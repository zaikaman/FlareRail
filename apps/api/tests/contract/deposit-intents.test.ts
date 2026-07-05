import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../../src/server.js";
import { getPrismaClient, DepositIntentStatus } from "@flarerail/core";
import { hashPartnerSecret } from "../../src/auth/partner-auth.js";
import type { ApiConfig } from "@flarerail/config";
import { loadApiConfig } from "@flarerail/config";

const DATABASE_URL = process.env.DATABASE_URL;
const describeWithDb = DATABASE_URL ? describe : describe.skip;

const TEST_PEPPER = "test-pepper-deposit-intents";

function makeTestConfig(): ApiConfig {
  return loadApiConfig({
    DATABASE_URL: DATABASE_URL!,
    REDIS_URL: "redis://localhost:6379",
    PARTNER_API_KEY_PEPPER: TEST_PEPPER,
  });
}

describeWithDb("Deposit Intents contract", () => {
  let app: Awaited<ReturnType<typeof buildServer>>;
  let orgId: string;
  let credentialKeyId: string;
  let bearerToken: string;
  let strategyId: string;
  let quoteId: string;

  beforeAll(async () => {
    const config = makeTestConfig();
    app = await buildServer({ config });
    await app.ready();

    const prisma = getPrismaClient();
    const org = await prisma.walletOrganization.create({
      data: {
        name: "Test Org Deposit Intents",
        slug: `test-org-di-${Date.now()}`,
        environment: "test",
        status: "active",
      },
    });
    orgId = org.id;

    const secret = "test-secret-di";
    credentialKeyId = `test-key-di-${Date.now()}`;
    await prisma.workspaceCredential.create({
      data: {
        organizationId: org.id,
        keyId: credentialKeyId,
        secretHash: hashPartnerSecret(secret, TEST_PEPPER),
        label: "Test DI Key",
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

    // Create a wallet user
    await prisma.walletUser.create({
      data: {
        organizationId: org.id,
        xrplAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        walletUserRef: "demo-user-001",
      },
    });

    bearerToken = `${credentialKeyId}.${secret}`;
  });

  afterAll(async () => {
    const prisma = getPrismaClient();
    await prisma.workspaceCredential.deleteMany({ where: { organizationId: orgId } });
    await prisma.walletUser.deleteMany({ where: { organizationId: orgId } });
    await prisma.strategy.deleteMany({ where: { organizationId: orgId } });
    await prisma.walletOrganization.delete({ where: { id: orgId } });
    await app.close();
  });

  async function createAvailableQuote() {
    const prisma = getPrismaClient();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const quote = await prisma.quote.create({
      data: {
        organizationId: orgId,
        strategyId,
        environment: "test",
        status: "available",
        amount: "250",
        feeAmount: "1.25",
        feeCurrency: "XRP",
        rate: "1",
        expiresAt,
        metadata: {
          expectedOutput: "248.75",
          feeSummary: { total: "1.25", currency: "XRP", lines: [{ label: "Entry fee", amount: "1.25", currency: "XRP" }] },
          xrplAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
          strategyCode: "fxrp-conservative",
        },
      },
    });
    quoteId = quote.id;
    return quote;
  }

  it("POST /v1/deposit-intents rejects missing auth", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/deposit-intents",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quoteId: "some-id" }),
    });

    expect(response.statusCode).toBe(401);
  });

  it("POST /v1/deposit-intents rejects missing quote id", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/deposit-intents",
      headers: {
        authorization: `Bearer ${bearerToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(response.statusCode).toBe(400);
  });

  it("POST /v1/deposit-intents rejects expired quote with QUOTE_EXPIRED", async () => {
    const prisma = getPrismaClient();
    const expiredQuote = await prisma.quote.create({
      data: {
        organizationId: orgId,
        strategyId,
        environment: "test",
        status: "available",
        amount: "250",
        feeAmount: "1.25",
        feeCurrency: "XRP",
        rate: "1",
        expiresAt: new Date(Date.now() - 60 * 1000), // Already expired
        metadata: { strategyCode: "fxrp-conservative" },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/v1/deposit-intents",
      headers: {
        authorization: `Bearer ${bearerToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ quoteId: expiredQuote.id }),
    });

    expect(response.statusCode).toBe(410);
    const body = response.json();
    expect(body.error.code).toBe("QUOTE_EXPIRED");
  });

  it("POST /v1/deposit-intents creates intent from available quote", async () => {
    await createAvailableQuote();

    const response = await app.inject({
      method: "POST",
      url: "/v1/deposit-intents",
      headers: {
        authorization: `Bearer ${bearerToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ quoteId }),
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.id).toBeDefined();
    expect(body.status).toBe("awaiting_user_action");
  });

  it("Created intent has status awaiting_user_action", async () => {
    await createAvailableQuote();

    const response = await app.inject({
      method: "POST",
      url: "/v1/deposit-intents",
      headers: {
        authorization: `Bearer ${bearerToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ quoteId }),
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.status).toBe("awaiting_user_action");
    expect(body.traceId).toBeDefined();
    expect(Array.isArray(body.userInstructions)).toBe(true);
    expect(body.userInstructions.length).toBeGreaterThanOrEqual(1);
    expect(body.userInstructions[0].type).toBe("xrpl_payment");
    expect(body.externalReferences).toBeDefined();
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBeDefined();
  });

  it("Reusing same idempotency key returns existing intent", async () => {
    await createAvailableQuote();

    const idempotencyKey = `unique-key-${Date.now()}`;
    const response1 = await app.inject({
      method: "POST",
      url: "/v1/deposit-intents",
      headers: {
        authorization: `Bearer ${bearerToken}`,
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify({ quoteId }),
    });

    expect(response1.statusCode).toBe(201);

    // Create another quote for second attempt
    await createAvailableQuote();

    const response2 = await app.inject({
      method: "POST",
      url: "/v1/deposit-intents",
      headers: {
        authorization: `Bearer ${bearerToken}`,
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify({ quoteId }),
    });

    // Should still be 201 (or could be 200, but we return same body)
    expect(response2.statusCode).toBe(201);
    const body2 = response2.json();
    expect(body2.id).toBe(response1.json().id);
    expect(body2.status).toBe(response1.json().status);
  });

  it("GET /v1/deposit-intents/{intentId} returns current intent", async () => {
    await createAvailableQuote();

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/deposit-intents",
      headers: {
        authorization: `Bearer ${bearerToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ quoteId }),
    });

    const created = createResponse.json();

    const getResponse = await app.inject({
      method: "GET",
      url: `/v1/deposit-intents/${created.id}`,
      headers: {
        authorization: `Bearer ${bearerToken}`,
      },
    });

    expect(getResponse.statusCode).toBe(200);
    const body = getResponse.json();
    expect(body.id).toBe(created.id);
    expect(body.status).toBe("awaiting_user_action");
    expect(body.traceId).toBeDefined();
  });

  it("GET /v1/deposit-intents/{intentId} rejects cross-organization access", async () => {
    // Create a second org
    const prisma = getPrismaClient();
    const otherOrg = await prisma.walletOrganization.create({
      data: {
        name: "Other Org",
        slug: `other-org-${Date.now()}`,
        environment: "test",
        status: "active",
      },
    });

    const otherSecret = "other-secret";
    const otherKeyId = `other-key-${Date.now()}`;
    await prisma.workspaceCredential.create({
      data: {
        organizationId: otherOrg.id,
        keyId: otherKeyId,
        secretHash: hashPartnerSecret(otherSecret, TEST_PEPPER),
        label: "Other Key",
        scopes: ["deposits:read"],
        environment: "test",
        status: "active",
      },
    });

    const otherStrategy = await prisma.strategy.create({
      data: {
        organizationId: otherOrg.id,
        code: "fxrp-conservative",
        environment: "test",
        name: "FXRP Conservative",
        description: "",
        riskCategory: "conservative",
        status: "active",
        capacityStatus: "available",
        minAmount: 10,
        maxAmount: 100000,
        feeModel: {},
      },
    });

    const otherExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const otherQuote = await prisma.quote.create({
      data: {
        organizationId: otherOrg.id,
        strategyId: otherStrategy.id,
        environment: "test",
        status: "available",
        amount: "250",
        feeAmount: "1.25",
        feeCurrency: "XRP",
        rate: "1",
        expiresAt: otherExpiresAt,
        metadata: { strategyCode: "fxrp-conservative" },
      },
    });

    const createOtherResponse = await app.inject({
      method: "POST",
      url: "/v1/deposit-intents",
      headers: {
        authorization: `Bearer ${otherKeyId}.${otherSecret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ quoteId: otherQuote.id }),
    });
    const otherIntentId = createOtherResponse.json().id;

    // Try to access other org's intent with first org's token
    const response = await app.inject({
      method: "GET",
      url: `/v1/deposit-intents/${otherIntentId}`,
      headers: {
        authorization: `Bearer ${bearerToken}`,
      },
    });

    expect(response.statusCode).toBe(400); // Will not find it -> INVALID_IDENTIFIER

    // Cleanup other org
    await prisma.workspaceCredential.deleteMany({ where: { organizationId: otherOrg.id } });
    await prisma.quote.deleteMany({ where: { organizationId: otherOrg.id } });
    await prisma.strategy.deleteMany({ where: { organizationId: otherOrg.id } });
    await prisma.walletOrganization.delete({ where: { id: otherOrg.id } });
  });
});
