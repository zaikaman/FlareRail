// ──────────────────────────────────────────────
// Environment
// ──────────────────────────────────────────────
export const Environment = {
  Test: "test",
  Production: "production",
} as const;

export type Environment = (typeof Environment)[keyof typeof Environment];

export const environments: readonly Environment[] = Object.values(Environment);

// ──────────────────────────────────────────────
// OrganizationStatus
// ──────────────────────────────────────────────
export const OrganizationStatus = {
  Active: "active",
  Suspended: "suspended",
} as const;

export type OrganizationStatus = (typeof OrganizationStatus)[keyof typeof OrganizationStatus];

export const organizationStatuses: readonly OrganizationStatus[] =
  Object.values(OrganizationStatus);

// ──────────────────────────────────────────────
// CredentialStatus
// ──────────────────────────────────────────────
export const CredentialStatus = {
  Active: "active",
  Revoked: "revoked",
} as const;

export type CredentialStatus = (typeof CredentialStatus)[keyof typeof CredentialStatus];

export const credentialStatuses: readonly CredentialStatus[] = Object.values(CredentialStatus);

// ──────────────────────────────────────────────
// StrategyStatus
// ──────────────────────────────────────────────
export const StrategyStatus = {
  Active: "active",
  Paused: "paused",
  Unavailable: "unavailable",
} as const;

export type StrategyStatus = (typeof StrategyStatus)[keyof typeof StrategyStatus];

export const strategyStatuses: readonly StrategyStatus[] = Object.values(StrategyStatus);

// ──────────────────────────────────────────────
// CapacityStatus
// ──────────────────────────────────────────────
export const CapacityStatus = {
  Available: "available",
  Limited: "limited",
  Full: "full",
} as const;

export type CapacityStatus = (typeof CapacityStatus)[keyof typeof CapacityStatus];

export const capacityStatuses: readonly CapacityStatus[] = Object.values(CapacityStatus);

// ──────────────────────────────────────────────
// QuoteStatus
// ──────────────────────────────────────────────
export const QuoteStatus = {
  Available: "available",
  Unavailable: "unavailable",
  Expired: "expired",
} as const;

export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus];

export const quoteStatuses: readonly QuoteStatus[] = Object.values(QuoteStatus);

// ──────────────────────────────────────────────
// DepositIntentStatus
// ──────────────────────────────────────────────
export const DepositIntentStatus = {
  Created: "created",
  AwaitingUserAction: "awaiting_user_action",
  Observed: "observed",
  Activating: "activating",
  ActivePositionCreated: "active_position_created",
  Expired: "expired",
  Failed: "failed",
  Cancelled: "cancelled",
} as const;

export type DepositIntentStatus = (typeof DepositIntentStatus)[keyof typeof DepositIntentStatus];

export const depositIntentStatuses: readonly DepositIntentStatus[] =
  Object.values(DepositIntentStatus);

// ──────────────────────────────────────────────
// PositionStatus
// ──────────────────────────────────────────────
export const PositionStatus = {
  Active: "active",
  Exiting: "exiting",
  Impaired: "impaired",
  RecoveryAvailable: "recovery_available",
  Closed: "closed",
} as const;

export type PositionStatus = (typeof PositionStatus)[keyof typeof PositionStatus];

export const positionStatuses: readonly PositionStatus[] = Object.values(PositionStatus);

// ──────────────────────────────────────────────
// ExitIntentStatus
// ──────────────────────────────────────────────
export const ExitIntentStatus = {
  Created: "created",
  PendingUserConfirmation: "pending_user_confirmation",
  Submitted: "submitted",
  Processing: "processing",
  Delayed: "delayed",
  Completed: "completed",
  RecoverableFailure: "recoverable_failure",
  Compensated: "compensated",
  Escalated: "escalated",
  Rejected: "rejected",
  Expired: "expired",
  Failed: "failed",
} as const;

export type ExitIntentStatus = (typeof ExitIntentStatus)[keyof typeof ExitIntentStatus];

export const exitIntentStatuses: readonly ExitIntentStatus[] = Object.values(ExitIntentStatus);

// ──────────────────────────────────────────────
// WebhookEndpointStatus
// ──────────────────────────────────────────────
export const WebhookEndpointStatus = {
  Active: "active",
  Disabled: "disabled",
} as const;

export type WebhookEndpointStatus =
  (typeof WebhookEndpointStatus)[keyof typeof WebhookEndpointStatus];

export const webhookEndpointStatuses: readonly WebhookEndpointStatus[] =
  Object.values(WebhookEndpointStatus);

// ──────────────────────────────────────────────
// WebhookDeliveryStatus
// ──────────────────────────────────────────────
export const WebhookDeliveryStatus = {
  Pending: "pending",
  Delivered: "delivered",
  Failed: "failed",
  Exhausted: "exhausted",
} as const;

export type WebhookDeliveryStatus =
  (typeof WebhookDeliveryStatus)[keyof typeof WebhookDeliveryStatus];

export const webhookDeliveryStatuses: readonly WebhookDeliveryStatus[] =
  Object.values(WebhookDeliveryStatus);

// ──────────────────────────────────────────────
// IncidentSeverity
// ──────────────────────────────────────────────
export const IncidentSeverity = {
  Info: "info",
  Warning: "warning",
  Critical: "critical",
} as const;

export type IncidentSeverity = (typeof IncidentSeverity)[keyof typeof IncidentSeverity];

export const incidentSeverities: readonly IncidentSeverity[] = Object.values(IncidentSeverity);

// ──────────────────────────────────────────────
// IncidentStatus
// ──────────────────────────────────────────────
export const IncidentStatus = {
  Open: "open",
  Monitoring: "monitoring",
  Resolved: "resolved",
} as const;

export type IncidentStatus = (typeof IncidentStatus)[keyof typeof IncidentStatus];

export const incidentStatuses: readonly IncidentStatus[] = Object.values(IncidentStatus);

// ──────────────────────────────────────────────
// ActorType
// ──────────────────────────────────────────────
export const ActorType = {
  System: "system",
  WalletOperator: "wallet_operator",
  PartnerApi: "partner_api",
  Worker: "worker",
} as const;

export type ActorType = (typeof ActorType)[keyof typeof ActorType];

export const actorTypes: readonly ActorType[] = Object.values(ActorType);
