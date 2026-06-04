import http from "node:http";
import net from "node:net";

import { getDevStatePaths, isPidRunning, readDevPid } from "../core/dev-state.mjs";
import { captureCommand } from "../core/process-runner.mjs";

export const meta = {
  name: "status",
  aliases: ["health"],
  description: "Show local container, port, and backend health status",
};

function checkHttp(url, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      const statusCode = res.statusCode ?? 0;
      res.resume();
      resolve(statusCode);
    });

    req.on("error", () => resolve(0));
    req.on("timeout", () => {
      req.destroy();
      resolve(0);
    });
  });
}

function checkTcp(host, port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function statusText(ok) {
  return ok ? "UP" : "DOWN";
}

export async function run(ctx) {
  ctx.output.section("Dev Status");

  const backgroundPid = await readDevPid(ctx);
  if (backgroundPid) {
    const { logFile } = getDevStatePaths(ctx);
    ctx.output.info(
      `background pid: ${backgroundPid} (${isPidRunning(backgroundPid) ? "running" : "stale"})`,
    );
    ctx.output.info(`background log: ${logFile}`);
    ctx.output.info("");
  }

  const compose = await captureCommand(
    "docker",
    ["compose", "ps", "--format", "table {{.Name}}\t{{.State}}\t{{.Ports}}"],
    {
      cwd: ctx.rootDir,
      env: ctx.env,
    },
  );

  if (compose.code === 0 && compose.stdout.trim()) {
    ctx.output.info(compose.stdout.trim());
  } else {
    ctx.output.info("Docker compose services are not running.");
  }

  ctx.output.info("");

  const nginxPort = ctx.readPort("NGINX_PORT", 80);
  const backendPort = ctx.readPort("BACKEND_PORT", 5402);
  const storefrontPort = ctx.readPort("STOREFRONT_PORT", 5473);
  const adminPort = ctx.readPort("ADMIN_PORT", 5474);
  const smtpPort = ctx.readPort("SMTP_PORT", 1025);

  const backendHealth = await checkHttp(`http://localhost:${backendPort}/health`);
  const nginxHealth = await checkHttp(`http://localhost:${nginxPort}`);
  const storefrontUp = await checkTcp("localhost", storefrontPort);
  const adminUp = await checkTcp("localhost", adminPort);
  const smtpUp = await checkTcp("localhost", smtpPort);

  ctx.output.info(`backend /health: ${backendHealth || "000"}`);
  ctx.output.info(`nginx: ${nginxHealth || "000"}`);
  ctx.output.info(`storefront port: ${statusText(storefrontUp)}`);
  ctx.output.info(`admin port: ${statusText(adminUp)}`);
  ctx.output.info(`smtp port: ${statusText(smtpUp)}`);

  return 0;
}
