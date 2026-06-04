import type {
  AdminOrderDetailResponse,
  AdminOrderListResponse,
  AdminOrderStatusUpdateRequest,
  AdminOrderStatusUpdateResponse,
} from "@otbt/types";
import type { FastifyInstance } from "fastify";

import { HttpError } from "../../middleware/error-handler.js";
import { requireAdmin } from "../../middleware/require-admin.js";
import {
  getAdminOrder,
  listAdminOrders,
  OrderValidationError,
  updateAdminOrderStatus,
} from "../../modules/orders/order.service.js";

type OrderParams = {
  orderId: string;
};

function handleOrderRouteError(error: unknown): never {
  if (error instanceof OrderValidationError) {
    throw new HttpError(400, error.message);
  }

  throw error;
}

export async function adminOrdersRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireAdmin }, async () => {
    const response: AdminOrderListResponse = {
      orders: await listAdminOrders(),
    };

    return response;
  });

  app.get<{ Params: OrderParams }>(
    "/:orderId",
    { preHandler: requireAdmin },
    async (request) => {
      const order = await getAdminOrder(request.params.orderId);

      if (!order) {
        throw new HttpError(404, "Order not found");
      }

      const response: AdminOrderDetailResponse = { order };
      return response;
    },
  );

  app.patch<{ Body: Partial<AdminOrderStatusUpdateRequest>; Params: OrderParams }>(
    "/:orderId/status",
    { preHandler: requireAdmin },
    async (request) => {
      try {
        const { status } = request.body;

        if (!status) {
          throw new OrderValidationError("Order status is required");
        }

        const order = await updateAdminOrderStatus(request.params.orderId, status);

        if (!order) {
          throw new HttpError(404, "Order not found");
        }

        const response: AdminOrderStatusUpdateResponse = { order };
        return response;
      } catch (error) {
        handleOrderRouteError(error);
      }
    },
  );
}
