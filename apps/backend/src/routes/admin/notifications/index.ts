import {
  NOTIFICATION_TYPES,
  type NotificationFilter,
  type NotificationListResponse,
  type NotificationStatusUpdateRequest,
  type NotificationStatusUpdateResponse,
} from "@otbt/types";
import type { FastifyInstance } from "fastify";

import { HttpError } from "../../../middleware/error-handler.js";
import { requireAdmin } from "../../../middleware/require-admin.js";
import { notificationService } from "../../../modules/notifications/index.js";

type NotificationParams = {
  notificationId: string;
};

type NotificationQuery = {
  filter?: string;
};

function parseNotificationFilter(filter: string | undefined): NotificationFilter {
  if (!filter) {
    return "all";
  }

  if (filter === "all" || filter === "unread") {
    return filter;
  }

  if ((NOTIFICATION_TYPES as readonly string[]).includes(filter)) {
    return filter as NotificationFilter;
  }

  throw new HttpError(400, "Invalid notification filter");
}

export async function adminNotificationsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: NotificationQuery }>(
    "/",
    { preHandler: requireAdmin },
    async (request) => {
      const filter = parseNotificationFilter(request.query.filter);
      const response: NotificationListResponse = {
        notifications: await notificationService.list(filter),
        summary: await notificationService.getSummary(),
      };

      return response;
    },
  );

  app.patch<{
    Body: Partial<NotificationStatusUpdateRequest>;
    Params: NotificationParams;
  }>("/:notificationId/status", { preHandler: requireAdmin }, async (request) => {
    const { status } = request.body;

    if (status !== "read" && status !== "dismissed") {
      throw new HttpError(400, "Invalid notification status");
    }

    const notification = await notificationService.updateStatus(
      request.params.notificationId,
      status,
    );

    if (!notification) {
      throw new HttpError(404, "Notification not found");
    }

    const response: NotificationStatusUpdateResponse = { notification };
    return response;
  });

  app.post("/mark-all-read", { preHandler: requireAdmin }, async () => {
    await notificationService.markAllRead();
    return { ok: true };
  });
}
