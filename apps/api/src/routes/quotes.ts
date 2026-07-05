import type { FastifyInstance } from "fastify";
import { partnerAuthHook } from "../auth/partner-auth.js";
import { createQuoteForPartner } from "../services/quote-service.js";

/**
 * Register quote routes.
 */
export async function registerQuoteRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/v1/quotes",
    {
      preHandler: [partnerAuthHook],
    },
    async (request, reply) => {
      const partner = request.partner!;
      const input = request.body as {
        xrplAddress: string;
        walletUserRef?: string;
        amount: string;
        strategyCode: string;
      };

      const quote = await createQuoteForPartner(
        {
          xrplAddress: input.xrplAddress,
          walletUserRef: input.walletUserRef,
          amount: input.amount,
          strategyCode: input.strategyCode,
        },
        {
          organizationId: partner.organizationId,
          environment: partner.environment,
        },
      );

      return reply.status(201).send(quote);
    },
  );
}
