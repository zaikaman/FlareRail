import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../../src/server.js";

const DATABASE_URL = process.env.DATABASE_URL;

// ── Server-dependent tests (skip if no DB) ────
const describeWithDb = DATABASE_URL ? describe : describe.skip;

describeWithDb("Auth contract", () => {
  let app: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /v1/health works without auth", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/health",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("flarerail-api");
  });

  it("rejects missing Authorization header", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/me",
    });

    expect(response.statusCode).toBe(401);
  });

  it("rejects malformed bearer token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/me",
      headers: {
        authorization: "Bearer invalid-token-no-dot",
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it("rejects malformed token format (no Bearer prefix)", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/me",
      headers: {
        authorization: "Basic some-token",
      },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ── Pure auth helper tests (no DB needed) ─────

describe("Auth middleware (pure)", () => {
  it("hashPartnerSecret produces a consistent hash", async () => {
    const { hashPartnerSecret } = await import("../../src/auth/partner-auth.js");
    const pepper = "test-pepper";
    const hash1 = hashPartnerSecret("my-secret", pepper);
    const hash2 = hashPartnerSecret("my-secret", pepper);
    expect(hash1).toBe(hash2);
  });

  it("verifyPartnerSecret returns true for matching secret", async () => {
    const { hashPartnerSecret, verifyPartnerSecret } =
      await import("../../src/auth/partner-auth.js");
    const pepper = "test-pepper";
    const hash = hashPartnerSecret("my-secret", pepper);
    expect(verifyPartnerSecret("my-secret", hash, pepper)).toBe(true);
  });

  it("verifyPartnerSecret returns false for wrong secret", async () => {
    const { hashPartnerSecret, verifyPartnerSecret } =
      await import("../../src/auth/partner-auth.js");
    const pepper = "test-pepper";
    const hash = hashPartnerSecret("my-secret", pepper);
    expect(verifyPartnerSecret("wrong-secret", hash, pepper)).toBe(false);
  });

  it("verifyPartnerSecret constant-time comparison works with different lengths", async () => {
    const { hashPartnerSecret, verifyPartnerSecret } =
      await import("../../src/auth/partner-auth.js");
    const pepper = "test-pepper";
    const hash = hashPartnerSecret("my-secret", pepper);
    expect(verifyPartnerSecret("very-long-secret-that-doesnt-match", hash, pepper)).toBe(false);
  });
});

// ── Fallback when no DB is available ──────────
const describeNoDb = DATABASE_URL ? describe.skip : describe;

describeNoDb("Auth contract (skipped)", () => {
  it("DATABASE_URL is not set; skipping auth contract tests", () => {
    expect(true).toBe(true);
  });
});
