"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TimelineChartProps {
  data: Array<{
    stage: string;
    count: number;
    target: number;
  }>;
}

export function TimelineChart({ data }: TimelineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="stage"
          tick={{ fontSize: 12 }}
          interval={0}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#3B82F6" name="Current Orders" />
        <Bar dataKey="target" fill="#10B981" name="Target Capacity" />
      </BarChart>
    </ResponsiveContainer>
  );
}