/**
 * Reason codes provide a stable, user-safe catalog of error and event reasons
 * shared across API responses, lifecycle events, dashboard labels, and tests.
 */

export interface ReasonCodeEntry {
  code: string;
  defaultMessage: string;
  httpStatus: number;
  severity: "info" | "warning" | "critical";
  retryable: boolean;
}

// ── Validation ──────────────────────────────────
export const INVALID_ADDRESS: ReasonCodeEntry = {
  code: "INVALID_ADDRESS",
  defaultMessage: "The provided address is not valid.",
  httpStatus: 400,
  severity: "warning",
  retryable: false,
};

export const INVALID_AMOUNT: ReasonCodeEntry = {
  code: "INVALID_AMOUNT",
  defaultMessage: "The provided amount is not valid.",
  httpStatus: 400,
  severity: "warning",
  retryable: false,
};

export const INVALID_ENVIRONMENT: ReasonCodeEntry = {
  code: "INVALID_ENVIRONMENT",
  defaultMessage: "The environment value is not valid.",
  httpStatus: 400,
  severity: "warning",
  retryable: false,
};

export const INVALID_IDENTIFIER: ReasonCodeEntry = {
  code: "INVALID_IDENTIFIER",
  defaultMessage: "The provided identifier is not valid.",
  httpStatus: 400,
  severity: "warning",
  retryable: false,
};

// ── Auth ────────────────────────────────────────
export const MISSING_AUTH: ReasonCodeEntry = {
  code: "MISSING_AUTH",
  defaultMessage: "Authentication is required.",
  httpStatus: 401,
  severity: "warning",
  retryable: false,
};

export const INVALID_AUTH: ReasonCodeEntry = {
  code: "INVALID_AUTH",
  defaultMessage: "Authentication credentials are invalid.",
  httpStatus: 401,
  severity: "warning",
  retryable: false,
};

export const REVOKED_CREDENTIAL: ReasonCodeEntry = {
  code: "REVOKED_CREDENTIAL",
  defaultMessage: "The credential has been revoked.",
  httpStatus: 403,
  severity: "warning",
  retryable: false,
};

export const CROSS_ENVIRONMENT_ACCESS: ReasonCodeEntry = {
  code: "CROSS_ENVIRONMENT_ACCESS",
  defaultMessage: "Cross-environment access is not permitted.",
  httpStatus: 403,
  severity: "warning",
  retryable: false,
};

// ── Policy ──────────────────────────────────────
export const ORGANIZATION_SUSPENDED: ReasonCodeEntry = {
  code: "ORGANIZATION_SUSPENDED",
  defaultMessage: "The organization is suspended.",
  httpStatus: 403,
  severity: "warning",
  retryable: false,
};

export const STRATEGY_PAUSED: ReasonCodeEntry = {
  code: "STRATEGY_PAUSED",
  defaultMessage: "The strategy is currently paused.",
  httpStatus: 409,
  severity: "warning",
  retryable: true,
};

export const STRATEGY_UNAVAILABLE: ReasonCodeEntry = {
  code: "STRATEGY_UNAVAILABLE",
  defaultMessage: "The strategy is not available.",
  httpStatus: 404,
  severity: "warning",
  retryable: false,
};

export const CAPACITY_UNAVAILABLE: ReasonCodeEntry = {
  code: "CAPACITY_UNAVAILABLE",
  defaultMessage: "Capacity is currently unavailable.",
  httpStatus: 503,
  severity: "warning",
  retryable: true,
};

export const EXPOSURE_LIMIT_EXCEEDED: ReasonCodeEntry = {
  code: "EXPOSURE_LIMIT_EXCEEDED",
  defaultMessage: "Exposure limit has been exceeded.",
  httpStatus: 409,
  severity: "warning",
  retryable: true,
};

// ── Quote / Deposit ─────────────────────────────
export const QUOTE_AVAILABLE: ReasonCodeEntry = {
  code: "QUOTE_AVAILABLE",
  defaultMessage: "Quote available for the selected strategy.",
  httpStatus: 200,
  severity: "info",
  retryable: false,
};

export const DEPOSIT_WAITING_FOR_USER: ReasonCodeEntry = {
  code: "DEPOSIT_WAITING_FOR_USER",
  defaultMessage: "Waiting for the XRP payment instruction to be completed.",
  httpStatus: 202,
  severity: "info",
  retryable: false,
};

export const DEPOSIT_OBSERVED: ReasonCodeEntry = {
  code: "DEPOSIT_OBSERVED",
  defaultMessage: "The XRP payment has been observed on the XRPL.",
  httpStatus: 200,
  severity: "info",
  retryable: false,
};

export const DEPOSIT_ACTIVATING: ReasonCodeEntry = {
  code: "DEPOSIT_ACTIVATING",
  defaultMessage: "The deposit is being activated on Flare.",
  httpStatus: 200,
  severity: "info",
  retryable: false,
};

