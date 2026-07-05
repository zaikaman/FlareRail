import {
  findDepositIntentById,
  updateDepositIntentStatus,
  attachDepositTxReference,
  DepositIntentStatus,
  createLifecycleEvent,
} from "@flarerail/core";
import type { PrismaClientLike, LifecycleEventInput } from "@flarerail/core";
import { MockXrplDepositMonitor } from "../monitors/xrpl-deposit-monitor.js";

export interface ProcessorDependencies {
  db?: PrismaClientLike;
  monitor?: MockXrplDepositMonitor;
}

function buildEventPayload(
  base: LifecycleEventInput,
  traceId?: string,
): LifecycleEventInput {
  if (traceId) {
    return { ...base, traceId };
  }
  return base;
}

/**
 * Process a deposit observation job.
 * Checks if the user has sent the XRP payment by consulting the mock XRPL monitor.
 */
export async function processDepositObservation(
  jobData: { depositIntentId: string; traceId?: string },
  deps?: ProcessorDependencies,
): Promise<void> {
  const db = deps?.db;
  const monitor = deps?.monitor ?? new MockXrplDepositMonitor();

  // Load deposit intent
  const intent = await findDepositIntentById({ intentId: jobData.depositIntentId }, db);

  if (!intent) {
    throw new Error(`DepositIntent not found: ${jobData.depositIntentId}`);
  }

  // If already past awaiting_user_action, return idempotently
  if (intent.status !== DepositIntentStatus.AwaitingUserAction) {
    return;
  }

  // Observe XRPL payment
  const quote = intent.quote ?? { amount: "0", metadata: null };
  const payment = await monitor.observeDepositIntent(
    {
      id: intent.id,
      metadata: (intent.metadata ?? {}) as Record<string, unknown>,
      txReference: (intent.txReference ?? {}) as Record<string, unknown>,
    },
    {
      amount: quote.amount?.toString() ?? "0",
      metadata: (quote.metadata ?? {}) as Record<string, unknown>,
    },
  );

  if (payment) {
    // Payment observed — transition to observed
    await updateDepositIntentStatus(
      {
        intentId: intent.id,
        status: DepositIntentStatus.Observed,
      },
      db,
    );

    // Attach transaction reference
    await attachDepositTxReference(
      {
        intentId: intent.id,
        txReference: {
          transactionId: payment.transactionId,
          ledgerIndex: payment.ledgerIndex,
          amount: payment.amount,
          sourceAddress: payment.sourceAddress,
          destinationAddress: payment.destinationAddress,
          reference: payment.reference,
          observedAt: payment.observedAt.toISOString(),
        },
      },
      db,
    );

    // Emit lifecycle event
    const trace = jobData.traceId;
    await createLifecycleEvent(
      buildEventPayload(
        {
          organizationId: intent.organizationId,
          subjectType: "deposit_intent",
          subjectId: intent.id,
          eventType: "deposit_intent.observed",
          actorType: "worker",
          reasonCode: "DEPOSIT_OBSERVED",
          message: "XRP payment observed. Activating position on Flare.",
          metadata: {
            transactionId: payment.transactionId,
            amount: payment.amount,
            reference: payment.reference,
          },
        },
        trace,
      ),
      db,
    );

    // Enqueue activation job - for tests, caller invokes activation processor directly
    // In production, the BullMQ worker would enqueue the activation job here
  } else {
    // Payment not observed yet
    const expiresAt = intent.expiresAt ? new Date(intent.expiresAt) : null;

    if (expiresAt && new Date() > expiresAt) {
      // Intent expired
      await updateDepositIntentStatus(
        {
          intentId: intent.id,
          status: DepositIntentStatus.Expired,
        },
        db,
      );

      const trace = jobData.traceId;
      await createLifecycleEvent(
        buildEventPayload(
          {
            organizationId: intent.organizationId,
            subjectType: "deposit_intent",
            subjectId: intent.id,
            eventType: "deposit_intent.expired",
            actorType: "worker",
            reasonCode: "DEPOSIT_EXPIRED",
            message: "The deposit intent has expired.",
          },
          trace,
        ),
        db,
      );
    } else {
      // Not expired — requeue logic would go here with BullMQ
      // For test/integration mode, the caller can re-invoke
    }
  }
}
