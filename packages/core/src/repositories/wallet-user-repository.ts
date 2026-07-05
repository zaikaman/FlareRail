import { getPrismaClient, type PrismaClientLike } from "../persistence/db.js";

export interface WalletUserQueryInput {
  organizationId: string;
  xrplAddress: string;
}

export interface FindOrCreateInput {
  organizationId: string;
  xrplAddress: string;
  walletUserRef?: string;
}

export interface FindByRefInput {
  organizationId: string;
  walletUserRef: string;
}

/**
 * Find a wallet user by XRPL address, scoped to organization.
 */
export async function findWalletUserByXrplAddress(
  input: WalletUserQueryInput,
  db?: PrismaClientLike,
) {
  const prisma = db ?? getPrismaClient();

  return prisma.walletUser.findUnique({
    where: {
      organizationId_xrplAddress: {
        organizationId: input.organizationId,
        xrplAddress: input.xrplAddress,
      },
    },
  });
}

/**
 * Find a wallet user by organization-scoped user ref.
 */
export async function findWalletUserByRef(input: FindByRefInput, db?: PrismaClientLike) {
  const prisma = db ?? getPrismaClient();

  return prisma.walletUser.findUnique({
    where: {
      organizationId_walletUserRef: {
        organizationId: input.organizationId,
        walletUserRef: input.walletUserRef,
      },
    },
  });
}

/**
 * Find or create a wallet user by XRPL address.
 * If walletUserRef is provided and no conflict exists, it will be set.
 */
export async function findOrCreateWalletUser(input: FindOrCreateInput, db?: PrismaClientLike) {
  const prisma = db ?? getPrismaClient();

  // Try to find existing user
  const existing = await prisma.walletUser.findUnique({
    where: {
      organizationId_xrplAddress: {
        organizationId: input.organizationId,
        xrplAddress: input.xrplAddress,
      },
    },
  });

  if (existing) {
    // If we have a new ref and existing has no ref, update
    if (input.walletUserRef && !existing.walletUserRef) {
      return prisma.walletUser.update({
        where: { id: existing.id },
        data: { walletUserRef: input.walletUserRef },
      });
    }
    return existing;
  }

  // Create new wallet user
  return prisma.walletUser.create({
    data: {
      organizationId: input.organizationId,
      xrplAddress: input.xrplAddress,
      walletUserRef: input.walletUserRef ?? null,
    },
  });
}
