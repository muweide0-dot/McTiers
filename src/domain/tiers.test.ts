import assert from "node:assert/strict";
import test from "node:test";
import {
  GLOBAL_TIERS,
  REGIONS,
  TIER_ORDER_BEST_TO_WORST,
  compareTiers,
  fromDatabaseTier,
  toDatabaseTier,
} from "./tiers.js";

test("the supported regions are exactly EU, NA, AS, AU, and ME", () => {
  assert.deepEqual(REGIONS, ["EU", "NA", "AS", "AU", "ME"]);
});

test("there are exactly ten global tiers, with N/A kept separate", () => {
  assert.deepEqual(GLOBAL_TIERS, [
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
  ]);
  assert.equal(TIER_ORDER_BEST_TO_WORST.length, 11);
  assert.equal(TIER_ORDER_BEST_TO_WORST.at(-1), "N/A");
});

test("ranking sorts from HT1 down to LT5, with N/A last", () => {
  assert.ok(compareTiers("HT1", "LT1") < 0);
  assert.ok(compareTiers("LT1", "HT2") < 0);
  assert.ok(compareTiers("HT5", "LT5") < 0);
  assert.ok(compareTiers("LT5", "N/A") < 0);
});

test("N/A maps to the database enum without changing the public label", () => {
  assert.equal(toDatabaseTier("N/A"), "N_A");
  assert.equal(fromDatabaseTier(toDatabaseTier("N/A")), "N/A");
});
