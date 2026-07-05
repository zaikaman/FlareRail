# Tasks: FlareRail Wallet API

**Input**: Design documents from `specs/001-flarerail-wallet-api/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml), [quickstart.md](./quickstart.md)

**Tests**: Testing is mandatory for this feature. Contract, unit, integration, worker, SDK, dashboard, and quickstart validation tasks are included.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and demonstrated independently after the shared foundation is complete.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the TypeScript monorepo structure and baseline tooling for API, dashboard, worker, SDK, shared domain, contracts, and configuration.

- [ ] T001 Create monorepo workspace files in `package.json`, `tsconfig.base.json`, `npm-workspaces.json`, and `.gitignore`
- [ ] T002 Create source directories from the implementation plan in `apps/api`, `apps/dashboard`, `apps/worker`, `packages/core`, `packages/sdk`, `packages/contracts`, `packages/config`, `prisma`, and `docs/flarerail`
- [ ] T003 Configure shared TypeScript build settings in `tsconfig.base.json` and package-specific `tsconfig.json` files
- [ ] T004 [P] Configure linting and formatting in `eslint.config.js`, `.prettierrc.json`, and package scripts in `package.json`
- [ ] T005 [P] Configure test runner setup in `vitest.config.ts` and package-level test setup files
- [ ] T006 [P] Add environment variable templates in `.env.example`, `apps/api/.env.example`, `apps/worker/.env.example`, and `apps/dashboard/.env.example`
- [ ] T007 [P] Add Vercel dashboard deployment config in `apps/dashboard/vercel.json`
- [ ] T008 [P] Add Heroku process config for API and worker in `Procfile`
- [ ] T009 Add root scripts for build, lint, test, dev, migration, and validation workflows in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared domain models, persistence, authentication, queues, provider adapters, and API scaffolding required by all user stories.

**Critical**: No user story work can begin until this phase is complete.

- [ ] T010 Create core enum and status definitions in `packages/core/src/domain/statuses.ts`
- [ ] T011 Create shared reason-code catalog in `packages/core/src/reason-codes/index.ts`
- [ ] T012 Create shared validation schemas for addresses, amounts, environments, identifiers, and pagination in `packages/core/src/validation/common.ts`
- [ ] T013 Create deposit intent state machine in `packages/core/src/state-machines/deposit-intent.ts`
- [ ] T014 Create position state machine in `packages/core/src/state-machines/position.ts`
- [ ] T015 Create exit intent state machine in `packages/core/src/state-machines/exit-intent.ts`
- [ ] T016 [P] Add unit tests for shared validation schemas in `packages/core/tests/validation/common.test.ts`
- [ ] T017 [P] Add unit tests for deposit intent state transitions in `packages/core/tests/state-machines/deposit-intent.test.ts`
- [ ] T018 [P] Add unit tests for position state transitions in `packages/core/tests/state-machines/position.test.ts`
- [ ] T019 [P] Add unit tests for exit intent state transitions in `packages/core/tests/state-machines/exit-intent.test.ts`
- [ ] T020 Define Prisma schema for WalletOrganization, WorkspaceCredential, WalletUser, Strategy, RiskPolicy, Quote, DepositIntent, Position, ExitIntent, LifecycleEvent, WebhookEndpoint, WebhookDelivery, and Incident in `prisma/schema.prisma`
- [ ] T021 Create initial database migration for FlareRail entities in `prisma/migrations/001_initial_flarerail_schema/migration.sql`
- [ ] T022 Create Prisma client wrapper in `packages/core/src/persistence/db.ts`
- [ ] T023 Create seed data for a test wallet organization, strategy, and policy in `prisma/seed.ts`
- [ ] T024 [P] Add persistence integration tests for organization scoping and environment separation in `packages/core/tests/persistence/scoping.test.ts`
- [ ] T025 Create shared configuration loader in `packages/config/src/index.ts`
- [ ] T026 Create API server bootstrap in `apps/api/src/server.ts`
- [ ] T027 Create API route registration shell in `apps/api/src/routes/index.ts`
- [ ] T028 Create API authentication middleware for partner bearer credentials in `apps/api/src/auth/partner-auth.ts`
- [ ] T029 Create idempotency middleware for command endpoints in `apps/api/src/middleware/idempotency.ts`
- [ ] T030 Create centralized API error and reason-code mapping in `apps/api/src/middleware/errors.ts`
- [ ] T031 Create lifecycle event service in `apps/api/src/services/lifecycle-event-service.ts`
- [ ] T032 Create queue connection and queue names in `apps/worker/src/jobs/queues.ts`
- [ ] T033 Create worker bootstrap in `apps/worker/src/worker.ts`
- [ ] T034 Create Flare provider adapter interface in `packages/contracts/src/flare-provider.ts`
- [ ] T035 Create XRPL provider adapter interface in `packages/contracts/src/xrpl-provider.ts`
- [ ] T036 Create placeholder Flare contract address registry in `packages/contracts/addresses/coston2.json`
- [ ] T037 Create placeholder ABI export barrel in `packages/contracts/abi/index.ts`
- [ ] T038 [P] Add API auth contract tests in `apps/api/tests/contract/auth.test.ts`
- [ ] T039 [P] Add API error mapping unit tests in `apps/api/tests/unit/errors.test.ts`
- [ ] T040 [P] Add worker queue smoke test in `apps/worker/tests/queues.test.ts`

**Checkpoint**: Foundation ready. User story implementation can now begin in priority order or in parallel by separate developers.

---

## Phase 3: User Story 1 - Wallet launches XRP earn flow (Priority: P1) MVP

**Goal**: Wallets can discover strategies, request quotes, create deposit intents, present user instructions, and track the deposit lifecycle until an active position is created or the flow reaches an explainable terminal state.

**Independent Test**: Onboard a test wallet workspace, create a quote and deposit intent for a valid XRPL user, simulate the user action and worker lifecycle, then confirm active-position status and dashboard visibility.

### Tests for User Story 1

- [ ] T041 [P] [US1] Add contract tests for `GET /v1/strategies` and `POST /v1/quotes` in `apps/api/tests/contract/quotes.test.ts`
- [ ] T042 [P] [US1] Add contract tests for `POST /v1/deposit-intents` and `GET /v1/deposit-intents/{intentId}` in `apps/api/tests/contract/deposit-intents.test.ts`
- [ ] T043 [P] [US1] Add integration test for quote-to-active-position flow in `apps/api/tests/integration/deposit-flow.test.ts`
- [ ] T044 [P] [US1] Add worker processor test for deposit observation and activation in `apps/worker/tests/deposit-processor.test.ts`

### Implementation for User Story 1

- [ ] T045 [P] [US1] Create Strategy repository functions in `packages/core/src/repositories/strategy-repository.ts`
- [ ] T046 [P] [US1] Create Quote repository functions in `packages/core/src/repositories/quote-repository.ts`
- [ ] T047 [P] [US1] Create DepositIntent repository functions in `packages/core/src/repositories/deposit-intent-repository.ts`
- [ ] T048 [P] [US1] Create WalletUser repository functions in `packages/core/src/repositories/wallet-user-repository.ts`
- [ ] T049 [US1] Implement strategy listing service in `apps/api/src/services/strategy-service.ts`
- [ ] T050 [US1] Implement quote service with policy, amount, strategy, and expiration checks in `apps/api/src/services/quote-service.ts`
- [ ] T051 [US1] Implement deposit intent service with idempotency and user instruction generation in `apps/api/src/services/deposit-intent-service.ts`
- [ ] T052 [US1] Implement position creation service for completed deposits in `apps/api/src/services/position-service.ts`
- [ ] T053 [US1] Implement `GET /v1/strategies` route in `apps/api/src/routes/strategies.ts`
- [ ] T054 [US1] Implement `POST /v1/quotes` route in `apps/api/src/routes/quotes.ts`
- [ ] T055 [US1] Implement `POST /v1/deposit-intents` route in `apps/api/src/routes/deposit-intents.ts`
- [ ] T056 [US1] Implement `GET /v1/deposit-intents/{intentId}` route in `apps/api/src/routes/deposit-intents.ts`
- [ ] T057 [US1] Implement deposit observation job producer in `apps/api/src/services/deposit-job-service.ts`
- [ ] T058 [US1] Implement deposit observation worker processor in `apps/worker/src/processors/deposit-observation-processor.ts`
- [ ] T059 [US1] Implement mocked XRPL deposit monitor for test environment in `apps/worker/src/monitors/xrpl-deposit-monitor.ts`
- [ ] T060 [US1] Implement mocked Flare activation adapter for test environment in `apps/worker/src/processors/flare-activation-processor.ts`
- [ ] T061 [US1] Emit lifecycle events for quote, deposit intent, observation, activation, failure, expiration, and position creation in `apps/api/src/services/deposit-intent-service.ts`
- [ ] T062 [US1] Add basic dashboard deposit intent list and detail pages in `apps/dashboard/app/intents/page.tsx` and `apps/dashboard/app/intents/[intentId]/page.tsx`
- [ ] T063 [US1] Add dashboard API client for strategies, quotes, and deposit intents in `apps/dashboard/lib/flarerail-api.ts`
- [ ] T064 [US1] Add manual validation notes for US1 to `docs/flarerail/deposit-flow.md`

**Checkpoint**: User Story 1 is independently functional and demoable as the MVP.

---

## Phase 4: User Story 2 - User exits back to native XRP (Priority: P1)

**Goal**: Wallets can create full or partial exit intents for eligible positions and track completion, delay, failure, or recovery states.

**Independent Test**: Use an active position, create an exit intent, simulate normal and recoverable exit paths, and verify API and dashboard state.

### Tests for User Story 2

- [ ] T065 [P] [US2] Add contract tests for `GET /v1/positions` and `GET /v1/positions/{positionId}` in `apps/api/tests/contract/positions.test.ts`
- [ ] T066 [P] [US2] Add contract tests for `POST /v1/exit-intents` and `GET /v1/exit-intents/{intentId}` in `apps/api/tests/contract/exit-intents.test.ts`
- [ ] T067 [P] [US2] Add integration test for full exit flow in `apps/api/tests/integration/exit-flow.test.ts`
- [ ] T068 [P] [US2] Add worker processor test for recoverable redemption failure in `apps/worker/tests/exit-recovery-processor.test.ts`

### Implementation for User Story 2

- [ ] T069 [P] [US2] Create Position repository functions in `packages/core/src/repositories/position-repository.ts`
- [ ] T070 [P] [US2] Create ExitIntent repository functions in `packages/core/src/repositories/exit-intent-repository.ts`
- [ ] T071 [US2] Implement position query service in `apps/api/src/services/position-query-service.ts`
- [ ] T072 [US2] Implement exit intent service with eligibility, amount, destination, and idempotency checks in `apps/api/src/services/exit-intent-service.ts`
- [ ] T073 [US2] Implement `GET /v1/positions` route in `apps/api/src/routes/positions.ts`
- [ ] T074 [US2] Implement `GET /v1/positions/{positionId}` route in `apps/api/src/routes/positions.ts`
- [ ] T075 [US2] Implement `POST /v1/exit-intents` route in `apps/api/src/routes/exit-intents.ts`
- [ ] T076 [US2] Implement `GET /v1/exit-intents/{intentId}` route in `apps/api/src/routes/exit-intents.ts`
- [ ] T077 [US2] Implement exit processing job producer in `apps/api/src/services/exit-job-service.ts`
- [ ] T078 [US2] Implement exit processing worker in `apps/worker/src/processors/exit-processor.ts`
- [ ] T079 [US2] Implement recoverable redemption failure simulator in `apps/worker/src/processors/redemption-recovery-processor.ts`
- [ ] T080 [US2] Emit lifecycle events for exit creation, submission, processing, delay, completion, recoverable failure, compensation, and escalation in `apps/api/src/services/exit-intent-service.ts`
- [ ] T081 [US2] Add dashboard positions list and detail pages in `apps/dashboard/app/positions/page.tsx` and `apps/dashboard/app/positions/[positionId]/page.tsx`
- [ ] T082 [US2] Add dashboard exit intent detail page in `apps/dashboard/app/exits/[intentId]/page.tsx`
- [ ] T083 [US2] Add manual validation notes for US2 to `docs/flarerail/exit-flow.md`

**Checkpoint**: User Story 2 works independently using seeded or US1-created positions.

---

## Phase 5: User Story 3 - Wallet monitors users and operational health in a dashboard (Priority: P2)

**Goal**: Wallet operators can search users, intents, positions, lifecycle events, incidents, strategy availability, pricing, and exposure from a production support dashboard.

**Independent Test**: Create mixed deposit and exit records, then search and inspect status, reason codes, affected users, and incident timelines in the dashboard.

### Tests for User Story 3

- [ ] T084 [P] [US3] Add contract tests for `GET /v1/events` and `GET /v1/incidents` in `apps/api/tests/contract/operations.test.ts`
- [ ] T085 [P] [US3] Add dashboard component tests for intent search and event timeline in `apps/dashboard/tests/operations-dashboard.test.tsx`
- [ ] T086 [P] [US3] Add integration test for incident creation and affected-user visibility in `apps/api/tests/integration/incidents.test.ts`

### Implementation for User Story 3

- [ ] T087 [P] [US3] Create LifecycleEvent repository search functions in `packages/core/src/repositories/lifecycle-event-repository.ts`
- [ ] T088 [P] [US3] Create Incident repository functions in `packages/core/src/repositories/incident-repository.ts`
- [ ] T089 [US3] Implement lifecycle event search service in `apps/api/src/services/event-search-service.ts`
- [ ] T090 [US3] Implement incident service with affected-user counts and severity in `apps/api/src/services/incident-service.ts`
- [ ] T091 [US3] Implement `GET /v1/events` route in `apps/api/src/routes/events.ts`
- [ ] T092 [US3] Implement `GET /v1/incidents` route in `apps/api/src/routes/incidents.ts`
- [ ] T093 [US3] Add dashboard shell navigation and workspace layout in `apps/dashboard/app/layout.tsx`
- [ ] T094 [US3] Add operations overview page in `apps/dashboard/app/page.tsx`
- [ ] T095 [US3] Add lifecycle event timeline component in `apps/dashboard/components/event-timeline.tsx`
- [ ] T096 [US3] Add incident list and detail pages in `apps/dashboard/app/incidents/page.tsx` and `apps/dashboard/app/incidents/[incidentId]/page.tsx`
- [ ] T097 [US3] Add dashboard search components for user address, intent id, position id, status, and trace id in `apps/dashboard/components/global-search.tsx`
- [ ] T098 [US3] Add export endpoint for support records in `apps/api/src/routes/exports.ts`
- [ ] T099 [US3] Add dashboard accessibility checks for search, timeline, and incident views in `apps/dashboard/tests/accessibility.test.tsx`

**Checkpoint**: User Story 3 provides production support visibility without requiring raw logs.

---

## Phase 6: User Story 4 - Developers integrate through docs and SDK wrapper (Priority: P2)

**Goal**: Developers can integrate FlareRail through OpenAPI docs and a thin TypeScript SDK covering quotes, deposit intents, exits, status reads, and webhook verification.

**Independent Test**: A fresh developer workspace follows the quickstart and completes quote, deposit intent, status, webhook, and exit flows through the SDK.

### Tests for User Story 4

- [ ] T100 [P] [US4] Add SDK unit tests for client initialization and authenticated requests in `packages/sdk/tests/client.test.ts`
- [ ] T101 [P] [US4] Add SDK tests for quote, deposit intent, position, and exit helpers in `packages/sdk/tests/flows.test.ts`
- [ ] T102 [P] [US4] Add SDK tests for webhook signature verification in `packages/sdk/tests/webhooks.test.ts`
- [ ] T103 [P] [US4] Add documentation smoke test for quickstart commands in `docs/flarerail/tests/quickstart-docs.test.ts`

### Implementation for User Story 4

- [ ] T104 [P] [US4] Create OpenAPI source copy for generated docs in `docs/flarerail/openapi.yaml`
- [ ] T105 [US4] Add OpenAPI validation script in `packages/contracts/src/validate-openapi.ts`
- [ ] T106 [US4] Implement SDK client constructor and request helper in `packages/sdk/src/client.ts`
- [ ] T107 [US4] Implement SDK quote and deposit intent methods in `packages/sdk/src/deposits.ts`
- [ ] T108 [US4] Implement SDK position and exit intent methods in `packages/sdk/src/exits.ts`
- [ ] T109 [US4] Implement SDK event and webhook verification helpers in `packages/sdk/src/webhooks.ts`
- [ ] T110 [US4] Export SDK public API in `packages/sdk/src/index.ts`
- [ ] T111 [US4] Add developer quickstart documentation in `docs/flarerail/quickstart.md`
- [ ] T112 [US4] Add API authentication and idempotency documentation in `docs/flarerail/api-auth.md`
- [ ] T113 [US4] Add webhook integration documentation in `docs/flarerail/webhooks.md`
- [ ] T114 [US4] Add dashboard developer documentation pages in `apps/dashboard/app/docs/page.tsx`
- [ ] T115 [US4] Add SDK example script in `packages/sdk/examples/deposit-and-exit.ts`

**Checkpoint**: User Story 4 allows integration without private support.

---

## Phase 7: User Story 5 - Risk controls protect users and wallet partners (Priority: P3)

**Goal**: Wallets can configure strategy availability, exposure limits, eligibility rules, emergency pause behavior, notification destinations, and incident response controls.

**Independent Test**: Configure policy limits and pauses, verify blocked quotes/deposits are denied before commitment, and confirm affected exposure appears in dashboard health views.

### Tests for User Story 5

- [ ] T116 [P] [US5] Add contract tests for `GET /v1/policies` and `PUT /v1/policies` in `apps/api/tests/contract/policies.test.ts`
- [ ] T117 [P] [US5] Add integration test for policy-blocked quote and deposit flows in `apps/api/tests/integration/policy-controls.test.ts`
- [ ] T118 [P] [US5] Add dashboard tests for policy settings and emergency pause controls in `apps/dashboard/tests/policy-settings.test.tsx`

### Implementation for User Story 5

- [ ] T119 [P] [US5] Create RiskPolicy repository functions in `packages/core/src/repositories/risk-policy-repository.ts`
- [ ] T120 [P] [US5] Create WebhookEndpoint repository functions in `packages/core/src/repositories/webhook-endpoint-repository.ts`
- [ ] T121 [US5] Implement policy service with strategy, exposure, eligibility, and emergency pause checks in `apps/api/src/services/policy-service.ts`
- [ ] T122 [US5] Implement `GET /v1/policies` route in `apps/api/src/routes/policies.ts`
- [ ] T123 [US5] Implement `PUT /v1/policies` route in `apps/api/src/routes/policies.ts`
- [ ] T124 [US5] Implement webhook endpoint registration route in `apps/api/src/routes/webhook-endpoints.ts`
- [ ] T125 [US5] Implement webhook delivery service with signing, retries, and idempotent event ids in `apps/api/src/webhooks/webhook-delivery-service.ts`
- [ ] T126 [US5] Implement webhook delivery worker in `apps/worker/src/processors/webhook-delivery-processor.ts`
- [ ] T127 [US5] Integrate policy checks into quote and deposit services in `apps/api/src/services/quote-service.ts` and `apps/api/src/services/deposit-intent-service.ts`
- [ ] T128 [US5] Add dashboard policy settings page in `apps/dashboard/app/settings/policies/page.tsx`
- [ ] T129 [US5] Add dashboard webhook settings page in `apps/dashboard/app/settings/webhooks/page.tsx`
- [ ] T130 [US5] Add emergency pause UI controls in `apps/dashboard/components/emergency-pause-control.tsx`
- [ ] T131 [US5] Add manual validation notes for policy and incident controls to `docs/flarerail/risk-controls.md`

**Checkpoint**: User Story 5 provides production guardrails for partner launches.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, deployment readiness, performance validation, terminology review, and full quickstart execution.

- [ ] T132 [P] Add health and readiness checks for API and worker in `apps/api/src/routes/health.ts` and `apps/worker/src/jobs/readiness.ts`
- [ ] T133 [P] Add structured logging and trace id propagation in `packages/core/src/observability/logger.ts`
- [ ] T134 [P] Add Heroku deployment documentation in `docs/flarerail/deployment-heroku.md`
- [ ] T135 [P] Add Vercel deployment documentation in `docs/flarerail/deployment-vercel.md`
- [ ] T136 Add performance validation script for quote and status budgets in `apps/api/tests/performance/quote-status-budget.test.ts`
- [ ] T137 Add dashboard performance smoke test for operator search in `apps/dashboard/tests/performance/search-budget.test.ts`
- [ ] T138 Add cross-wallet isolation security tests in `apps/api/tests/security/cross-wallet-isolation.test.ts`
- [ ] T139 Add production/test environment separation security tests in `apps/api/tests/security/environment-separation.test.ts`
- [ ] T140 Review user-facing Flare terminology across dashboard and docs in `docs/flarerail/terminology-review.md`
- [ ] T141 Execute and record quickstart validation results in `specs/001-flarerail-wallet-api/quickstart-results.md`
- [ ] T142 Run full lint, test, build, OpenAPI validation, and quickstart checks from `package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 and blocks all user story work.
- **User Story 1 (Phase 3)**: Depends on Phase 2 and is the MVP scope.
- **User Story 2 (Phase 4)**: Depends on Phase 2 and can use seeded positions if US1 is not complete.
- **User Story 3 (Phase 5)**: Depends on Phase 2 and can use seeded records if US1 or US2 are not complete.
- **User Story 4 (Phase 6)**: Depends on Phase 2 and can run alongside US1 after API contract paths exist.
- **User Story 5 (Phase 7)**: Depends on Phase 2 and integrates back into US1 quote/deposit services.
- **Polish (Phase 8)**: Depends on all desired user stories for the delivery milestone.

