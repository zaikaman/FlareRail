import type { FastifyInstance } from "fastify";
import { partnerAuthHook } from "../auth/partner-auth.js";

/**
 * Register all API routes on the given Fastify instance.
 * Phase 2 only registers the health route and a protected placeholder.
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // ── Placeholder protected route for auth tests ──
  app.get(
    "/v1/me",
    {
      preHandler: [partnerAuthHook],
    },
    async () => {
      return { service: "flarerail-api" };
    },
  );
}
