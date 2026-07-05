# US1: Wallet XRP Earn Flow — Manual Validation

## Prerequisites

- `npm install` completed
- PostgreSQL instance running with `DATABASE_URL` configured
- Redis instance running with `REDIS_URL` configured (optional — processor tests work without it)
- Environment variables set in `.env` files (see `.env.example` files)

## Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Start the API server (terminal 1)
npm run dev --workspace @flarerail/api

# Start the worker (terminal 2)
npm run dev --workspace @flarerail/worker

# Start the dashboard (terminal 3)
npm run dev --workspace @flarerail/dashboard
```

## API Validation

### 1. Request Strategies

```bash
# Get a demo token from the seed data (key_id.secret)
# Demo credential from seed: demo-test-key-001.a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
TOKEN="demo-test-key-001.a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
API_BASE="http://localhost:4000"

curl -s "$API_BASE/v1/strategies" -H "Authorization: Bearer $TOKEN" | jq .
```

Expected: Array with one strategy `fxrp-conservative`.

### 2. Create a Quote

```bash
curl -s -X POST "$API_BASE/v1/quotes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "xrplAddress": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    "walletUserRef": "demo-user-001",
    "amount": "250",
    "strategyCode": "fxrp-conservative"
  }' | jq .
```

Expected: Returns `available` quote with `expectedOutput: "248.750000"` and fee info.

### 3. Create a Deposit Intent

```bash
QUOTE_ID="<quote_id_from_step_2>"

curl -s -X POST "$API_BASE/v1/deposit-intents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo-unique-key-$(date +%s)" \
  -d "{\"quoteId\": \"$QUOTE_ID\"}" | jq .
```

Expected: Returns `awaiting_user_action` with `userInstructions` and `externalReferences`.

### 4. Inspect Deposit Intent Status

```bash
INTENT_ID="<deposit_intent_id_from_step_3>"

curl -s "$API_BASE/v1/deposit-intents/$INTENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Expected: Status is `awaiting_user_action`.

## Worker Simulation

The worker will automatically process deposit intents by simulating XRPL observation and Flare activation.

### Expected Status Transitions

1. `awaiting_user_action` — Initial state after deposit intent creation
2. `observed` — Worker's deposit observation processor simulates seeing the XRP payment
3. `activating` — Worker's Flare activation processor starts
4. `active_position_created` — Position is created on Flare

### Manual Worker Invocation

If the worker is not running with Redis, you can invoke processors directly:

```bash
# Using the test suite:
npm run test --workspace @flarerail/api -- apps/api/tests/integration/deposit-flow.test.ts

# Or run all worker processor tests:
npm run test --workspace @flarerail/worker -- apps/worker/tests/deposit-processor.test.ts
```

## Dashboard Validation

### Intents Page

1. Open `http://localhost:3000/intents` in a browser
2. The page shows a search interface for looking up deposit intents by ID
3. Enter a deposit intent ID from step 3 above

### Intent Detail Page

1. The detail page shows:
   - Current status with color-coded badge
   - Trace ID
   - User instructions
   - External references (simulation reference)
   - Position summary when status is `active_position_created`
2. Navigate directly to `/intents/{intentId}` to inspect

## Verification Checklist

- [ ] `GET /v1/strategies` returns seeded strategies with correct fields
- [ ] `POST /v1/quotes` returns an available quote for `fxrp-conservative`
- [ ] `POST /v1/deposit-intents` returns user instructions and `awaiting_user_action`
- [ ] Worker simulation advances the intent to `active_position_created`
- [ ] A `Position` row is created once and only once
- [ ] Lifecycle events exist for every US1 transition
- [ ] Dashboard intent detail can display the final active-position state
