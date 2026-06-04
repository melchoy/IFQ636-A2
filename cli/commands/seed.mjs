import { runCommand } from "../core/process-runner.mjs";

export const meta = {
  name: "seed",
  aliases: [],
  description: "Seed local dev data or a specific seed target",
};

const seedTargets = new Set(["all", "admin", "customers", "products"]);

function resolveSeedTarget(ctx) {
  const target = ctx.rest[0] ?? "all";

  if (!seedTargets.has(target)) {
    throw new Error(`Unknown seed target: ${target}`);
  }

  return target;
}

export async function run(ctx) {
  const target = resolveSeedTarget(ctx);

  await runCommand(
    "pnpm",
    [
      "--filter",
      "@otbt/backend",
      "exec",
      "tsx",
      "../../cli/seed/run-seed.ts",
      target,
    ],
    {
      cwd: ctx.rootDir,
      env: ctx.env,
    },
  );

  return 0;
}
