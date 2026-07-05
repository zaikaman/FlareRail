import { Queue, Worker, type ConnectionOptions, type JobsOptions } from "bullmq";
import type { WorkerConfig } from "@flarerail/config";

// ── Queue names ──────────────────────────────
export const QueueName = {
  DepositObservation: "deposit.observation",
  DepositActivation: "deposit.activation",
  ExitProcessing: "exit.processing",
  RedemptionRecovery: "redemption.recovery",
  WebhookDelivery: "webhook.delivery",
  Maintenance: "maintenance",
} as const;

export type QueueName = (typeof QueueName)[keyof typeof QueueName];

// ── Redis connection ─────────────────────────

export function createRedisConnection(config: Pick<WorkerConfig, "REDIS_URL">): ConnectionOptions {
  return {
    url: config.REDIS_URL,
    maxRetriesPerRequest: null,
  };
}

// ── Queue helpers ────────────────────────────

export function createQueue(name: QueueName, config: Pick<WorkerConfig, "REDIS_URL">): Queue {
  const connection = createRedisConnection(config);
  return new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: {
        age: 3600 * 24, // 1 day
        count: 100,
      },
      removeOnFail: {
        age: 3600 * 24 * 7, // 7 days
      },
    },
  });
}

export function createWorker(
  name: QueueName,
  processor: (job: any) => Promise<void>,
  config: Pick<WorkerConfig, "REDIS_URL" | "WORKER_CONCURRENCY">,
): Worker {
  const connection = createRedisConnection(config);
  return new Worker(name, processor, {
    connection,
    concurrency: config.WORKER_CONCURRENCY,
  });
}

// ── Cleanup ──────────────────────────────────

export async function closeQueues(...queues: Queue[]): Promise<void> {
  await Promise.all(queues.map((q) => q.close()));
}

export async function closeWorkers(...workers: Worker[]): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
}
