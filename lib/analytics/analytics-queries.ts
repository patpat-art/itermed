import { fetchLeaderboardPayload } from "@/lib/leaderboard/leaderboard-queries";
import { fetchStatisticsPageData } from "@/lib/statistics-queries";
import type { AnalyticsPageData } from "@/lib/analytics/analytics-types";

export type { AnalyticsPageData } from "@/lib/analytics/analytics-types";

/** Single parallel fetch for the unified Analytics dashboard. */
export async function fetchAnalyticsPageData(userId: string): Promise<AnalyticsPageData> {
  const [leaderboard, statistics] = await Promise.all([
    fetchLeaderboardPayload(userId),
    fetchStatisticsPageData(userId),
  ]);

  return {
    leaderboard,
    statistics,
    generatedAt: new Date().toISOString(),
  };
}
