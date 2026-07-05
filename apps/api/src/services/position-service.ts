// Re-export position service from core package
// This ensures backward compatibility for any API-internal imports
export {
  createPositionFromDepositIntent,
  findPositionForDepositIntent,
  serializePosition,
} from "@flarerail/core";

export type { CreatePositionInput } from "@flarerail/core";
