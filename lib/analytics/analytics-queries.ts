import { fetchLeaderboardPayload } from "@/lib/leaderboard/leaderboard-queries";
import { fetchStatisticsPageData } from "@/lib/statistics-queries";
import type { AnalyticsPageData } from "@/lib/analytics/analytics-types";
import { OVERVIEW_RADAR_METRICS } from "@/lib/overview-queries";
import { createLogger } from "@/lib/logger";

export type { AnalyticsPageData } from "@/lib/analytics/analytics-types";

const log = createLogger("analytics-queries");

function emptyAnalyticsPayload(userId: string): AnalyticsPageData {
  const zeroAverages = Object.fromEntries(
    OVERVIEW_RADAR_METRICS.map(({ key }) => [key, 0]),
  ) as AnalyticsPageData["statistics"]["overallAverages"];

  return {
    leaderboard: {
      top50: [],
      currentUser: {
        rank: null,
        entry: null,
        preferences: {
          leaderboardOptIn: false,
          leaderboardNameType: "ANONYMOUS",
          nickname: null,
        },
        metrics: {
          averageScore: null,
          completedCount: 0,
          rank: null,
          totalParticipants: 0,
          percentileTop: null,
          clinicalResolutionRate: null,
          averageResolutionMinutes: null,
        },
      },
      generatedAt: new Date().toISOString(),
    },
    statistics: {
      completedCount: 0,
      trend: [],
      coachInsights: [],
      overallAverages: zeroAverages,
    },
    generatedAt: new Date().toISOString(),
  };
}

/** Single parallel fetch for the unified Analytics dashboard — never throws to the page. */
export async function fetchAnalyticsPageData(userId: string): Promise<AnalyticsPageData> {
  try {
    const [leaderboard, statistics] = await Promise.all([
      fetchLeaderboardPayload(userId),
      fetchStatisticsPageData(userId),
    ]);

    return {
      leaderboard,
      statistics,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    log.error("Analytics fetch failed — returning empty payload", { userId, error });
    return emptyAnalyticsPayload(userId);
  }
}
