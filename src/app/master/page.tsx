"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { AddClientModal } from "@/components/AddClientModal";
import { NovaLogo } from "@/components/NovaLogo";
import { StatCard } from "@/components/StatCard";
import {
  Users, TrendingUp, AlertTriangle, Activity, Bell,
  Trash2, ExternalLink, Search, RefreshCw, ChevronRight,
} from "lucide-react";
import type { Business } from "@/types";

const BD = "#1C1C1C";
const DIM = "#333333";
const G = "#C6A15B";
const BEBAS = "var(--font-bebas), 'Bebas Neue', sans-serif";
const INTER = "var(--font-inter), 'Inter', system-ui, sans-serif";

interface ClientRow extends Business {
  lead_count?: number;
  health_score?: number;
  active_leads?: number;
  missed_calls?: number;
  alert_count?: number;
}

function healthColor(score?: number): string {
  if (!score) return DIM;
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

function HealthBar({ score }: { score: number }) {
  const color = healthColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 3, background: BD, borderRadius: 2, minWidth: 60 }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
      <span className="font-mono tabular-nums" style={{ fontSize: 13, fontWeight: 700, color, minWidth: 30, textAlign: "right" }}>
        {score}
      </span>
    </div>
  );
}

export default function MasterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [userName, setUserName] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Isaac");

    const { data: userBiz } = await supabase.from("businesses").select("role").eq("owner_id", user.id).single();
    if (userBiz?.role !== "super_admin" && user.email !== "isaac_0427@icloud.com") {
      router.push("/login"); return;
    }

    const res = await fetch("/api/admin/businesses");
    if (!res.ok) { router.push("/login"); return; }
    const json = await res.json();
    setClients(json.businesses ?? []);
    setTotalLeads(json.totalLeads ?? 0);
    setTotalAlerts(json.totalAlerts ?? 0);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const avgHealth = clients.length
    ? Math.round(clients.reduce((s, c) => s + (c.health_score ?? 0), 0) / clients.length)
    : 0;
  const totalActive = clients.reduce((s, c) => s + (c.active_leads ?? 0), 0);
  const totalMissed = clients.reduce((s, c) => s + (c.missed_calls ?? 0), 0);

  const filtered = clients.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.owner_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (bizId: string) => {
    if (!confirm("Delete this client and all their data? This cannot be undone.")) return;
    const supabase = createClient();
    await supabase.from("businesses").delete().eq("id", bizId);
    fetchData();
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <NovaLogo size={48} />
          <div style={{ width: 28, height: 28, border: `2px solid ${BD}`, borderTopColor: G, borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "20px auto 0" }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex" }}>
      <Sidebar variant="master" userName={userName} onAddClient={() => setShowAddModal(true)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="pt-14 lg:pt-0">
        <div style={{ padding: "20px 32px", borderBottom: `1px solid ${BD}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", background: "#0A0A0A", position: "sticky", top: 0, zIndex: 30 }}>
          <div>
            <p style={{ fontFamily: INTER, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: DIM }}>Master View</p>
            <h1 style={{ fontFamily: BEBAS, fontSize: 32, fontWeight: 400, color: "#F5F5F5", letterSpacing: "0.06em", marginTop: 2, lineHeight: 1 }}>System Overview</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={fetchData} title="Refresh"
              style={{ background: "transparent", border: `1px solid ${BD}`, color: DIM, padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", transition: "border-color 0.2s, color 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(198,161,91,0.3)"; (e.currentTarget as HTMLElement).style.color = G; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BD; (e.currentTarget as HTMLElement).style.color = DIM; }}
            >
              <RefreshCw size={14} />
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-gold" style={{ padding: "10px 18px" }}>
              Add Client
            </button>
          </div>
        </div>

        <div className="dash-content" style={{ flex: 1, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 28 }}>

          <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 1, background: BD }}>
            <StatCard label="Total Clients" value={clients.length} sub="Active portals" accent="default" icon={<Users size={14} />} />
            <StatCard label="Active Leads" value={totalActive.toLocaleString()} sub="Across all clients" accent="gold" icon={<TrendingUp size={14} />} />
            <StatCard label="Open Alerts" value={totalAlerts} sub={totalAlerts > 0 ? "Requiring attention" : "All clear"} accent={totalAlerts > 0 ? "danger" : "success"} icon={<Bell size={14} />} />
            <StatCard label="Missed Calls" value={totalMissed} sub="Uncontacted leads" accent={totalMissed > 0 ? "warning" : "success"} icon={<AlertTriangle size={14} />} />
            <StatCard label="Total Leads" value={totalLeads.toLocaleString()} sub="All time, all clients" accent="info" icon={<Activity size={14} />} />
            <StatCard label="Avg Health" value={`${avgHealth}`} sub="System-wide score" accent={avgHealth >= 80 ? "success" : avgHealth >= 60 ? "warning" : "danger"} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 1, background: BD }}>
            <div style={{ background: "#111111" }}>
              <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BD}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontFamily: BEBAS, fontSize: 22, fontWeight: 400, color: "#F5F5F5", letterSpacing: "0.06em" }}>Client Health</h2>
                <span style={{ fontFamily: INTER, fontSize: 11, color: DIM }}>{clients.length} clients</span>
              </div>
              <div>
                {[...clients].sort((a, b) => (a.health_score ?? 0) - (b.health_score ?? 0)).map((client, i, arr) => (
                  <div
                    key={client.id}
                    onClick={() => router.push(`/${client.slug}`)}
                    style={{ padding: "14px 24px", borderBottom: i < arr.length - 1 ? `1px solid ${BD}` : "none", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#0E0E0E")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: INTER, fontSize: 13, fontWeight: 600, color: "#F5F5F5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                      <div style={{ fontFamily: INTER, fontSize: 11, color: DIM, marginTop: 2 }}>{client.active_leads ?? 0} active · {client.missed_calls ?? 0} missed</div>
                    </div>
                    <div style={{ width: 130, flexShrink: 0 }}>
                      <HealthBar score={client.health_score ?? 0} />
                    </div>
                    <ChevronRight size={12} color={DIM} />
                  </div>
                ))}
                {clients.length === 0 && <div style={{ padding: "32px 24px", textAlign: "center", color: DIM, fontSize: 13 }}>No clients yet</div>}
              </div>
            </div>

            <div style={{ background: "#111111" }}>
              <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BD}` }}>
                <h2 style={{ fontFamily: BEBAS, fontSize: 22, fontWeight: 400, color: "#F5F5F5", letterSpacing: "0.06em" }}>Activity</h2>
              </div>
              <div>
                {[...clients].sort((a, b) => (b.alert_count ?? 0) - (a.alert_count ?? 0)).slice(0, 10).map((client, i) => {
                  const hasAlerts = (client.alert_count ?? 0) > 0;
                  const hasMissed = (client.missed_calls ?? 0) > 0;
                  const ev = hasAlerts
                    ? { label: `${client.alert_count} alert${(client.alert_count ?? 0) > 1 ? "s" : ""}`, color: "#EF4444" }
                    : hasMissed
                    ? { label: `${client.missed_calls} missed`, color: "#F59E0B" }
                    : { label: `${client.active_leads ?? 0} active`, color: "#22C55E" };
                  return (
                    <div key={client.id} onClick={() => router.push(`/${client.slug}`)}
                      style={{ padding: "11px 18px", borderBottom: i < 9 ? `1px solid ${BD}` : "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#0E0E0E")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: ev.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: INTER, fontSize: 12, fontWeight: 600, color: "#F5F5F5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                        <div style={{ fontFamily: INTER, fontSize: 11, color: ev.color }}>{ev.label}</div>
                      </div>
                    </div>
                  );
                })}
                {clients.length === 0 && <div style={{ padding: "32px 18px", textAlign: "center", color: DIM, fontSize: 12 }}>No activity</div>}
              </div>
            </div>
          </div>

          <div style={{ background: "#111111", border: `1px solid ${BD}` }}>
            <div style={{ padding: "18px 24px", borderBottom: `1px solid ${BD}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ fontFamily: BEBAS, fontSize: 26, fontWeight: 400, color: "#F5F5F5", letterSpacing: "0.06em" }}>Clients</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ position: "relative" }}>
                  <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: DIM }} />
                  <input
                    placeholder="Search clients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ background: "#07111F", border: `1px solid ${BD}`, color: "#F5F5F5", fontSize: 13, padding: "8px 12px 8px 32px", outline: "none", width: 220, fontFamily: INTER }}
                  />
                </div>
                <span style={{ fontFamily: INTER, fontSize: 12, color: DIM }}>{filtered.length} shown</span>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: "56px 24px", textAlign: "center" }}>
                <p style={{ fontFamily: INTER, color: DIM, fontSize: 14 }}>{clients.length === 0 ? "No clients yet." : "No results."}</p>
                {clients.length === 0 && (
                  <button onClick={() => setShowAddModal(true)} className="btn-gold" style={{ marginTop: 16 }}>
                    Add First Client
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>{["Business", "Slug", "Health", "Active Leads", "Missed Calls", "Alerts", "Status", "Actions"].map((h) => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filtered.map((client) => (
                      <tr key={client.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/${client.slug}`)}>
                        <td>
                          <div style={{ fontWeight: 600, color: "#F5F5F5" }}>{client.name}</div>
                          <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{client.owner_name}</div>
                        </td>
                        <td>
                          <code className="font-mono" style={{ fontSize: 11, color: G, background: "rgba(198,161,91,0.08)", padding: "2px 7px" }}>/{client.slug}</code>
                        </td>
                        <td style={{ minWidth: 140 }}>
                          <HealthBar score={client.health_score ?? 0} />
                        </td>
                        <td className="tabular-nums" style={{ color: "#F5F5F5" }}>{client.active_leads ?? 0}</td>
                        <td>
                          <span style={{ color: (client.missed_calls ?? 0) > 0 ? "#EF4444" : DIM }} className="tabular-nums">
                            {client.missed_calls ?? 0}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: (client.alert_count ?? 0) > 0 ? "#F59E0B" : DIM }} className="tabular-nums">
                            {client.alert_count ?? 0}
                          </span>
                        </td>
                        <td>
                          <span className="status-pill" style={{ color: "#22C55E", background: "rgba(34,197,94,0.1)" }}>Active</span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => router.push(`/${client.slug}`)} title="View"
                              style={{ background: "transparent", border: `1px solid ${BD}`, color: DIM, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: INTER, transition: "border-color 0.15s, color 0.15s" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(198,161,91,0.3)"; (e.currentTarget as HTMLElement).style.color = G; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BD; (e.currentTarget as HTMLElement).style.color = DIM; }}
                            >
                              <ExternalLink size={11} /> View
                            </button>
                            <button onClick={() => handleDelete(client.id)} title="Delete"
                              style={{ background: "transparent", border: `1px solid ${BD}`, color: DIM, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center", transition: "border-color 0.15s, color 0.15s" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.3)"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BD; (e.currentTarget as HTMLElement).style.color = DIM; }}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddClientModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchData(); }} />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
