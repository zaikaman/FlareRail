-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('system', 'wallet_operator', 'partner_api', 'worker');

-- CreateEnum
CREATE TYPE "CapacityStatus" AS ENUM ('available', 'limited', 'full');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('active', 'revoked');

-- CreateEnum
CREATE TYPE "DepositIntentStatus" AS ENUM ('created', 'awaiting_user_action', 'observed', 'activating', 'active_position_created', 'expired', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('test', 'production');

-- CreateEnum
CREATE TYPE "ExitIntentStatus" AS ENUM ('created', 'pending_user_confirmation', 'submitted', 'processing', 'delayed', 'completed', 'recoverable_failure', 'compensated', 'escalated', 'rejected', 'expired', 'failed');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('open', 'monitoring', 'resolved');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('active', 'exiting', 'impaired', 'recovery_available', 'closed');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('available', 'unavailable', 'expired');

-- CreateEnum
CREATE TYPE "StrategyStatus" AS ENUM ('active', 'paused', 'unavailable');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('pending', 'delivered', 'failed', 'exhausted');

-- CreateEnum
CREATE TYPE "WebhookEndpointStatus" AS ENUM ('active', 'disabled');

-- CreateTable
CREATE TABLE "WalletOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "environment" "Environment" NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceCredential" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "scopes" JSONB NOT NULL,
    "environment" "Environment" NOT NULL,
    "status" "CredentialStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletUser" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "xrplAddress" TEXT NOT NULL,
    "walletUserRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "environment" "Environment" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "riskCategory" TEXT NOT NULL,
    "status" "StrategyStatus" NOT NULL DEFAULT 'active',
    "capacityStatus" "CapacityStatus" NOT NULL DEFAULT 'available',
    "minAmount" DECIMAL(65,30),
    "maxAmount" DECIMAL(65,30),
    "feeModel" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "emergencyPaused" BOOLEAN NOT NULL DEFAULT false,
    "exposureLimit" DECIMAL(65,30),
    "maxAmountPerUser" DECIMAL(65,30),
    "minAmountPerUser" DECIMAL(65,30),
    "allowedEnvironments" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "walletUserId" TEXT,
    "strategyId" TEXT NOT NULL,
    "environment" "Environment" NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'available',
    "amount" DECIMAL(65,30) NOT NULL,
    "feeAmount" DECIMAL(65,30),
    "feeCurrency" TEXT,
    "rate" DECIMAL(65,30),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositIntent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "walletUserId" TEXT,
    "quoteId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "environment" "Environment" NOT NULL,
    "status" "DepositIntentStatus" NOT NULL DEFAULT 'created',
    "idempotencyKey" TEXT,
    "userInstructions" JSONB,
    "txReference" JSONB,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "walletUserId" TEXT,
    "depositIntentId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "environment" "Environment" NOT NULL,
    "status" "PositionStatus" NOT NULL DEFAULT 'active',
    "amount" DECIMAL(65,30) NOT NULL,
    "feesCollected" DECIMAL(65,30),
    "xrplAddress" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExitIntent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "walletUserId" TEXT,
    "positionId" TEXT NOT NULL,
    "environment" "Environment" NOT NULL,
    "status" "ExitIntentStatus" NOT NULL DEFAULT 'created',
    "amount" DECIMAL(65,30) NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "txReference" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExitIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifecycleEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "traceId" TEXT,
    "externalReference" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifecycleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "eventTypes" JSONB NOT NULL,
    "status" "WebhookEndpointStatus" NOT NULL DEFAULT 'active',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "webhookEndpointId" TEXT NOT NULL,
    "lifecycleEventId" TEXT NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'pending',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "nextRetryAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "strategyId" TEXT,
    "severity" "IncidentSeverity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "affectedUsers" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "responseBody" JSONB,
    "responseStatus" INTEGER,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletOrganization_slug_key" ON "WalletOrganization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceCredential_keyId_key" ON "WorkspaceCredential"("keyId");

-- CreateIndex
CREATE INDEX "WorkspaceCredential_organizationId_environment_idx" ON "WorkspaceCredential"("organizationId", "environment");

-- CreateIndex
CREATE UNIQUE INDEX "WalletUser_organizationId_xrplAddress_key" ON "WalletUser"("organizationId", "xrplAddress");

-- CreateIndex
CREATE UNIQUE INDEX "WalletUser_organizationId_walletUserRef_key" ON "WalletUser"("organizationId", "walletUserRef");

-- CreateIndex
CREATE INDEX "WalletUser_organizationId_xrplAddress_idx" ON "WalletUser"("organizationId", "xrplAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Strategy_environment_code_key" ON "Strategy"("environment", "code");

-- CreateIndex
CREATE INDEX "Strategy_organizationId_environment_idx" ON "Strategy"("organizationId", "environment");

-- CreateIndex
CREATE INDEX "RiskPolicy_organizationId_strategyId_idx" ON "RiskPolicy"("organizationId", "strategyId");

-- CreateIndex
CREATE INDEX "Quote_organizationId_environment_idx" ON "Quote"("organizationId", "environment");

-- CreateIndex
CREATE INDEX "Quote_organizationId_walletUserId_idx" ON "Quote"("organizationId", "walletUserId");

-- CreateIndex
CREATE UNIQUE INDEX "DepositIntent_quoteId_key" ON "DepositIntent"("quoteId");

-- CreateIndex
CREATE INDEX "DepositIntent_organizationId_environment_idx" ON "DepositIntent"("organizationId", "environment");

-- CreateIndex
CREATE INDEX "DepositIntent_organizationId_idempotencyKey_idx" ON "DepositIntent"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Position_depositIntentId_key" ON "Position"("depositIntentId");

-- CreateIndex
CREATE INDEX "Position_organizationId_environment_idx" ON "Position"("organizationId", "environment");

-- CreateIndex
CREATE INDEX "ExitIntent_organizationId_environment_idx" ON "ExitIntent"("organizationId", "environment");

-- CreateIndex
CREATE INDEX "ExitIntent_organizationId_idempotencyKey_idx" ON "ExitIntent"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "LifecycleEvent_organizationId_subjectType_subjectId_idx" ON "LifecycleEvent"("organizationId", "subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "LifecycleEvent_organizationId_createdAt_idx" ON "LifecycleEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "LifecycleEvent_organizationId_eventType_idx" ON "LifecycleEvent"("organizationId", "eventType");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_organizationId_idx" ON "WebhookEndpoint"("organizationId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_webhookEndpointId_status_idx" ON "WebhookDelivery"("webhookEndpointId", "status");

-- CreateIndex
CREATE INDEX "WebhookDelivery_lifecycleEventId_idx" ON "WebhookDelivery"("lifecycleEventId");

-- CreateIndex
CREATE INDEX "Incident_organizationId_idx" ON "Incident"("organizationId");

-- CreateIndex
CREATE INDEX "Incident_status_severity_idx" ON "Incident"("status", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_idempotencyKey_organizationId_key" ON "IdempotencyRecord"("idempotencyKey", "organizationId");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- AddForeignKey
ALTER TABLE "WorkspaceCredential" ADD CONSTRAINT "WorkspaceCredential_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WalletOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletUser" ADD CONSTRAINT "WalletUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WalletOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WalletOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskPolicy" ADD CONSTRAINT "RiskPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WalletOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskPolicy" ADD CONSTRAINT "RiskPolicy_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WalletOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_walletUserId_fkey" FOREIGN KEY ("walletUserId") REFERENCES "WalletUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositIntent" ADD CONSTRAINT "DepositIntent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WalletOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositIntent" ADD CONSTRAINT "DepositIntent_walletUserId_fkey" FOREIGN KEY ("walletUserId") REFERENCES "WalletUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositIntent" ADD CONSTRAINT "DepositIntent_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositIntent" ADD CONSTRAINT "DepositIntent_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WalletOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_walletUserId_fkey" FOREIGN KEY ("walletUserId") REFERENCES "WalletUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_depositIntentId_fkey" FOREIGN KEY ("depositIntentId") REFERENCES "DepositIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExitIntent" ADD CONSTRAINT "ExitIntent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WalletOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExitIntent" ADD CONSTRAINT "ExitIntent_walletUserId_fkey" FOREIGN KEY ("walletUserId") REFERENCES "WalletUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExitIntent" ADD CONSTRAINT "ExitIntent_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifecycleEvent" ADD CONSTRAINT "LifecycleEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WalletOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WalletOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookEndpointId_fkey" FOREIGN KEY ("webhookEndpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_lifecycleEventId_fkey" FOREIGN KEY ("lifecycleEventId") REFERENCES "LifecycleEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WalletOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
