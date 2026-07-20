"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

export type RadarDatum = {
  metric: string;
  score: number;
};

export function ResultsRadarClient({ data }: { data: RadarDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid radialLines={false} stroke="#E2E8F0" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fill: "#64748B", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#94A3B8", fontSize: 10 }}
          tickCount={6}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#345884"
          fill="#345884"
          fillOpacity={0.18}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

