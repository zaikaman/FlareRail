import {
  DepositIntentStatus,
  type DepositIntentStatus as DepositIntentStatusType,
} from "../domain/statuses.js";
import { InvalidStateTransitionError } from "../domain/errors.js";

/**
 * Allowed deposit intent transitions.
 */
export const depositIntentTransitions: Record<
  DepositIntentStatusType,
  ReadonlySet<DepositIntentStatusType>
> = {
  [DepositIntentStatus.Created]: new Set([
    DepositIntentStatus.AwaitingUserAction,
    DepositIntentStatus.Expired,
  ]),
  [DepositIntentStatus.AwaitingUserAction]: new Set([
    DepositIntentStatus.Observed,
    DepositIntentStatus.Expired,
    DepositIntentStatus.Cancelled,
  ]),
  [DepositIntentStatus.Observed]: new Set([
    DepositIntentStatus.Activating,
    DepositIntentStatus.Failed,
  ]),
  [DepositIntentStatus.Activating]: new Set([
    DepositIntentStatus.ActivePositionCreated,
    DepositIntentStatus.Failed,
  ]),
  [DepositIntentStatus.ActivePositionCreated]: new Set([]),
  [DepositIntentStatus.Expired]: new Set([]),
  [DepositIntentStatus.Failed]: new Set([]),
  [DepositIntentStatus.Cancelled]: new Set([]),
};

/**
 * Returns true if the transition from `from` to `to` is allowed.
 */
export function canTransitionDepositIntent(
  from: DepositIntentStatusType,
  to: DepositIntentStatusType,
): boolean {
  return depositIntentTransitions[from]?.has(to) ?? false;
}

/**
 * Throws InvalidStateTransitionError if the transition is not allowed.
 */
export function assertTransitionDepositIntent(
  from: DepositIntentStatusType,
  to: DepositIntentStatusType,
): void {
  if (!canTransitionDepositIntent(from, to)) {
    throw new InvalidStateTransitionError("DepositIntent", from, to);
  }
}

/**
 * Returns the set of allowed next statuses from the given status.
 */
export function getAllowedDepositIntentTransitions(
  status: DepositIntentStatusType,
): ReadonlySet<DepositIntentStatusType> {
  return depositIntentTransitions[status] ?? new Set();
}
