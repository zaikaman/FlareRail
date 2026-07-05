import { getPrismaClient, type PrismaClientLike } from "../persistence/db.js";
import type { Environment, DepositIntentStatus } from "../domain/statuses.js";
import { assertTransitionDepositIntent } from "../state-machines/deposit-intent.js";

export interface CreateDepositIntentData {
  organizationId: string;
  walletUserId?: string;
  quoteId: string;
  strategyId: string;
  environment: Environment;
  status: DepositIntentStatus;
  idempotencyKey?: string;
  userInstructions?: Record<string, unknown>;
  txReference?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

export interface FindDepositIntentInput {
  organizationId: string;
  environment: Environment;
  intentId: string;
}

export interface FindByIdInput {
  intentId: string;
}

export interface FindByIdempotencyKeyInput {
  organizationId: string;
  environment: Environment;
  idempotencyKey: string;
}

export interface UpdateStatusInput {
  intentId: string;
  status: DepositIntentStatus;
}

export interface AttachTxReferenceInput {
  intentId: string;
  txReference: Record<string, unknown>;
}

/**
 * Create a new deposit intent record.
 */
export async function createDepositIntent(data: CreateDepositIntentData, db?: PrismaClientLike) {
  const prisma = db ?? getPrismaClient();

  return prisma.depositIntent.create({
    data: {
      organizationId: data.organizationId,
      walletUserId: data.walletUserId ?? null,
      quoteId: data.quoteId,
      strategyId: data.strategyId,
      environment: data.environment,
      status: data.status,
      idempotencyKey: data.idempotencyKey ?? null,
      userInstructions: (data.userInstructions ?? null) as any,
      txReference: (data.txReference ?? null) as any,
      metadata: (data.metadata ?? null) as any,
      expiresAt: data.expiresAt ?? null,
    },
  });
}

/**
 * Find a deposit intent by ID, scoped to organization and environment.
 */
export async function findDepositIntentByIdForOrganization(
  input: FindDepositIntentInput,
  db?: PrismaClientLike,
) {
  const prisma = db ?? getPrismaClient();

  return prisma.depositIntent.findFirst({
    where: {
      id: input.intentId,
      organizationId: input.organizationId,
      environment: input.environment,
    },
    include: {
      position: true,
    },
  });
}

/**
 * Find a deposit intent by ID (no org scoping - for worker use).
 */
export async function findDepositIntentById(input: FindByIdInput, db?: PrismaClientLike) {
  const prisma = db ?? getPrismaClient();

  return prisma.depositIntent.findUnique({
    where: { id: input.intentId },
    include: {
      quote: true,
      strategy: true,
      position: true,
    },
  });
}

/**
 * Find a deposit intent by idempotency key, scoped to organization and environment.
 */
export async function findDepositIntentByIdempotencyKey(
  input: FindByIdempotencyKeyInput,
  db?: PrismaClientLike,
) {
  const prisma = db ?? getPrismaClient();

  return prisma.depositIntent.findFirst({
    where: {
      organizationId: input.organizationId,
      environment: input.environment,
      idempotencyKey: input.idempotencyKey,
    },
    include: {
      position: true,
    },
  });
}

/**
 * Update deposit intent status with state machine validation.
 */
export async function updateDepositIntentStatus(
  input: UpdateStatusInput,
  db?: PrismaClientLike,
) {
  const prisma = db ?? getPrismaClient();

  // Load current status
  const current = await prisma.depositIntent.findUnique({
    where: { id: input.intentId },
    select: { status: true },
  });

  if (!current) {
    throw new Error(`DepositIntent not found: ${input.intentId}`);
  }

  // Validate state machine transition
  assertTransitionDepositIntent(current.status as DepositIntentStatus, input.status);

  return prisma.depositIntent.update({
    where: { id: input.intentId },
    data: { status: input.status },
  });
}

/**
 * Attach a transaction reference to a deposit intent.
 */
export async function attachDepositTxReference(
  input: AttachTxReferenceInput,
  db?: PrismaClientLike,
) {
  const prisma = db ?? getPrismaClient();

  return prisma.depositIntent.update({
    where: { id: input.intentId },
    data: {
      txReference: input.txReference as any,
    },
  });
}
