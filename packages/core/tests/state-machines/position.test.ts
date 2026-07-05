import { describe, it, expect } from "vitest";
import { PositionStatus } from "../../src/domain/statuses.js";
import {
  canTransitionPosition,
  assertTransitionPosition,
  getAllowedPositionTransitions,
} from "../../src/state-machines/position.js";
import { InvalidStateTransitionError } from "../../src/domain/errors.js";

describe("Position state machine", () => {
  const { Active, Exiting, Impaired, RecoveryAvailable, Closed } = PositionStatus;

  // ── Allowed transitions ────────────────────

  it("Active can enter Exiting or Impaired", () => {
    expect(canTransitionPosition(Active, Exiting)).toBe(true);
    expect(canTransitionPosition(Active, Impaired)).toBe(true);
  });

  it("Exiting can return to Active or become Closed", () => {
    expect(canTransitionPosition(Exiting, Active)).toBe(true);
    expect(canTransitionPosition(Exiting, Closed)).toBe(true);
  });

  it("Impaired can return to Active or become RecoveryAvailable", () => {
    expect(canTransitionPosition(Impaired, Active)).toBe(true);
    expect(canTransitionPosition(Impaired, RecoveryAvailable)).toBe(true);
  });

  it("RecoveryAvailable can become Closed", () => {
    expect(canTransitionPosition(RecoveryAvailable, Closed)).toBe(true);
  });

  // ── Illegal transitions ────────────────────

  it("Active cannot transition to RecoveryAvailable or Closed directly", () => {
    expect(canTransitionPosition(Active, RecoveryAvailable)).toBe(false);
    expect(canTransitionPosition(Active, Closed)).toBe(false);
  });

  it("Closed is terminal", () => {
    expect(() => assertTransitionPosition(Closed, Active)).toThrow(InvalidStateTransitionError);
    expect(canTransitionPosition(Closed, Active)).toBe(false);
    expect(getAllowedPositionTransitions(Closed).size).toBe(0);
  });

  it("throws error for illegal Impaired -> Closed", () => {
    expect(() => assertTransitionPosition(Impaired, Closed)).toThrow(InvalidStateTransitionError);
  });
});
