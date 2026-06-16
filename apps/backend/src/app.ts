import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";

import { env } from "./config/env.js";
import { registerErrorHandler } from "./middleware/error-handler.js";
import { adminRoutes } from "./routes/admin/index.js";
import { healthRoutes } from "./routes/health.js";
import { serverEventRoutes } from "./routes/server-events.js";
import { storefrontRoutes } from "./routes/storefront/index.js";

export async function buildApp() {
  const app = Fastify();

  registerErrorHandler(app);

  await app.register(cors, { origin: env.clientOrigins });
  await app.register(fastifyStatic, {
    prefix: "/uploads/",
    root: env.uploadsDir,
  });
  await app.register(multipart, {
    limits: { fileSize: 8 * 1024 * 1024 },
  });

  await app.register(healthRoutes, { prefix: "/health" });
  await app.register(serverEventRoutes, { prefix: "/api/server-events" });
  await app.register(adminRoutes, { prefix: "/api/admin" });
  await app.register(storefrontRoutes, { prefix: "/api/storefront" });

  return app;
}
