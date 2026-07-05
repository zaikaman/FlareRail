import { describe, it, expect } from "vitest";
import {
  DepositIntentStatus,
  type DepositIntentStatus as DepositIntentStatusType,
} from "../../src/domain/statuses.js";
import {
  canTransitionDepositIntent,
  assertTransitionDepositIntent,
  getAllowedDepositIntentTransitions,
} from "../../src/state-machines/deposit-intent.js";
import { InvalidStateTransitionError } from "../../src/domain/errors.js";

describe("DepositIntent state machine", () => {
  const {
    Created,
    AwaitingUserAction,
    Observed,
    Activating,
    ActivePositionCreated,
    Expired,
    Failed,
    Cancelled,
  } = DepositIntentStatus;

  // ── Allowed transitions ────────────────────

  it.each([
    [Created, AwaitingUserAction],
    [Created, Expired],
    [AwaitingUserAction, Observed],
    [AwaitingUserAction, Expired],
    [AwaitingUserAction, Cancelled],
    [Observed, Activating],
    [Observed, Failed],
    [Activating, ActivePositionCreated],
    [Activating, Failed],
  ])("allows %s -> %s", (from, to) => {
    expect(canTransitionDepositIntent(from, to)).toBe(true);
    expect(() => assertTransitionDepositIntent(from, to)).not.toThrow();
  });

  // ── Illegal transitions ────────────────────

  it.each([
    [Created, Observed],
    [Created, Failed],
    [AwaitingUserAction, ActivePositionCreated],
    [Observed, Created],
    [Observed, Expired],
    [Activating, Expired],
  ])("rejects %s -> %s", (from, to) => {
    expect(canTransitionDepositIntent(from, to)).toBe(false);
    expect(() => assertTransitionDepositIntent(from, to)).toThrow(InvalidStateTransitionError);
  });

  it("includes from/to status in error", () => {
    try {
      assertTransitionDepositIntent(Created, Observed);
    } catch (e) {
      const err = e as InvalidStateTransitionError;
      expect(err.fromStatus).toBe("created");
      expect(err.toStatus).toBe("observed");
      expect(err.entityType).toBe("DepositIntent");
    }
  });

  // ── Terminal states ────────────────────────

  const terminalStates: DepositIntentStatusType[] = [
    ActivePositionCreated,
    Expired,
    Failed,
    Cancelled,
  ];

  it.each(terminalStates)("%s is terminal (no outgoing transitions)", (state) => {
    const allowed = getAllowedDepositIntentTransitions(state);
    expect(allowed.size).toBe(0);
  });
});
