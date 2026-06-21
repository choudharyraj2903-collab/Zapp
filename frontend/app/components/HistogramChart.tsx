"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface HistogramChartProps {
  offsets: number[];
  counts: number[];
}

export default function HistogramChart({
  offsets,
  counts,
}: HistogramChartProps) {
  const maxCount = Math.max(...counts, 1);
  const data = offsets.map((offset, i) => ({
    offset,
    count: counts[i],
  }));

  return (
    <div className="glass-card p-5 animate-float-up-delay-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-accent" />
        <h3 className="text-sm font-semibold text-foreground">
          Offset Histogram
        </h3>
        <span className="text-xs text-muted ml-auto">
          Peak: {maxCount} hits
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(30,33,48,0.8)"
            vertical={false}
          />
          <XAxis
            dataKey="offset"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={{ stroke: "#1e2130" }}
            tickLine={{ stroke: "#1e2130" }}
            label={{
              value: "Offset",
              position: "insideBottom",
              offset: -10,
              fill: "#6b7280",
              fontSize: 11,
            }}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={{ stroke: "#1e2130" }}
            tickLine={{ stroke: "#1e2130" }}
            label={{
              value: "Count",
              angle: -90,
              position: "insideLeft",
              offset: 5,
              fill: "#6b7280",
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(18,20,28,0.95)",
              border: "1px solid #1e2130",
              borderRadius: "10px",
              fontSize: "12px",
              color: "#e8eaf0",
            }}
            cursor={{ fill: "rgba(124,58,237,0.08)" }}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={12}>
            {data.map((entry, index) => {
              const intensity = entry.count / maxCount;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={`rgba(124, 58, 237, ${0.3 + intensity * 0.7})`}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
