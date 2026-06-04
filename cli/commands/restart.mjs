import * as startCommand from "./start.mjs";
import * as stopCommand from "./stop.mjs";

export const meta = {
  name: "restart",
  aliases: ["reboot"],
  description: "Restart the dev stack using the selected start mode",
};

export async function run(ctx) {
  await stopCommand.run(ctx);
  return startCommand.run(ctx);
}
