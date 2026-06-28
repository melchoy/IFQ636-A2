import {
  NotificationModel,
  type NotificationDocument,
} from "./notification.model.js";

export type NotificationCreateInput = {
  action: string;
  message: string;
  resource: string;
  resourceId?: string;
  title: string;
  type: "order" | "system";
};

export type NotificationQuery = Record<string, unknown>;

export type NotificationStatusUpdate = {
  dismissedAt?: Date;
  readAt?: Date;
  status: "read" | "dismissed";
};

export interface NotificationRepository {
  count(query: NotificationQuery): Promise<number>;
  create(input: NotificationCreateInput): Promise<NotificationDocument>;
  find(query: NotificationQuery): Promise<NotificationDocument[]>;
  updateMany(query: NotificationQuery, update: NotificationStatusUpdate): Promise<void>;
  updateStatus(
    id: string,
    update: NotificationStatusUpdate,
  ): Promise<NotificationDocument | null>;
}

export class MongoNotificationRepository implements NotificationRepository {
  async count(query: NotificationQuery) {
    return await NotificationModel.countDocuments(query).exec();
  }

  async create(input: NotificationCreateInput) {
    return (await NotificationModel.create(input)) as NotificationDocument;
  }

  async find(query: NotificationQuery) {
    return (await NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .exec()) as NotificationDocument[];
  }

  async updateMany(query: NotificationQuery, update: NotificationStatusUpdate) {
    await NotificationModel.updateMany(query, { $set: update }).exec();
  }

  async updateStatus(id: string, update: NotificationStatusUpdate) {
    return (await NotificationModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true },
    ).exec()) as NotificationDocument | null;
  }
}
