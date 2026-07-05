import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { reasonCodes, type ReasonCodeEntry } from "@flarerail/core";

// ── ApiError class ───────────────────────────

export class ApiError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly severity: string;
  public readonly retryable: boolean;
  public readonly traceId?: string;
  public readonly details?: Record<string, unknown>;

  constructor(reason: ReasonCodeEntry, overrides?: Partial<ReasonCodeEntry>) {
    super(overrides?.defaultMessage ?? reason.defaultMessage);
    this.name = "ApiError";
    this.code = overrides?.code ?? reason.code;
    this.httpStatus = overrides?.httpStatus ?? reason.httpStatus;
    this.severity = reason.severity;
    this.retryable = reason.retryable;
  }
}

// ── Error mapping ────────────────────────────

/**
 * Convert any error to a standardized API error response.
 */
export function toApiError(
  error: unknown,
  traceId?: string,
): { error: { code: string; message: string; traceId?: string } } {
  if (error instanceof ApiError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(traceId !== undefined ? { traceId } : {}),
      },
    };
  }

  // Unknown error → INTERNAL_ERROR
  const reason = reasonCodes["INTERNAL_ERROR"]!;
  return {
    error: {
      code: reason.code,
      message: reason.defaultMessage,
      ...(traceId !== undefined ? { traceId } : {}),
    },
  };
}

/**
 * Throw a reason code as an ApiError.
 */
export function throwReason(code: string, overrides?: Partial<ReasonCodeEntry>): never {
  const reason = reasonCodes[code];
  if (!reason) {
    throw new ApiError(reasonCodes["INTERNAL_ERROR"]!);
  }
  throw new ApiError(reason, overrides);
}

// ── Fastify error handler ────────────────────

/**
 * Register the central error handler on a Fastify instance.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
    const traceId = request.id as string | undefined;

    if (error instanceof ApiError) {
      return reply.status(error.httpStatus).send(toApiError(error, traceId));
    }

    // Fastify validation errors
    if ("validation" in error) {
      return reply.status(400).send({
        error: {
          code: "INVALID_IDENTIFIER",
          message: error.message,
          ...(traceId !== undefined ? { traceId } : {}),
        },
      });
    }

    // Fallback to INTERNAL_ERROR
    const message =
      process.env.NODE_ENV === "production" ? "An internal error occurred." : error.message;
    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message,
        ...(traceId !== undefined ? { traceId } : {}),
      },
    });
  });
}
