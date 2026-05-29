import type { Alert } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { AlertTriangle, Phone, Clock } from "lucide-react";

const alertConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  missed_call:  { label: "Missed Call",   color: "#EF4444", bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.15)" },
  no_response:  { label: "No Response",   color: "#F59E0B", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.15)" },
  dead_lead:    { label: "Dead Lead",     color: "#EF4444", bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.15)" },
  slow_response:{ label: "Slow Response", color: "#F59E0B", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.15)" },
  stalled_lead: { label: "Stalled",       color: "#F59E0B", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.15)" },
};

function AlertIcon({ type }: { type: string }) {
  const size = 14;
  if (type === "missed_call") return <Phone size={size} />;
  if (type === "dead_lead" || type === "stalled_lead") return <AlertTriangle size={size} />;
  return <Clock size={size} />;
}

interface AlertCardsProps {
  alerts: Alert[];
}

export function AlertCards({ alerts }: AlertCardsProps) {
  if (!alerts.length) {
    return (
      <div
        style={{
          padding: "32px 24px",
          textAlign: "center",
          color: "#94A3B8",
          fontSize: 13,
          background: "#1A2535",
          border: "1px solid #2A3A4A",
        }}
      >
        No active alerts — operations look clean.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {alerts.map((alert) => {
        const cfg = alertConfig[alert.type] ?? alertConfig.no_response;
        return (
          <div
            key={alert.id}
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              padding: "14px 18px",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <span style={{ color: cfg.color, display: "flex", flexShrink: 0, marginTop: 1 }}>
              <AlertIcon type={alert.type} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: cfg.color,
                  }}
                >
                  {cfg.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#94A3B8",
                  }}
                >
                  {formatRelativeTime(alert.created_at)}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#FFFFFF", marginTop: 4, fontWeight: 500 }}>
                {alert.title}
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                {alert.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
