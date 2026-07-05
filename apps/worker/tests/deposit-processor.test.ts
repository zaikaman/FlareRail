import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getPrismaClient,
  findDepositIntentById,
  DepositIntentStatus,
} from "@flarerail/core";
import { processDepositObservation } from "../src/processors/deposit-observation-processor.js";
import { processFlareActivation } from "../src/processors/flare-activation-processor.js";
import { MockXrplDepositMonitor } from "../src/monitors/xrpl-deposit-monitor.js";

const DATABASE_URL = process.env.DATABASE_URL;
const describeWithDb = DATABASE_URL ? describe : describe.skip;

const TEST_PEPPER = "test-pepper-worker";

describeWithDb("Deposit Processors", () => {
  let orgId: string;
  let strategyId: string;
  let walletUserId: string;
  let quoteId: string;

  beforeAll(async () => {
    // Queue producer not needed for direct processor tests

    const prisma = getPrismaClient();
    const org = await prisma.walletOrganization.create({
      data: {
        name: "Worker Test Org",
        slug: `worker-test-${Date.now()}`,
        environment: "test",
        status: "active",
      },
    });
    orgId = org.id;

    const strategy = await prisma.strategy.create({
      data: {
        organizationId: org.id,
        code: "fxrp-conservative",
        environment: "test",
        name: "FXRP Conservative",
        description: "Worker test strategy",
        riskCategory: "conservative",
        status: "active",
        capacityStatus: "available",
        minAmount: 10,
        maxAmount: 100000,
        feeModel: { entryFee: "0.5%", exitFee: "0.0%", performanceFee: "10%" },
      },
    });
    strategyId = strategy.id;

    const walletUser = await prisma.walletUser.create({
      data: {
        organizationId: org.id,
        xrplAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        walletUserRef: "worker-demo-user",
      },
    });
    walletUserId = walletUser.id;

    const quote = await prisma.quote.create({
      data: {
        organizationId: org.id,
        strategyId,
        walletUserId: walletUser.id,
        environment: "test",
        status: "available",
        amount: "250",
        feeAmount: "1.25",
        feeCurrency: "XRP",
        rate: "1",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        metadata: {
          expectedOutput: "248.75",
          feeSummary: { total: "1.25", currency: "XRP", lines: [{ label: "Entry fee", amount: "1.25", currency: "XRP" }] },
          xrplAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
          strategyCode: "fxrp-conservative",
        },
      },
    });
    quoteId = quote.id;
  });

  afterAll(async () => {
    const prisma = getPrismaClient();
    await prisma.position.deleteMany({ where: { organizationId: orgId } });
    await prisma.depositIntent.deleteMany({ where: { organizationId: orgId } });
    await prisma.quote.deleteMany({ where: { organizationId: orgId } });
    await prisma.lifecycleEvent.deleteMany({ where: { organizationId: orgId } });
    await prisma.walletUser.deleteMany({ where: { organizationId: orgId } });
    await prisma.strategy.deleteMany({ where: { organizationId: orgId } });
    await prisma.walletOrganization.delete({ where: { id: orgId } });
  });

  async function createAwaitingIntent(idempotencyKey?: string) {
    const prisma = getPrismaClient();
    const simRef = `fr_sim_test_${Date.now()}`;
    return prisma.depositIntent.create({
      data: {
        organizationId: orgId,
        walletUserId,
        quoteId: quoteId,
        strategyId,
        environment: "test",
        status: "awaiting_user_action",
        idempotencyKey: idempotencyKey ?? null,
        userInstructions: [
          {
            type: "xrpl_payment",
            title: "Send XRP from your wallet",
            description: `Send 250 XRP with reference ${simRef}.`,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          },
        ],
        metadata: {
          traceId: `trace-${Date.now()}`,
          simulationReference: simRef,
          amount: "250",
          strategyCode: "fxrp-conservative",
        },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
  }

  it("Deposit observation processor moves awaiting_user_action to observed", async () => {
    const intent = await createAwaitingIntent();

    await processDepositObservation(
      { depositIntentId: intent.id },
      { monitor: new MockXrplDepositMonitor() },
    );

    const updated = await findDepositIntentById({ intentId: intent.id });
    expect(updated!.status).toBe(DepositIntentStatus.Observed);
  });

  it("Deposit observation processor emits deposit_intent.observed", async () => {
    const intent = await createAwaitingIntent();
    const prisma = getPrismaClient();

    await processDepositObservation(
      { depositIntentId: intent.id },
      { monitor: new MockXrplDepositMonitor() },
    );

    const events = await prisma.lifecycleEvent.findMany({
      where: {
        subjectId: intent.id,
        eventType: "deposit_intent.observed",
      },
    });

    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  it("Activation processor moves observed to active_position_created", async () => {
    const prisma = getPrismaClient();
    const intent = await createAwaitingIntent();

    // First, observe
    await processDepositObservation(
      { depositIntentId: intent.id },
      { monitor: new MockXrplDepositMonitor() },
    );

    // Then, activate
    await processFlareActivation({ depositIntentId: intent.id });

    const updated = await findDepositIntentById({ intentId: intent.id });
    expect(updated!.status).toBe(DepositIntentStatus.ActivePositionCreated);
  });

  it("Activation processor creates one active Position", async () => {
    const prisma = getPrismaClient();
    const intent = await createAwaitingIntent();

    await processDepositObservation(
      { depositIntentId: intent.id },
      { monitor: new MockXrplDepositMonitor() },
    );

    await processFlareActivation({ depositIntentId: intent.id });

    const position = await prisma.position.findUnique({
      where: { depositIntentId: intent.id },
    });

    expect(position).toBeDefined();
    expect(position!.status).toBe("active");
  });

  it("Re-running activation is idempotent and does not create duplicate positions", async () => {
    const prisma = getPrismaClient();
    const intent = await createAwaitingIntent();

    await processDepositObservation(
      { depositIntentId: intent.id },
      { monitor: new MockXrplDepositMonitor() },
    );

    // Run activation twice
    await processFlareActivation({ depositIntentId: intent.id });
    await processFlareActivation({ depositIntentId: intent.id });

    const positions = await prisma.position.findMany({
      where: { depositIntentId: intent.id },
    });

    expect(positions.length).toBe(1);
  });

  it("Invalid state is ignored (e.g., already active)", async () => {
    const prisma = getPrismaClient();
    const intent = await createAwaitingIntent();

    // Should not throw — just return idempotently
    await expect(
      processFlareActivation({ depositIntentId: intent.id }),
    ).resolves.not.toThrow();
  });

  it("Processor can accept job data with only depositIntentId and derive all other data from DB", async () => {
    const intent = await createAwaitingIntent();

    // Process with minimal job data (only depositIntentId)
    await processDepositObservation(
      { depositIntentId: intent.id },
      { monitor: new MockXrplDepositMonitor() },
    );

    const updated = await findDepositIntentById({ intentId: intent.id });
    expect(updated!.status).toBe(DepositIntentStatus.Observed);

    await processFlareActivation({ depositIntentId: intent.id });

    const activated = await findDepositIntentById({ intentId: intent.id });
    expect(activated!.status).toBe(DepositIntentStatus.ActivePositionCreated);
  });
});
