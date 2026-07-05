import { createQuoteInputSchema } from "@flarerail/core";
import {
  findStrategyByCode,
  assertStrategyAvailable,
  createQuote as createQuoteRepo,
  findOrCreateWalletUser,
} from "@flarerail/core";
import type { PrismaClientLike } from "@flarerail/core";
import { createLifecycleEvent } from "@flarerail/core";
import { throwReason } from "../middleware/errors.js";

export interface CreateQuoteInput {
  xrplAddress: string;
  walletUserRef?: string;
  amount: string;
  strategyCode: string;
}

export interface PartnerContext {
  organizationId: string;
  environment: string;
}

/**
 * Create a quote for a partner's user.
 * Validates strategy availability, amount bounds, and calculates deterministic fees.
 */
export async function createQuoteForPartner(
  input: CreateQuoteInput,
  partnerContext: PartnerContext,
  db?: PrismaClientLike,
) {
  // Validate input
  const parsed = createQuoteInputSchema.safeParse(input);
  if (!parsed.success) {
    throwReason("INVALID_IDENTIFIER", {
      defaultMessage: parsed.error.errors.map((e: any) => e.message).join("; "),
    });
  }

  const { xrplAddress, walletUserRef, amount, strategyCode } = parsed.data;

  // Look up strategy
  const strategy = await findStrategyByCode(
    {
      organizationId: partnerContext.organizationId,
      environment: partnerContext.environment as any,
      code: strategyCode,
    },
    db,
  );

  if (!strategy) {
    throwReason("STRATEGY_UNAVAILABLE");
  }

  // Assert strategy is available
  const unavailableReason = assertStrategyAvailable(strategy);
  if (unavailableReason) {
    throwReason(unavailableReason);
  }

  // Check amount bounds
  const amountNum = parseFloat(amount);
  if (strategy.minAmount && amountNum < Number(strategy.minAmount)) {
    throwReason("UNSAFE_AMOUNT", {
      defaultMessage: `Amount ${amount} is below minimum ${strategy.minAmount}.`,
    });
  }
  if (strategy.maxAmount && amountNum > Number(strategy.maxAmount)) {
    throwReason("UNSAFE_AMOUNT", {
      defaultMessage: `Amount ${amount} exceeds maximum ${strategy.maxAmount}.`,
    });
  }

  // Calculate deterministic MVP fees
  const entryFee = amountNum * 0.005;
  const expectedOutput = amountNum - entryFee;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Find or create wallet user
  const walletUser = await findOrCreateWalletUser(
    {
      organizationId: partnerContext.organizationId,
      xrplAddress,
      walletUserRef: walletUserRef ?? undefined,
    },
    db,
  );

  // Persist quote
  const quote = await createQuoteRepo(
    {
      organizationId: partnerContext.organizationId,
      walletUserId: walletUser.id,
      strategyId: strategy.id,
      environment: partnerContext.environment as any,
      amount: amount,
      feeAmount: entryFee.toString(),
      feeCurrency: "XRP",
      rate: "1",
      expiresAt,
      metadata: {
        expectedOutput: expectedOutput.toString(),
        feeSummary: {
          total: entryFee.toString(),
          currency: "XRP",
          lines: [
            {
              label: "Entry fee",
              amount: entryFee.toString(),
              currency: "XRP",
            },
          ],
        },
        xrplAddress,
        walletUserRef: walletUserRef ?? null,
        strategyCode,
      },
    },
    db,
  );

  // Emit lifecycle event
  await createLifecycleEvent(
    {
      organizationId: partnerContext.organizationId,
      subjectType: "quote",
      subjectId: quote.id,
      eventType: "quote.created",
      actorType: "partner_api",
      reasonCode: "QUOTE_AVAILABLE",
      message: "Quote available for FXRP Conservative.",
      traceId: quote.id,
      metadata: {
        amount,
        strategyCode,
        expectedOutput: expectedOutput.toString(),
      },
    },
    db,
  );

  // Return serialized response
  return {
    id: quote.id,
    status: "available",
    amount: amount,
    expectedOutput: expectedOutput.toString(),
    strategyCode,
    feeSummary: {
      total: entryFee.toString(),
      currency: "XRP",
      lines: [
        {
          label: "Entry fee",
          amount: entryFee.toString(),
          currency: "XRP",
        },
      ],
    },
    expiresAt: expiresAt.toISOString(),
    reasonCode: null,
    userMessage: "Quote available for FXRP Conservative.",
  };
}
