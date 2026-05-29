import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "gold" | "success" | "danger" | "warning" | "info" | "default";
  icon?: ReactNode;
  trend?: { value: number; label?: string };
}

const accentColors: Record<string, string> = {
  gold: "#C6A15B",
  success: "#22C55E",
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  default: "#F5F5F5",
};

export function StatCard({ label, value, sub, accent = "default", icon, trend }: StatCardProps) {
  const color = accentColors[accent];
  const trendUp = trend && trend.value > 0;
  const trendDown = trend && trend.value < 0;

  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid #1C1C1C",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "border-color 0.3s, box-shadow 0.3s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(198,161,91,0.25)";
        el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.6)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "#1C1C1C";
        el.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#333333", fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}>
          {label}
        </span>
        {icon && <span style={{ color: "#C6A15B", display: "flex", opacity: 0.6 }}>{icon}</span>}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: 36,
            fontWeight: 400,
            color,
            lineHeight: 1,
            letterSpacing: "0.02em",
          }}
        >
          {value}
        </span>
        {trend && (
          <span style={{ fontSize: 11, fontWeight: 600, color: trendUp ? "#22C55E" : trendDown ? "#EF4444" : "#333333", fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}>
            {trendUp ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>

      {sub && <span style={{ fontSize: 11, color: "#333333", lineHeight: 1.4, fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}>{sub}</span>}
    </div>
  );
}
