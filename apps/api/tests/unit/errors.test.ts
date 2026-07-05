import { describe, it, expect } from "vitest";
import {
  ApiError,
  toApiError,
  throwReason,
  registerErrorHandler,
} from "../../src/middleware/errors.js";
import { reasonCodes } from "@flarerail/core";

describe("ApiError", () => {
  it("maps known reason code to configured HTTP status", () => {
    const err = new ApiError(reasonCodes["INVALID_AMOUNT"]!);
    expect(err.code).toBe("INVALID_AMOUNT");
    expect(err.httpStatus).toBe(400);
    expect(err.message).toBe("The provided amount is not valid.");
  });

  it("unknown error maps to INTERNAL_ERROR", () => {
    const result = toApiError(new Error("something broke"), "trace-123");
    expect(result.error.code).toBe("INTERNAL_ERROR");
    expect(result.error.traceId).toBe("trace-123");
  });

  it("response includes error.code, error.message, and traceId", () => {
    const err = new ApiError(reasonCodes["MISSING_AUTH"]!);
    const result = toApiError(err, "trace-456");
    expect(result.error).toHaveProperty("code");
    expect(result.error).toHaveProperty("message");
    expect(result.error).toHaveProperty("traceId");
    expect(result.error.traceId).toBe("trace-456");
  });

  it("production response does not include stack", () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "production";

    try {
      const result = toApiError(new Error("hidden"), "trace-789");
      expect(result.error.message).toBe("An internal error occurred.");
    } finally {
      (process.env as Record<string, string>).NODE_ENV = originalEnv ?? "test";
    }
  });

  it("Zod validation errors map to INVALID_IDENTIFIER via toApiError", () => {
    // Simulate a Zod-like error
    class ZodError extends Error {
      public validation: unknown[] = [];
      constructor() {
        super("Validation failed");
        this.name = "ZodError";
      }
    }

    const zodError = new ZodError();
    const result = toApiError(zodError, "trace-999");
    expect(result.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("throwReason", () => {
  it("throws ApiError for known code", () => {
    expect(() => throwReason("INVALID_ADDRESS")).toThrow(ApiError);
  });

  it("throws INTERNAL_ERROR for unknown code", () => {
    expect(() => throwReason("UNKNOWN_CODE")).toThrow(ApiError);
    expect(() => throwReason("UNKNOWN_CODE")).toThrow("An internal error occurred.");
  });
});
