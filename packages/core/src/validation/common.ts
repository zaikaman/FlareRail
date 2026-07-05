import { z } from "zod";
import { environments } from "../domain/statuses.js";

// ── Environment ─────────────────────────────────
const envValues = [...environments] as const;

export const environmentSchema = z.enum(envValues as unknown as [string, ...string[]]);

// ── Strings ─────────────────────────────────────
export const nonEmptyStringSchema = z.string().trim().min(1, "Value must not be empty");

export const idSchema = nonEmptyStringSchema;

export const traceIdSchema = nonEmptyStringSchema;

// ── Pagination ──────────────────────────────────
export const paginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .refine((val) => val === undefined || /^\d+$/.test(val), {
      message: "limit must be a positive integer string",
    })
    .transform((val) => (val ? parseInt(val, 10) : 25))
    .pipe(z.number().int().min(1).max(100)),
  cursor: z.string().optional(),
});

// ── Amounts ─────────────────────────────────────
const amountRegex = /^\d+(\.\d+)?$/;

export const amountStringSchema = z
  .string()
  .trim()
  .refine((val) => amountRegex.test(val), {
    message: "Amount must be a positive decimal string",
  })
  .refine((val) => {
    const parts = val.split(".");
    if (parts[0] && parts[0].length > 18) return false;
    if (parts[1] && parts[1].length > 18) return false;
    return true;
  }, "Amount must have at most 18 integer digits and 18 decimal digits")
  .refine((val) => parseFloat(val) > 0, "Amount must be positive");

// ── Addresses ───────────────────────────────────
const base58LikeRegex = /^[r][1-9A-HJ-NP-Za-km-z]{24,34}$/;

export const xrplAddressSchema = z
  .string()
  .trim()
  .min(25, "XRPL address must be between 25 and 35 characters")
  .max(35, "XRPL address must be between 25 and 35 characters")
  .refine((val) => base58LikeRegex.test(val), {
    message: "Not a valid XRPL address format",
  });

export const evmAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Not a valid EVM address");

// ── URLs ────────────────────────────────────────
export const httpsUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .refine((val) => val.startsWith("https://"), "Must be an HTTPS URL");

// ── Webhook Event Types ─────────────────────────
const webhookEventTypes = [
  "deposit_intent.created",
  "deposit_intent.observed",
  "deposit_intent.active_position_created",
  "deposit_intent.failed",
  "position.exiting",
  "position.closed",
  "exit_intent.completed",
  "exit_intent.failed",
  "exit_intent.recoverable_failure",
  "incident.triggered",
] as [string, ...string[]];

export const webhookEventTypesSchema = z.array(z.enum(webhookEventTypes));

// ── Input Schemas ───────────────────────────────

export const createQuoteInputSchema = z.object({
  strategyCode: nonEmptyStringSchema,
  amount: amountStringSchema,
  walletUserRef: nonEmptyStringSchema.optional(),
  xrplAddress: xrplAddressSchema.optional(),
});

export const createDepositIntentInputSchema = z.object({
  quoteId: nonEmptyStringSchema,
  idempotencyKey: nonEmptyStringSchema.optional(),
});

export const createExitIntentInputSchema = z.object({
  positionId: nonEmptyStringSchema,
  amount: amountStringSchema,
  destinationAddress: xrplAddressSchema,
  idempotencyKey: nonEmptyStringSchema.optional(),
});
