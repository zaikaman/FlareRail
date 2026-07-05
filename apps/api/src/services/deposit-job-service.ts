import { QueueName } from "@flarerail/core";

export interface DepositObservationInput {
  depositIntentId: string;
  traceId: string;
  runAt?: Date;
}

export interface QueueProducer {
  add: (
    queueName: string,
    jobName: string,
    data: Record<string, unknown>,
    opts?: Record<string, unknown>,
  ) => Promise<void>;
}

let _queueProducer: QueueProducer | null = null;

/**
 * Set an injectable queue producer (for tests or direct invocation).
 */
export function setQueueProducer(producer: QueueProducer | null): void {
  _queueProducer = producer;
}

/**
 * Get the current queue producer, or null if not set (tests).
 */
export function getQueueProducer(): QueueProducer | null {
  return _queueProducer;
}

/**
 * Enqueue a deposit observation job.
 * In tests, allows injection of a mock producer.
 */
export async function enqueueDepositObservation(
  input: DepositObservationInput,
  producer?: QueueProducer,
): Promise<void> {
  const queueProducer = producer ?? _queueProducer;

  if (!queueProducer) {
    // No queue producer configured — simulate by returning
    // This allows contract/integration tests to run without Redis
    return;
  }

  const delay = input.runAt
    ? Math.max(0, input.runAt.getTime() - Date.now())
    : 2000; // 2 seconds default delay for demo

  await queueProducer.add(
    QueueName.DepositObservation,
    `deposit-observation:${input.depositIntentId}`,
    {
      depositIntentId: input.depositIntentId,
      traceId: input.traceId,
    },
    {
      jobId: `deposit-observation:${input.depositIntentId}`,
      delay,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    },
  );
}
