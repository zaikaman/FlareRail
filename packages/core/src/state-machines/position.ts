import { PositionStatus, type PositionStatus as PositionStatusType } from "../domain/statuses.js";
import { InvalidStateTransitionError } from "../domain/errors.js";

/**
 * Allowed position transitions.
 */
export const positionTransitions: Record<PositionStatusType, ReadonlySet<PositionStatusType>> = {
  [PositionStatus.Active]: new Set([PositionStatus.Exiting, PositionStatus.Impaired]),
  [PositionStatus.Exiting]: new Set([PositionStatus.Active, PositionStatus.Closed]),
  [PositionStatus.Impaired]: new Set([PositionStatus.Active, PositionStatus.RecoveryAvailable]),
  [PositionStatus.RecoveryAvailable]: new Set([PositionStatus.Closed]),
  [PositionStatus.Closed]: new Set([]),
};

/**
 * Returns true if the transition from `from` to `to` is allowed.
 */
export function canTransitionPosition(from: PositionStatusType, to: PositionStatusType): boolean {
  return positionTransitions[from]?.has(to) ?? false;
}

/**
 * Throws InvalidStateTransitionError if the transition is not allowed.
 */
export function assertTransitionPosition(from: PositionStatusType, to: PositionStatusType): void {
  if (!canTransitionPosition(from, to)) {
    throw new InvalidStateTransitionError("Position", from, to);
  }
}

/**
 * Returns the set of allowed next statuses from the given status.
 */
export function getAllowedPositionTransitions(
  status: PositionStatusType,
): ReadonlySet<PositionStatusType> {
  return positionTransitions[status] ?? new Set();
}
