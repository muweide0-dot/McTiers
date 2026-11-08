import "dotenv/config";
import { REST, Routes } from "discord.js";
import pino from "pino";
import { z } from "zod";
import { discordCommands } from "./discord/commands.js";

const logger = pino({ name: "mctiers-command-deploy" });
const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().regex(/^\d{16,22}$/),
  DISCORD_GUILD_ID: z.string().regex(/^\d{16,22}$/),
});
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid Discord command deployment configuration: ${parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ")}`,
  );
}

const rest = new REST({ version: "10" }).setToken(parsed.data.DISCORD_TOKEN);
await rest.put(
  Routes.applicationGuildCommands(
    parsed.data.DISCORD_CLIENT_ID,
    parsed.data.DISCORD_GUILD_ID,
  ),
  { body: discordCommands },
);
logger.info(
  { guildId: parsed.data.DISCORD_GUILD_ID, commandCount: discordCommands.length },
  "Registered McTiers guild commands",
);
