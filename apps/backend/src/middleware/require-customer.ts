import type { Customer } from "@otbt/types";
import type { FastifyRequest } from "fastify";

import { findCustomerById } from "../modules/customers/customer.service.js";
import { verifyCustomerToken } from "../modules/customers/customer.tokens.js";
import { HttpError } from "./error-handler.js";

declare module "fastify" {
  interface FastifyRequest {
    customer?: Customer;
    customerAuthError?: HttpError;
  }
}

export async function attachCustomerContext(request: FastifyRequest) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return;
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = verifyCustomerToken(token);
    const customer = await findCustomerById(payload.id);

    if (!customer) {
      request.customerAuthError = new HttpError(401, "Not authorized");
      return;
    }

    request.customer = customer;
  } catch {
    request.customerAuthError = new HttpError(401, "Not authorized");
  }
}

export async function requireCustomer(request: FastifyRequest) {
  if (!request.customer) {
    throw request.customerAuthError ?? new HttpError(401, "Not authorized");
  }
}
