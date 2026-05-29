"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { AlertTriangle, Phone, Clock, CheckCircle, Bell, Info } from "lucide-react";
import type { Business, Alert } from "@/types";

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

const SEV_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: AlertTriangle },
  warning: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", icon: Bell },
  info: { color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: Info },
};

const TYPE_LABELS: Record<string, string> = {
  missed_call: "Missed Call", no_response: "No Response", dead_lead: "Dead Lead",
  slow_response: "Slow Response", stalled_lead: "Stalled Lead",
};

export default function AlertsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  const fetchData = useCallback(async () => {
    if (!slug) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const res = await fetch(`/api/admin/businesses/${slug}`);
    if (!res.ok) { router.push("/login"); return; }
    const json = await res.json();
    setBusiness(json.business);
    setAlerts(json.alerts ?? []);
    setLoading(false);
  }, [slug, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = alerts.filter((a) => filter === "all" || a.severity === filter);

  if (loading || !business) {
    return (
      <div style={{ minHeight: "100vh", background: "#080C14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <NovaLogo size={44} />
      </div>
    );
  }

  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", display: "flex" }}>
      <Sidebar variant="client" businessName={business.name} ownerName={business.owner_name} slug={slug} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="pt-14 lg:pt-0">
        <div style={{ padding: "20px 32px", borderBottom: "1px solid #1E2D3D", background: "#080C14", position: "sticky", top: 0, zIndex: 30 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A5568" }}>{business.name}</p>
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em", marginTop: 4 }}>Alerts</h1>
        </div>

        <div style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "#1E2D3D" }}>
            {[
              { label: "Critical", value: critical, color: critical > 0 ? "#EF4444" : "#10B981" },
              { label: "Warning", value: warning, color: warning > 0 ? "#F59E0B" : "#10B981" },
              { label: "Total Open", value: alerts.length, color: "#F8FAFC" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#111827", padding: "20px 24px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Alerts list */}
          <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
            <div style={{ padding: "14px 24px", borderBottom: "1px solid #1E2D3D", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, fontWeight: 600, color: "#F8FAFC" }}>Active Alerts</h2>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {(["all", "critical", "warning", "info"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ padding: "5px 10px", fontSize: 10, fontWeight: 700, textTransform: "capitalize", background: filter === f ? "#C6A15B" : "transparent", color: filter === f ? "#080C14" : "#4A5568", border: `1px solid ${filter === f ? "#C6A15B" : "#1E2D3D"}`, cursor: "pointer", letterSpacing: "0.06em" }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: "56px 24px", textAlign: "center" }}>
                <CheckCircle size={32} color="#10B981" style={{ margin: "0 auto 12px" }} />
                <p style={{ color: "#4A5568", fontSize: 14 }}>No active alerts</p>
              </div>
            ) : (
              filtered.map((alert, i) => {
                const cfg = SEV_CONFIG[alert.severity] ?? SEV_CONFIG.info;
                const SevIcon = cfg.icon;
                return (
                  <div
                    key={alert.id}
                    style={{ padding: "16px 24px", borderBottom: i < filtered.length - 1 ? "1px solid #1E2D3D" : "none", display: "flex", alignItems: "flex-start", gap: 14, transition: "background 0.15s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#141f2e")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <div style={{ width: 34, height: 34, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <SevIcon size={14} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#F8FAFC" }}>{alert.title}</span>
                        <span className="status-pill" style={{ color: cfg.color, background: cfg.bg }}>{alert.severity}</span>
                        {alert.type && (
                          <span style={{ fontSize: 10, color: "#4A5568", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                            {TYPE_LABELS[alert.type] ?? alert.type}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 4 }}>{alert.description}</div>
                      <div style={{ fontSize: 11, color: "#4A5568" }}>{timeAgo(alert.created_at)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
