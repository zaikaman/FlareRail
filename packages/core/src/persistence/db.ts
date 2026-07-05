import { PrismaClient, type Prisma } from "@prisma/client";

let prismaClient: PrismaClient | null = null;

/**
 * Returns a singleton Prisma client instance.
 * Creates the client on first call and reuses it thereafter.
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

/**
 * Disconnect the Prisma client if it exists.
 * Safe to call multiple times.
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
}

/**
 * Execute a callback within a Prisma transaction.
 * Provides an isolated $transaction wrapper.
 */
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const client = getPrismaClient();
  return client.$transaction(callback);
}

/**
 * Interface for Prisma client injection (useful for tests).
 * Accepts either a real PrismaClient or a mock.
 */
export type PrismaClientLike = PrismaClient;
