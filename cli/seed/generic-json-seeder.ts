import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { applyFieldTransform } from "./transforms.js";
import type {
  SeedContext,
  SeedDefinition,
  SeedRecord,
  SeedResult,
} from "./seed-types.js";

export class GenericJsonSeeder {
  constructor(private readonly definition: SeedDefinition) {}

  async run(context: SeedContext): Promise<SeedResult> {
    const raw = await this.load(context);
    const parsed = this.parse(raw);
    const records = await Promise.all(
      parsed.map(async (input) => {
        const prepared = await this.prepareRecord(input);
        return {
          input: prepared,
          document: await this.mapToDocument(prepared),
        };
      }),
    );

    for (const record of records) {
      const persisted = await this.upsert(record.document);
      await this.definition.afterUpsert?.(
        record.input,
        record.document,
        persisted,
        context,
      );
    }

    return {
      target: this.definition.target,
      count: records.length,
    };
  }

  private async load(context: SeedContext) {
    const seedPath = resolve(context.dataDir, this.definition.file);
    return readFile(seedPath, "utf8");
  }

  private parse(raw: string): SeedRecord[] {
    const parsed = JSON.parse(raw);
    const records = Array.isArray(parsed) ? parsed : [parsed];

    return records.map((record) => {
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        throw new Error(`${this.definition.target} seed data must contain objects`);
      }
      return record as SeedRecord;
    });
  }

  private async prepareRecord(input: SeedRecord): Promise<SeedRecord> {
    const output: SeedRecord = {};

    for (const [field, config] of Object.entries(this.definition.fields)) {
      let value = input[field] ?? config.default;

      if (config.required && value === undefined) {
        throw new Error(`Invalid ${this.definition.target} seed field "${field}"`);
      }

      if (value === undefined) {
        continue;
      }

      if (config.type === "string") {
        if (typeof value !== "string" || value.trim().length === 0) {
          throw new Error(`Invalid ${this.definition.target} seed field "${field}"`);
        }
        value = value.trim();
      }

      if (config.type === "number") {
        if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
          throw new Error(`Invalid ${this.definition.target} seed field "${field}"`);
        }
      }

      const transforms = Array.isArray(config.transform)
        ? config.transform
        : config.transform
          ? [config.transform]
          : [];

      for (const transform of transforms) {
        value = await applyFieldTransform(transform, value);
      }

      output[field] = value;
    }

    return output;
  }

  private async mapToDocument(record: SeedRecord): Promise<SeedRecord> {
    return this.definition.mapToDocument
      ? await this.definition.mapToDocument(record)
      : record;
  }

  private async upsert(record: SeedRecord): Promise<SeedRecord> {
    const uniqueValue = record[this.definition.uniqueBy];

    if (uniqueValue === undefined) {
      throw new Error(
        `${this.definition.target} seed record is missing unique field "${this.definition.uniqueBy}"`,
      );
    }

    const persisted = await this.definition.model.findOneAndUpdate(
      { [this.definition.uniqueBy]: uniqueValue },
      record,
      { lean: true, new: true, setDefaultsOnInsert: true, upsert: true },
    );

    return persisted as SeedRecord;
  }
}
