import type { Model } from "mongoose";

export type SeedTarget = "admin" | "customers" | "products";

export type SeedRecord = Record<string, unknown>;

export type SeedContext = {
  rootDir: string;
  dataDir: string;
  assetsDir: string;
};

export type SeedResult = {
  target: SeedTarget;
  count: number;
};

export type FieldType = "string" | "number";

export type FieldTransformName =
  | "lowercase"
  | "uppercase"
  | "productStatus"
  | "productVisibility"
  | "hashAdminPassword"
  | "hashCustomerPassword";

export type SeedFieldDefinition = {
  type: FieldType;
  required?: boolean;
  default?: unknown;
  transform?: FieldTransformName | FieldTransformName[];
};

export type SeedDefinition = {
  target: SeedTarget;
  file: string;
  model: Model<any>;
  uniqueBy: string;
  fields: Record<string, SeedFieldDefinition>;
  mapToDocument?: (record: SeedRecord) => Promise<SeedRecord> | SeedRecord;
  afterUpsert?: (
    input: SeedRecord,
    document: SeedRecord,
    persisted: SeedRecord,
    context: SeedContext,
  ) => Promise<void>;
};
