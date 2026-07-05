/**
 * FlareRail Dashboard API Client
 * Typed client for demo/partner dashboard use.
 */

export class FlareRailApiError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "FlareRailApiError";
    this.code = code;
    this.status = status;
  }
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_FLARERAIL_API_URL ?? "http://localhost:4000";
  }
  return process.env.FLARERAIL_API_URL ?? "http://localhost:4000";
}

export function getDemoApiToken(): string | undefined {
  if (typeof window !== "undefined") {
    return undefined; // Don't expose token to browser
  }
  return process.env.FLARERAIL_DEMO_API_TOKEN;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = getDemoApiToken();

  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorCode = "UNKNOWN";
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorBody = await response.json();
      errorCode = errorBody?.error?.code ?? errorCode;
      errorMessage = errorBody?.error?.message ?? errorMessage;
    } catch {
      // Use defaults
    }
    throw new FlareRailApiError(errorMessage, errorCode, response.status);
  }

  return response.json() as Promise<T>;
}

// ── Types ────────────────────────────────────

export interface Strategy {
  id: string;
  code: string;
  name: string;
  description: string | null;
  riskCategory: string;
  status: string;
  capacityStatus: string;
  minAmount: string | null;
  maxAmount: string | null;
  feeModel: Record<string, string> | null;
}

export interface FeeSummary {
  total: string;
  currency: string;
  lines: Array<{ label: string; amount: string; currency: string }>;
}

export interface Quote {
  id: string;
  status: string;
  amount: string;
  expectedOutput: string;
  strategyCode: string;
  feeSummary: FeeSummary;
  expiresAt: string;
  reasonCode: string | null;
  userMessage: string;
}

export interface UserInstruction {
  type: string;
  title: string;
  description: string;
  expiresAt?: string;
}

export interface ExternalReference {
  type: string;
  value: string;
  url?: string;
}

export interface DepositIntent {
  id: string;
  status: string;
  traceId: string;
  userInstructions: UserInstruction[];
  reasonCode: string | null;
  userMessage: string;
  externalReferences: ExternalReference[];
  position?: {
    id: string;
    status: string;
    strategyCode: string;
    activeAmount: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteInput {
  xrplAddress: string;
  walletUserRef?: string;
  amount: string;
  strategyCode: string;
}

export interface CreateDepositIntentInput {
  quoteId: string;
  idempotencyKey?: string;
}

// ── API Functions ────────────────────────────

export async function fetchStrategies(): Promise<Strategy[]> {
  return apiFetch<Strategy[]>("/v1/strategies");
}

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  return apiFetch<Quote>("/v1/quotes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createDepositIntent(
  input: CreateDepositIntentInput,
  idempotencyKey?: string,
): Promise<DepositIntent> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers["idempotency-key"] = idempotencyKey;
  }

  return apiFetch<DepositIntent>("/v1/deposit-intents", {
    method: "POST",
    body: JSON.stringify(input),
    headers,
  });
}

export async function getDepositIntent(intentId: string): Promise<DepositIntent> {
  return apiFetch<DepositIntent>(`/v1/deposit-intents/${intentId}`);
}
