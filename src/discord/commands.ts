import {
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import {
  GLOBAL_TIERS,
  REGIONS,
  TIER_ORDER_BEST_TO_WORST,
} from "../domain/tiers.js";

const tierChoices = TIER_ORDER_BEST_TO_WORST.map((tier) => ({
  name: tier,
  value: tier,
}));

export const discordCommands = [
  new SlashCommandBuilder()
    .setName("tiers")
    .setDescription("Show the global McTiers ranking order."),
  new SlashCommandBuilder()
    .setName("rankings")
    .setDescription("Show the ranked community list, optionally by region.")
    .addStringOption((option) =>
      option
        .setName("region")
        .setDescription("Limit the list to one supported region.")
        .setRequired(false)
        .addChoices(...REGIONS.map((region) => ({ name: region, value: region }))),
    ),
  new SlashCommandBuilder()
    .setName("test-start")
    .setDescription("Open a PvP tier test for a Discord member.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option
        .setName("candidate")
        .setDescription("The player being tested.")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("region")
        .setDescription("The candidate's region.")
        .setRequired(true)
        .addChoices(...REGIONS.map((region) => ({ name: region, value: region }))),
    )
    .addStringOption((option) =>
      option
        .setName("previous-tier")
        .setDescription("Their previous global tier, or N/A.")
        .setRequired(true)
        .addChoices(...tierChoices),
    ),
  new SlashCommandBuilder()
    .setName("test-finish")
    .setDescription("Save a test result and update the candidate's global tier.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option
        .setName("session-id")
        .setDescription("The ID returned by /test-start.")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("tier")
        .setDescription("The global tier awarded by the test.")
        .setRequired(true)
        .addChoices(...tierChoices),
    )
    .addStringOption((option) =>
      option
        .setName("note")
        .setDescription("Optional result note, up to 1000 characters.")
        .setMaxLength(1000)
        .setRequired(false),
    ),
].map((command) => command.toJSON());

export const tierHelpText =
  `Global tiers (best to worst): ${TIER_ORDER_BEST_TO_WORST.slice(0, GLOBAL_TIERS.length).join(" → ")}\n` +
  "N/A means no previous tier; tiers are global and not kit-specific.";
