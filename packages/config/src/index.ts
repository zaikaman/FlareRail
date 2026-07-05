import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// ── Shared config schema ───────────────────────

const sharedConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["test", "production"]).default("test"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
});

// ── API config schema ──────────────────────────

const apiConfigSchema = sharedConfigSchema.extend({
  PORT: z
    .string()
    .default("4000")
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive()),
  PARTNER_API_KEY_PEPPER: z.string().default("dev-pepper-not-secret"),
  WEBHOOK_SIGNING_SECRET_PEPPER: z.string().default("dev-webhook-pepper"),
  COSTON2_RPC_URL: z.string().default("https://coston2-api.flare.network/ext/bc/C/rpc"),
  XRPL_RPC_URL: z.string().default("wss://s.altnet.rippletest.net:51233"),
});

// ── Worker config schema ───────────────────────

const workerConfigSchema = sharedConfigSchema.extend({
  WORKER_CONCURRENCY: z
    .string()
    .default("5")
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive()),
  COSTON2_RPC_URL: z.string().default("https://coston2-api.flare.network/ext/bc/C/rpc"),
  XRPL_RPC_URL: z.string().default("wss://s.altnet.rippletest.net:51233"),
});

// ── Types ──────────────────────────────────────

export type AppConfig = z.infer<typeof sharedConfigSchema>;
export type ApiConfig = z.infer<typeof apiConfigSchema>;
export type WorkerConfig = z.infer<typeof workerConfigSchema>;

// ── Loaders ────────────────────────────────────

function buildConfig<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  overrides?: Record<string, string | undefined>,
): z.infer<typeof schema> {
  const source = { ...process.env, ...overrides };
  const result = schema.safeParse(source);
  if (!result.success) {
    const missingKeys = result.error.issues
      .filter(
        (i: z.ZodIssue) =>
          i.code === "invalid_type" && "received" in i && i.received === "undefined",
      )
      .map((i: z.ZodIssue) => i.path.join("."));
    const message =
      missingKeys.length > 0
        ? `Missing required config variables: ${missingKeys.join(", ")}`
        : result.error.message;
    throw new Error(message);
  }
  return result.data;
}

/**
 * Load and validate top-level application config.
 */
export function loadConfig(overrides?: Record<string, string | undefined>): AppConfig {
  return buildConfig(sharedConfigSchema, overrides);
}

/**
 * Load and validate API-specific config.
 */
export function loadApiConfig(overrides?: Record<string, string | undefined>): ApiConfig {
  return buildConfig(apiConfigSchema, overrides);
}

/**
 * Load and validate Worker-specific config.
 */
export function loadWorkerConfig(overrides?: Record<string, string | undefined>): WorkerConfig {
  return buildConfig(workerConfigSchema, overrides);
}
