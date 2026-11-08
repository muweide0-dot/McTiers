import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
} from "discord.js";
import pino from "pino";
import type { AppConfig } from "../config.js";
import { prisma } from "../db/prisma.js";
import { getSafeInteractionError, handleInteraction } from "./handlers.js";

const logger = pino({ name: "mctiers-discord" });

export async function startDiscordBot(config: AppConfig): Promise<Client> {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once(Events.ClientReady, (readyClient) => {
    logger.info(
      { botUser: readyClient.user.tag, guildId: config.DISCORD_GUILD_ID },
      "McTiers Discord bot is online",
    );
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    try {
      await handleInteraction(interaction, { guildId: config.DISCORD_GUILD_ID });
    } catch (error) {
      logger.error(
        { err: error, commandName: interaction.commandName },
        "Discord command failed",
      );
      const content = getSafeInteractionError(error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content }).catch((replyError: unknown) => {
          logger.warn({ err: replyError }, "Could not send command error response");
        });
      } else {
        await interaction
          .reply({ content, flags: MessageFlags.Ephemeral })
          .catch((replyError: unknown) => {
            logger.warn({ err: replyError }, "Could not send command error response");
          });
      }
    }
  });

  await client.login(config.DISCORD_TOKEN);
  return client;
}

export async function stopDiscordBot(client: Client): Promise<void> {
  client.destroy();
  await prisma.$disconnect();
  logger.info("Discord client stopped");
}
