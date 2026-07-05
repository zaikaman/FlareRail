import { getPrismaClient, type PrismaClientLike } from "../persistence/db.js";
import type { Environment } from "../domain/statuses.js";

export interface CreateQuoteData {
  organizationId: string;
  walletUserId?: string;
  strategyId: string;
  environment: Environment;
  amount: string;
  feeAmount?: string;
  feeCurrency?: string;
  rate?: string;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
}

export interface FindQuoteInput {
  organizationId: string;
  environment: Environment;
  quoteId: string;
}

/**
 * Create a new quote record.
 */
export async function createQuote(data: CreateQuoteData, db?: PrismaClientLike) {
  const prisma = db ?? getPrismaClient();

  return prisma.quote.create({
    data: {
      organizationId: data.organizationId,
      walletUserId: data.walletUserId ?? null,
      strategyId: data.strategyId,
      environment: data.environment,
      amount: data.amount,
      feeAmount: data.feeAmount ?? null,
      feeCurrency: data.feeCurrency ?? null,
      rate: data.rate ?? null,
      status: "available",
      expiresAt: data.expiresAt,
      metadata: (data.metadata ?? {}) as any,
    },
  });
}

/**
 * Find a quote by ID, scoped to organization and environment.
 */
export async function findQuoteByIdForOrganization(
  input: FindQuoteInput,
  db?: PrismaClientLike,
) {
  const prisma = db ?? getPrismaClient();

  return prisma.quote.findFirst({
    where: {
      id: input.quoteId,
      organizationId: input.organizationId,
      environment: input.environment,
    },
  });
}

/**
 * Mark a quote as expired.
 */
export async function markQuoteExpired(quoteId: string, db?: PrismaClientLike) {
  const prisma = db ?? getPrismaClient();

  return prisma.quote.update({
    where: { id: quoteId },
    data: { status: "expired" },
  });
}
