"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

type Datum = { metric: string; score: number };

export function HomeRadarClient({ data }: { data: Datum[] }) {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <ResponsiveContainer width="90%" height="90%">
        <RadarChart data={data} outerRadius="80%" cx="50%" cy="55%">
          <defs>
            <linearGradient id="itermedRadarFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.18} />
            </linearGradient>
          </defs>
          <PolarGrid radialLines={false} stroke="#e4e4e7" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "#52525b", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
            tickLine={false}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#2563eb"
            fill="url(#itermedRadarFill)"
            fillOpacity={1}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

