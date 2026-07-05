# Data Model: FlareRail Wallet API

## WalletOrganization

Represents a partner wallet or XRP application.

**Fields**: id, name, slug, environment, status, branding metadata, allowed origins, support contact, created at, updated at.

**Relationships**: Has many workspaces, users, strategies enabled through policy, credentials, webhook endpoints, intents, positions, lifecycle events, and incidents.

**Validation Rules**:

- Name and slug are required.
- Test and production environments are separated.
- Suspended organizations cannot create new deposit intents.
- Organization data cannot be visible to other organizations.

## WorkspaceCredential

Represents partner access credentials for an organization and environment.

**Fields**: id, organization id, environment, label, key identifier, secret hash, scopes, status, created at, rotated at, revoked at.

**Relationships**: Belongs to WalletOrganization.

**Validation Rules**:

- Secret material is never stored in plain text.
- Revoked credentials cannot authenticate.
- Production credentials cannot access test records, and test credentials cannot access production records.

## WalletUser

Represents an XRP holder as known to a partner wallet.

**Fields**: id, organization id, xrpl address, wallet-scoped user reference, status, created at, updated at.

**Relationships**: Has many deposit intents, positions, exit intents, and lifecycle events.

**Validation Rules**:

- XRPL address must be valid.
- Wallet-scoped user reference is optional but unique within a wallet when supplied.
- User records are scoped to one organization.

## Strategy

Represents a supported Flare-powered route or destination.

**Fields**: id, name, code, environment, risk category, status, capacity status, fee model, minimum amount, maximum amount, exit rules, disclosure copy, created at, updated at.

**Relationships**: Referenced by quotes, deposit intents, positions, policies, and incidents.

**Validation Rules**:

- Paused strategies cannot accept new deposit intents.
- Exits remain visible when a strategy is paused unless explicitly marked unavailable with a reason.
- Amount limits must be enforced before user commitment.

## RiskPolicy

Represents wallet-level controls for availability and exposure.

**Fields**: id, organization id, environment, enabled strategies, per-user exposure limit, organization exposure limit, eligibility rules, emergency pause setting, status, created at, updated at.

**Relationships**: Belongs to WalletOrganization; references Strategy.

**Validation Rules**:

- New deposit intents must pass active policy.
- Policy denials must produce user-safe reason codes.
- Policy changes are recorded as lifecycle events.

## Quote

Represents a pre-commitment estimate.

**Fields**: id, organization id, wallet user id, strategy id, input amount, expected output amount, fee summary, pricing snapshot, availability result, disclosure summary, expires at, status, created at.

**Relationships**: May be used by one deposit intent.

**Validation Rules**:

- Expired quotes cannot create deposit intents.
- Unavailable quotes cannot create deposit intents.
- Quote status is immutable after expiration or conversion to an intent.

## DepositIntent

Represents a tracked user commitment to move XRP-backed value into a strategy.

**Fields**: id, organization id, wallet user id, quote id, strategy id, amount, expected user action, instruction payload, fee summary, status, expires at, external references, failure reason, created at, updated at.

**Relationships**: Belongs to WalletOrganization, WalletUser, Quote, and Strategy. Creates zero or one Position. Has many LifecycleEvents.

**Validation Rules**:

- Must be created from an available, unexpired quote.
- Must not exceed wallet or user exposure limits.
- Replayed or duplicate user actions do not create duplicate positions.

**State Transitions**:

created -> awaiting_user_action -> observed -> activating -> active_position_created

created -> expired

awaiting_user_action -> expired

observed -> failed

activating -> failed

Any active non-terminal state -> cancelled only when no irreversible user action has been completed.

## Position

Represents a user's active strategy balance.

**Fields**: id, organization id, wallet user id, strategy id, source deposit intent id, active amount, valuation snapshot, status, exit eligibility, created at, updated at.

**Relationships**: Belongs to WalletUser and Strategy. Has many ExitIntents and LifecycleEvents.

**Validation Rules**:

- Active amount cannot be negative.
- Closed positions cannot create new exit intents.
- Position visibility must not depend on the integrating wallet remaining active.

**State Transitions**:

active -> exiting -> active

active -> exiting -> closed

active -> impaired

impaired -> active

impaired -> recovery_available

recovery_available -> closed

## ExitIntent

Represents a request to withdraw position value back to native XRP or another supported destination.

**Fields**: id, organization id, wallet user id, position id, amount, destination, fee summary, expected timing, status, recovery status, external references, failure reason, created at, updated at.

**Relationships**: Belongs to Position and WalletUser. Has many LifecycleEvents.

**Validation Rules**:

- Amount must be positive and not exceed eligible position amount.
- Destination must be valid for the selected exit route.
- Recoverable failures must remain visible until resolved, compensated, or escalated.

**State Transitions**:

created -> pending_user_confirmation -> submitted -> processing -> completed

created -> rejected

pending_user_confirmation -> expired

processing -> delayed

delayed -> processing

processing -> recoverable_failure

recoverable_failure -> compensated

recoverable_failure -> escalated

Any non-terminal state -> failed when no recovery path remains.

## LifecycleEvent

Represents an immutable audit event.

**Fields**: id, organization id, subject type, subject id, event type, timestamp, actor type, reason code, user-safe message, trace id, external references, metadata.

**Relationships**: Belongs to organization and one subject such as quote, intent, position, policy, credential, or incident.

**Validation Rules**:

- Events are append-only.
- Events must include a trace id.
- User-safe messages must not expose secrets or another wallet's data.

## WebhookEndpoint

Represents a partner notification destination.

**Fields**: id, organization id, environment, url, subscribed event types, signing secret reference, status, created at, updated at.

**Relationships**: Has many WebhookDeliveries.

**Validation Rules**:

- URL must use HTTPS in production.
- Disabled endpoints do not receive new deliveries.
- Event subscriptions must be scoped to the endpoint's organization and environment.

## WebhookDelivery

Represents one delivery attempt sequence for a lifecycle event.

**Fields**: id, webhook endpoint id, lifecycle event id, status, attempt count, next retry at, last response summary, created at, updated at.

**Relationships**: Belongs to WebhookEndpoint and LifecycleEvent.

**Validation Rules**:

- Deliveries are idempotent by event id.
- Failed deliveries are retried until the retry policy is exhausted.
- Out-of-order delivery must not require wallets to duplicate user-facing actions.

## Incident

Represents a degradation or exceptional condition.

**Fields**: id, organization scope, environment, severity, affected component, affected strategy id, status, summary, recommended action, affected user count, started at, updated at, resolved at.

**Relationships**: May affect many organizations, strategies, intents, positions, and events.

**Validation Rules**:

- Incidents must expose severity and affected scope.
- Resolved incidents must keep timeline history.
- Incidents that affect user commitments must be visible in dashboard and status outputs.
