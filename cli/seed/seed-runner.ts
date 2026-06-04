import { resolve } from "node:path";

import { env } from "../../apps/backend/src/config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "../../apps/backend/src/db/connect.js";

import { GenericJsonSeeder } from "./generic-json-seeder.js";
import { seedDefinitions, seedTargets } from "./seed-definitions.js";
import type { SeedTarget } from "./seed-types.js";

type RunSeedOptions = {
  rootDir: string;
  target: "all" | SeedTarget;
};

function isSeedTarget(target: string): target is SeedTarget {
  return target === "admin" || target === "customers" || target === "products";
}

export class SeedRunner {
  async run(options: RunSeedOptions) {
    const targets = this.resolveTargets(options.target);
    const context = {
      rootDir: options.rootDir,
      dataDir: resolve(options.rootDir, "seeds/data"),
      assetsDir: resolve(options.rootDir, "seeds/assets"),
    };

    await connectDatabase(env.mongodbUri);

    try {
      for (const target of targets) {
        const seeder = new GenericJsonSeeder(seedDefinitions[target]);
        const result = await seeder.run(context);
        console.log(`Seeded ${result.count} ${result.target}`);
      }
    } finally {
      await disconnectDatabase();
    }
  }

  private resolveTargets(target: "all" | SeedTarget): SeedTarget[] {
    if (target === "all") {
      return seedTargets;
    }

    if (isSeedTarget(target)) {
      return [target];
    }

    throw new Error(`Unknown seed target: ${target}`);
  }
}
