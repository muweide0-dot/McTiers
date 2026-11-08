CREATE TYPE "Region" AS ENUM ('EU', 'NA', 'AS', 'AU', 'ME');
CREATE TYPE "Tier" AS ENUM ('LT5', 'HT5', 'LT4', 'HT4', 'LT3', 'HT3', 'LT2', 'HT2', 'LT1', 'HT1', 'N/A');
CREATE TYPE "TestSessionStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "discord_user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "current_tier" "Tier" NOT NULL DEFAULT 'N/A',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "test_sessions" (
    "id" TEXT NOT NULL,
    "candidate_discord_id" TEXT NOT NULL,
    "candidate_username" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "previous_tier" "Tier" NOT NULL,
    "assigned_tier" "Tier",
    "status" "TestSessionStatus" NOT NULL DEFAULT 'OPEN',
    "opened_by_discord_id" TEXT NOT NULL,
    "completed_by_discord_id" TEXT,
    "note" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "test_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tier_history" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "previous_tier" "Tier",
    "new_tier" "Tier" NOT NULL,
    "region" "Region" NOT NULL,
    "changed_by_discord_id" TEXT NOT NULL,
    "test_session_id" TEXT,
    "reason" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tier_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "players_discord_user_id_key" ON "players"("discord_user_id");
CREATE INDEX "players_region_current_tier_idx" ON "players"("region", "current_tier");
CREATE INDEX "test_sessions_status_created_at_idx" ON "test_sessions"("status", "created_at");
CREATE INDEX "test_sessions_candidate_discord_id_created_at_idx" ON "test_sessions"("candidate_discord_id", "created_at");
CREATE UNIQUE INDEX "tier_history_test_session_id_key" ON "tier_history"("test_session_id");
CREATE INDEX "tier_history_player_id_created_at_idx" ON "tier_history"("player_id", "created_at");

ALTER TABLE "tier_history"
ADD CONSTRAINT "tier_history_player_id_fkey"
FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tier_history"
ADD CONSTRAINT "tier_history_test_session_id_fkey"
FOREIGN KEY ("test_session_id") REFERENCES "test_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
