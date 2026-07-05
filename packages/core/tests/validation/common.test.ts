import { describe, it, expect } from "vitest";
import {
  environmentSchema,
  amountStringSchema,
  xrplAddressSchema,
  evmAddressSchema,
  paginationSchema,
  createQuoteInputSchema,
  createDepositIntentInputSchema,
  createExitIntentInputSchema,
} from "../../src/validation/common.js";

describe("environmentSchema", () => {
  it("accepts valid environments", () => {
    expect(environmentSchema.parse("test")).toBe("test");
    expect(environmentSchema.parse("production")).toBe("production");
  });

  it("rejects invalid environments", () => {
    expect(() => environmentSchema.parse("dev")).toThrow();
    expect(() => environmentSchema.parse("")).toThrow();
  });
});

describe("amountStringSchema", () => {
  it("accepts valid amount strings", () => {
    expect(amountStringSchema.parse("100")).toBe("100");
    expect(amountStringSchema.parse("0.01")).toBe("0.01");
    expect(amountStringSchema.parse("123456789012345678.123456789012345678")).toBe(
      "123456789012345678.123456789012345678",
    );
  });

  it("rejects zero values", () => {
    expect(() => amountStringSchema.parse("0")).toThrow();
    expect(() => amountStringSchema.parse("0.0")).toThrow();
  });

  it("rejects negative values", () => {
    expect(() => amountStringSchema.parse("-100")).toThrow();
    expect(() => amountStringSchema.parse("-0.01")).toThrow();
  });

  it("rejects blank values", () => {
    expect(() => amountStringSchema.parse("")).toThrow();
    expect(() => amountStringSchema.parse("  ")).toThrow();
  });

  it("rejects non-number strings", () => {
    expect(() => amountStringSchema.parse("abc")).toThrow();
    expect(() => amountStringSchema.parse("12a")).toThrow();
  });

  it("rejects too many decimals", () => {
    expect(() => amountStringSchema.parse("1.1234567890123456789")).toThrow();
  });

  it("rejects too many integer digits", () => {
    expect(() => amountStringSchema.parse("12345678901234567890.5")).toThrow();
  });
});

describe("xrplAddressSchema", () => {
  it("accepts a valid XRPL-like address", () => {
    expect(xrplAddressSchema.parse("rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh")).toBe(
      "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    );
  });

  it("rejects an address that does not start with r", () => {
    expect(() => xrplAddressSchema.parse("xHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh")).toThrow();
  });

  it("rejects too-short addresses", () => {
    expect(() => xrplAddressSchema.parse("rShort")).toThrow();
  });

  it("rejects addresses with non-base58 chars", () => {
    expect(() => xrplAddressSchema.parse("rHb9CJAWyB4rj91VRWn96DkukG4bwdtyO0")).toThrow();
  });
});

describe("evmAddressSchema", () => {
  it("accepts a valid EVM address", () => {
    expect(evmAddressSchema.parse("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18")).toBe(
      "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    );
  });

  it("accepts lowercase EVM address", () => {
    expect(evmAddressSchema.parse("0x742d35cc6634c0532925a3b844bc9e7595f2bd18")).toBe(
      "0x742d35cc6634c0532925a3b844bc9e7595f2bd18",
    );
  });

  it("rejects address without 0x prefix", () => {
    expect(() => evmAddressSchema.parse("742d35Cc6634C0532925a3b844Bc9e7595f2bD18")).toThrow();
  });

  it("rejects address with wrong length", () => {
    expect(() => evmAddressSchema.parse("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD1")).toThrow();
  });
});

describe("paginationSchema", () => {
  it("uses default limit when not provided", () => {
    const result = paginationSchema.parse({});
    expect(result.limit).toBe(25);
  });

  it("accepts valid limit within range", () => {
    const result = paginationSchema.parse({ limit: "50" });
    expect(result.limit).toBe(50);
  });

  it("caps limit at max 100", () => {
    expect(() => paginationSchema.parse({ limit: "200" })).toThrow();
  });

  it("rejects limit below min", () => {
    expect(() => paginationSchema.parse({ limit: "0" })).toThrow();
  });

  it("accepts optional cursor", () => {
    const result = paginationSchema.parse({ cursor: "abc123" });
    expect(result.cursor).toBe("abc123");
  });
});

describe("createQuoteInputSchema", () => {
  it("rejects missing required fields", () => {
    expect(() => createQuoteInputSchema.parse({})).toThrow();
  });

  it("rejects empty strategyCode", () => {
    expect(() =>
      createQuoteInputSchema.parse({
        strategyCode: "",
        amount: "100",
        xrplAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
      }),
    ).toThrow();
  });

  it("rejects invalid amount", () => {
    expect(() =>
      createQuoteInputSchema.parse({
        strategyCode: "fxrp-conservative",
        amount: "-50",
      }),
    ).toThrow();
  });
});

describe("createDepositIntentInputSchema", () => {
  it("rejects missing quoteId", () => {
    expect(() => createDepositIntentInputSchema.parse({})).toThrow();
  });

  it("accepts with idempotencyKey", () => {
    const result = createDepositIntentInputSchema.parse({
      quoteId: "q_abc123",
      idempotencyKey: "idem_001",
    });
    expect(result.quoteId).toBe("q_abc123");
    expect(result.idempotencyKey).toBe("idem_001");
  });
});

describe("createExitIntentInputSchema", () => {
  it("rejects missing required fields", () => {
    expect(() => createExitIntentInputSchema.parse({})).toThrow();
  });

  it("rejects invalid destination address", () => {
    expect(() =>
      createExitIntentInputSchema.parse({
        positionId: "pos_001",
        amount: "50",
        destinationAddress: "bad-address",
      }),
    ).toThrow();
  });
});
