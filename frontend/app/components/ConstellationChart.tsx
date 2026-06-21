"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ConstellationChartProps {
  times: number[];
  freqs: number[];
}

export default function ConstellationChart({
  times,
  freqs,
}: ConstellationChartProps) {
  const data = times.map((t, i) => ({
    time: Number(t.toFixed(3)),
    freq: Math.round(freqs[i]),
  }));

  return (
    <div className="glass-card p-5 animate-float-up-delay-2">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <h3 className="text-sm font-semibold text-foreground">
          Constellation Map
        </h3>
        <span className="text-xs text-muted ml-auto">
          {data.length} peaks
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(30,33,48,0.8)"
          />
          <XAxis
            dataKey="time"
            type="number"
            name="Time"
            unit="s"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={{ stroke: "#1e2130" }}
            tickLine={{ stroke: "#1e2130" }}
            label={{
              value: "Time (s)",
              position: "insideBottom",
              offset: -10,
              fill: "#6b7280",
              fontSize: 11,
            }}
          />
          <YAxis
            dataKey="freq"
            type="number"
            name="Frequency"
            unit=" Hz"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={{ stroke: "#1e2130" }}
            tickLine={{ stroke: "#1e2130" }}
            label={{
              value: "Freq (Hz)",
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
            cursor={{ strokeDasharray: "3 3", stroke: "#7c3aed" }}
          />
          <Scatter
            data={data}
            fill="#ef4444"
            fillOpacity={0.85}
            r={2.5}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
