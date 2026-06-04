import { buildCommandRegistry, listCommands } from "./command-registry.mjs";
import { createContext } from "./context.mjs";

function printHelp(ctx) {
  ctx.output.info("Usage: pnpm dev [command]");
  ctx.output.info("");
  ctx.output.info("Commands:");

  for (const command of listCommands()) {
    const aliases = command.meta.aliases?.length
      ? ` (${command.meta.aliases.join(", ")})`
      : "";
    ctx.output.info(
      `  ${command.meta.name.padEnd(14)} ${command.meta.description}${aliases}`,
    );
  }
}

export async function route(argv) {
  const ctx = await createContext(argv);
  const registry = buildCommandRegistry();

  if (ctx.command === "help" || ctx.command === "--help" || ctx.command === "-h") {
    printHelp(ctx);
    return 0;
  }

  const command = registry.get(ctx.command);
  if (!command) {
    ctx.output.error(`Unknown dev command: ${ctx.command}`);
    ctx.output.error("");
    printHelp(ctx);
    return 1;
  }

  try {
    return await command.run(ctx);
  } catch (error) {
    ctx.output.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
