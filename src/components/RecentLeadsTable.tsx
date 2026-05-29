"use client";

import { formatRelativeTime } from "@/lib/utils";
import type { Lead } from "@/types";

const statusStyles: Record<string, { label: string; color: string; bg: string }> = {
  new:       { label: "New",       color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  contacted: { label: "Contacted", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  waiting:   { label: "Waiting",   color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  booked:    { label: "Booked",    color: "#C9A84C", bg: "rgba(201,168,76,0.1)" },
  quoted:    { label: "Quoted",    color: "#A855F7", bg: "rgba(168,85,247,0.1)" },
  closed:    { label: "Closed",    color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  lost:      { label: "Lost",      color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  ignored:   { label: "Ignored",   color: "#4A5568", bg: "rgba(68,68,68,0.1)" },
};

const sourceLabels: Record<string, string> = {
  phone_call: "Phone",
  sms:        "SMS",
  web_form:   "Web",
  email:      "Email",
  manual:     "Manual",
};

interface RecentLeadsTableProps {
  leads: Lead[];
}

function formatResponseTime(seconds?: number | null): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function RecentLeadsTable({ leads }: RecentLeadsTableProps) {
  if (!leads.length) {
    return (
      <div
        style={{
          padding: "48px 24px",
          textAlign: "center",
          color: "#94A3B8",
          fontSize: 13,
        }}
      >
        No leads yet
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid #2A3A4A" }}>
            {["Name", "Source", "Status", "Time", "Response"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 16px",
                  textAlign: "left",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#94A3B8",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const st = statusStyles[lead.status] ?? statusStyles.new;
            return (
              <tr
                key={lead.id}
                style={{
                  borderBottom: "1px solid #2A3A4A",
                  transition: "background 0.15s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#243347")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <td style={{ padding: "12px 16px", color: "#FFFFFF", fontWeight: 500 }}>
                  {lead.name ?? "Unknown"}
                </td>
                <td style={{ padding: "12px 16px", color: "#94A3B8" }}>
                  {sourceLabels[lead.source] ?? lead.source}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span
                    className="status-pill"
                    style={{ color: st.color, background: st.bg }}
                  >
                    {st.label}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: "#94A3B8", whiteSpace: "nowrap" }}>
                  {formatRelativeTime(lead.created_at)}
                </td>
                <td
                  className="tabular-nums"
                  style={{
                    padding: "12px 16px",
                    color: lead.response_time_seconds ? "#22C55E" : "#EF4444",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatResponseTime(lead.response_time_seconds)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
