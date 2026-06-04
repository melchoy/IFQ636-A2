import type {
  AdminCustomerDetailResponse,
  AdminCustomerListResponse,
  AdminCustomerUpdateRequest,
  AdminCustomerUpdateResponse,
} from "@otbt/types";
import type { FastifyInstance } from "fastify";
import { Error as MongooseError } from "mongoose";

import { HttpError } from "../../middleware/error-handler.js";
import { requireAdmin } from "../../middleware/require-admin.js";
import {
  getCustomer,
  listCustomers,
  updateCustomer,
} from "../../modules/customers/customer.service.js";

type CustomerParams = {
  customerId: string;
};

function handleCustomerRouteError(error: unknown): never {
  if (error instanceof MongooseError.ValidationError) {
    throw new HttpError(400, error.message);
  }

  throw error;
}

export async function adminCustomersRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireAdmin }, async () => {
    const customers = await listCustomers();
    const response: AdminCustomerListResponse = { customers };

    return response;
  });

  app.get<{ Params: CustomerParams }>(
    "/:customerId",
    { preHandler: requireAdmin },
    async (request) => {
      const customer = await getCustomer(request.params.customerId);

      if (!customer) {
        throw new HttpError(404, "Customer not found");
      }

      const response: AdminCustomerDetailResponse = { customer };
      return response;
    },
  );

  app.patch<{ Body: AdminCustomerUpdateRequest; Params: CustomerParams }>(
    "/:customerId",
    { preHandler: requireAdmin },
    async (request) => {
      try {
        const customer = await updateCustomer(
          request.params.customerId,
          request.body,
        );

        if (!customer) {
          throw new HttpError(404, "Customer not found");
        }

        const response: AdminCustomerUpdateResponse = { customer };
        return response;
      } catch (error) {
        handleCustomerRouteError(error);
      }
    },
  );
}
