import { clearDevPid, readDevPid } from "../core/dev-state.mjs";
import { runCommand } from "../core/process-runner.mjs";

export const meta = {
  name: "stop",
  aliases: ["down"],
  description: "Stop background dev servers and docker compose services",
};

export async function run(ctx) {
  const pid = await readDevPid(ctx);

  if (pid) {
    try {
      process.kill(-pid, "SIGTERM");
      ctx.output.info(`Stopped background dev process group: ${pid}`);
    } catch (error) {
      if (!error || error.code !== "ESRCH") {
        throw error;
      }
    }
    await clearDevPid(ctx);
  }

  await runCommand("docker", ["compose", "down"], {
    cwd: ctx.rootDir,
    env: ctx.env,
  });

  ctx.output.info("Dev stack stopped.");
  return 0;
}
