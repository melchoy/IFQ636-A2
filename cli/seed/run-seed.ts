import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { SeedRunner } from "./seed-runner.js";

const target = process.argv[2] ?? "all";
const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, "../..");

await new SeedRunner().run({
  rootDir,
  target: target as never,
});
