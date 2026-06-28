import { model, Schema, type InferSchemaType } from "mongoose";

const notificationSchema = new Schema(
  {
    action: { required: true, trim: true, type: String },
    dismissedAt: { default: null, type: Date },
    message: { required: true, trim: true, type: String },
    readAt: { default: null, type: Date },
    resource: { required: true, trim: true, type: String },
    resourceId: { default: null, trim: true, type: String },
    status: {
      default: "unread",
      enum: ["unread", "read", "dismissed"],
      required: true,
      type: String,
    },
    title: { required: true, trim: true, type: String },
    type: {
      enum: ["order", "system"],
      required: true,
      type: String,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & {
  _id: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
};

export const NotificationModel = model("Notification", notificationSchema);
