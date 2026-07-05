import {
  findDepositIntentById,
  updateDepositIntentStatus,
  DepositIntentStatus,
  attachDepositTxReference,
  createLifecycleEvent,
  createPositionFromDepositIntent,
} from "@flarerail/core";
import type { PrismaClientLike, LifecycleEventInput } from "@flarerail/core";
import crypto from "node:crypto";

export interface ProcessorDependencies {
  db?: PrismaClientLike;
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
 * Process a Flare activation job.
 * Mocks the Flare-side minting/activation process.
 */
export async function processFlareActivation(
  jobData: { depositIntentId: string; traceId?: string },
  deps?: ProcessorDependencies,
): Promise<void> {
  const db = deps?.db;

  // Load deposit intent
  const intent = await findDepositIntentById({ intentId: jobData.depositIntentId }, db);

  if (!intent) {
    throw new Error(`DepositIntent not found: ${jobData.depositIntentId}`);
  }

  // If already active_position_created, return idempotently
  if (intent.status === DepositIntentStatus.ActivePositionCreated) {
    return;
  }

  // If already activating, check if position already exists
  if (intent.status === DepositIntentStatus.Activating) {
    if (intent.position) {
      return; // Already has position, idempotent
    }
  }

  // Must be in observed state to proceed
  if (intent.status !== DepositIntentStatus.Observed) {
    return; // Idempotent: ignore if not in correct state
  }

  // Transition to activating
  await updateDepositIntentStatus(
    {
      intentId: intent.id,
      status: DepositIntentStatus.Activating,
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
        eventType: "deposit_intent.activating",
        actorType: "worker",
        reasonCode: "DEPOSIT_ACTIVATING",
        message: "Position is being activated on Flare.",
        metadata: {
          depositIntentId: intent.id,
        },
      },
      trace,
    ),
    db,
  );

  // Attach simulated Flare transaction reference
  const activationTxHash = `0x${crypto.randomBytes(32).toString("hex")}`;
  await attachDepositTxReference(
    {
      intentId: intent.id,
      txReference: {
        activationTxHash,
        type: "simulation_flare_tx",
        activatedAt: new Date().toISOString(),
      },
    },
    db,
  );

  // Determine expected output from quote metadata
  const quote = intent.quote ?? {};
  const quoteMetadata = quote.metadata as Record<string, any> | undefined;
  const expectedOutput = quoteMetadata?.expectedOutput ?? "0";

  // Create active position
  try {
    const positionInput: {
      depositIntentId: string;
      organizationId: string;
      strategyId: string;
      environment: string;
      amount: string;
      walletUserId?: string;
      xrplAddress?: string;
    } = {
      depositIntentId: intent.id,
      organizationId: intent.organizationId,
      strategyId: intent.strategyId,
      environment: intent.environment,
      amount: expectedOutput,
    };

    if (intent.walletUserId) {
      positionInput.walletUserId = intent.walletUserId;
    }
    if (quoteMetadata?.xrplAddress) {
      positionInput.xrplAddress = quoteMetadata.xrplAddress as string;
    }

    await createPositionFromDepositIntent(positionInput, db);
  } catch (err: any) {
    // If position already exists (idempotent), that's fine
    if (!err.message?.includes("already exists")) {
      // Transition to failed
      await updateDepositIntentStatus(
        {
          intentId: intent.id,
          status: DepositIntentStatus.Failed,
        },
        db,
      );

      await createLifecycleEvent(
        buildEventPayload(
          {
            organizationId: intent.organizationId,
            subjectType: "deposit_intent",
            subjectId: intent.id,
            eventType: "deposit_intent.failed",
            actorType: "worker",
            reasonCode: "INTERNAL_ERROR",
            message: "Position creation failed.",
            metadata: {
              error: err.message,
            },
          },
          trace,
        ),
        db,
      );

      throw err;
    }
  }
}
