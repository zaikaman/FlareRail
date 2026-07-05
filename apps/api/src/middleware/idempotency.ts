import type { FastifyRequest } from "fastify";
import { throwReason } from "./errors.js";

/**
 * Extract the idempotency key from the request headers.
 */
export function getIdempotencyKey(request: FastifyRequest): string | undefined {
  const key = request.headers["idempotency-key"];
  return typeof key === "string" ? key : undefined;
}

/**
 * Require an idempotency key; throws if missing.
 */
export function requireIdempotencyKey(request: FastifyRequest): string {
  const key = getIdempotencyKey(request);
  if (!key || key.trim().length === 0) {
    throwReason("INVALID_IDENTIFIER", {
      defaultMessage: "Idempotency-Key header is required",
    });
  }
  return key!;
}

/**
 * Create a deterministic fingerprint from a request for idempotency checks.
 */
export function createIdempotencyFingerprint({
  method,
  path,
  organizationId,
  body,
}: {
  method: string;
  path: string;
  organizationId: string;
  body: unknown;
}): string {
  const normalizedBody = stableStringify(body);
  return `${method}:${path}:${organizationId}:${normalizedBody}`;
}

// ── Stable JSON stringify ───────────────────

function stableStringify(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  return String(value);
}
