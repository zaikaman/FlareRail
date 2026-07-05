import type { FastifyInstance } from "fastify";
import { partnerAuthHook } from "../auth/partner-auth.js";
import { registerStrategyRoutes } from "./strategies.js";
import { registerQuoteRoutes } from "./quotes.js";
import { registerDepositIntentRoutes } from "./deposit-intents.js";

/**
 * Register all API routes on the given Fastify instance.
 * Phase 3 registers strategies, quotes, and deposit intents.
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // ── Protected placeholder for auth tests ──
  app.get(
    "/v1/me",
    {
      preHandler: [partnerAuthHook],
    },
    async () => {
      return { service: "flarerail-api" };
    },
  );

  // ── US1: Strategy, Quote, and Deposit Intent routes ──
  await registerStrategyRoutes(app);
  await registerQuoteRoutes(app);
  await registerDepositIntentRoutes(app);
}
