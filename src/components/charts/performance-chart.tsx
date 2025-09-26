"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PerformanceChartProps {
  data: Array<{
    date: string;
    completed: number;
    quality: number;
  }>;
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="completed"
          stroke="#3B82F6"
          strokeWidth={2}
          name="Orders Completed"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="quality"
          stroke="#10B981"
          strokeWidth={2}
          name="Quality Score %"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}