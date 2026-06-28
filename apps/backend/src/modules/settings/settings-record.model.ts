import { model, Schema } from "mongoose";

import {
  ORDER_NUMBER_FORMATS,
  PAGINATION_MODES,
  type OrderNumberFormat,
  type PaginationMode,
} from "@otbt/types";

export const STORE_SETTINGS_KEY = "store";

export interface SettingsRecordDocument {
  key: typeof STORE_SETTINGS_KEY;
  orderNumberFormat: OrderNumberFormat;
  paginationMode: PaginationMode;
  defaultPageSize: number;
  createdAt: Date;
  updatedAt: Date;
}

const settingsRecordSchema = new Schema<SettingsRecordDocument>(
  {
    key: {
      default: STORE_SETTINGS_KEY,
      enum: [STORE_SETTINGS_KEY],
      required: true,
      type: String,
      unique: true,
    },
    orderNumberFormat: {
      default: "sequential",
      enum: [...ORDER_NUMBER_FORMATS],
      required: true,
      type: String,
    },
    paginationMode: {
      default: "infinite",
      enum: [...PAGINATION_MODES],
      required: true,
      type: String,
    },
    defaultPageSize: {
      default: 24,
      max: 100,
      min: 1,
      required: true,
      type: Number,
    },
  },
  { timestamps: true },
);

export const SettingsRecordModel = model<SettingsRecordDocument>(
  "SettingsRecord",
  settingsRecordSchema,
);
