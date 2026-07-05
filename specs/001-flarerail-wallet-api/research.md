# Research: FlareRail Wallet API

## Decision: TypeScript monorepo

**Rationale**: The product spans a dashboard, partner API, worker, and SDK. TypeScript keeps domain types, validation, status enums, reason codes, and SDK contracts consistent across those surfaces.

**Alternatives considered**: Separate repositories were rejected because they would slow iteration and make shared state-machine changes harder to review during the hackathon. A polyglot backend was rejected because it adds operational overhead without improving the product.

## Decision: Next.js dashboard deployed on Vercel

**Rationale**: The dashboard is a first-class partner and judge-facing surface. Next.js on Vercel gives fast deployment, routing, server-rendered documentation pages, and a polished operator interface without coupling dashboard availability to worker throughput.

**Alternatives considered**: A dashboard served by the API was rejected because it couples operational UI deployment to backend release cycles. A static-only dashboard was rejected because partner operations need authenticated, dynamic data.

## Decision: Fastify API deployed on Heroku

**Rationale**: FlareRail is API-first and needs a dedicated service for partner authentication, idempotency, OpenAPI documentation, webhook delivery, status reads, and intent creation. Fastify fits a production API surface with explicit schemas and predictable performance.

**Alternatives considered**: Dashboard-native route handlers were rejected because long-lived API ownership, partner auth, and webhook behavior should not depend on the dashboard runtime. A heavier application framework was rejected for speed and simplicity.

## Decision: Separate worker process on Heroku

**Rationale**: Deposit, proof, redemption, webhook, and monitoring flows are asynchronous. A separate worker prevents chain polling, retries, and background orchestration from blocking partner API requests.

**Alternatives considered**: Running workers inside the API process was rejected because it weakens reliability during deploys and traffic spikes. External managed workflow products were rejected to keep the hackathon product portable and inspectable.

## Decision: Heroku Postgres as system of record

**Rationale**: Quotes, intents, positions, lifecycle events, wallet policies, incidents, and audit records require relational consistency, filtering, exportability, and durable history. PostgreSQL is the right production default.

**Alternatives considered**: Document storage was rejected because the entity relationships and audit queries are central. In-memory state was rejected because production support and recovery require durable records.

## Decision: Heroku Redis with BullMQ for orchestration

**Rationale**: FlareRail needs retries, delayed jobs, polling schedules, webhook delivery attempts, distributed locks, and queue visibility. Redis plus BullMQ provides a straightforward job model while PostgreSQL remains the durable source of truth.

**Alternatives considered**: Database-only polling was rejected because retry and scheduling semantics would become ad hoc. A hosted queue vendor was rejected to minimize platform spread.

## Decision: Prisma for data access

**Rationale**: Prisma provides fast schema iteration, typed access, migration visibility, and readable data-model mapping for a TypeScript monorepo.

**Alternatives considered**: Raw SQL-only access was rejected for initial product speed. A custom repository layer is deferred until real complexity requires it.

## Decision: viem for Flare/EVM interactions

**Rationale**: viem provides typed EVM reads/writes, ABI handling, chain configuration, and reliable transaction primitives for Flare-compatible contracts.

**Alternatives considered**: ethers was considered, but viem is the preferred choice for typed modern TypeScript EVM interactions.

## Decision: xrpl.js for XRPL interactions

**Rationale**: XRPL monitoring, address validation, and transaction inspection are core to the product. xrpl.js is the standard JavaScript library for XRPL workflows.

**Alternatives considered**: Direct JSON-RPC calls were rejected because they would add avoidable parsing and edge-case work.

## Decision: OpenAPI contract plus thin TypeScript SDK

**Rationale**: Wallet partners need a stable API contract, generated documentation, and a low-friction integration wrapper. OpenAPI documents the product boundary; the SDK wraps authentication, request typing, status polling, and webhook verification helpers.

**Alternatives considered**: SDK-only integration was rejected because it hides the product boundary and is harder for partners to audit. GraphQL was rejected because the workflows are command/status oriented and map cleanly to resource endpoints.

## Decision: Conservative initial strategy scope

**Rationale**: Production credibility depends on reliability. The first strategy surface should cover quotes, deposit intents, position tracking, and exit intents for a conservative FXRP route, while the strategy model remains extensible.

**Alternatives considered**: Multiple high-yield strategies at launch were rejected because risk disclosure, support, and exit behavior would expand too quickly.
