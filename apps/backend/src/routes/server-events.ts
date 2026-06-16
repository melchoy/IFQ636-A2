import type { FastifyInstance } from "fastify";

import {
  serverEventHub,
  type ServerEventLevel,
} from "../server-events/index.js";

type StreamQuery = {
  channel?: string;
};

type PublishBody = {
  channel?: string;
  resource?: string;
  action?: string;
  message?: string;
  level?: ServerEventLevel;
  payload?: unknown;
};

const DEFAULT_CHANNEL = "storefront";
const DEFAULT_RESOURCE = "notification";
const DEFAULT_ACTION = "created";

export async function serverEventRoutes(app: FastifyInstance) {
  app.get<{ Querystring: StreamQuery }>("/", async (request, reply) => {
    const channel = request.query.channel?.trim() || DEFAULT_CHANNEL;
    serverEventHub.connect(channel, reply);
  });

  app.post<{ Body: PublishBody }>("/", async (request, reply) => {
    if (process.env.NODE_ENV === "production") {
      return reply.code(404).send({ error: "Not found" });
    }

    const body = request.body ?? {};
    const message = body.message?.trim() || "Server event notification";

    const event = serverEventHub.create({
      action: body.action?.trim() || DEFAULT_ACTION,
      channel: body.channel?.trim() || DEFAULT_CHANNEL,
      level: body.level ?? "info",
      message,
      payload: body.payload ?? { message },
      resource: body.resource?.trim() || DEFAULT_RESOURCE,
    });

    serverEventHub.publish(event);

    return reply.code(202).send({ event });
  });
}
