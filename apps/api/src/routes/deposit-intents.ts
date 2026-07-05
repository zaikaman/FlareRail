import type { FastifyInstance } from "fastify";
import { partnerAuthHook } from "../auth/partner-auth.js";
import {
  createDepositIntentForPartner,
  getDepositIntentForPartner,
} from "../services/deposit-intent-service.js";
import { getIdempotencyKey } from "../middleware/idempotency.js";

/**
 * Register deposit intent routes.
 */
export async function registerDepositIntentRoutes(app: FastifyInstance): Promise<void> {
  // POST /v1/deposit-intents
  app.post(
    "/v1/deposit-intents",
    {
      preHandler: [partnerAuthHook],
    },
    async (request, reply) => {
      const partner = request.partner!;
      const headerIdempotencyKey = getIdempotencyKey(request);
      const input = request.body as {
        quoteId: string;
        idempotencyKey?: string;
      };

      const intent = await createDepositIntentForPartner(
        {
          quoteId: input.quoteId,
          idempotencyKey: input.idempotencyKey,
          headerIdempotencyKey,
        },
        {
          organizationId: partner.organizationId,
          environment: partner.environment,
        },
      );

      return reply.status(201).send(intent);
    },
  );

  // GET /v1/deposit-intents/:intentId
  app.get(
    "/v1/deposit-intents/:intentId",
    {
      preHandler: [partnerAuthHook],
    },
    async (request, reply) => {
      const partner = request.partner!;
      const { intentId } = request.params as { intentId: string };

      const intent = await getDepositIntentForPartner(
        { intentId },
        {
          organizationId: partner.organizationId,
          environment: partner.environment,
        },
      );

      return reply.status(200).send(intent);
    },
  );
}
