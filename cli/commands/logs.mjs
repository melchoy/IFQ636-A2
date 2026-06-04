import { getDevStatePaths } from "../core/dev-state.mjs";
import { spawnCommand } from "../core/process-runner.mjs";

export const meta = {
  name: "logs",
  aliases: ["log"],
  description: "Follow background dev logs",
};

export async function run(ctx) {
  const { logFile } = getDevStatePaths(ctx);
  const follow = !ctx.rest.includes("--no-follow");
  const args = follow ? ["-f", logFile] : [logFile];

  const child = spawnCommand("tail", args, {
    cwd: ctx.rootDir,
    env: ctx.env,
  });

  return await new Promise((resolve) => {
    child.on("exit", (code) => {
      resolve(code ?? 0);
    });
  });
}
