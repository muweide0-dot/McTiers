import { Tier as DatabaseTier } from "@prisma/client";

export const REGIONS = ["EU", "NA", "AS", "AU", "ME"] as const;
export type RegionCode = (typeof REGIONS)[number];

export const GLOBAL_TIERS = [
  "LT5",
  "HT5",
  "LT4",
  "HT4",
  "LT3",
  "HT3",
  "LT2",
  "HT2",
  "LT1",
  "HT1",
] as const;

export type GlobalTier = (typeof GLOBAL_TIERS)[number];
export type TierLabel = GlobalTier | "N/A";

export const TIER_ORDER_BEST_TO_WORST: readonly TierLabel[] = [
  "HT1",
  "LT1",
  "HT2",
  "LT2",
  "HT3",
  "LT3",
  "HT4",
  "LT4",
  "HT5",
  "LT5",
  "N/A",
];

const tierRank = new Map(
  TIER_ORDER_BEST_TO_WORST.map((tier, index) => [tier, index]),
);

export function isRegionCode(value: string): value is RegionCode {
  return (REGIONS as readonly string[]).includes(value);
}

export function isTierLabel(value: string): value is TierLabel {
  return value === "N/A" || (GLOBAL_TIERS as readonly string[]).includes(value);
}

export function tierRankIndex(tier: TierLabel): number {
  return tierRank.get(tier) ?? TIER_ORDER_BEST_TO_WORST.length;
}

export function toDatabaseTier(tier: TierLabel): DatabaseTier {
  return tier === "N/A" ? DatabaseTier.N_A : tier;
}

export function fromDatabaseTier(tier: DatabaseTier): TierLabel {
  return tier === DatabaseTier.N_A ? "N/A" : tier;
}

export function compareTiers(left: TierLabel, right: TierLabel): number {
  return tierRankIndex(left) - tierRankIndex(right);
}