### User Story Dependencies

- **US1 - Wallet launches XRP earn flow**: Independent after Foundation. Suggested MVP.
- **US2 - User exits back to native XRP**: Independent after Foundation when seeded positions exist; enhances US1 positions when both are implemented.
- **US3 - Dashboard operations**: Independent after Foundation with seeded records; becomes richer as US1 and US2 produce real lifecycle data.
- **US4 - Developer SDK and docs**: Independent after Foundation and OpenAPI contract stabilization; wraps US1 and US2 endpoints.
- **US5 - Risk controls**: Independent policy configuration after Foundation; final integration into US1 quote/deposit paths is required for complete guardrails.

### Within Each User Story

- Tests are listed before implementation and should be created to fail before implementation.
- Repository and model tasks precede service tasks.
- Service tasks precede route, worker, dashboard, and SDK integration tasks.
- Lifecycle events and reason codes should be added before dashboard support views depend on them.

---

## Parallel Opportunities

- T004 through T008 can run in parallel after T001 through T003 define the workspace.
- T016 through T019 can run in parallel after T010 through T015 define shared state and validation.
- T038 through T040 can run in parallel after API, auth, error handling, and queue scaffolding exist.
- US1 tests T041 through T044 can run in parallel.
- US1 repositories T045 through T048 can run in parallel.
- US2 tests T065 through T068 can run in parallel.
- US3 tests T084 through T086 can run in parallel.
- US4 tests T100 through T103 can run in parallel.
- US5 tests T116 through T118 can run in parallel.
- Deployment docs and observability polish tasks T132 through T135 can run in parallel.

