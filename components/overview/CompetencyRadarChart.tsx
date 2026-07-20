"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

export type CompetencyRadarPoint = {
  metric: string;
  score: number;
};

type CompetencyRadarChartProps = {
  data: CompetencyRadarPoint[];
};

function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CompetencyRadarPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      <p className="font-medium text-zinc-900">{point.metric}</p>
      <p className="text-zinc-600 mt-0.5">Media: {point.score}/100</p>
    </div>
  );
}

export function CompetencyRadarChart({ data }: CompetencyRadarChartProps) {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <ResponsiveContainer width="92%" height="92%">
        <RadarChart data={data} outerRadius="78%" cx="50%" cy="54%">
          <defs>
            <linearGradient id="itermedRadarFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#345884" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#1E324E" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <PolarGrid radialLines={false} stroke="#E2E8F0" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: "#64748B", fontSize: 11 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<RadarTooltip />} />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#345884"
            strokeWidth={2}
            fill="url(#itermedRadarFill)"
            fillOpacity={1}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
