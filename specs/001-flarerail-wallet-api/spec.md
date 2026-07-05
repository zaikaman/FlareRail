# Feature Specification: FlareRail Wallet API

**Working Branch**: `main`

**Created**: 2026-07-05

**Status**: Draft

**Input**: User description: "Build a production-ready API-first wallet infrastructure product, with a thin SDK wrapper, that lets XRPL wallets integrate Flare-powered XRP yield, FXRP minting, strategy routing, redemption, status tracking, and developer-facing operational visibility."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Wallet launches XRP earn flow (Priority: P1)

An XRPL wallet product team can configure a branded earn flow for its users, create a deposit intent for a user's XRP, present clear signing instructions, and track the resulting position until the user's XRP-backed value is active in a selected Flare strategy.

**Why this priority**: This is the core business value. Wallets need a reliable way to offer Flare-powered XRP utility without building FAssets orchestration, proof tracking, or user status handling themselves.

**Independent Test**: Can be fully tested by onboarding a wallet workspace, creating a deposit intent for a test user, completing the required user signature or payment action, and confirming that the wallet receives a final active-position status with user-visible amounts and references.

**Acceptance Scenarios**:

1. **Given** a wallet has an active workspace and a supported strategy, **When** it creates a deposit intent for a valid XRPL user and amount, **Then** the system returns user instructions, expected amounts, expiration details, fees, and a stable tracking identifier.
2. **Given** a user completes the required XRPL-side action before expiration, **When** the wallet checks the intent status, **Then** the system shows each lifecycle step from submitted to active or failed, including user-facing remediation when action is needed.
3. **Given** a wallet requests a quote before creating an intent, **When** current pricing or capacity makes the selected strategy unavailable, **Then** the system explains the reason and offers available alternatives without creating a user commitment.

---

### User Story 2 - User exits back to native XRP (Priority: P1)

An XRP holder whose position was created through a wallet can request exit back to native XRP, understand timing and fees, and receive a traceable completion or actionable failure state.

**Why this priority**: A production product must prove that users can leave, not only enter. Redeemability is central to trust for XRP users and wallet partners.

**Independent Test**: Can be fully tested by using an existing active position, requesting a full or partial exit, and verifying that the user receives a final redeemed, pending, or failed-with-remediation status.

**Acceptance Scenarios**:

1. **Given** a user has an active position with redeemable value, **When** the wallet creates an exit intent, **Then** the system returns expected native XRP destination, timing, fees, and risk disclosures before the user commits.
2. **Given** an exit is in progress, **When** the wallet or user checks status, **Then** the system reports the current stage, relevant transaction references, expected next update, and whether the user or operator must act.
3. **Given** an exit cannot complete normally, **When** the system detects a missed required underlying payment window, **Then** the system marks the exit as recoverable, exposes the recovery path, and records compensation or escalation status.

---

### User Story 3 - Wallet monitors users and operational health (Priority: P2)

A wallet operations team can view all user intents, positions, strategy capacity, proof status, pricing, incidents, and user-impacting delays from a dashboard suitable for production support.

**Why this priority**: Production wallet partners need supportability, not just happy-path transaction orchestration. This reduces support tickets and makes incidents auditable.

**Independent Test**: Can be tested by creating several deposit and exit intents with mixed outcomes and confirming that the dashboard provides searchable status, reason codes, timestamps, and exportable records.

**Acceptance Scenarios**:

1. **Given** a wallet has multiple users and intents, **When** an operator searches by user address, intent identifier, or status, **Then** matching records show the current state, history, and user-facing explanation.
2. **Given** a strategy, proof source, or redemption path is delayed or degraded, **When** an operator opens the health view, **Then** the system shows affected users, severity, last update, and recommended action.
3. **Given** a wallet needs to answer a user support request, **When** an operator opens a specific intent, **Then** the operator can see a complete chronological audit trail without exposing unrelated users.

---

### User Story 4 - Developers integrate through docs and SDK wrapper (Priority: P2)

A wallet developer can understand the integration model, use a small client wrapper to create quotes and intents, receive status updates, and launch a test integration without direct coordination with the product team.

**Why this priority**: The product is API-first, but a thin SDK and high-quality developer experience materially reduce adoption friction.

**Independent Test**: Can be tested by a developer following public onboarding instructions in a fresh workspace and completing quote, deposit, status, and exit flows in a test environment.

**Acceptance Scenarios**:

