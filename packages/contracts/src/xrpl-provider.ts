import type { ProviderHealth } from "./flare-provider.js";

// ── Types ──────────────────────────────────────

export interface XrplPaymentReference {
  txHash: string;
  sourceAddress: string;
  destinationAddress: string;
  amount: string;
  currency: string;
  timestamp: string;
  ledgerIndex: number;
}

export interface ObservedXrplPayment {
  txHash: string;
  sourceAddress: string;
  destinationAddress: string;
  amount: string;
  currency: string;
  tag?: number;
  timestamp: string;
  ledgerIndex: number;
  confirmed: boolean;
}

export interface XrplPaymentLookupInput {
  sourceAddress: string;
  destinationAddress: string;
  minAmount: string;
  maxAmount?: string;
  destinationTag?: number;
  lookbackSeconds?: number;
}

export interface XrplAddressValidationResult {
  valid: boolean;
  address: string;
  network?: string;
  error?: string;
}

// ── Interface ──────────────────────────────────

export interface XrplProvider {
  /** Check the health of the XRPL provider. */
  getHealth(): Promise<ProviderHealth>;

  /** Validate an XRPL address. */
  validateAddress(address: string): Promise<XrplAddressValidationResult>;

  /** Find a payment matching the given input criteria. */
  findPayment(input: XrplPaymentLookupInput): Promise<ObservedXrplPayment | null>;
}
