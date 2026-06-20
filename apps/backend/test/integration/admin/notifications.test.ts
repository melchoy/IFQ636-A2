import { expect } from "chai";

import { registerErrorHandler } from "../../../src/middleware/error-handler.js";
import { generateAdminToken } from "../../../src/modules/admin-users/admin-user.tokens.js";
import { notificationService } from "../../../src/modules/notifications/index.js";
import { adminNotificationsRoutes } from "../../../src/routes/admin/notifications/index.js";
import { buildTestApp } from "../../support/fastify-harness.js";

describe("admin notification routes", () => {
  const originalAdminJwtSecret = process.env.ADMIN_JWT_SECRET;
  const originalList = notificationService.list;
  const originalGetSummary = notificationService.getSummary;
  const originalUpdateStatus = notificationService.updateStatus;
  const originalMarkAllRead = notificationService.markAllRead;

  before(() => {
    process.env.ADMIN_JWT_SECRET = "test-admin-secret";
  });

  after(() => {
    process.env.ADMIN_JWT_SECRET = originalAdminJwtSecret;
  });

  afterEach(() => {
    notificationService.list = originalList;
    notificationService.getSummary = originalGetSummary;
    notificationService.updateStatus = originalUpdateStatus;
    notificationService.markAllRead = originalMarkAllRead;
  });

  function adminAuthHeader() {
    const token = generateAdminToken({
      email: "admin@example.com",
      id: "admin-1",
    });

    return { authorization: `Bearer ${token}` };
  }

  it("requires admin authentication", async () => {
    const app = await buildTestApp(async (testApp) => {
      registerErrorHandler(testApp);
      await testApp.register(adminNotificationsRoutes, {
        prefix: "/api/admin/notifications",
      });
    });

    try {
      const response = await app.inject({
        method: "GET",
        url: "/api/admin/notifications",
      });

      expect(response.statusCode).to.equal(401);
      expect(response.json()).to.deep.equal({ error: "Not authorized" });
    } finally {
      await app.close();
    }
  });

  it("lists notifications with summary", async () => {
    notificationService.list = async () => [
      {
        action: "received",
        createdAt: "2026-06-20T00:00:00.000Z",
        id: "notification-1",
        message: "Order #1001 from storefront checkout",
        resource: "orders",
        resourceId: "order-1001",
        status: "unread",
        title: "New order received",
        type: "order",
      },
    ];
    notificationService.getSummary = async () => ({
      recentOrderCount: 1,
      unreadCount: 1,
    });

    const app = await buildTestApp(async (testApp) => {
      registerErrorHandler(testApp);
      await testApp.register(adminNotificationsRoutes, {
        prefix: "/api/admin/notifications",
      });
    });

    try {
      const response = await app.inject({
        headers: adminAuthHeader(),
        method: "GET",
        url: "/api/admin/notifications",
      });

      expect(response.statusCode).to.equal(200);
      expect(response.json()).to.deep.equal({
        notifications: [
          {
            action: "received",
            createdAt: "2026-06-20T00:00:00.000Z",
            id: "notification-1",
            message: "Order #1001 from storefront checkout",
            resource: "orders",
            resourceId: "order-1001",
            status: "unread",
            title: "New order received",
            type: "order",
          },
        ],
        summary: {
          recentOrderCount: 1,
          unreadCount: 1,
        },
      });
    } finally {
      await app.close();
    }
  });

  it("rejects invalid notification filters", async () => {
    const app = await buildTestApp(async (testApp) => {
      registerErrorHandler(testApp);
      await testApp.register(adminNotificationsRoutes, {
        prefix: "/api/admin/notifications",
      });
    });

    try {
      const response = await app.inject({
        headers: adminAuthHeader(),
        method: "GET",
        url: "/api/admin/notifications?filter=unknown",
      });

      expect(response.statusCode).to.equal(400);
      expect(response.json()).to.deep.equal({
        error: "Invalid notification filter",
      });
    } finally {
      await app.close();
    }
  });

  it("validates notification status updates", async () => {
    const app = await buildTestApp(async (testApp) => {
      registerErrorHandler(testApp);
      await testApp.register(adminNotificationsRoutes, {
        prefix: "/api/admin/notifications",
      });
    });

    try {
      const response = await app.inject({
        headers: adminAuthHeader(),
        method: "PATCH",
        payload: { status: "unread" },
        url: "/api/admin/notifications/notification-1/status",
      });

      expect(response.statusCode).to.equal(400);
      expect(response.json()).to.deep.equal({
        error: "Invalid notification status",
      });
    } finally {
      await app.close();
    }
  });

  it("returns not found when updating a missing notification", async () => {
    notificationService.updateStatus = async () => null;

    const app = await buildTestApp(async (testApp) => {
      registerErrorHandler(testApp);
      await testApp.register(adminNotificationsRoutes, {
        prefix: "/api/admin/notifications",
      });
    });

    try {
      const response = await app.inject({
        headers: adminAuthHeader(),
        method: "PATCH",
        payload: { status: "read" },
        url: "/api/admin/notifications/missing-notification/status",
      });

      expect(response.statusCode).to.equal(404);
      expect(response.json()).to.deep.equal({
        error: "Notification not found",
      });
    } finally {
      await app.close();
    }
  });

  it("marks all notifications read", async () => {
    let markAllReadCalled = false;
    notificationService.markAllRead = async () => {
      markAllReadCalled = true;
    };

    const app = await buildTestApp(async (testApp) => {
      registerErrorHandler(testApp);
      await testApp.register(adminNotificationsRoutes, {
        prefix: "/api/admin/notifications",
      });
    });

    try {
      const response = await app.inject({
        headers: adminAuthHeader(),
        method: "POST",
        url: "/api/admin/notifications/mark-all-read",
      });

      expect(response.statusCode).to.equal(200);
      expect(response.json()).to.deep.equal({ ok: true });
      expect(markAllReadCalled).to.equal(true);
    } finally {
      await app.close();
    }
  });
});
