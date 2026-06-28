export const NOTIFICATION_TYPES = ["order", "system"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_STATUSES = ["unread", "read", "dismissed"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export interface NotificationItem {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  resource: string;
  resourceId?: string;
  action: string;
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
}