## Parallel Example: User Story 1

```text
Task: T041 [US1] Add contract tests for strategies and quotes in apps/api/tests/contract/quotes.test.ts
Task: T042 [US1] Add contract tests for deposit intents in apps/api/tests/contract/deposit-intents.test.ts
Task: T043 [US1] Add integration test for quote-to-active-position flow in apps/api/tests/integration/deposit-flow.test.ts
Task: T044 [US1] Add worker processor test for deposit observation and activation in apps/worker/tests/deposit-processor.test.ts
```

```text
Task: T045 [US1] Create Strategy repository functions in packages/core/src/repositories/strategy-repository.ts
Task: T046 [US1] Create Quote repository functions in packages/core/src/repositories/quote-repository.ts
Task: T047 [US1] Create DepositIntent repository functions in packages/core/src/repositories/deposit-intent-repository.ts
Task: T048 [US1] Create WalletUser repository functions in packages/core/src/repositories/wallet-user-repository.ts
```

## Parallel Example: User Story 2

```text
Task: T065 [US2] Add contract tests for positions in apps/api/tests/contract/positions.test.ts
Task: T066 [US2] Add contract tests for exit intents in apps/api/tests/contract/exit-intents.test.ts
Task: T067 [US2] Add integration test for full exit flow in apps/api/tests/integration/exit-flow.test.ts
Task: T068 [US2] Add worker processor test for recoverable redemption failure in apps/worker/tests/exit-recovery-processor.test.ts
```

