import Fastify, { type FastifyInstance } from "fastify";
import { loadApiConfig, type ApiConfig } from "@flarerail/config";
import { registerRoutes } from "./routes/index.js";
import { registerErrorHandler } from "./middleware/errors.js";

export interface BuildServerOptions {
  config?: ApiConfig;
  logger?: boolean;
}

/**
 * Build a configured Fastify instance.
 * Used by tests and the start() entry point.
 */
export async function buildServer(options: BuildServerOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadApiConfig();

  const app = Fastify({
    requestIdHeader: "x-request-id",
    logger: options.logger ?? false,
  });

  // Decorator for route handlers to access config
  app.decorate("config", config);

  // Health check
  app.get("/v1/health", async () => {
    return {
      status: "ok",
      service: "flarerail-api",
      environment: config.APP_ENV,
    };
  });

  // Register error handler
  registerErrorHandler(app);

  // Register all routes
  await registerRoutes(app);

  return app;
}

// ── Start directly ───────────────────────────
const isMainModule = process.argv[1]?.endsWith("server.ts");

if (isMainModule) {
  const config = loadApiConfig();
  const app = await buildServer({ config, logger: true });

  try {
    await app.listen({ port: config.PORT, host: "0.0.0.0" });
    console.log(`🚀 FlareRail API listening on port ${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
