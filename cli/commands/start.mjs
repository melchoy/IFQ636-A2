import { openSync } from "node:fs";

import {
  clearDevPid,
  ensureDevStateDir,
  getDevStatePaths,
  isPidRunning,
  readDevPid,
  writeDevPid,
} from "../core/dev-state.mjs";
import { spawnCommand, runCommand } from "../core/process-runner.mjs";

export const meta = {
  name: "start",
  aliases: ["up"],
  description: "Start docker compose services and app dev servers",
};

let devProcess;
let cleaningUp = false;
let shuttingDown = false;

function startMode(ctx) {
  if (ctx.rest.includes("--foreground") || ctx.rest.includes("-f")) {
    return "foreground";
  }

  if (ctx.rest.includes("--background") || ctx.rest.includes("-b")) {
    return "background";
  }

  if (ctx.env.DEV_START_MODE === "foreground") {
    return "foreground";
  }

  return "background";
}

function logPorts(ctx) {
  if (ctx.env.COMPOSE_PROJECT_NAME) {
    ctx.output.info(`Compose project: ${ctx.env.COMPOSE_PROJECT_NAME}`);
  }
  ctx.output.info(`nginx: http://localhost:${ctx.readPort("NGINX_PORT", 80)}`);
  ctx.output.info(`storefront: http://localhost:${ctx.readPort("STOREFRONT_PORT", 5473)}`);
  ctx.output.info(`admin: http://localhost:${ctx.readPort("ADMIN_PORT", 5474)}/admin/`);
  ctx.output.info(`backend: http://localhost:${ctx.readPort("BACKEND_PORT", 5402)}`);
  ctx.output.info(`mailpit: http://mailpit.localhost:${ctx.readPort("NGINX_PORT", 80)}`);
  ctx.output.info(`smtp: localhost:${ctx.readPort("SMTP_PORT", 1025)}`);
  ctx.output.info("");
}

function devArgs() {
  return [
    "--parallel",
    "--filter",
    "@otbt/storefront",
    "--filter",
    "@otbt/admin",
    "--filter",
    "@otbt/backend",
    "dev",
  ];
}

async function cleanup(ctx) {
  if (cleaningUp) {
    return;
  }

  cleaningUp = true;

  if (devProcess && !devProcess.killed) {
    devProcess.kill("SIGTERM");
  }

  await runCommand("docker", ["compose", "down"], {
    cwd: ctx.rootDir,
    env: ctx.env,
  });
  ctx.output.info("");
}

async function shutdown(ctx, exitCode) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  try {
    await cleanup(ctx);
  } catch (error) {
    ctx.output.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  process.stdin.pause();
  ctx.output.info("Dev stack stopped.");
  process.exitCode = exitCode;
}

async function startBackground(ctx) {
  const existingPid = await readDevPid(ctx);
  if (existingPid && isPidRunning(existingPid)) {
    throw new Error(`Dev stack already has a background pid: ${existingPid}`);
  }
  if (existingPid) {
    await clearDevPid(ctx);
  }

  await ensureDevStateDir(ctx);
  const { logFile } = getDevStatePaths(ctx);
  const logStream = openSync(logFile, "a");

  logPorts(ctx);
  await runCommand("docker", ["compose", "up", "-d"], {
    cwd: ctx.rootDir,
    env: ctx.env,
  });

  const child = spawnCommand("pnpm", devArgs(), {
    cwd: ctx.rootDir,
    detached: true,
    env: ctx.env,
    stdio: ["ignore", logStream, logStream],
  });

  child.unref();
  await writeDevPid(ctx, child.pid);
  ctx.output.info(`Dev stack started in background. Logs: ${logFile}`);
}

async function startForeground(ctx) {
  logPorts(ctx);
  await runCommand("docker", ["compose", "up", "-d"], {
    cwd: ctx.rootDir,
    env: ctx.env,
  });

  devProcess = spawnCommand("pnpm", devArgs(), {
    cwd: ctx.rootDir,
    env: ctx.env,
  });

  process.on("SIGINT", () => {
    void shutdown(ctx, 130);
  });

  process.on("SIGTERM", () => {
    void shutdown(ctx, 143);
  });

  return await new Promise((resolve) => {
    devProcess.on("error", async (error) => {
      ctx.output.error(error instanceof Error ? error.message : String(error));
      await shutdown(ctx, 1);
      resolve(1);
    });

    devProcess.on("exit", async (code, signal) => {
      if (cleaningUp) {
        resolve(code ?? 0);
        return;
      }

      if (signal === "SIGINT") {
        await shutdown(ctx, 130);
        resolve(130);
        return;
      }

      if (signal === "SIGTERM") {
        await shutdown(ctx, 143);
        resolve(143);
        return;
      }

      await shutdown(ctx, code ?? 0);
      resolve(code ?? 0);
    });
  });
}

export async function run(ctx) {
  if (startMode(ctx) === "background") {
    await startBackground(ctx);
    return 0;
  }

  return startForeground(ctx);
}
