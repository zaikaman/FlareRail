import type { FastifyInstance } from "fastify";
import { partnerAuthHook } from "../auth/partner-auth.js";
import { listStrategiesForPartner } from "../services/strategy-service.js";

/**
 * Register strategy routes.
 */
export async function registerStrategyRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/v1/strategies",
    {
      preHandler: [partnerAuthHook],
    },
    async (request, reply) => {
      const partner = request.partner!;
      const strategies = await listStrategiesForPartner({
        organizationId: partner.organizationId,
        environment: partner.environment,
      });

      return reply.status(200).send(strategies);
    },
  );
}
