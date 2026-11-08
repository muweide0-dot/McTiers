import "dotenv/config";
import pino from "pino";
import { loadApiConfig } from "./config.js";
import { prisma } from "./db/prisma.js";
import { createApiApp } from "./api/app.js";

const config = loadApiConfig();
const logger = pino({ name: "mctiers-api", level: config.LOG_LEVEL });
const server = createApiApp(config.API_ADMIN_KEY).listen(config.PORT, "0.0.0.0", () => {
  logger.info({ port: config.PORT }, "McTiers REST API is listening");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Stopping REST API");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
