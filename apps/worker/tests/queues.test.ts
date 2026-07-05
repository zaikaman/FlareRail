import { describe, it, expect } from "vitest";
import { QueueName, createRedisConnection } from "../src/jobs/queues.js";
import { loadWorkerConfig } from "@flarerail/config";

describe("Queue names", () => {
  it("are stable and match expected values", () => {
    expect(QueueName.DepositObservation).toBe("deposit.observation");
    expect(QueueName.DepositActivation).toBe("deposit.activation");
    expect(QueueName.ExitProcessing).toBe("exit.processing");
    expect(QueueName.RedemptionRecovery).toBe("redemption.recovery");
    expect(QueueName.WebhookDelivery).toBe("webhook.delivery");
    expect(QueueName.Maintenance).toBe("maintenance");
  });
});

describe("Redis connection factory", () => {
  it("uses supplied URL", () => {
    const config = { REDIS_URL: "redis://test:6379" };
    const connection = createRedisConnection(config);
    expect(connection.url).toBe("redis://test:6379");
  });
});

describe("Worker runtime", () => {
  it("can be constructed with test config", async () => {
    const { buildWorkerRuntime } = await import("../src/worker.js");
    const config = loadWorkerConfig({
      DATABASE_URL: "postgresql://localhost:5432/test",
      REDIS_URL: "redis://localhost:6379",
    });

    // Just verify it builds without error
    const runtime = buildWorkerRuntime(config);
    expect(runtime.config).toBeDefined();
    expect(runtime.queues).toEqual([]);
    expect(runtime.workers).toEqual([]);
  });
});

// ── Live Redis test (skipped when no Redis) ──
const describeRedis = process.env.REDIS_URL ? describe : describe.skip;

describeRedis("Live queue operations", () => {
  it("can create a queue and check it exists", async () => {
    const { createQueue } = await import("../src/jobs/queues.js");
    const config = loadWorkerConfig();

    const queue = createQueue(QueueName.Maintenance, config);
    try {
      // Check queue exists by getting its client
      const client = await queue.client;
      expect(client).toBeDefined();
    } finally {
      await queue.close();
    }
  });
});