1. **Given** a developer has a wallet workspace, **When** they follow the quickstart, **Then** they can create a quote and deposit intent in under 30 minutes.
2. **Given** a wallet subscribes to status updates, **When** an intent changes state, **Then** the wallet receives a timely update with a stable event type, user-safe reason code, and trace identifier.
3. **Given** a developer submits invalid input, **When** the system rejects it, **Then** the response clearly identifies the field, the reason, and the safe next action.

---

### User Story 5 - Risk controls protect users and wallet partners (Priority: P3)

A wallet can configure risk limits, supported strategies, geographic or policy restrictions, maximum user exposure, and emergency pause behavior so that FlareRail can be launched responsibly in production.

**Why this priority**: Production readiness requires bounded exposure and clear controls, but the first usable product can launch with conservative defaults while advanced policy controls mature.

**Independent Test**: Can be tested by configuring wallet-level limits and verifying that quotes, deposits, and exits honor the configured controls and produce auditable denials.

**Acceptance Scenarios**:

1. **Given** a wallet sets a per-user exposure limit, **When** a user attempts to deposit above that limit, **Then** the system rejects the intent before user commitment and explains the limit.
2. **Given** an operator pauses a strategy, **When** a wallet requests a new quote for that strategy, **Then** no new deposit intent is created and existing users retain visible exit options.
3. **Given** a risk signal changes for an active strategy, **When** the wallet opens its settings or health view, **Then** the system shows affected exposure and recommended action.

### Edge Cases

- User completes an XRPL-side action after the intent expires.
- User sends less or more XRP than the expected amount.
- User repeats the same action or attempts to replay an old instruction.
- Selected strategy capacity changes between quote and commitment.
- Pricing changes materially between quote, deposit, and final activation.
- Underlying proof or attestation is delayed, unavailable, or rejected.
- Redemption is delayed, partially completed, or enters a recoverable default path.
- Wallet webhook delivery fails or is retried out of order.
- A wallet workspace is suspended while user positions still exist.
- A user wants to exit when the original wallet integration is unavailable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow wallet organizations to create and manage production and test workspaces with separate credentials, branding metadata, allowed origins, notification destinations, and operator roles.
- **FR-002**: The system MUST provide wallet-facing quotes for supported XRP-to-Flare strategies before user commitment, including expected input, expected output, fees, timing, availability, expiration, and user-facing risk disclosures.
- **FR-003**: The system MUST allow wallets to create deposit intents for valid XRPL users, amounts, destinations, and supported strategies.
- **FR-004**: Each deposit intent MUST have a stable identifier, expiration, current lifecycle status, user instructions, expected user action, fee summary, and traceable external references when available.
- **FR-005**: The system MUST reject deposit intents that violate wallet policy, user limits, unsupported strategy rules, expired quotes, unavailable capacity, invalid addresses, or unsafe amount boundaries.
- **FR-006**: The system MUST track the full lifecycle of each deposit intent from creation through user action, proof observation, Flare-side activation, active position creation, failure, expiration, or cancellation.
- **FR-007**: The system MUST expose current and historical position records for each wallet user, including active amount, strategy, valuation, status, created date, exit eligibility, and relevant transaction references.
- **FR-008**: The system MUST allow wallets to create full and partial exit intents for eligible active positions.
- **FR-009**: Each exit intent MUST communicate expected native XRP destination, expected timing, fees, current stage, completion references, and failure or recovery state.
- **FR-010**: The system MUST detect and represent recoverable redemption failures, including missed underlying payment windows, and expose compensation or escalation status in a way wallet support teams can explain to users.
- **FR-011**: The system MUST maintain an auditable lifecycle history for every quote, deposit intent, exit intent, position, status update, policy decision, and operator action.
- **FR-012**: The system MUST provide wallet-level operational dashboards for searching users, intents, positions, statuses, incidents, strategy availability, pricing, and exposure.
- **FR-013**: The system MUST provide programmatic status retrieval and event notifications for quote, intent, position, incident, and policy state changes.
- **FR-014**: The system MUST ensure event notifications are traceable, retryable, and safe for wallets to process more than once without duplicating user-facing actions.
- **FR-015**: The system MUST provide human-readable reason codes and remediation guidance for failed, delayed, expired, rejected, or paused flows.
- **FR-016**: The system MUST provide a thin developer client wrapper that covers workspace authentication, quote creation, deposit intent creation, exit intent creation, status retrieval, and event verification.
- **FR-017**: The system MUST provide developer documentation that enables a new wallet developer to complete a test quote, deposit, status, and exit flow without private support.
- **FR-018**: The system MUST allow wallets to configure supported strategies, exposure limits, user eligibility policy, emergency pause behavior, notification destinations, and support contact metadata.
- **FR-019**: The system MUST preserve user control by presenting clear commitment steps and avoiding irreversible user actions without explicit wallet-visible confirmation.
- **FR-020**: The system MUST provide a fallback user recovery path for active positions when the integrating wallet is unavailable, suspended, or no longer operating.
- **FR-021**: The system MUST separate test-environment activity from production activity in all user-facing records, dashboards, credentials, and reports.
- **FR-022**: The system MUST provide exportable records for wallet reconciliation, support, and compliance review.
- **FR-023**: The system MUST prevent cross-wallet data disclosure so one wallet cannot view another wallet's users, positions, intents, policies, credentials, or operational records.
- **FR-024**: The system MUST provide clear availability and degradation states for supported strategies, proof sources, pricing, and redemption paths.
- **FR-025**: The system MUST support manual operator review for exceptional incidents without blocking unaffected users or unrelated wallets.

