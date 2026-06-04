import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv } from "./dotenv.mjs";
import { createOutput } from "./output.mjs";

const cliDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const rootDir = path.resolve(cliDir, "..");

function normalizeCommand(argv) {
  const [rawCommand = "start", ...rest] = argv;
  return {
    command: rawCommand,
    rest,
  };
}

export function readPort(env, key, fallback) {
  const value = Number(env[key] ?? fallback);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }
  return value;
}

export async function createContext(argv) {
  const env = { ...process.env };
  const envPath = path.join(rootDir, ".env");
  await loadDotEnv(envPath, env);

  return {
    ...normalizeCommand(argv),
    env,
    envPath,
    output: createOutput(),
    rootDir,
    readPort(key, fallback) {
      return readPort(env, key, fallback);
    },
  };
}
