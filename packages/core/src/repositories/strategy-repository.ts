import { getPrismaClient, type PrismaClientLike } from "../persistence/db.js";
import type { Environment } from "../domain/statuses.js";

export interface StrategyQueryInput {
  organizationId: string;
  environment: Environment;
}

export interface FindStrategyByCodeInput extends StrategyQueryInput {
  code: string;
}

/**
 * List all strategies for an organization and environment.
 */
export async function listStrategiesForOrganization(
  input: StrategyQueryInput,
  db?: PrismaClientLike,
) {
  const prisma = db ?? getPrismaClient();

  return prisma.strategy.findMany({
    where: {
      organizationId: input.organizationId,
      environment: input.environment,
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Find a strategy by code, scoped to organization and environment.
 */
export async function findStrategyByCode(
  input: FindStrategyByCodeInput,
  db?: PrismaClientLike,
) {
  const prisma = db ?? getPrismaClient();

  return prisma.strategy.findFirst({
    where: {
      organizationId: input.organizationId,
      environment: input.environment,
      code: input.code,
    },
  });
}

/**
 * Assert that a strategy is available for use.
 * Returns a reason code string if unavailable, or null if available.
 */
export function assertStrategyAvailable(strategy: {
  status: string;
  capacityStatus: string;
  code?: string;
}): string | null {
  if (!strategy) {
    return "STRATEGY_UNAVAILABLE";
  }

  if (strategy.status === "paused") {
    return "STRATEGY_PAUSED";
  }

  if (strategy.status === "unavailable") {
    return "STRATEGY_UNAVAILABLE";
  }

  if (strategy.capacityStatus === "full") {
    return "CAPACITY_UNAVAILABLE";
  }

  return null;
}