export const POSITION_ACTIVE: ReasonCodeEntry = {
  code: "POSITION_ACTIVE",
  defaultMessage: "Position is active.",
  httpStatus: 200,
  severity: "info",
  retryable: false,
};

export const QUOTE_EXPIRED: ReasonCodeEntry = {
  code: "QUOTE_EXPIRED",
  defaultMessage: "The quote has expired.",
  httpStatus: 410,
  severity: "info",
  retryable: false,
};

export const QUOTE_UNAVAILABLE: ReasonCodeEntry = {
  code: "QUOTE_UNAVAILABLE",
  defaultMessage: "The quote is no longer available.",
  httpStatus: 404,
  severity: "info",
  retryable: false,
};

export const DEPOSIT_EXPIRED: ReasonCodeEntry = {
  code: "DEPOSIT_EXPIRED",
  defaultMessage: "The deposit intent has expired.",
  httpStatus: 410,
  severity: "info",
  retryable: false,
};

export const DUPLICATE_ACTION: ReasonCodeEntry = {
  code: "DUPLICATE_ACTION",
  defaultMessage: "This action has already been performed.",
  httpStatus: 409,
  severity: "info",
  retryable: false,
};

export const UNSAFE_AMOUNT: ReasonCodeEntry = {
  code: "UNSAFE_AMOUNT",
  defaultMessage: "The amount is outside the safe range.",
  httpStatus: 400,
  severity: "warning",
  retryable: false,
};

// ── Exit / Recovery ─────────────────────────────
export const POSITION_NOT_EXITABLE: ReasonCodeEntry = {
  code: "POSITION_NOT_EXITABLE",
  defaultMessage: "The position cannot be exited in its current state.",
  httpStatus: 409,
  severity: "info",
  retryable: false,
};

export const EXIT_AMOUNT_EXCEEDS_POSITION: ReasonCodeEntry = {
  code: "EXIT_AMOUNT_EXCEEDS_POSITION",
  defaultMessage: "Exit amount exceeds the position value.",
  httpStatus: 400,
  severity: "warning",
  retryable: false,
};

export const REDEMPTION_DELAYED: ReasonCodeEntry = {
  code: "REDEMPTION_DELAYED",
  defaultMessage: "Redemption processing is delayed.",
  httpStatus: 202,
  severity: "info",
  retryable: false,
};

export const RECOVERY_AVAILABLE: ReasonCodeEntry = {
  code: "RECOVERY_AVAILABLE",
  defaultMessage: "Recovery action is available for this position.",
  httpStatus: 200,
  severity: "info",
  retryable: false,
};

// ── System ──────────────────────────────────────
export const INTERNAL_ERROR: ReasonCodeEntry = {
  code: "INTERNAL_ERROR",
  defaultMessage: "An internal error occurred.",
  httpStatus: 500,
  severity: "critical",
  retryable: true,
};

export const PROVIDER_UNAVAILABLE: ReasonCodeEntry = {
  code: "PROVIDER_UNAVAILABLE",
  defaultMessage: "An external provider is unavailable.",
  httpStatus: 503,
  severity: "critical",
  retryable: true,
};

export const QUEUE_UNAVAILABLE: ReasonCodeEntry = {
  code: "QUEUE_UNAVAILABLE",
  defaultMessage: "The job queue is unavailable.",
  httpStatus: 503,
  severity: "critical",
  retryable: true,
};

// ── Lookup ──────────────────────────────────────
/** All reason code entries keyed by code string. */
export const reasonCodes: Record<string, ReasonCodeEntry> = {
  INVALID_ADDRESS,
  INVALID_AMOUNT,
  INVALID_ENVIRONMENT,
  INVALID_IDENTIFIER,
  MISSING_AUTH,
  INVALID_AUTH,
  REVOKED_CREDENTIAL,
  CROSS_ENVIRONMENT_ACCESS,
  ORGANIZATION_SUSPENDED,
  STRATEGY_PAUSED,
  STRATEGY_UNAVAILABLE,
  CAPACITY_UNAVAILABLE,
  EXPOSURE_LIMIT_EXCEEDED,
  QUOTE_AVAILABLE,
  DEPOSIT_WAITING_FOR_USER,
  DEPOSIT_OBSERVED,
  DEPOSIT_ACTIVATING,
  POSITION_ACTIVE,
  QUOTE_EXPIRED,
  QUOTE_UNAVAILABLE,
  DEPOSIT_EXPIRED,
  DUPLICATE_ACTION,
  UNSAFE_AMOUNT,
  POSITION_NOT_EXITABLE,
  EXIT_AMOUNT_EXCEEDS_POSITION,
  REDEMPTION_DELAYED,
  RECOVERY_AVAILABLE,
  INTERNAL_ERROR,
  PROVIDER_UNAVAILABLE,
  QUEUE_UNAVAILABLE,
};
