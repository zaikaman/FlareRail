import { describe, it, expect } from "vitest";
import {
  ExitIntentStatus,
  type ExitIntentStatus as ExitIntentStatusType,
} from "../../src/domain/statuses.js";
import {
  canTransitionExitIntent,
  assertTransitionExitIntent,
  getAllowedExitIntentTransitions,
} from "../../src/state-machines/exit-intent.js";
import { InvalidStateTransitionError } from "../../src/domain/errors.js";

describe("ExitIntent state machine", () => {
  const {
    Created,
    PendingUserConfirmation,
    Submitted,
    Processing,
    Delayed,
    Completed,
    RecoverableFailure,
    Compensated,
    Escalated,
    Rejected,
    Expired,
    Failed,
  } = ExitIntentStatus;

  // ── Happy path ─────────────────────────────

  it("follows happy path: Created -> PendingUserConfirmation -> Submitted -> Processing -> Completed", () => {
    expect(() => assertTransitionExitIntent(Created, PendingUserConfirmation)).not.toThrow();
    expect(() => assertTransitionExitIntent(PendingUserConfirmation, Submitted)).not.toThrow();
    expect(() => assertTransitionExitIntent(Submitted, Processing)).not.toThrow();
    expect(() => assertTransitionExitIntent(Processing, Completed)).not.toThrow();
  });

  // ── Delayed path ───────────────────────────

  it("follows delayed path: Processing -> Delayed -> Processing", () => {
    expect(canTransitionExitIntent(Processing, Delayed)).toBe(true);
    expect(canTransitionExitIntent(Delayed, Processing)).toBe(true);
  });

  // ── Recovery path ──────────────────────────

  it("follows recovery path: Processing -> RecoverableFailure -> Compensated", () => {
    expect(() => assertTransitionExitIntent(Processing, RecoverableFailure)).not.toThrow();
    expect(() => assertTransitionExitIntent(RecoverableFailure, Compensated)).not.toThrow();
  });

  it("RecoverableFailure can also go to Escalated or Failed", () => {
    expect(canTransitionExitIntent(RecoverableFailure, Escalated)).toBe(true);
    expect(canTransitionExitIntent(RecoverableFailure, Failed)).toBe(true);
  });

  // ── Rejected / Expired / Failed are terminal ─

  const terminalStates: ExitIntentStatusType[] = [
    Completed,
    Compensated,
    Escalated,
    Rejected,
    Expired,
    Failed,
  ];

  it.each(terminalStates)("%s is terminal", (state) => {
    expect(getAllowedExitIntentTransitions(state).size).toBe(0);
  });

  // ── Created can be rejected ──────────────────

  it("Created can transition to Rejected", () => {
    expect(canTransitionExitIntent(Created, Rejected)).toBe(true);
  });

  // ── Illegal transitions throw ────────────────

  it("throws on illegal transitions", () => {
    expect(() => assertTransitionExitIntent(Created, Processing)).toThrow(
      InvalidStateTransitionError,
    );
    expect(() => assertTransitionExitIntent(Completed, Processing)).toThrow(
      InvalidStateTransitionError,
    );
  });
});
