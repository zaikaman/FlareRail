import "@flarerail/config";
import type { ApiConfig } from "@flarerail/config";

declare module "fastify" {
  interface FastifyInstance {
    config: ApiConfig;
  }

  interface FastifyRequest {
    partner?: {
      organizationId: string;
      credentialId: string;
      environment: string;
      scopes: string[];
    };
  }
}
