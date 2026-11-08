import { z } from "zod";

const portSchema = z.coerce.number().int().min(1).max(65535).default(8080);

const apiConfigSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_ADMIN_KEY: z.string().min(32),
  PORT: portSchema,
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

const botConfigSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().regex(/^\d{16,22}$/, "must be a Discord application ID"),
  DISCORD_GUILD_ID: z.string().regex(/^\d{16,22}$/, "must be a Discord server ID"),
});

export type ApiConfig = z.infer<typeof apiConfigSchema>;
export type AppConfig = ApiConfig & z.infer<typeof botConfigSchema>;

export function loadApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const parsed = apiConfigSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(
      `Invalid API configuration: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const api = loadApiConfig(env);
  const bot = botConfigSchema.safeParse(env);
  if (!bot.success) {
    throw new Error(
      `Invalid Discord configuration: ${bot.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }
  return { ...api, ...bot.data };
}
