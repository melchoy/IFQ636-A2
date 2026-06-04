import fs from "node:fs/promises";
import net from "node:net";

import { captureCommand } from "../core/process-runner.mjs";

export const meta = {
  name: "doctor",
  aliases: ["check"],
  description: "Check local prerequisites and dev environment configuration",
};

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function checkTcpFree(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(true);
    });
    socket.connect(port, "localhost");
  });
}

async function commandAvailable(command, args, ctx) {
  const result = await captureCommand(command, args, {
    cwd: ctx.rootDir,
    env: ctx.env,
  });
  return result.code === 0;
}

export async function run(ctx) {
  ctx.output.section("Dev Doctor");

  const checks = [];

  checks.push([".env exists", await fileExists(ctx.envPath)]);
  checks.push(["pnpm available", await commandAvailable("pnpm", ["--version"], ctx)]);
  checks.push(["docker available", await commandAvailable("docker", ["--version"], ctx)]);

  for (const [name, ok] of checks) {
    ctx.output.info(`${ok ? "OK" : "FAIL"} ${name}`);
  }

  ctx.output.info("");
  ctx.output.info("Configured ports:");

  const ports = [
    ["NGINX_PORT", ctx.readPort("NGINX_PORT", 80)],
    ["BACKEND_PORT", ctx.readPort("BACKEND_PORT", 5402)],
    ["STOREFRONT_PORT", ctx.readPort("STOREFRONT_PORT", 5473)],
    ["ADMIN_PORT", ctx.readPort("ADMIN_PORT", 5474)],
    ["SMTP_PORT", ctx.readPort("SMTP_PORT", 1025)],
  ];

  for (const [key, port] of ports) {
    const free = await checkTcpFree(port);
    ctx.output.info(`${key}=${port} ${free ? "free" : "in use"}`);
  }

  return checks.every(([, ok]) => ok) ? 0 : 1;
}
