import { getDevStatePaths, isPidRunning, readDevPid } from "../core/dev-state.mjs";
import { captureCommand } from "../core/process-runner.mjs";

export const meta = {
  name: "ps",
  aliases: ["processes"],
  description: "Show dev process and docker compose container state",
};

export async function run(ctx) {
  const pid = await readDevPid(ctx);

  if (pid) {
    const { logFile } = getDevStatePaths(ctx);
    ctx.output.info(`background pid: ${pid} (${isPidRunning(pid) ? "running" : "stale"})`);
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

  if (compose.code !== 0) {
    ctx.output.error(compose.stderr.trim());
    return compose.code;
  }

  ctx.output.info(compose.stdout.trim());
  return 0;
}
