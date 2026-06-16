import http from "node:http";

export const meta = {
  name: "notify",
  description: "Publish a local server-event notification for manual SSE testing",
};

function parseArgs(args) {
  const options = {
    channel: "storefront",
    messageParts: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--channel") {
      const channel = args[index + 1];
      if (!channel) {
        throw new Error("--channel requires a value");
      }
      options.channel = channel;
      index += 1;
      continue;
    }

    options.messageParts.push(arg);
  }

  return {
    channel: options.channel,
    message: options.messageParts.join(" ").trim() || "Server event notification",
  };
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Length": Buffer.byteLength(payload),
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let responseBody = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          resolve({
            body: responseBody,
            statusCode: res.statusCode ?? 0,
          });
        });
      },
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

export async function run(ctx) {
  const backendPort = ctx.readPort("BACKEND_PORT", 5402);
  const { channel, message } = parseArgs(ctx.rest);
  const url = `http://localhost:${backendPort}/api/server-events`;

  const response = await postJson(url, {
    action: "created",
    channel,
    level: "info",
    message,
    payload: { message },
    resource: "notification",
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    ctx.output.error(`Notification failed: HTTP ${response.statusCode}`);
    if (response.body) {
      ctx.output.error(response.body);
    }
    return 1;
  }

  ctx.output.info(`Published notification to ${channel}: ${message}`);
  return 0;
}