## Parallel Example: User Story 3

```text
Task: T084 [US3] Add contract tests for events and incidents in apps/api/tests/contract/operations.test.ts
Task: T085 [US3] Add dashboard component tests in apps/dashboard/tests/operations-dashboard.test.tsx
Task: T086 [US3] Add integration test for incident visibility in apps/api/tests/integration/incidents.test.ts
```

## Parallel Example: User Story 4

```text
Task: T100 [US4] Add SDK client tests in packages/sdk/tests/client.test.ts
Task: T101 [US4] Add SDK flow tests in packages/sdk/tests/flows.test.ts
Task: T102 [US4] Add SDK webhook tests in packages/sdk/tests/webhooks.test.ts
Task: T103 [US4] Add documentation smoke test in docs/flarerail/tests/quickstart-docs.test.ts
```

## Parallel Example: User Story 5

```text
Task: T116 [US5] Add policy contract tests in apps/api/tests/contract/policies.test.ts
Task: T117 [US5] Add policy integration tests in apps/api/tests/integration/policy-controls.test.ts
Task: T118 [US5] Add dashboard policy tests in apps/dashboard/tests/policy-settings.test.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Stop and validate: run US1 contract tests, integration test, worker test, and manual dashboard validation.
5. Deploy API and worker to Heroku and dashboard to Vercel if US1 is stable.

### Production Increment

1. Add US2 to prove redeemability and exit trust.
2. Add US3 to make the dashboard production-support credible.
3. Add US4 to make the product partner-integrable through SDK and docs.
4. Add US5 to enforce launch guardrails and policy controls.
5. Complete Phase 8 before final hackathon submission.

### Parallel Team Strategy

1. One developer owns foundation and data model.
2. One developer owns API routes and services.
3. One developer owns worker orchestration.
4. One developer owns dashboard.
5. One developer owns SDK/docs and validation.

## Notes

- All tasks follow the required checklist format.
- `[P]` means the task can run in parallel because it touches different files and has no dependency on incomplete tasks in the same phase.
- `[US1]` through `[US5]` labels map directly to the user stories in `spec.md`.
- Tests should be created before implementation and should fail until the corresponding implementation tasks are complete.
- Keep Flare terminology aligned with the local Developer Hub docs: FAssets, FXRP, Flare Smart Accounts, FDC, FTSO, redemption, and underlying XRP.
