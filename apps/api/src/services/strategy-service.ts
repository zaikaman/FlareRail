import { listStrategiesForOrganization } from "@flarerail/core";
import type { PrismaClientLike } from "@flarerail/core";

export interface PartnerContext {
  organizationId: string;
  environment: string;
}

/**
 * List strategies available to the authenticated partner.
 * Maps Prisma Decimal values to strings for API consumption.
 */
export async function listStrategiesForPartner(
  partnerContext: PartnerContext,
  db?: PrismaClientLike,
) {
  const strategies = await listStrategiesForOrganization(
    {
      organizationId: partnerContext.organizationId,
      environment: partnerContext.environment as any,
    },
    db,
  );

  return strategies.map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    description: s.description,
    riskCategory: s.riskCategory,
    status: s.status,
    capacityStatus: s.capacityStatus,
    minAmount: s.minAmount?.toString() ?? null,
    maxAmount: s.maxAmount?.toString() ?? null,
    feeModel: s.feeModel as Record<string, string> | null,
  }));
}
