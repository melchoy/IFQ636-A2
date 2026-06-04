import fs from "node:fs/promises";
import path from "node:path";

export function getDevStatePaths(ctx) {
  const stateDir = path.join(ctx.rootDir, "local/dev-cli");

  return {
    logFile: path.join(stateDir, "dev.log"),
    pidFile: path.join(stateDir, "dev.pid"),
    stateDir,
  };
}

export async function ensureDevStateDir(ctx) {
  const { stateDir } = getDevStatePaths(ctx);
  await fs.mkdir(stateDir, { recursive: true });
}

export async function writeDevPid(ctx, pid) {
  await ensureDevStateDir(ctx);
  const { pidFile } = getDevStatePaths(ctx);
  await fs.writeFile(pidFile, `${pid}\n`, "utf8");
}

export async function readDevPid(ctx) {
  const { pidFile } = getDevStatePaths(ctx);

  try {
    const raw = await fs.readFile(pidFile, "utf8");
    const pid = Number(raw.trim());
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function clearDevPid(ctx) {
  const { pidFile } = getDevStatePaths(ctx);
  await fs.rm(pidFile, { force: true });
}

export function isPidRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return Boolean(error && error.code === "EPERM");
  }
}
