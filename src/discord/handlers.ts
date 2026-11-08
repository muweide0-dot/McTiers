import {
  MessageFlags,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { z } from "zod";
import type { RegionCode, TierLabel } from "../domain/tiers.js";
import {
  isRegionCode,
  isTierLabel,
} from "../domain/tiers.js";
import { getRankings } from "../services/rankings.js";
import { completeTestSession, openTestSession } from "../services/test-sessions.js";
import { ServiceError } from "../services/errors.js";
import { tierHelpText } from "./commands.js";

type CommandContext = {
  guildId: string;
};

function hasGuildManagement(interaction: ChatInputCommandInteraction): boolean {
  return Boolean(
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild),
  );
}

export async function handleInteraction(
  interaction: ChatInputCommandInteraction,
  context: CommandContext,
): Promise<void> {
  if (!interaction.inGuild() || interaction.guildId !== context.guildId) {
    await interaction.reply({
      content: "McTiers is configured for one server and cannot be used here.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (interaction.commandName === "tiers") {
    await interaction.reply({
      content: tierHelpText,
      allowedMentions: { parse: [] },
    });
    return;
  }

  if (interaction.commandName === "rankings") {
    const requestedRegion = interaction.options.getString("region");
    const region: RegionCode | undefined =
      requestedRegion && isRegionCode(requestedRegion)
        ? requestedRegion
        : undefined;
    const result = await getRankings(region, 20);
    const header = region ? `Rankings · ${region}` : "Global rankings";
    const rows = result.entries.map(
      (entry) =>
        `${entry.rank}. **${entry.tier}** — <@${entry.discordUserId}> (${entry.region})`,
    );
    await interaction.reply({
      content: rows.length
        ? `**${header}**\n${rows.join("\n")}`
        : `**${header}**\nNo test results have been recorded yet.`,
      allowedMentions: { parse: [] },
    });
    return;
  }

  if (interaction.commandName === "test-start") {
    if (!hasGuildManagement(interaction)) {
      await interaction.reply({
        content: "You need the Manage Server permission to open a tier test.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const candidate = interaction.options.getUser("candidate", true);
    const regionValue = interaction.options.getString("region", true);
    const previousTierValue = interaction.options.getString("previous-tier", true);
    if (candidate.bot || !isRegionCode(regionValue) || !isTierLabel(previousTierValue)) {
      await interaction.reply({
        content: "Choose a human member and one of the supported region and tier values.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const session = await openTestSession({
      candidateDiscordId: candidate.id,
      candidateUsername: candidate.username,
      region: regionValue,
      previousTier: previousTierValue,
      openedByDiscordId: interaction.user.id,
    });
    await interaction.editReply(
      `Test opened for <@${candidate.id}> in **${session.region}**. ` +
        `Previous tier: **${session.previousTier}**. Session ID: \`${session.id}\``,
    );
    return;
  }

  if (interaction.commandName === "test-finish") {
    if (!hasGuildManagement(interaction)) {
      await interaction.reply({
        content: "You need the Manage Server permission to save a tier test.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const sessionId = interaction.options.getString("session-id", true).trim();
    const tierValue = interaction.options.getString("tier", true);
    const note = interaction.options.getString("note")?.trim();
    if (!isTierLabel(tierValue)) {
      await interaction.reply({
        content: "Choose one of the supported global tiers.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const result = await completeTestSession({
      sessionId,
      assignedTier: tierValue,
      completedByDiscordId: interaction.user.id,
      note,
    });
    await interaction.editReply(
      `Test saved for <@${result.candidateDiscordId}>: **${result.assignedTier}** ` +
        `(${result.region}). The global tier history has been updated.`,
    );
    return;
  }

  await interaction.reply({
    content: "Unknown McTiers command.",
    flags: MessageFlags.Ephemeral,
  });
}

export function getSafeInteractionError(error: unknown): string {
  if (error instanceof ServiceError) return error.message;
  const parsed = z
    .object({ code: z.string().optional() })
    .safeParse(error);
  if (parsed.success && parsed.data.code === "P2002") {
    return "This test result was already recorded.";
  }
  return "The request could not be completed. Check the bot logs for details.";
}
