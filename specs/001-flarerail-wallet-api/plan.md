# Implementation Plan: FlareRail Wallet API

**Working Branch**: `main` | **Date**: 2026-07-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-flarerail-wallet-api/spec.md`

## Summary

FlareRail is an API-first wallet infrastructure product with a first-class partner dashboard and thin TypeScript SDK. It lets XRPL wallets offer Flare-powered XRP utility through quote, deposit, position, exit, status, webhook, policy, and support workflows. The technical approach is a TypeScript monorepo with a dedicated partner API, orchestration worker, dashboard, SDK, shared domain package, PostgreSQL system of record, Redis-backed job orchestration, and explicit OpenAPI contracts.

## Technical Context

**Language/Version**: TypeScript on current active LTS Node.js

**Primary Dependencies**: Next.js dashboard, Fastify API, Prisma, PostgreSQL, Redis, BullMQ, viem, xrpl.js, OpenAPI tooling, Zod-compatible runtime validation, TypeScript SDK package

**Storage**: Heroku Postgres for system of record; Heroku Redis for queues, retries, locks, and transient orchestration state

**Testing**: Unit tests for domain/state machines, API contract tests from OpenAPI, integration tests for quote/deposit/exit flows, worker job tests with mocked Flare/XRPL providers, dashboard component/accessibility tests, and documented end-to-end validation in quickstart

**Target Platform**: Dashboard on Vercel; API, worker, Postgres, and Redis on Heroku

**Project Type**: Web service plus dashboard plus worker plus SDK in a monorepo

**Performance Goals**: 95% of quote requests return a presentable result or unavailability reason within 5 seconds; 95% of status checks return within 3 seconds; 99% of lifecycle updates are delivered or available for retry within 60 seconds; operator search completes within 30 seconds

**Constraints**: Wallet data isolation is mandatory; all irreversible user actions require explicit wallet-visible confirmation; test and production environments must be separated; webhook events must be idempotent and retryable; user-facing status must remain explainable during degraded Flare, XRPL, pricing, proof, or redemption conditions

**Scale/Scope**: Production-oriented hackathon build covering wallet workspace onboarding, quote, deposit intent, position tracking, exit intent, lifecycle events, webhooks, partner dashboard, developer docs, and TypeScript SDK. Initial strategy scope is conservative FXRP route support with extensible strategy records.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Code quality gate: PASS. The monorepo separates dashboard, API, worker, SDK, and shared domain logic so changes can stay small and reviewable.
- Testing gate: PASS. The plan requires unit, contract, integration, dashboard, worker, and documented end-to-end validation before implementation completion.
- UX consistency gate: PASS. Product copy and dashboard flows will use current Flare terminology from local docs: FAssets, FXRP, Flare Smart Accounts, FDC, FTSO, redemption, and underlying XRP.
- Performance gate: PASS. User-facing budgets are inherited from success criteria and mapped to quote, status, webhook, dashboard, and incident detection paths.

## Project Structure

### Documentation (this feature)

```text
specs/001-flarerail-wallet-api/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── api/
│   ├── src/
│   │   ├── auth/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── webhooks/
│   │   └── server.ts
│   └── tests/
├── dashboard/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── tests/
└── worker/
    ├── src/
    │   ├── jobs/
    │   ├── monitors/
    │   ├── processors/
    │   └── worker.ts
    └── tests/

packages/
├── core/
│   ├── src/
│   │   ├── domain/
│   │   ├── state-machines/
│   │   ├── validation/
│   │   └── reason-codes/
│   └── tests/
├── sdk/
│   ├── src/
│   └── tests/
├── contracts/
│   ├── abi/
│   ├── addresses/
│   └── src/
└── config/
    └── src/

prisma/
├── schema.prisma
└── migrations/

docs/
└── flarerail/
```

**Structure Decision**: Use a TypeScript monorepo with deployable `apps/api`, `apps/dashboard`, and `apps/worker`, plus shared `packages/core`, `packages/sdk`, `packages/contracts`, and `packages/config`. The dashboard remains first-class for production operations and demonstration, while the API remains the product boundary for wallet partners.

## Complexity Tracking

No constitution violations require justification.

## Phase 0 Research

Research decisions are captured in [research.md](./research.md). All technical context choices are resolved.

## Phase 1 Design

Design artifacts:

- [data-model.md](./data-model.md)
- [contracts/openapi.yaml](./contracts/openapi.yaml)
- [quickstart.md](./quickstart.md)

Post-design constitution check:

- Code quality gate: PASS. Entity boundaries and contracts keep implementation units cohesive.
- Testing gate: PASS. Quickstart and OpenAPI contracts define verifiable flows before task generation.
- UX consistency gate: PASS. Dashboard and API reason codes preserve user-safe Flare terminology.
- Performance gate: PASS. Contract and quickstart include quote/status/webhook timing expectations.

Agent context update: skipped because this project does not include an agent-context update script in `.specify/scripts/powershell`.
