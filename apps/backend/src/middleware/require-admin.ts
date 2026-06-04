import type { FastifyRequest } from "fastify";

import { verifyAdminToken, type AdminTokenPayload } from "../modules/admin-users/admin-user.tokens.js";
import { HttpError } from "./error-handler.js";

declare module "fastify" {
  interface FastifyRequest {
    admin?: AdminTokenPayload;
  }
}

export async function requireAdmin(request: FastifyRequest) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError(401, "Not authorized");
  }

  try {
    const token = authHeader.split(" ")[1];
    request.admin = verifyAdminToken(token);
  } catch {
    throw new HttpError(401, "Not authorized");
  }
}
