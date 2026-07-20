import type { LeaderboardPayload } from "@/lib/leaderboard/leaderboard-queries";
import type { StatisticsPageData } from "@/lib/statistics-queries";

/** Serializable analytics payload passed from server page → client hub. */
export type AnalyticsPageData = {
  leaderboard: LeaderboardPayload;
  statistics: StatisticsPageData;
  generatedAt: string;
};
