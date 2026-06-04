import * as doctorCommand from "../commands/doctor.mjs";
import * as logsCommand from "../commands/logs.mjs";
import * as psCommand from "../commands/ps.mjs";
import * as restartCommand from "../commands/restart.mjs";
import * as seedCommand from "../commands/seed.mjs";
import * as startCommand from "../commands/start.mjs";
import * as statusCommand from "../commands/status.mjs";
import * as stopCommand from "../commands/stop.mjs";

const commandModules = [
  startCommand,
  stopCommand,
  restartCommand,
  logsCommand,
  psCommand,
  seedCommand,
  statusCommand,
  doctorCommand,
];

function validateCommandModule(mod) {
  if (!mod || typeof mod.run !== "function") {
    throw new Error("Invalid dev command: missing run(ctx)");
  }

  if (!mod.meta || typeof mod.meta.name !== "string" || mod.meta.name.length === 0) {
    throw new Error("Invalid dev command: missing meta.name");
  }
}

function registerCommand(registry, mod) {
  validateCommandModule(mod);

  for (const name of [mod.meta.name, ...(mod.meta.aliases ?? [])]) {
    if (registry.has(name)) {
      throw new Error(`Duplicate dev command registration: ${name}`);
    }
    registry.set(name, mod);
  }
}

export function buildCommandRegistry() {
  const registry = new Map();

  for (const mod of commandModules) {
    registerCommand(registry, mod);
  }

  return registry;
}

export function listCommands() {
  return commandModules;
}
