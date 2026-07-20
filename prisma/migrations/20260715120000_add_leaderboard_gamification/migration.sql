-- Leaderboard gamification fields on User + index for fast aggregation on SessionReport.

CREATE TYPE "LeaderboardNameType" AS ENUM ('REAL_NAME', 'NICKNAME', 'ANONYMOUS');

ALTER TABLE "User"
  ADD COLUMN "leaderboardOptIn" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "leaderboardNameType" "LeaderboardNameType" NOT NULL DEFAULT 'REAL_NAME',
  ADD COLUMN "nickname" TEXT;

CREATE INDEX "User_leaderboardOptIn_idx" ON "User"("leaderboardOptIn");

CREATE INDEX "SessionReport_status_userId_totalScore_idx"
  ON "SessionReport"("status", "userId", "totalScore");
