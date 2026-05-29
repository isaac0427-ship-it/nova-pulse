"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { AlertTriangle, Bell, Info, ExternalLink, CheckCircle } from "lucide-react";
import type { Alert } from "@/types";

interface AlertRow extends Alert {
  business_name?: string;
  business_slug?: string;
}

const SEVERITY_STYLES: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: AlertTriangle },
  warning: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", icon: Bell },
  info: { color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: Info },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MasterAlertsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [userName, setUserName] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Isaac");

    const { data: userBiz } = await supabase.from("businesses").select("role").eq("owner_id", user.id).single();
    if (userBiz?.role !== "super_admin" && user.email !== "isaac_0427@icloud.com") { router.push("/login"); return; }

    const res = await fetch("/api/admin/businesses");
    if (!res.ok) { router.push("/login"); return; }
    const json = await res.json();
    const bizList = json.businesses ?? [];

    const allAlerts: AlertRow[] = [];
    await Promise.all(
      bizList.slice(0, 10).map(async (biz: { slug: string; id: string; name: string }) => {
        const r = await fetch(`/api/admin/businesses/${biz.slug}`);
        if (r.ok) {
          const d = await r.json();
          (d.alerts ?? []).forEach((a: AlertRow) => {
            allAlerts.push({ ...a, business_name: biz.name, business_slug: biz.slug });
          });
        }
      })
    );

    allAlerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setAlerts(allAlerts);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = alerts.filter((a) => severityFilter === "all" || a.severity === severityFilter);
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080C14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <NovaLogo size={44} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", display: "flex" }}>
      <Sidebar variant="master" userName={userName} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="pt-14 lg:pt-0">
        <div style={{ padding: "20px 32px", borderBottom: "1px solid #1E2D3D", background: "#080C14", position: "sticky", top: 0, zIndex: 30 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A5568" }}>Master View</p>
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em", marginTop: 4 }}>All Alerts</h1>
        </div>

        <div style={{ flex: 1, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "#1E2D3D" }}>
            {[
              { label: "Critical", value: critical, color: "#EF4444", bg: "rgba(239,68,68,0.08)" },
              { label: "Warning", value: warning, color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
              { label: "Total Open", value: alerts.length, color: "#F8FAFC", bg: "#111827" },
            ].map((s) => (
              <div key={s.label} style={{ background: s.bg, padding: "20px 24px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Alerts table */}
          <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D", display: "flex", alignItems: "center", gap: 12 }}>
              <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, fontWeight: 600, color: "#F8FAFC", flex: 1 }}>Active Alerts</h2>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{ background: "#0D1421", border: "1px solid #1E2D3D", color: "#94A3B8", fontSize: 12, padding: "7px 12px", outline: "none", fontFamily: '"Inter", system-ui, sans-serif', cursor: "pointer" }}
              >
                <option value="all" style={{ background: "#111827" }}>All Severities</option>
                <option value="critical" style={{ background: "#111827" }}>Critical</option>
                <option value="warning" style={{ background: "#111827" }}>Warning</option>
                <option value="info" style={{ background: "#111827" }}>Info</option>
              </select>
            </div>
            <div>
              {filtered.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <CheckCircle size={32} color="#10B981" style={{ margin: "0 auto 12px" }} />
                  <p style={{ color: "#4A5568", fontSize: 14 }}>No alerts — all clear</p>
                </div>
              ) : (
                filtered.map((alert, i) => {
                  const sev = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info;
                  const SevIcon = sev.icon;
                  return (
                    <div
                      key={alert.id}
                      style={{ padding: "16px 24px", borderBottom: i < filtered.length - 1 ? "1px solid #1E2D3D" : "none", display: "flex", alignItems: "flex-start", gap: 14, transition: "background 0.15s" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#141f2e")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      <div style={{ width: 32, height: 32, background: sev.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <SevIcon size={14} color={sev.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#F8FAFC" }}>{alert.title}</span>
                          <span className="status-pill" style={{ color: sev.color, background: sev.bg }}>{alert.severity}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 4 }}>{alert.description}</div>
                        <div style={{ fontSize: 11, color: "#4A5568" }}>
                          <span style={{ color: "#C6A15B", cursor: "pointer" }} onClick={() => router.push(`/${alert.business_slug}`)}>{alert.business_name}</span>
                          {" · "}{formatDate(alert.created_at)}
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/${alert.business_slug}/alerts`)}
                        style={{ background: "transparent", border: "none", color: "#4A5568", cursor: "pointer", padding: "4px", display: "flex", transition: "color 0.15s", flexShrink: 0 }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C6A15B")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#4A5568")}
                      >
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
