/**
 * Domain error thrown when an invalid state transition is attempted.
 */
export class InvalidStateTransitionError extends Error {
  public readonly fromStatus: string;
  public readonly toStatus: string;
  public readonly entityType: string;

  constructor(entityType: string, fromStatus: string, toStatus: string) {
    super(`Invalid state transition for ${entityType}: ${fromStatus} -> ${toStatus}`);
    this.name = "InvalidStateTransitionError";
    this.entityType = entityType;
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
  }
}
