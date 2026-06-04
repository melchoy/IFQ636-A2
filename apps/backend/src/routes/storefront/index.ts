import type { FastifyInstance } from "fastify";

import { attachCustomerContext } from "../../middleware/require-customer.js";
import { storefrontAuthRoutes } from "./auth.js";
import { storefrontCustomersRoutes } from "./customers.js";
import { storefrontOrdersRoutes } from "./orders.js";
import { storefrontProductsRoutes } from "./products.js";

export async function storefrontRoutes(app: FastifyInstance) {
  app.addHook("preHandler", attachCustomerContext);

  await app.register(storefrontAuthRoutes, { prefix: "/auth" });
  await app.register(storefrontCustomersRoutes, { prefix: "/customers" });
  await app.register(storefrontOrdersRoutes, { prefix: "/orders" });
  await app.register(storefrontProductsRoutes, { prefix: "/products" });
}
