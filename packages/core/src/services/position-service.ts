import { getPrismaClient, type PrismaClientLike } from "../persistence/db.js";
import { DepositIntentStatus } from "../domain/statuses.js";
import { updateDepositIntentStatus } from "../repositories/deposit-intent-repository.js";
import { createLifecycleEvent } from "./lifecycle-event-service.js";

export interface CreatePositionInput {
  depositIntentId: string;
  organizationId: string;
  walletUserId?: string;
  strategyId: string;
  environment: string;
  amount: string;
  xrplAddress?: string;
}

/**
 * Create a position from a completed deposit intent.
 * Only creates if deposit intent is in `observed` or `activating` state.
 * Idempotent: does not duplicate if position already exists.
 */
export async function createPositionFromDepositIntent(
  input: CreatePositionInput,
  db?: PrismaClientLike,
) {
  const prisma = db ?? getPrismaClient();

  // Check if position already exists for this deposit intent
  const existingPosition = await prisma.position.findUnique({
    where: { depositIntentId: input.depositIntentId },
  });

  if (existingPosition) {
    return existingPosition;
  }

  // Load deposit intent to verify status
  const depositIntent = await prisma.depositIntent.findUnique({
    where: { id: input.depositIntentId },
  });

  if (!depositIntent) {
    throw new Error(`DepositIntent not found: ${input.depositIntentId}`);
  }

  // Only create position from observed or activating states
  if (
    depositIntent.status !== DepositIntentStatus.Observed &&
    depositIntent.status !== DepositIntentStatus.Activating
  ) {
    throw new Error(
      `Cannot create position from status: ${depositIntent.status}. Must be observed or activating.`,
    );
  }

  // Create position
  const position = await prisma.position.create({
    data: {
      organizationId: input.organizationId,
      walletUserId: input.walletUserId ?? null,
      depositIntentId: input.depositIntentId,
      strategyId: input.strategyId,
      environment: input.environment as any,
      status: "active",
      amount: input.amount,
      xrplAddress: input.xrplAddress ?? null,
    },
    include: {
      strategy: true,
    },
  });

  // Update deposit intent status using state machine
  await updateDepositIntentStatus(
    {
      intentId: input.depositIntentId,
      status: DepositIntentStatus.ActivePositionCreated,
    },
    db,
  );

  // Emit lifecycle events
  const metadata = (depositIntent.metadata ?? {}) as Record<string, any> | null;

  await createLifecycleEvent(
    {
      organizationId: input.organizationId,
      subjectType: "position",
      subjectId: position.id,
      eventType: "position.created",
      actorType: "worker",
      reasonCode: "POSITION_ACTIVE",
      message: "Position is active.",
      traceId: metadata?.traceId,
      metadata: {
        amount: input.amount,
        depositIntentId: input.depositIntentId,
      },
    },
    db,
  );

  await createLifecycleEvent(
    {
      organizationId: input.organizationId,
      subjectType: "deposit_intent",
      subjectId: input.depositIntentId,
      eventType: "deposit_intent.active_position_created",
      actorType: "worker",
      reasonCode: "POSITION_ACTIVE",
      message: "Position is active.",
      traceId: metadata?.traceId,
      metadata: {
        positionId: position.id,
        amount: input.amount,
      },
    },
    db,
  );

  return position;
}

/**
 * Find a position for a given deposit intent.
 */
export async function findPositionForDepositIntent(
  depositIntentId: string,
  db?: PrismaClientLike,
) {
  const prisma = db ?? getPrismaClient();

  return prisma.position.findUnique({
    where: { depositIntentId },
    include: { strategy: true },
  });
}

/**
 * Serialize a position to API shape.
 */
export function serializePosition(position: any, _strategy?: any) {
  return {
    id: position.id,
    status: position.status,
    strategyCode: position.strategy?.code ?? "unknown",
    activeAmount: position.amount?.toString() ?? "0",
  };
}
