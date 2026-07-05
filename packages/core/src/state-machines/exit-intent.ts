import {
  ExitIntentStatus,
  type ExitIntentStatus as ExitIntentStatusType,
} from "../domain/statuses.js";
import { InvalidStateTransitionError } from "../domain/errors.js";

/**
 * Allowed exit intent transitions.
 */
export const exitIntentTransitions: Record<
  ExitIntentStatusType,
  ReadonlySet<ExitIntentStatusType>
> = {
  [ExitIntentStatus.Created]: new Set([
    ExitIntentStatus.PendingUserConfirmation,
    ExitIntentStatus.Rejected,
  ]),
  [ExitIntentStatus.PendingUserConfirmation]: new Set([
    ExitIntentStatus.Submitted,
    ExitIntentStatus.Expired,
  ]),
  [ExitIntentStatus.Submitted]: new Set([ExitIntentStatus.Processing]),
  [ExitIntentStatus.Processing]: new Set([
    ExitIntentStatus.Delayed,
    ExitIntentStatus.Completed,
    ExitIntentStatus.RecoverableFailure,
    ExitIntentStatus.Failed,
  ]),
  [ExitIntentStatus.Delayed]: new Set([
    ExitIntentStatus.Processing,
    ExitIntentStatus.RecoverableFailure,
  ]),
  [ExitIntentStatus.Completed]: new Set([]),
  [ExitIntentStatus.RecoverableFailure]: new Set([
    ExitIntentStatus.Compensated,
    ExitIntentStatus.Escalated,
    ExitIntentStatus.Failed,
  ]),
  [ExitIntentStatus.Compensated]: new Set([]),
  [ExitIntentStatus.Escalated]: new Set([]),
  [ExitIntentStatus.Rejected]: new Set([]),
  [ExitIntentStatus.Expired]: new Set([]),
  [ExitIntentStatus.Failed]: new Set([]),
};

/**
 * Returns true if the transition from `from` to `to` is allowed.
 */
export function canTransitionExitIntent(
  from: ExitIntentStatusType,
  to: ExitIntentStatusType,
): boolean {
  return exitIntentTransitions[from]?.has(to) ?? false;
}

/**
 * Throws InvalidStateTransitionError if the transition is not allowed.
 */
export function assertTransitionExitIntent(
  from: ExitIntentStatusType,
  to: ExitIntentStatusType,
): void {
  if (!canTransitionExitIntent(from, to)) {
    throw new InvalidStateTransitionError("ExitIntent", from, to);
  }
}

/**
 * Returns the set of allowed next statuses from the given status.
 */
export function getAllowedExitIntentTransitions(
  status: ExitIntentStatusType,
): ReadonlySet<ExitIntentStatusType> {
  return exitIntentTransitions[status] ?? new Set();
}
