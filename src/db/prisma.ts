import { PrismaClient } from "@prisma/client";
import pino from "pino";

const log = pino({ name: "mctiers-database" });

export const prisma = new PrismaClient({
  log:
    process.env.LOG_LEVEL === "debug"
      ? ["warn", "error"]
      : ["error"],
  errorFormat: "minimal",
});

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  log.info("Database connection closed");
}
