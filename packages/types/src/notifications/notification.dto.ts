import type {
  NotificationItem,
  NotificationStatus,
  NotificationType,
} from "./notification.entity.js";

export type NotificationFilter = "all" | "unread" | NotificationType;

export interface NotificationSummary {
  unreadCount: number;
  recentOrderCount: number;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  summary: NotificationSummary;
}

export interface NotificationStatusUpdateRequest {
  status: Extract<NotificationStatus, "read" | "dismissed">;
}

export interface NotificationStatusUpdateResponse {
  notification: NotificationItem;
}
