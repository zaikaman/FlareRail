import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ── WalletOrganization ──────────────────────
  const org = await prisma.walletOrganization.upsert({
    where: { slug: "demo-wallet" },
    update: {},
    create: {
      name: "Demo Wallet",
      slug: "demo-wallet",
      environment: "test",
      status: "active",
    },
  });

  // ── WorkspaceCredential ────────────────────
  await prisma.workspaceCredential.upsert({
    where: { keyId: "demo-test-key-001" },
    update: {},
    create: {
      organizationId: org.id,
      keyId: "demo-test-key-001",
      secretHash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      label: "Demo Test Key",
      scopes: ["quotes:read", "quotes:write", "deposits:read", "deposits:write"],
      environment: "test",
      status: "active",
    },
  });

  // ── WalletUser ─────────────────────────────
  await prisma.walletUser.upsert({
    where: {
      organizationId_xrplAddress: {
        organizationId: org.id,
        xrplAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      xrplAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
      walletUserRef: "demo-user-001",
    },
  });

  // ── Strategy ───────────────────────────────
  await prisma.strategy.upsert({
    where: {
      environment_code: {
        environment: "test",
        code: "fxrp-conservative",
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      code: "fxrp-conservative",
      environment: "test",
      name: "FXRP Conservative",
      description: "Conservative FXRP earn strategy with lower risk profile",
      riskCategory: "conservative",
      status: "active",
      capacityStatus: "available",
      minAmount: 10,
      maxAmount: 100000,
      feeModel: {
        entryFee: "0.5%",
        exitFee: "0.0%",
        performanceFee: "10%",
      },
    },
  });

  // ── RiskPolicy ─────────────────────────────
  const strategy = await prisma.strategy.findFirstOrThrow({
    where: {
      environment_code: {
        environment: "test",
        code: "fxrp-conservative",
      },
    },
  });

  await prisma.riskPolicy.upsert({
    where: {
      id: `risk-policy-${strategy.id}`,
    },
    update: {},
    create: {
      id: `risk-policy-${strategy.id}`,
      organizationId: org.id,
      strategyId: strategy.id,
      emergencyPaused: false,
      exposureLimit: 500000,
      maxAmountPerUser: 25000,
      minAmountPerUser: 10,
      allowedEnvironments: ["test"],
      metadata: {
        notes: "Conservative exposure limits for demo",
      },
    },
  });

  console.log("✅ Seed data created successfully");
  console.log(`  Organization: ${org.name} (${org.slug})`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
