import type { StoreSettingsSnapshot } from "./settings.entity.js";

export type StoreSettingsUpdate = Partial<
  Pick<
    StoreSettingsSnapshot,
    "defaultPageSize" | "orderNumberFormat" | "paginationMode"
  >
>;

export interface StoreSettingsResponse {
  settings: StoreSettingsSnapshot;
}
