import { createDepositIntentInputSchema, DepositIntentStatus } from "@flarerail/core";
import {
  findQuoteByIdForOrganization,
  findDepositIntentByIdempotencyKey,
  createDepositIntent as createDepositIntentRepo,
  findDepositIntentByIdForOrganization,
} from "@flarerail/core";
import type { PrismaClientLike } from "@flarerail/core";
import { createLifecycleEvent } from "@flarerail/core";
import { throwReason } from "../middleware/errors.js";
import { enqueueDepositObservation } from "./deposit-job-service.js";
import crypto from "node:crypto";

export interface CreateDepositIntentInput {
  quoteId: string;
  idempotencyKey?: string;
}

export interface PartnerContext {
  organizationId: string;
  environment: string;
}

/**
 * Create a deposit intent for a partner's user from an available quote.
 * Handles idempotency, user instruction generation, lifecycle events, and job enqueueing.
 */
export async function createDepositIntentForPartner(
  input: CreateDepositIntentInput & { headerIdempotencyKey?: string },
  partnerContext: PartnerContext,
  db?: PrismaClientLike,
) {
  // Validate body
  const parsed = createDepositIntentInputSchema.safeParse(input);
  if (!parsed.success) {
    throwReason("INVALID_IDENTIFIER", {
      defaultMessage: parsed.error.errors.map((e: any) => e.message).join("; "),
    });
  }

  // Idempotency key: header first, body fallback
  const idempotencyKey = input.headerIdempotencyKey ?? parsed.data.idempotencyKey;

  // Check idempotency
  if (idempotencyKey) {
    const existing = await findDepositIntentByIdempotencyKey(
      {
        organizationId: partnerContext.organizationId,
        environment: partnerContext.environment as any,
        idempotencyKey,
      },
      db,
    );

    if (existing) {
      return serializeDepositIntent(existing, existing.position ?? undefined);
    }
  }

  // Load quote
  const quote = await findQuoteByIdForOrganization(
    {
      organizationId: partnerContext.organizationId,
      environment: partnerContext.environment as any,
      quoteId: parsed.data.quoteId,
    },
    db,
  );

  if (!quote) {
    throwReason("QUOTE_UNAVAILABLE");
  }

  // Check quote status
  if (quote.status === "expired") {
    throwReason("QUOTE_EXPIRED");
  }

  if (quote.status !== "available") {
    throwReason("QUOTE_UNAVAILABLE");
  }

  // Check quote expiration
  if (new Date() > new Date(quote.expiresAt)) {
    throwReason("QUOTE_EXPIRED");
  }

  // Generate trace id
  const traceId = crypto.randomUUID();

  // Generate simulation reference
  const simSuffix = crypto.randomBytes(6).toString("hex");
  const simulationReference = `fr_sim_${simSuffix}`;

  // Build user instruction
  const expiresAt = quote.expiresAt;
  const metadata = quote.metadata as Record<string, any> | null;
  const amount = quote.amount.toString();
  const strategyCode = metadata?.strategyCode ?? "unknown";

  const userInstructions = [
    {
      type: "xrpl_payment",
      title: "Send XRP from your wallet",
      description: `Send ${amount} XRP with reference ${simulationReference} before the quote expires.`,
      expiresAt: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt,
    },
  ];

  // Create deposit intent
  const depositIntent = await createDepositIntentRepo(
    {
      organizationId: partnerContext.organizationId,
      walletUserId: quote.walletUserId ?? undefined,
      quoteId: quote.id,
      strategyId: quote.strategyId,
      environment: partnerContext.environment as any,
      status: DepositIntentStatus.AwaitingUserAction,
      idempotencyKey: idempotencyKey ?? undefined,
      userInstructions: userInstructions as any,
      metadata: {
        traceId,
        simulationReference,
        amount,
        strategyCode,
      },
      expiresAt: expiresAt instanceof Date ? expiresAt : new Date(expiresAt),
    },
    db,
  );

  // Emit lifecycle events
  await createLifecycleEvent(
    {
      organizationId: partnerContext.organizationId,
      subjectType: "deposit_intent",
      subjectId: depositIntent.id,
      eventType: "deposit_intent.created",
      actorType: "partner_api",
      reasonCode: "QUOTE_AVAILABLE",
      message: "Deposit intent created.",
      traceId,
      metadata: { amount, strategyCode },
    },
    db,
  );

  await createLifecycleEvent(
    {
      organizationId: partnerContext.organizationId,
      subjectType: "deposit_intent",
      subjectId: depositIntent.id,
      eventType: "deposit_intent.awaiting_user_action",
      actorType: "partner_api",
      reasonCode: "DEPOSIT_WAITING_FOR_USER",
      message: "Waiting for the XRP payment instruction to be completed.",
      traceId,
      metadata: { amount, strategyCode },
    },
    db,
  );

  // Enqueue deposit observation job
  await enqueueDepositObservation({
    depositIntentId: depositIntent.id,
    traceId,
  });

  return serializeDepositIntent(depositIntent, undefined, {
    traceId,
    simulationReference,
    expiresAt: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt,
  });
}

