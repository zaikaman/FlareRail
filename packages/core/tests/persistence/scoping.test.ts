import { describe, it, expect, beforeAll, afterAll } from "vitest";

const DATABASE_URL = process.env.DATABASE_URL;

const describeDb = DATABASE_URL ? describe : describe.skip;

describeDb("Persistence scoping", () => {
  let prisma: import("@prisma/client").PrismaClient;
  let org1Id: string;
  let org2Id: string;

  beforeAll(async () => {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();

    // Clean up any leftover test data
    await prisma.walletUser.deleteMany({
      where: {
        OR: [{ walletUserRef: "scoping-test-user-1" }, { walletUserRef: "scoping-test-user-2" }],
      },
    });
    await prisma.walletOrganization.deleteMany({
      where: { slug: { in: ["scoping-test-org-1", "scoping-test-org-2"] } },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.walletUser.deleteMany({
        where: {
          OR: [{ walletUserRef: "scoping-test-user-1" }, { walletUserRef: "scoping-test-user-2" }],
        },
      });
      await prisma.walletOrganization.deleteMany({
        where: { slug: { in: ["scoping-test-org-1", "scoping-test-org-2"] } },
      });
      await prisma.$disconnect();
    }
  });

  it("two organizations can have users with the same XRPL address without data leakage", async () => {
    // Create org 1
    const org1 = await prisma.walletOrganization.create({
      data: {
        name: "Scoping Test Org 1",
        slug: "scoping-test-org-1",
        environment: "test",
        status: "active",
      },
    });
    org1Id = org1.id;

    // Create org 2
    const org2 = await prisma.walletOrganization.create({
      data: {
        name: "Scoping Test Org 2",
        slug: "scoping-test-org-2",
        environment: "test",
        status: "active",
      },
    });
    org2Id = org2.id;

    const sharedAddress = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh";

    // Create user with same address in both orgs
    const user1 = await prisma.walletUser.create({
      data: {
        organizationId: org1Id,
        xrplAddress: sharedAddress,
        walletUserRef: "scoping-test-user-1",
      },
    });

    const user2 = await prisma.walletUser.create({
      data: {
        organizationId: org2Id,
        xrplAddress: sharedAddress,
        walletUserRef: "scoping-test-user-2",
      },
    });

    // Verify they are different users
    expect(user1.id).not.toBe(user2.id);
    expect(user1.organizationId).toBe(org1Id);
    expect(user2.organizationId).toBe(org2Id);
  });

  it("suspended organization can be queried but marked inactive", async () => {
    const org = await prisma.walletOrganization.findUnique({
      where: { slug: "scoping-test-org-1" },
    });
    expect(org).not.toBeNull();
    expect(org!.status).toBe("active");

    // Mark as suspended
    await prisma.walletOrganization.update({
      where: { slug: "scoping-test-org-1" },
      data: { status: "suspended" },
    });

    const suspendedOrg = await prisma.walletOrganization.findUnique({
      where: { slug: "scoping-test-org-1" },
    });
    expect(suspendedOrg!.status).toBe("suspended");

    // Reset back to active for cleanup
    await prisma.walletOrganization.update({
      where: { slug: "scoping-test-org-1" },
      data: { status: "active" },
    });
  });
});

// ── Fallback when no DB is available ─────────
const describeNoDb = DATABASE_URL ? describe.skip : describe;

describeNoDb("Persistence scoping (skipped)", () => {
  it("DATABASE_URL is not set; skipping persistence tests", () => {
    console.log("⚠️  DATABASE_URL not set — skipping database-backed tests");
    expect(true).toBe(true);
  });
});
