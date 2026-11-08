import { Region as DatabaseRegion } from "@prisma/client";
import type { RegionCode, TierLabel } from "../domain/tiers.js";
import {
  compareTiers,
  fromDatabaseTier,
  TIER_ORDER_BEST_TO_WORST,
} from "../domain/tiers.js";
import { prisma } from "../db/prisma.js";

export async function getRankings(region?: RegionCode, limit = 100) {
  const records = await prisma.player.findMany({
    where: region ? { region: region as DatabaseRegion } : undefined,
    select: {
      discordUserId: true,
      username: true,
      region: true,
      currentTier: true,
    },
  });

  const entries = records
    .map((record) => ({
      discordUserId: record.discordUserId,
      username: record.username,
      region: record.region,
      tier: fromDatabaseTier(record.currentTier),
    }))
    .sort((left, right) => {
      const tierComparison = compareTiers(left.tier, right.tier);
      if (tierComparison !== 0) return tierComparison;
      const usernameComparison = left.username.localeCompare(right.username);
      return usernameComparison || left.discordUserId.localeCompare(right.discordUserId);
    })
    .slice(0, limit)
    .map((entry, index) => ({ rank: index + 1, ...entry }));

  return {
    region: region ?? null,
    tierOrder: TIER_ORDER_BEST_TO_WORST satisfies readonly TierLabel[],
    total: records.length,
    entries,
  };
}
