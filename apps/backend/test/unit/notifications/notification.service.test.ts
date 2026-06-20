import { expect } from "chai";

import {
  NotificationService,
  type NotificationCreateInput,
  type NotificationDocument,
  type NotificationQuery,
  type NotificationRepository,
  type NotificationStatusUpdate,
} from "../../../src/modules/notifications/index.js";

function createDocument(
  overrides: Partial<NotificationDocument> = {},
): NotificationDocument {
  return {
    _id: { toString: () => overrides._id?.toString() ?? "notification-1" },
    action: "received",
    createdAt: new Date("2026-06-20T00:00:00.000Z"),
    dismissedAt: null,
    message: "Order #1001 from storefront checkout",
    readAt: null,
    resource: "orders",
    resourceId: "order-1001",
    status: "unread",
    title: "New order received",
    type: "order",
    updatedAt: new Date("2026-06-20T00:00:00.000Z"),
    ...overrides,
  } as NotificationDocument;
}

class FakeNotificationRepository implements NotificationRepository {
  countQueries: NotificationQuery[] = [];
  createdInputs: NotificationCreateInput[] = [];
  findQueries: NotificationQuery[] = [];
  updateManyCalls: Array<{
    query: NotificationQuery;
    update: NotificationStatusUpdate;
  }> = [];
  updateStatusCalls: Array<{
    id: string;
    update: NotificationStatusUpdate;
  }> = [];

  constructor(
    private readonly documents: NotificationDocument[] = [createDocument()],
    private readonly counts: number[] = [1, 3],
  ) {}

  async count(query: NotificationQuery) {
    this.countQueries.push(query);
    return this.counts[this.countQueries.length - 1] ?? 0;
  }

  async create(input: NotificationCreateInput) {
    this.createdInputs.push(input);
    return createDocument(input);
  }

  async find(query: NotificationQuery) {
    this.findQueries.push(query);
    return this.documents;
  }

  async updateMany(query: NotificationQuery, update: NotificationStatusUpdate) {
    this.updateManyCalls.push({ query, update });
  }

  async updateStatus(id: string, update: NotificationStatusUpdate) {
    this.updateStatusCalls.push({ id, update });
    return createDocument({ readAt: update.readAt ?? null, status: update.status });
  }
}

describe("NotificationService", () => {
  it("creates and serializes a notification", async () => {
    const repository = new FakeNotificationRepository();
    const service = new NotificationService(repository);

    const notification = await service.create({
      action: "received",
      message: "Order #1001 from storefront checkout",
      resource: "orders",
      resourceId: "order-1001",
      title: "New order received",
      type: "order",
    });

    expect(repository.createdInputs).to.have.length(1);
    expect(notification).to.deep.equal({
      action: "received",
      createdAt: "2026-06-20T00:00:00.000Z",
      dismissedAt: undefined,
      id: "notification-1",
      message: "Order #1001 from storefront checkout",
      readAt: undefined,
      resource: "orders",
      resourceId: "order-1001",
      status: "unread",
      title: "New order received",
      type: "order",
    });
  });

  it("resolves list filters into repository queries", async () => {
    const repository = new FakeNotificationRepository();
    const service = new NotificationService(repository);

    await service.list("unread");
    await service.list("order");
    await service.list("all");

    expect(repository.findQueries).to.deep.equal([
      { status: "unread" },
      { status: { $ne: "dismissed" }, type: "order" },
      { status: { $ne: "dismissed" } },
    ]);
  });

  it("returns notification summary counts", async () => {
    const repository = new FakeNotificationRepository([], [2, 5]);
    const service = new NotificationService(repository);

    const summary = await service.getSummary();

    expect(summary).to.deep.equal({ recentOrderCount: 5, unreadCount: 2 });
    expect(repository.countQueries).to.deep.equal([
      { status: "unread" },
      { status: { $ne: "dismissed" }, type: "order" },
    ]);
  });

  it("marks all unread notifications as read", async () => {
    const repository = new FakeNotificationRepository();
    const service = new NotificationService(repository);

    await service.markAllRead();

    expect(repository.updateManyCalls).to.have.length(1);
    expect(repository.updateManyCalls[0].query).to.deep.equal({
      status: "unread",
    });
    expect(repository.updateManyCalls[0].update.status).to.equal("read");
    expect(repository.updateManyCalls[0].update.readAt).to.be.instanceOf(Date);
  });
});
