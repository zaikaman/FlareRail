import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../../src/server.js";
import {
  getPrismaClient,
  findDepositIntentById,
  updateDepositIntentStatus,
  attachDepositTxReference,
  DepositIntentStatus,
  createLifecycleEvent,
  createPositionFromDepositIntent,
} from "@flarerail/core";
import { hashPartnerSecret } from "../../src/auth/partner-auth.js";
import type { ApiConfig } from "@flarerail/config";
import { loadApiConfig } from "@flarerail/config";

const DATABASE_URL = process.env.DATABASE_URL;
const describeWithDb = DATABASE_URL ? describe : describe.skip;

const TEST_PEPPER = "test-pepper-integration";

function makeTestConfig(): ApiConfig {
  return loadApiConfig({
    DATABASE_URL: DATABASE_URL!,
    REDIS_URL: "redis://localhost:6379",
    PARTNER_API_KEY_PEPPER: TEST_PEPPER,
  });
}

describeWithDb("Quote-to-Active-Position Integration", () => {
  let app: Awaited<ReturnType<typeof buildServer>>;
  let orgId: string;
  let credentialKeyId: string;
  let bearerToken: string;
  let strategyId: string;

  beforeAll(async () => {
    const config = makeTestConfig();
    app = await buildServer({ config });
    await app.ready();

    // Seed test data
    const prisma = getPrismaClient();
    const org = await prisma.walletOrganization.create({
      data: {
        name: "Integration Test Org",
        slug: `int-test-org-${Date.now()}`,
        environment: "test",
        status: "active",
      },
    });
    orgId = org.id;

    const secret = "int-secret";
    credentialKeyId = `int-key-${Date.now()}`;
    await prisma.workspaceCredential.create({
      data: {
        organizationId: org.id,
        keyId: credentialKeyId,
        secretHash: hashPartnerSecret(secret, TEST_PEPPER),
        label: "Integration Key",
        scopes: ["quotes:read", "quotes:write", "deposits:read", "deposits:write"],
        environment: "test",
        status: "active",
      },
    });

    const strategy = await prisma.strategy.create({
      data: {
        organizationId: org.id,
        code: "fxrp-conservative",
        environment: "test",
        name: "FXRP Conservative",
        description: "Conservative FXRP earn strategy",
        riskCategory: "conservative",
        status: "active",
        capacityStatus: "available",
        minAmount: 10,
        maxAmount: 100000,
        feeModel: { entryFee: "0.5%", exitFee: "0.0%", performanceFee: "10%" },
      },
    });
    strategyId = strategy.id;

    await prisma.walletUser.create({
      data: {
        organizationId: org.id,
        xrplAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        walletUserRef: "int-demo-user-001",
      },
    });

    bearerToken = `${credentialKeyId}.${secret}`;
  });

  afterAll(async () => {
    const prisma = getPrismaClient();
    await prisma.position.deleteMany({ where: { organizationId: orgId } });
    await prisma.depositIntent.deleteMany({ where: { organizationId: orgId } });
    await prisma.quote.deleteMany({ where: { organizationId: orgId } });
    await prisma.lifecycleEvent.deleteMany({ where: { organizationId: orgId } });
    await prisma.workspaceCredential.deleteMany({ where: { organizationId: orgId } });
    await prisma.walletUser.deleteMany({ where: { organizationId: orgId } });
    await prisma.strategy.deleteMany({ where: { organizationId: orgId } });
    await prisma.walletOrganization.delete({ where: { id: orgId } });
    await app.close();
  });

  it("completes the full quote-to-active-position flow", async () => {
    // 1. GET /v1/strategies
    const strategiesResponse = await app.inject({
      method: "GET",
      url: "/v1/strategies",
      headers: { authorization: `Bearer ${bearerToken}` },
    });
    expect(strategiesResponse.statusCode).toBe(200);
    const strategies = strategiesResponse.json();
    expect(strategies.length).toBeGreaterThanOrEqual(1);

    // 2. POST /v1/quotes
    const quoteResponse = await app.inject({
      method: "POST",
      url: "/v1/quotes",
      headers: {
        authorization: `Bearer ${bearerToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        xrplAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        amount: "500",
        strategyCode: "fxrp-conservative",
      }),
    });
    expect(quoteResponse.statusCode).toBe(201);
    const quote = quoteResponse.json();
    expect(quote.status).toBe("available");

    // 3. POST /v1/deposit-intents
    const depositResponse = await app.inject({
      method: "POST",
      url: "/v1/deposit-intents",
      headers: {
        authorization: `Bearer ${bearerToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ quoteId: quote.id }),
    });
    expect(depositResponse.statusCode).toBe(201);
    const depositIntent = depositResponse.json();
    expect(depositIntent.status).toBe("awaiting_user_action");
    const depositIntentId = depositIntent.id;

    // 4. Simulate observation (directly transition state + emit event)
    const db = getPrismaClient();
    await updateDepositIntentStatus(
      { intentId: depositIntentId, status: DepositIntentStatus.Observed },
      db,
    );

    await attachDepositTxReference(
      {
        intentId: depositIntentId,
        txReference: {
          transactionId: "sim_tx_123",
          ledgerIndex: 80000001,
          amount: "500",
          sourceAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
          destinationAddress: "rFlareRailDest",
          reference: "fr_sim_test",
          observedAt: new Date().toISOString(),
        },
      },
      db,
    );

    await createLifecycleEvent(
      {
        organizationId: orgId,
        subjectType: "deposit_intent",
        subjectId: depositIntentId,
        eventType: "deposit_intent.observed",
        actorType: "worker",
        reasonCode: "DEPOSIT_OBSERVED",
        message: "XRP payment observed.",
        traceId: depositIntent.traceId,
      },
      db,
    );

    // 5. Simulate activation (directly invoke position service)
    await createPositionFromDepositIntent(
      {
        depositIntentId,
        organizationId: orgId,
        strategyId,
        environment: "test",
        amount: "497.5",
        xrplAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
      },
      db,
    );

    // 6. GET /v1/deposit-intents/{intentId}
    const getResponse = await app.inject({
      method: "GET",
      url: `/v1/deposit-intents/${depositIntentId}`,
      headers: { authorization: `Bearer ${bearerToken}` },
    });
    expect(getResponse.statusCode).toBe(200);
    const finalIntent = getResponse.json();

    // 7. Assert final status is active_position_created
    expect(finalIntent.status).toBe("active_position_created");
    expect(finalIntent.position).toBeDefined();
    expect(finalIntent.position.status).toBe("active");
    expect(finalIntent.position.activeAmount).toBe("497.5");

    // 8. Assert a Position row exists with status active
    const positionRecord = await db.position.findUnique({
      where: { depositIntentId },
    });
    expect(positionRecord).toBeDefined();
    expect(positionRecord!.status).toBe("active");

    // 9. Assert lifecycle events exist
    const events = await db.lifecycleEvent.findMany({
      where: {
        organizationId: orgId,
        subjectId: depositIntentId,
      },
      orderBy: { createdAt: "asc" },
    });

    const eventTypes = events.map((e) => e.eventType);
    expect(eventTypes).toContain("deposit_intent.created");
    expect(eventTypes).toContain("deposit_intent.awaiting_user_action");
    expect(eventTypes).toContain("deposit_intent.observed");
    expect(eventTypes).toContain("deposit_intent.active_position_created");
    expect(eventTypes).toContain("position.created");
  });
});
