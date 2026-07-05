/**
 * Shared queue name constants used by both API and worker.
 */
export const QueueName = {
  DepositObservation: "deposit.observation",
  DepositActivation: "deposit.activation",
  ExitProcessing: "exit.processing",
  RedemptionRecovery: "redemption.recovery",
  WebhookDelivery: "webhook.delivery",
  Maintenance: "maintenance",
} as const;

export type QueueName = (typeof QueueName)[keyof typeof QueueName];
