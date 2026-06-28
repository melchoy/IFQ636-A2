import {
  ORDER_NUMBER_FORMATS,
  PAGINATION_MODES,
  type OrderNumberFormat,
  type PaginationMode,
  type StoreSettingsSnapshot,
  type StoreSettingsUpdate,
} from "@otbt/types";

import {
  SettingsRecordModel,
  STORE_SETTINGS_KEY,
  type SettingsRecordDocument,
} from "./settings-record.model.js";

const DEFAULT_SETTINGS = {
  defaultPageSize: 24,
  orderNumberFormat: "sequential",
  paginationMode: "infinite",
} as const;

function serializeSettings(record: SettingsRecordDocument): StoreSettingsSnapshot {
  return {
    createdAt: record.createdAt.toISOString(),
    defaultPageSize: record.defaultPageSize,
    orderNumberFormat: record.orderNumberFormat,
    paginationMode: record.paginationMode,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function assertOrderNumberFormat(value: unknown): asserts value is OrderNumberFormat {
  if (!ORDER_NUMBER_FORMATS.includes(value as OrderNumberFormat)) {
    throw new Error("Invalid order number format");
  }
}

function assertPaginationMode(value: unknown): asserts value is PaginationMode {
  if (!PAGINATION_MODES.includes(value as PaginationMode)) {
    throw new Error("Invalid pagination mode");
  }
}

function normalizeSettingsUpdate(input: StoreSettingsUpdate): StoreSettingsUpdate {
  const update: StoreSettingsUpdate = {};

  if (input.orderNumberFormat !== undefined) {
    assertOrderNumberFormat(input.orderNumberFormat);
    update.orderNumberFormat = input.orderNumberFormat;
  }

  if (input.paginationMode !== undefined) {
    assertPaginationMode(input.paginationMode);
    update.paginationMode = input.paginationMode;
  }

  if (input.defaultPageSize !== undefined) {
    if (
      !Number.isInteger(input.defaultPageSize) ||
      input.defaultPageSize < 1 ||
      input.defaultPageSize > 100
    ) {
      throw new Error("Default page size must be between 1 and 100");
    }

    update.defaultPageSize = input.defaultPageSize;
  }

  return update;
}

export class StoreSettings {
  private static instance: StoreSettings | null = null;

  private constructor() {}

  static getInstance() {
    StoreSettings.instance ??= new StoreSettings();
    return StoreSettings.instance;
  }

  static resetForTesting() {
    StoreSettings.instance = null;
  }

  private async getOrCreateRecord() {
    return await SettingsRecordModel.findOneAndUpdate(
      { key: STORE_SETTINGS_KEY },
      { $setOnInsert: { key: STORE_SETTINGS_KEY, ...DEFAULT_SETTINGS } },
      { new: true, runValidators: true, upsert: true },
    ).exec();
  }

  async getSettings() {
    return serializeSettings(await this.getOrCreateRecord());
  }

  async getOrderNumberFormat() {
    const settings = await this.getSettings();
    return settings.orderNumberFormat;
  }

  async updateSettings(input: StoreSettingsUpdate) {
    const update = normalizeSettingsUpdate(input);
    const record = await SettingsRecordModel.findOneAndUpdate(
      { key: STORE_SETTINGS_KEY },
      {
        $set: update,
        $setOnInsert: { key: STORE_SETTINGS_KEY, ...DEFAULT_SETTINGS },
      },
      { new: true, runValidators: true, upsert: true },
    ).exec();

    return serializeSettings(record);
  }
}
