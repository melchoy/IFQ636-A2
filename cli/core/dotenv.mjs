import fs from "node:fs/promises";

export function parseDotEnv(raw) {
  return Object.fromEntries(
    raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const equalsAt = line.indexOf("=");
        if (equalsAt === -1) {
          return [line, ""];
        }

        const key = line.slice(0, equalsAt).trim();
        const value = line.slice(equalsAt + 1).trim().replace(/^['"]|['"]$/g, "");
        return [key, value];
      }),
  );
}

export async function loadDotEnv(envPath, targetEnv) {
  try {
    const raw = await fs.readFile(envPath, "utf8");
    for (const [key, value] of Object.entries(parseDotEnv(raw))) {
      targetEnv[key] ??= value;
    }
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}
