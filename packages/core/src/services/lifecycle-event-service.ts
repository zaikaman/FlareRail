import { getPrismaClient, type PrismaClientLike } from "../persistence/db.js";
import type { ActorType } from "../domain/statuses.js";

export type SubjectType =
  | "quote"
  | "deposit_intent"
  | "position"
  | "exit_intent"
  | "policy"
  | "credential"
  | "webhook"
  | "incident";

export interface LifecycleEventInput {
  organizationId: string;
  subjectType: SubjectType;
  subjectId: string;
  eventType: string;
  actorType: ActorType;
  reasonCode: string;
  message: string;
  traceId?: string;
  externalReference?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Create an append-only lifecycle event.
 */
export async function createLifecycleEvent(
  input: LifecycleEventInput,
  db?: PrismaClientLike,
): Promise<void> {
  const prisma = db ?? getPrismaClient();

  await prisma.lifecycleEvent.create({
    data: {
      organizationId: input.organizationId,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      eventType: input.eventType,
      actorType: input.actorType as any,
      reasonCode: input.reasonCode,
      message: input.message,
      traceId: input.traceId ?? null,
      externalReference: input.externalReference as any,
      metadata: input.metadata as any,
    },
  });
}

export interface LifecycleEventFilter {
  organizationId: string;
  subjectType?: SubjectType;
  subjectId?: string;
  eventType?: string;
  limit?: number;
  cursor?: string;
}

/**
 * List lifecycle events for an organization with optional filtering.
 */
export async function listLifecycleEvents(filter: LifecycleEventFilter, db?: PrismaClientLike) {
  const prisma = db ?? getPrismaClient();

  const where: Record<string, unknown> = {
    organizationId: filter.organizationId,
  };

  if (filter.subjectType) where.subjectType = filter.subjectType;
  if (filter.subjectId) where.subjectId = filter.subjectId;
  if (filter.eventType) where.eventType = filter.eventType;

  const events = await prisma.lifecycleEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filter.limit ?? 25,
    ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
  });

  return events;
}
