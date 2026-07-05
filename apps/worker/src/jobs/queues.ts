import { QueueName } from "@flarerail/core";
import type { QueueName as QueueNameType } from "@flarerail/core";
import { Queue, Worker, type ConnectionOptions, type JobsOptions } from "bullmq";
import type { WorkerConfig } from "@flarerail/config";

// Re-export QueueName for backward compatibility
export { QueueName };
export type { QueueName as QueueNameType };

// ── Redis connection ─────────────────────────

export function createRedisConnection(config: Pick<WorkerConfig, "REDIS_URL">): ConnectionOptions {
  return {
    url: config.REDIS_URL,
    maxRetriesPerRequest: null,
  };
}

// ── Queue helpers ────────────────────────────

export function createQueue(name: QueueNameType, config: Pick<WorkerConfig, "REDIS_URL">): Queue {
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
  name: QueueNameType,
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
