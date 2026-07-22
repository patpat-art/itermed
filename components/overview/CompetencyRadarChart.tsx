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
    <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2.5 text-xs shadow-lg backdrop-blur-sm">
      <p className="font-display font-semibold text-text-primary">{point.metric}</p>
      <p className="mt-0.5 font-medium text-brand-secondary">Media: {point.score}/100</p>
    </div>
  );
}

export function CompetencyRadarChart({ data }: CompetencyRadarChartProps) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div className="h-48 w-48 rounded-full bg-brand-secondary/[0.04]" />
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%" cx="50%" cy="52%">
          <defs>
            <linearGradient id="itermedRadarFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#345884" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#1E324E" stopOpacity={0.12} />
            </linearGradient>
            <linearGradient id="itermedRadarStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1E324E" />
              <stop offset="100%" stopColor="#345884" />
            </linearGradient>
          </defs>
          <PolarGrid
            radialLines={false}
            stroke="#E2E8F0"
            strokeDasharray="4 4"
          />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
          />
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
            stroke="url(#itermedRadarStroke)"
            strokeWidth={2.5}
            fill="url(#itermedRadarFill)"
            fillOpacity={1}
            dot={{ fill: "#345884", strokeWidth: 0, r: 3 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