/**
 * Get a deposit intent for a partner by ID.
 */
export async function getDepositIntentForPartner(
  input: { intentId: string },
  partnerContext: PartnerContext,
  db?: PrismaClientLike,
) {
  const intent = await findDepositIntentByIdForOrganization(
    {
      organizationId: partnerContext.organizationId,
      environment: partnerContext.environment as any,
      intentId: input.intentId,
    },
    db,
  );

  if (!intent) {
    throwReason("INVALID_IDENTIFIER", {
      defaultMessage: "Deposit intent not found.",
    });
  }

  return serializeDepositIntent(intent, intent.position ?? undefined);
}

/**
 * Serialize a deposit intent to the API response shape.
 */
export function serializeDepositIntent(
  intent: any,
  position?: any,
  extra?: { traceId?: string; simulationReference?: string; expiresAt?: string },
) {
  const metadata = (intent.metadata ?? {}) as Record<string, any>;
  const userInstructionsRaw = intent.userInstructions as any;

  const externalReferences: Array<{ type: string; value: string }> = [];
  if (metadata?.simulationReference) {
    externalReferences.push({
      type: "simulation_reference",
      value: metadata.simulationReference,
    });
  }

  // Add txReference external refs if present
  const txRef = intent.txReference as Record<string, any> | null;
  if (txRef?.transactionId) {
    externalReferences.push({
      type: "xrpl_transaction",
      value: txRef.transactionId as string,
    });
  }
  if (txRef?.activationTxHash) {
    externalReferences.push({
      type: "flare_transaction",
      value: txRef.activationTxHash as string,
    });
  }

  const result: Record<string, any> = {
    id: intent.id,
    status: intent.status,
    traceId: metadata?.traceId ?? extra?.traceId ?? null,
    userInstructions: Array.isArray(userInstructionsRaw) ? userInstructionsRaw : [],
    reasonCode: null,
    userMessage: getUserMessageForStatus(intent.status),
    externalReferences,
    createdAt: intent.createdAt instanceof Date ? intent.createdAt.toISOString() : intent.createdAt,
    updatedAt: intent.updatedAt instanceof Date ? intent.updatedAt.toISOString() : intent.updatedAt,
  };

  // Include position if available
  if (position) {
    result.position = {
      id: position.id,
      status: position.status,
      strategyCode: position.strategy?.code ?? metadata?.strategyCode ?? "unknown",
      activeAmount: position.amount?.toString() ?? "0",
    };
  }

  return result;
}

function getUserMessageForStatus(status: string): string {
  switch (status) {
    case "awaiting_user_action":
      return "Waiting for the XRP payment instruction to be completed.";
    case "observed":
      return "XRP payment observed. Activating position on Flare.";
    case "activating":
      return "Position is being activated on Flare.";
    case "active_position_created":
      return "Position is active.";
    case "expired":
      return "The deposit intent has expired.";
    case "failed":
      return "The deposit failed.";
    case "cancelled":
      return "The deposit was cancelled.";
    default:
      return "Deposit intent is being processed.";
  }
}
