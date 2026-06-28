import type { NotificationItem } from "@otbt/types";

import {
  serverEventBroadcaster,
  type ServerEventBroadcaster,
} from "../../server-events/index.js";

export interface NotificationEventPublisher {
  publishCreated(notification: NotificationItem): unknown;
  publishUpdated(notification: NotificationItem): unknown;
}

export class NotificationPublisher implements NotificationEventPublisher {
  constructor(
    private readonly broadcaster: Pick<ServerEventBroadcaster, "publish"> =
      serverEventBroadcaster,
  ) {}

  publishCreated(notification: NotificationItem) {
    return this.broadcaster.publish({
      action: "created",
      channel: "admin",
      message: notification.title,
      resource: "notifications",
      resourceId: notification.id,
    });
  }

  publishUpdated(notification: NotificationItem) {
    return this.broadcaster.publish({
      action: "updated",
      channel: "admin",
      message: notification.title,
      resource: "notifications",
      resourceId: notification.id,
    });
  }
}
