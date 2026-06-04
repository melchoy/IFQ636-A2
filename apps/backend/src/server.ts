import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./db/connect.js";

await connectDatabase(env.mongodbUri);

const app = await buildApp();

await app.listen({ host: env.host, port: env.port });
console.log(`Backend listening on port ${env.port}`);
