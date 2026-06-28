export const ORDER_NUMBER_FORMATS = ["sequential", "date_prefixed"] as const;
export const PAGINATION_MODES = ["infinite", "paged"] as const;

export type OrderNumberFormat = (typeof ORDER_NUMBER_FORMATS)[number];
export type PaginationMode = (typeof PAGINATION_MODES)[number];

export interface StoreSettingsSnapshot {
  orderNumberFormat: OrderNumberFormat;
  paginationMode: PaginationMode;
  defaultPageSize: number;
  createdAt: string;
  updatedAt: string;
}
