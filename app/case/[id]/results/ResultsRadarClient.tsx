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
        <PolarGrid radialLines={false} stroke="#e4e4e7" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fill: "#52525b", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#a1a1aa", fontSize: 10 }}
          tickCount={6}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#2563eb"
          fill="#2563eb"
          fillOpacity={0.18}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