### Key Entities

- **Wallet Organization**: A partner wallet or XRP application using FlareRail. Key attributes include workspace name, environment, credentials, branding, policy settings, notification destinations, operator roles, and status.
- **Wallet User**: An XRP holder known to a wallet by XRPL address and optional wallet-scoped user reference. Related to deposit intents, positions, and exit intents.
- **Strategy**: A supported Flare-powered destination or route for XRP-backed value. Key attributes include name, risk category, availability, capacity, fee model, exit rules, and status.
- **Quote**: A pre-commitment estimate for a user action. Key attributes include input amount, expected output, strategy, fees, expiration, risk disclosures, and availability result.
- **Deposit Intent**: A tracked request to move a user's XRP-backed value into a strategy. Key attributes include wallet, user, quote, amount, instructions, lifecycle state, expiration, fees, and external references.
- **Position**: A user's active strategy balance created through FlareRail. Key attributes include owner, strategy, amount, valuation, status, creation date, exit eligibility, and historical events.
- **Exit Intent**: A tracked request to withdraw some or all of a position back to native XRP or another supported destination. Key attributes include position, amount, destination, fees, lifecycle state, recovery status, and completion references.
- **Lifecycle Event**: An immutable status or audit record tied to a quote, intent, position, workspace, policy decision, or incident. Key attributes include event type, timestamp, actor, reason code, trace identifier, and user-safe message.
- **Risk Policy**: Wallet-configured constraints that bound who can use the product, how much they can deposit, which strategies are enabled, and what happens during degraded conditions.
- **Incident**: A service, strategy, proof, pricing, redemption, or operational condition that may affect user flows. Key attributes include severity, scope, affected users, status, timeline, and recommended action.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new wallet developer can complete the test quote, deposit intent, status tracking, and exit intent flow in under 30 minutes using public documentation.
- **SC-002**: At least 95% of valid quote requests return a user-presentable result or explicit unavailability reason within 5 seconds under normal operating conditions.
- **SC-003**: At least 95% of status checks for existing intents and positions return current state, next expected action, and trace identifier within 3 seconds under normal operating conditions.
- **SC-004**: Wallet operators can find any user intent or position by user address, intent identifier, or status in under 30 seconds.
- **SC-005**: 100% of completed deposit and exit flows include a chronological audit trail with timestamps, status transitions, reason codes, and external references where applicable.
- **SC-006**: 100% of rejected user commitments provide a user-safe reason and recommended next action before the user performs an irreversible step.
- **SC-007**: Event notifications for lifecycle changes are delivered or made available for retry within 60 seconds for at least 99% of state changes under normal operating conditions.
- **SC-008**: Wallet-level policy controls prevent deposits above configured limits in 100% of tested policy scenarios.
- **SC-009**: Production dashboards identify affected users and severity for simulated strategy, proof, pricing, or redemption degradation within 2 minutes of detection.
- **SC-010**: In user testing with wallet operators, at least 80% can explain a delayed or failed user flow using the dashboard audit trail without engineering assistance.

## Assumptions

- The initial product is API-first for wallet organizations, with a thin developer client wrapper and a hosted dashboard for operations.
- The initial partner user is an XRPL wallet or XRP application that already has a user relationship and can present signing or payment instructions to the user.
- Users interact primarily through the partner wallet, while FlareRail provides status, orchestration, disclosures, and recovery visibility.
- Conservative supported strategies will launch first, and unsupported or degraded strategies will be unavailable for new deposits while exits remain visible.
- Wallet partners are responsible for their own end-user terms, regional availability decisions, and customer relationship, while FlareRail provides product-level disclosures, status, and operational evidence.
- Test and production environments must be visibly separated to prevent accidental production commitments during integration.
- Production readiness includes supportability, auditability, policy controls, incident visibility, and user recovery paths, not only successful happy-path flows.
