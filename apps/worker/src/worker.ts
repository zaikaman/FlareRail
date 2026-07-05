import { loadWorkerConfig, type WorkerConfig } from "@flarerail/config";
import { QueueName, createQueue, createWorker, closeQueues, closeWorkers } from "./jobs/queues.js";
import type { Queue, Worker } from "bullmq";

export interface WorkerRuntime {
  config: WorkerConfig;
  queues: Queue[];
  workers: Worker[];
  start: () => Promise<void>;
  shutdown: () => Promise<void>;
}

/**
 * Build a worker runtime with configurable queues and processors.
 */
export function buildWorkerRuntime(config?: WorkerConfig): WorkerRuntime {
  const resolvedConfig = config ?? loadWorkerConfig();

  const queues: Queue[] = [];
  const workers: Worker[] = [];

  return {
    config: resolvedConfig,
    queues,
    workers,

    start: async () => {
      // ── Create all queues ──────────────────
      const queueNames = Object.values(QueueName);
      for (const name of queueNames) {
        const queue = createQueue(name, resolvedConfig);
        queues.push(queue);
        console.log(`  📦 Queue created: ${name}`);
      }

      // ── Placeholder maintenance processor ──
      const maintenanceWorker = createWorker(
        QueueName.Maintenance,
        async () => {
          console.log(`  🔧 Maintenance job processed at ${new Date().toISOString()}`);
        },
        resolvedConfig,
      );
      workers.push(maintenanceWorker);

      console.log("✅ FlareRail Worker started");
      console.log(`  Concurrency: ${resolvedConfig.WORKER_CONCURRENCY}`);
      console.log(`  Environment: ${resolvedConfig.APP_ENV}`);
    },

    shutdown: async () => {
      console.log("🛑 Shutting down FlareRail Worker…");
      await closeWorkers(...workers);
      await closeQueues(...queues);
      console.log("✅ FlareRail Worker shut down");
    },
  };
}

// ── Start directly ───────────────────────────
const isMainModule = process.argv[1]?.endsWith("worker.ts");

if (isMainModule) {
  const runtime = buildWorkerRuntime();

  process.on("SIGINT", async () => {
    console.log("SIGINT received");
    await runtime.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("SIGTERM received");
    await runtime.shutdown();
    process.exit(0);
  });

  await runtime.start();
}
