import crypto from "node:crypto";

export interface ObservedPayment {
  transactionId: string;
  ledgerIndex: number;
  amount: string;
  sourceAddress: string;
  destinationAddress: string;
  reference: string;
  observedAt: Date;
}

export interface DepositIntentData {
  id: string;
  metadata: Record<string, unknown> | null;
  txReference: Record<string, unknown> | null;
}

export interface QuoteData {
  amount: string;
  metadata: Record<string, unknown> | null;
}

/**
 * Mock XRPL deposit monitor for test environment simulation.
 * Deterministically returns observed payments without live XRPL network calls.
 */
export class MockXrplDepositMonitor {
  /**
   * Observe a deposit intent on the XRPL.
   * In test/simulation mode, this returns an observed payment immediately
   * unless `simulateObservation` is explicitly set to false in metadata.
   */
  async observeDepositIntent(
    _intent: DepositIntentData,
    _quote: QuoteData,
  ): Promise<ObservedPayment | null> {
    const metadata = _intent.metadata ?? {};
    const simulateObservation = metadata.simulateObservation !== false;

    if (!simulateObservation) {
      return null;
    }

    const reference =
      (metadata.simulationReference as string) ?? `fr_sim_${crypto.randomBytes(6).toString("hex")}`;

    const quoteMetadata = _quote.metadata as Record<string, unknown> | undefined;
    const xrplAddress = (quoteMetadata?.xrplAddress as string) ?? "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh";

    return {
      transactionId: crypto.randomBytes(16).toString("hex"),
      ledgerIndex: Math.floor(Math.random() * 100000) + 80000000,
      amount: _quote.amount,
      sourceAddress: xrplAddress,
      destinationAddress: "rFlareRailDestinationAddress",
      reference,
      observedAt: new Date(),
    };
  }
}
