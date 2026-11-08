import "dotenv/config";
import type { Client } from "discord.js";
import pino from "pino";
import { createApiApp } from "./api/app.js";
import { loadAppConfig } from "./config.js";
import { startDiscordBot } from "./discord/client.js";
import { prisma } from "./db/prisma.js";

const config = loadAppConfig();
const logger = pino({ name: "mctiers", level: config.LOG_LEVEL });
const server = createApiApp(config.API_ADMIN_KEY).listen(
  config.PORT,
  "0.0.0.0",
  () => logger.info({ port: config.PORT }, "McTiers REST API is listening"),
);

let bot: Client | undefined;
let shuttingDown = false;

try {
  bot = await startDiscordBot(config);
} catch (error) {
  logger.fatal({ err: error }, "Discord bot could not start");
  server.close(async () => {
    await prisma.$disconnect();
    process.exitCode = 1;
  });
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Stopping McTiers");
  bot?.destroy();
  server.close(async (error) => {
    if (error) logger.error({ err: error }, "REST API shutdown failed");
    await prisma.$disconnect();
    process.exitCode = error ? 1 : 0;
  });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
