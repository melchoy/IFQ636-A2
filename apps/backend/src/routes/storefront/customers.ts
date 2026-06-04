import type { RegisterCustomerDto, RegisterCustomerResponse } from "@otbt/types";
import type { FastifyInstance } from "fastify";

import { HttpError } from "../../middleware/error-handler.js";
import { registerCustomer } from "../../modules/customers/customer.service.js";

export async function storefrontCustomersRoutes(app: FastifyInstance) {
  app.post<{ Body: Partial<RegisterCustomerDto> }>("/", async (request, reply) => {
    const { firstName, lastName, email, password } = request.body;

    if (!firstName || !lastName || !email || !password) {
      throw new HttpError(
        400,
        "First name, last name, email, and password are required",
      );
    }

    const response: RegisterCustomerResponse = {
      customer: await registerCustomer({
        firstName,
        lastName,
        email,
        password,
      }),
    };

    reply.status(201);
    return response;
  });
}
