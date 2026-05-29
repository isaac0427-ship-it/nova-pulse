"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface LeadFlowDataPoint {
  date: string;
  new: number;
  contacted: number;
  booked: number;
}

interface LeadFlowChartProps {
  data: LeadFlowDataPoint[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1A2535",
        border: "1px solid #2A3A4A",
        padding: "12px 16px",
        fontSize: 12,
        lineHeight: 1.8,
      }}
    >
      <div style={{ color: "#94A3B8", marginBottom: 6, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </div>
      {payload.map((entry) => (
        <div key={entry.name} style={{ color: entry.color, display: "flex", gap: 8, justifyContent: "space-between" }}>
          <span style={{ textTransform: "capitalize" }}>{entry.name}</span>
          <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function LeadFlowChart({ data }: LeadFlowChartProps) {
  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#2A3A4A" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#2A2A2A" }} />
          <Legend
            iconType="circle"
            iconSize={6}
            wrapperStyle={{ fontSize: 11, color: "#94A3B8", paddingTop: 12 }}
          />
          <Line
            type="monotone"
            dataKey="new"
            stroke="#C9A84C"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: "#C9A84C", strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="contacted"
            stroke="#3B82F6"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: "#3B82F6", strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="booked"
            stroke="#22C55E"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: "#22C55E", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
