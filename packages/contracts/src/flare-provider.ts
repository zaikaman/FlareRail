// ── Types ──────────────────────────────────────

export type ChainEnvironment = "coston2" | "flare";

export interface ProviderHealth {
  status: "ok" | "degraded" | "unavailable";
  checkedAt: string;
  message?: string;
}

export interface FlareTransactionReference {
  txHash: string;
  blockNumber: number;
  chainId: number;
}

export interface FAssetStrategyQuoteInput {
  environment: ChainEnvironment;
  strategyCode: string;
  amount: string;
  xrplAddress: string;
}

export interface FAssetStrategyQuoteResult {
  estimatedFAssetAmount: string;
  feeAmount: string;
  rate: string;
  expiresAt: string;
  pricingReference: string;
}

export interface FAssetActivationInput {
  environment: ChainEnvironment;
  strategyCode: string;
  amount: string;
  xrplAddress: string;
  userTxHash: string;
}

export interface FAssetActivationResult {
  activationTxHash: string;
  positionId: string;
  blockNumber: number;
}

export interface FAssetRedemptionInput {
  environment: ChainEnvironment;
  strategyCode: string;
  amount: string;
  destinationAddress: string;
  positionId: string;
}

export interface FAssetRedemptionResult {
  redemptionTxHash: string;
  blockNumber: number;
  estimatedCompletionTime: string;
}

// ── Interface ──────────────────────────────────

export interface FlareProvider {
  /** Check the health of the Flare provider. */
  getHealth(): Promise<ProviderHealth>;

  /** Get a quote for an FAsset strategy. */
  getFxrpQuote(input: FAssetStrategyQuoteInput): Promise<FAssetStrategyQuoteResult>;

  /** Build an activation reference for a deposit. */
  buildActivationReference(input: FAssetActivationInput): Promise<FAssetActivationResult>;

  /** Build a redemption reference for an exit. */
  buildRedemptionReference(input: FAssetRedemptionInput): Promise<FAssetRedemptionResult>;
}
