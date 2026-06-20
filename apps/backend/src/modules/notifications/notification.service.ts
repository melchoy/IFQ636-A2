import type {
  NotificationFilter,
  NotificationItem,
  NotificationSummary,
} from "@otbt/types";

import type { NotificationDocument } from "./notification.model.js";
import {
  MongoNotificationRepository,
  type NotificationCreateInput,
  type NotificationQuery,
  type NotificationRepository,
} from "./notification.repository.js";

function serializeNotification(
  notification: NotificationDocument,
): NotificationItem {
  return {
    action: notification.action,
    createdAt: notification.createdAt.toISOString(),
    dismissedAt: notification.dismissedAt?.toISOString(),
    id: notification._id.toString(),
    message: notification.message,
    readAt: notification.readAt?.toISOString(),
    resource: notification.resource,
    resourceId: notification.resourceId ?? undefined,
    status: notification.status,
    title: notification.title,
    type: notification.type,
  };
}

export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository =
      new MongoNotificationRepository(),
  ) {}

  async create(input: NotificationCreateInput) {
    const created = await this.repository.create(input);
    return serializeNotification(created);
  }

  async list(filter: NotificationFilter = "all") {
    const notifications = await this.repository.find(this.resolveListQuery(filter));

    return notifications.map((notification) => serializeNotification(notification));
  }

  async getSummary(): Promise<NotificationSummary> {
    const [unreadCount, recentOrderCount] = await Promise.all([
      this.repository.count({ status: "unread" }),
      this.repository.count({
        status: { $ne: "dismissed" },
        type: "order",
      }),
    ]);

    return { recentOrderCount, unreadCount };
  }

  async markAllRead() {
    await this.repository.updateMany(
      { status: "unread" },
      { readAt: new Date(), status: "read" },
    );
  }

  async updateStatus(id: string, status: "read" | "dismissed") {
    const now = new Date();
    const update =
      status === "dismissed"
        ? { dismissedAt: now, status }
        : { readAt: now, status };

    const notification = await this.repository.updateStatus(id, update);

    return notification ? serializeNotification(notification) : null;
  }

  private resolveListQuery(filter: NotificationFilter): NotificationQuery {
    if (filter === "unread") {
      return { status: "unread" };
    }

    if (filter === "order" || filter === "system") {
      return { status: { $ne: "dismissed" }, type: filter };
    }

    return { status: { $ne: "dismissed" } };
  }
}

export const notificationService = new NotificationService();
