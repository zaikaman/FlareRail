# Quickstart: FlareRail Wallet API

This guide validates the production-shaped FlareRail flow end to end: partner onboarding, quote, deposit intent, dashboard tracking, webhook delivery, position visibility, exit intent, and recovery-state visibility.

## Prerequisites

- Node.js active LTS
- Heroku account with Postgres and Redis add-ons
- Vercel account for dashboard deployment
- Test XRPL account
- Flare Coston2 account and RPC access
- Environment variables for test Flare and XRPL providers

## Local Setup

1. Install dependencies.

   ```powershell
   npm install
   ```

2. Configure local environment files for API, worker, dashboard, Postgres, Redis, XRPL testnet, and Coston2.

3. Apply database migrations.

   ```powershell
   npm run db:migrate
   ```

4. Start API, worker, and dashboard.

   ```powershell
   npm run dev
   ```

## Validation Scenario 1: Wallet Creates Quote and Deposit Intent

1. Create a test wallet organization and test credential.
2. Request available strategies.
3. Create a quote for a valid XRPL address and conservative FXRP strategy.
4. Create a deposit intent from the quote.

Expected outcome:

- Quote returns within 5 seconds with amount, fees, expiration, strategy, and disclosure fields.
- Deposit intent returns a stable id, trace id, user instructions, lifecycle status, and expiration.
- Dashboard shows the new intent under the correct test workspace.

## Validation Scenario 2: Lifecycle Tracking and Dashboard Search

1. Simulate or complete the user-side XRPL action for the deposit intent.
2. Let the worker observe and advance lifecycle states.
3. Search by XRPL address, intent id, and trace id in the dashboard.

Expected outcome:

- Status endpoint returns current state within 3 seconds.
- Dashboard shows chronological events with reason codes and external references.
- Operator can explain the current user state without raw logs.

## Validation Scenario 3: Webhook Delivery

1. Register a test webhook endpoint.
2. Trigger a lifecycle transition for a deposit intent.
3. Verify the webhook payload and retry behavior.

Expected outcome:

- Event payload includes event type, subject id, trace id, timestamp, user-safe message, and signature metadata.
- Replaying the same event does not require the wallet to duplicate user-facing action.
- Failed delivery is retained for retry.

## Validation Scenario 4: Position and Exit Intent

1. Use an active position or seeded test position.
2. Create a full or partial exit intent.
3. Track exit status in API and dashboard.

Expected outcome:

- Exit intent shows destination, expected timing, fees, status, and trace id.
- Position status changes are visible in the dashboard.
- Completed or delayed exit produces lifecycle events and user-safe reason codes.

## Validation Scenario 5: Policy and Incident Controls

1. Set a per-user exposure limit below a requested deposit amount.
2. Request a quote or deposit that exceeds the limit.
3. Pause a strategy and request a new quote.
4. Create a simulated strategy degradation incident.

Expected outcome:

- Policy-blocked requests are rejected before user commitment.
- Rejection includes reason code and recommended next action.
- Paused strategies do not accept new deposit intents.
- Dashboard identifies affected users and severity within 2 minutes.

## Deployment Validation

1. Deploy dashboard to Vercel.
2. Deploy API and worker to Heroku.
3. Attach Heroku Postgres and Heroku Redis.
4. Run migrations against Heroku Postgres.
5. Configure dashboard to use the Heroku API base URL.
6. Repeat Validation Scenarios 1 through 5 in the test environment.

Expected outcome:

- Dashboard and API use test credentials and test records only.
- API, worker, Postgres, and Redis are independently observable in Heroku.
- Dashboard remains available when worker jobs are delayed, while status clearly shows delay state.
