// Re-export lifecycle event service from core package
// This ensures backward compatibility for any API-internal imports
export {
  createLifecycleEvent,
  listLifecycleEvents,
} from "@flarerail/core";

export type {
  SubjectType,
  ActorType,
  LifecycleEventInput,
  LifecycleEventFilter,
} from "@flarerail/core";
