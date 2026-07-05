import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../../src/server.js";
import { getPrismaClient } from "@flarerail/core";
import { hashPartnerSecret } from "../../src/auth/partner-auth.js";
import type { ApiConfig } from "@flarerail/config";
import { loadApiConfig } from "@flarerail/config";

const DATABASE_URL = process.env.DATABASE_URL;
const describeWithDb = DATABASE_URL ? describe : describe.skip;

const TEST_PEPPER = "test-pepper-for-quotes";

function makeTestConfig(): ApiConfig {
  return loadApiConfig({
    DATABASE_URL: DATABASE_URL!,
    REDIS_URL: "redis://localhost:6379",
    PARTNER_API_KEY_PEPPER: TEST_PEPPER,
  });
}

describeWithDb("Strategies and Quotes contract", () => {
  let app: Awaited<ReturnType<typeof buildServer>>;
  let orgId: string;
  let credentialKeyId: string;
  let bearerToken: string;

  beforeAll(async () => {
    const config = makeTestConfig();
    app = await buildServer({ config });
    await app.ready();

    // Seed test data
    const prisma = getPrismaClient();
    const org = await prisma.walletOrganization.create({
      data: {
        name: "Test Org Quotes",
        slug: `test-org-quotes-${Date.now()}`,
        environment: "test",
        status: "active",
      },
    });
    orgId = org.id;

    const secret = "test-secret-quotes";
    credentialKeyId = `test-key-quotes-${Date.now()}`;
    await prisma.workspaceCredential.create({
      data: {
        organizationId: org.id,
        keyId: credentialKeyId,
        secretHash: hashPartnerSecret(secret, TEST_PEPPER),
        label: "Test Quotes Key",
        scopes: ["quotes:read", "quotes:write", "deposits:read", "deposits:write"],
        environment: "test",
        status: "active",
      },
    });

    await prisma.strategy.create({
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
        feeModel: {
          entryFee: "0.5%",
          exitFee: "0.0%",
          performanceFee: "10%",
        },
      },
    });

    bearerToken = `${credentialKeyId}.${secret}`;
  });

  afterAll(async () => {
    // Cleanup
    const prisma = getPrismaClient();
    await prisma.workspaceCredential.deleteMany({ where: { organizationId: orgId } });
    await prisma.strategy.deleteMany({ where: { organizationId: orgId } });
    await prisma.walletOrganization.delete({ where: { id: orgId } });
    await app.close();
  });

  it("GET /v1/strategies returns authenticated org's active test strategies", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/strategies",
      headers: {
        authorization: `Bearer ${bearerToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
    const strategy = body.find((s: any) => s.code === "fxrp-conservative");
    expect(strategy).toBeDefined();
    expect(strategy.name).toBe("FXRP Conservative");
    expect(strategy.status).toBe("active");
    expect(strategy.minAmount).toBe("10");
    expect(strategy.maxAmount).toBe("100000");
    expect(strategy.feeModel).toBeDefined();
    expect(strategy.feeModel.entryFee).toBe("0.5%");
  });

  it("GET /v1/strategies rejects missing auth", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/strategies",
    });

    expect(response.statusCode).toBe(401);
  });

  it("POST /v1/quotes creates available quote for valid XRPL address, amount, and strategy", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/quotes",
      headers: {
        authorization: `Bearer ${bearerToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        xrplAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        amount: "250",
        strategyCode: "fxrp-conservative",
      }),
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.id).toBeDefined();
    expect(body.status).toBe("available");
    expect(body.amount).toBe("250");
    expect(body.expectedOutput).toBe("248.75");
    expect(body.strategyCode).toBe("fxrp-conservative");
    expect(body.feeSummary).toBeDefined();
    expect(body.feeSummary.total).toBe("1.25");
    expect(body.feeSummary.currency).toBe("XRP");
    expect(body.feeSummary.lines).toHaveLength(1);
    expect(body.feeSummary.lines[0].label).toBe("Entry fee");
    expect(body.expiresAt).toBeDefined();
    expect(body.userMessage).toBeDefined();
  });

  it("Quote response includes expected fields", async () => {
    const response = await app.inject({
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

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("amount");
    expect(body).toHaveProperty("expectedOutput");
    expect(body).toHaveProperty("strategyCode");
    expect(body).toHaveProperty("feeSummary");
    expect(body).toHaveProperty("expiresAt");
    expect(body.reasonCode).toBeNull();
  });

  it("POST /v1/quotes rejects unknown strategy with STRATEGY_UNAVAILABLE", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/quotes",
      headers: {
        authorization: `Bearer ${bearerToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        xrplAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        amount: "250",
        strategyCode: "nonexistent-strategy",
      }),
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.error.code).toBe("STRATEGY_UNAVAILABLE");
  });

  it("POST /v1/quotes rejects amount below min with UNSAFE_AMOUNT", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/quotes",
      headers: {
        authorization: `Bearer ${bearerToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        xrplAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        amount: "5",
        strategyCode: "fxrp-conservative",
      }),
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error.code).toBe("UNSAFE_AMOUNT");
  });

  it("POST /v1/quotes rejects amount above max with UNSAFE_AMOUNT", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/quotes",
      headers: {
        authorization: `Bearer ${bearerToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        xrplAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        amount: "200000",
        strategyCode: "fxrp-conservative",
      }),
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error.code).toBe("UNSAFE_AMOUNT");
  });
});
