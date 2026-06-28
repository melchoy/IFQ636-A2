import { expect } from "chai";

import { NotificationPublisher } from "../../../src/modules/notifications/index.js";
import type { ServerEventInput } from "../../../src/server-events/index.js";
import type { NotificationItem } from "@otbt/types";

class FakeServerEventBroadcaster {
  inputs: ServerEventInput[] = [];

  publish(input: ServerEventInput) {
    this.inputs.push(input);
    return {
      ...input,
      id: "event-1",
      timestamp: "2026-06-20T00:00:00.000Z",
    };
  }
}

function createNotification(
  overrides: Partial<NotificationItem> = {},
): NotificationItem {
  return {
    action: "received",
    createdAt: "2026-06-20T00:00:00.000Z",
    id: "notification-1",
    message: "Order #1001 from storefront checkout",
    resource: "orders",
    resourceId: "order-1001",
    status: "unread",
    title: "New order received",
    type: "order",
    ...overrides,
  };
}

describe("NotificationPublisher", () => {
  it("publishes created notification events to the admin channel", () => {
    const broadcaster = new FakeServerEventBroadcaster();
    const publisher = new NotificationPublisher(broadcaster);

    publisher.publishCreated(createNotification());

    expect(broadcaster.inputs).to.deep.equal([
      {
        action: "created",
        channel: "admin",
        message: "New order received",
        resource: "notifications",
        resourceId: "notification-1",
      },
    ]);
  });

  it("publishes updated notification events to the admin channel", () => {
    const broadcaster = new FakeServerEventBroadcaster();
    const publisher = new NotificationPublisher(broadcaster);

    publisher.publishUpdated(createNotification({ status: "read" }));

    expect(broadcaster.inputs).to.deep.equal([
      {
        action: "updated",
        channel: "admin",
        message: "New order received",
        resource: "notifications",
        resourceId: "notification-1",
      },
    ]);
  });
});
