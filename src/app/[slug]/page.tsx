"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { formatSeconds } from "@/lib/utils";
import {
  TrendingUp, Phone, Clock, Activity, AlertTriangle, ChevronRight, RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar,
} from "recharts";
import type { Business, Lead, Alert } from "@/types";

const G = "#C6A15B";
const BG = "#0A0A0A";
const CARD = "#111111";
const BD = "#1C1C1C";
const DIM = "#333333";
const MUT = "#6B7A8D";
const TXT = "#F5F4F0";
const BEBAS = "var(--font-bebas), 'Bebas Neue', sans-serif";
const INTER = "var(--font-inter), 'Inter', system-ui, sans-serif";

const TIP = { background: "#111111", border: `1px solid ${BD}`, borderRadius: 0, fontSize: 11, color: TXT, padding: "6px 12px" };

const STATUS_COLORS: Record<string, string> = {
  new: G, contacted: "#3B82F6", waiting: "#F59E0B", quoted: "#8B5CF6",
  booked: "#22C55E", closed: "#22C55E", lost: "#EF4444", ignored: "#EF4444", dead: "#555",
};

const SOURCE_LABELS: Record<string, string> = {
  phone_call: "Phone", web_form: "Web", email: "Email", sms: "SMS", manual: "Manual",
};

const DONUT_COLORS = [G, "#3B82F6", "#22C55E", "#8B5CF6", "#F59E0B"];

interface Stats {
  total_leads: number;
  converted_leads: number;
  conversion_rate: number;
  dead_leads: number;
  missed_calls: number;
  avg_response_seconds: number;
  operational_health_score: number;
  unread_alerts: number;
  leads_by_source: { source: string; count: number }[];
  lead_flow: { date: string; incoming: number; contacted: number; converted: number }[];
  this_week_leads: number;
  last_week_leads: number;
  recent_alerts: Alert[];
}

function Skeleton({ w = "100%", h = 16 }: { w?: string | number; h?: number }) {
  return <div style={{ width: w, height: h, background: "#1A1A1A", animation: "pulse 1.5s ease-in-out infinite" }} />;
}

function MiniLine({ data, color }: { data: number[]; color: string }) {
  const pts = data.map((v, i) => ({ i, v }));
  return (
    <LineChart width={60} height={28} data={pts}>
      <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
    </LineChart>
  );
}

function StatCard({ label, value, sub, color, spark, icon }: {
  label: string; value: string | number; sub: string; color: string;
  spark: number[]; icon: React.ReactNode;
}) {
  return (
    <div style={{ background: CARD, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontFamily: INTER, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: MUT }}>{label}</span>
        <span style={{ color: MUT }}>{icon}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontFamily: BEBAS, fontSize: 36, color, lineHeight: 1, letterSpacing: "0.02em" }}>{value}</div>
          <div style={{ fontFamily: INTER, fontSize: 10, color: MUT, marginTop: 4 }}>{sub}</div>
        </div>
        <MiniLine data={spark} color={color} />
      </div>
    </div>
  );
}

function buildSparkData(leads: Lead[], field: (l: Lead, dayStart: Date, dayEnd: Date) => boolean): number[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const e = new Date(s.getTime() + 86400000);
    return leads.filter((l) => field(l, s, e)).length;
  });
}

function buildFlowData(leads: Lead[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const e = new Date(s.getTime() + 86400000);
    const day = leads.filter((l) => { const c = new Date(l.created_at); return c >= s && c < e; });
    return {
      date: d.toLocaleDateString("en-US", { weekday: "short" }),
      incoming: day.length,
      contacted: day.filter((l) => ["contacted","booked","closed"].includes(l.status)).length,
      converted: day.filter((l) => ["booked","closed"].includes(l.status)).length,
    };
  });
}

function buildResponseData(leads: Lead[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const e = new Date(s.getTime() + 86400000);
    const day = leads.filter((l) => l.response_time_seconds && (() => { const c = new Date(l.created_at); return c >= s && c < e; })());
    const avg = day.length ? Math.round(day.reduce((a, l) => a + (l.response_time_seconds ?? 0), 0) / day.length / 60) : 0;
    return { date: d.toLocaleDateString("en-US", { weekday: "short" }), minutes: avg };
  });
}

export default function ClientDashboard() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<Partial<Stats>>({});

  const fetchData = useCallback(async () => {
    if (!slug) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const res = await fetch(`/api/admin/businesses/${slug}`);
    if (!res.ok) { router.push("/login"); return; }
    const json = await res.json();

    const biz: Business = json.business;
    const ls: Lead[] = json.leads ?? [];
    const al: Alert[] = json.alerts ?? [];

    setBusiness(biz);
    setLeads(ls);
    setAlerts(al);

    // Fetch stats for charts
    const statsRes = await fetch(`/api/dashboard/stats?business_id=${biz.id}`);
    if (statsRes.ok) {
      const s = await statsRes.json();
      setStats(s);
    }

    setLoading(false);
  }, [slug, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !business) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex" }}>
        <Sidebar variant="client" businessName="" ownerName="" slug={slug} healthScore={0} />
        <div style={{ flex: 1, padding: "32px", display: "flex", flexDirection: "column", gap: 24 }} className="pt-14 lg:pt-0">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            <NovaLogo size={32} />
            <div style={{ width: 24, height: 24, border: `2px solid ${BD}`, borderTopColor: G, borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 1, background: BD }}>
            {[0,1,2,3,4].map((i) => (
              <div key={i} style={{ background: CARD, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
                <Skeleton h={10} w="60%" />
                <Skeleton h={32} w="40%" />
                <Skeleton h={8} w="80%" />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 1, background: BD }}>
            <div style={{ background: CARD, padding: "24px" }}><Skeleton h={240} /></div>
            <div style={{ background: CARD, padding: "24px" }}><Skeleton h={240} /></div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
      </div>
    );
  }

  const hour = new Date().getHours();
  const timeLabel = hour < 12 ? "MORNING" : hour < 17 ? "AFTERNOON" : "EVENING";
  const firstName = (business.owner_name?.split(" ")[0] ?? "there").toUpperCase();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const activeLeads = leads.filter((l) => ["new","contacted","waiting","quoted"].includes(l.status));
  const missedThisWeek = leads.filter((l) => l.source === "phone_call" && !l.response_time_seconds && ["new","ignored"].includes(l.status) && new Date(l.created_at) >= weekAgo);
  const responded = leads.filter((l) => l.response_time_seconds);
  const avgResp = responded.length ? Math.round(responded.reduce((s, l) => s + (l.response_time_seconds ?? 0), 0) / responded.length) : 0;
  const recovered = leads.filter((l) => ["booked","closed"].includes(l.status));
  const healthScore = stats.operational_health_score ?? 0;

  const sparkActive = buildSparkData(leads, (l, s, e) => { const c = new Date(l.created_at); return c >= s && c < e && ["new","contacted","waiting","quoted"].includes(l.status); });
  const sparkMissed = buildSparkData(leads, (l, s, e) => { const c = new Date(l.created_at); return c >= s && c < e && l.source === "phone_call" && !l.response_time_seconds; });
  const sparkResp = buildSparkData(leads, (l, s, e) => { const c = new Date(l.created_at); return !!(l.response_time_seconds && c >= s && c < e); });
  const sparkRec = buildSparkData(leads, (l, s, e) => { const c = new Date(l.created_at); return c >= s && c < e && ["booked","closed"].includes(l.status); });

  const flowData = buildFlowData(leads);
  const responseData = buildResponseData(leads);

  const sourceData = (stats.leads_by_source ?? []).map((d) => ({ name: SOURCE_LABELS[d.source] ?? d.source, value: d.count }));

  const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;

  const recentLeads = leads.slice(0, 8);

  const healthGaugeData = [{ name: "Health", value: healthScore, fill: healthScore >= 80 ? "#22C55E" : healthScore >= 60 ? G : "#EF4444" }];

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex" }}>
      <Sidebar variant="client" businessName={business.name} ownerName={business.owner_name} slug={slug} healthScore={healthScore} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="pt-14 lg:pt-0">

        {/* Action banner */}
        {(missedThisWeek.length > 0 || criticalAlerts > 0) && (
          <div style={{ background: G, padding: "12px 32px", display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={14} color={BG} />
            <span style={{ fontFamily: BEBAS, fontSize: 17, letterSpacing: "0.06em", color: BG }}>
              {missedThisWeek.length > 0
                ? `${missedThisWeek.length} MISSED CALL${missedThisWeek.length > 1 ? "S" : ""} — FOLLOW UP NOW`
                : `${criticalAlerts} CRITICAL ALERT${criticalAlerts > 1 ? "S" : ""} REQUIRE ACTION`}
            </span>
            <button onClick={() => router.push(`/${slug}/leads`)} style={{ marginLeft: "auto", background: "rgba(0,0,0,0.15)", border: "none", color: BG, fontFamily: BEBAS, fontSize: 13, letterSpacing: "0.08em", cursor: "pointer", padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
              VIEW <ChevronRight size={11} />
            </button>
          </div>
        )}

        {/* Topbar */}
        <div style={{ padding: "20px 32px", borderBottom: `1px solid ${BD}`, background: BG, position: "sticky", top: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: BEBAS, fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 400, color: TXT, letterSpacing: "0.06em", lineHeight: 1 }}>
              GOOD {timeLabel}, {firstName}.
            </h1>
            <p style={{ fontFamily: INTER, fontSize: 11, color: MUT, marginTop: 4 }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ padding: "6px 14px", border: `1px solid ${BD}`, fontFamily: INTER, fontSize: 11, color: MUT }}>Last 7 days</div>
            <button onClick={fetchData} title="Refresh"
              style={{ background: "transparent", border: `1px solid ${BD}`, color: DIM, padding: "8px", cursor: "pointer", display: "flex", transition: "border-color 0.2s, color 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(198,161,91,0.3)"; (e.currentTarget as HTMLElement).style.color = G; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BD; (e.currentTarget as HTMLElement).style.color = DIM; }}
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Stat cards + health gauge */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr) 200px", gap: 1, background: BD }} className="stat-grid">
            <StatCard label="Active Leads" value={activeLeads.length} sub="Need follow-up" color={G} spark={sparkActive} icon={<TrendingUp size={13} />} />
            <StatCard label="Missed Calls" value={missedThisWeek.length} sub="This week" color={missedThisWeek.length > 0 ? "#EF4444" : "#22C55E"} spark={sparkMissed} icon={<Phone size={13} />} />
            <StatCard label="Avg Response" value={avgResp > 0 ? formatSeconds(avgResp) : "—"} sub="Per lead" color="#3B82F6" spark={sparkResp} icon={<Clock size={13} />} />
            <StatCard label="Recovered" value={recovered.length} sub="Booked + closed" color="#22C55E" spark={sparkRec} icon={<TrendingUp size={13} />} />
            {/* Health gauge */}
            <div style={{ background: CARD, padding: "20px 22px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: INTER, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: MUT, marginBottom: 8 }}>Health</span>
              <RadialBarChart width={100} height={80} innerRadius={28} outerRadius={44} data={healthGaugeData} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={4} background={{ fill: BD }} />
              </RadialBarChart>
              <div style={{ fontFamily: BEBAS, fontSize: 28, color: healthScore >= 80 ? "#22C55E" : healthScore >= 60 ? G : "#EF4444", lineHeight: 1, marginTop: -4 }}>{healthScore}</div>
              <Activity size={12} color={MUT} style={{ marginTop: 2 }} />
            </div>
          </div>

          {/* Lead flow + channel donut */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 1, background: BD }}>
            <div style={{ background: CARD }}>
              <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BD}` }}>
                <h2 style={{ fontFamily: BEBAS, fontSize: 20, fontWeight: 400, color: TXT, letterSpacing: "0.06em" }}>Lead Flow — Last 7 Days</h2>
              </div>
              <div style={{ padding: "16px 12px 12px", height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={flowData} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BD} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: DIM, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: DIM, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TIP} cursor={{ stroke: "rgba(198,161,91,0.1)", strokeWidth: 1 }} />
                    <Line type="monotone" dataKey="incoming" stroke={G} strokeWidth={2} dot={false} name="Incoming" />
                    <Line type="monotone" dataKey="contacted" stroke="#3B82F6" strokeWidth={2} dot={false} name="Contacted" />
                    <Line type="monotone" dataKey="converted" stroke="#22C55E" strokeWidth={2} dot={false} name="Converted" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", gap: 20, padding: "0 24px 16px" }}>
                {[{ label: "Incoming", color: G }, { label: "Contacted", color: "#3B82F6" }, { label: "Converted", color: "#22C55E" }].map(({ label, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 20, height: 2, background: color }} />
                    <span style={{ fontFamily: INTER, fontSize: 10, color: MUT }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Channel donut */}
            <div style={{ background: CARD }}>
              <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BD}` }}>
                <h2 style={{ fontFamily: BEBAS, fontSize: 20, fontWeight: 400, color: TXT, letterSpacing: "0.06em" }}>Channels</h2>
              </div>
              <div style={{ padding: "16px 0 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {sourceData.length > 0 ? (
                  <PieChart width={180} height={180}>
                    <Pie data={sourceData} cx={90} cy={90} innerRadius={52} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {sourceData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={TIP} />
                  </PieChart>
                ) : (
                  <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: DIM, fontFamily: INTER, fontSize: 12 }}>No data</div>
                )}
                <div style={{ width: "100%", padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {sourceData.map((d, i) => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        <span style={{ fontFamily: INTER, fontSize: 11, color: MUT }}>{d.name}</span>
                      </div>
                      <span style={{ fontFamily: BEBAS, fontSize: 16, color: TXT }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent leads + alerts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 1, background: BD }}>
            <div style={{ background: CARD }}>
              <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BD}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontFamily: BEBAS, fontSize: 20, fontWeight: 400, color: TXT, letterSpacing: "0.06em" }}>Recent Leads</h2>
                <button onClick={() => router.push(`/${slug}/leads`)} style={{ fontFamily: INTER, fontSize: 11, color: DIM, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "color 0.15s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = G)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = DIM)}
                >View all <ChevronRight size={11} /></button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>{["Name", "Source", "Status", "Response"].map((h) => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {recentLeads.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: "center", color: DIM }}>No leads yet</td></tr>
                    ) : recentLeads.map((lead) => {
                      const sc = STATUS_COLORS[lead.status] ?? MUT;
                      return (
                        <tr key={lead.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/${slug}/leads`)}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 12 }}>{lead.name || "Unknown"}</div>
                            {lead.phone && <div style={{ fontSize: 11, color: DIM }}>{lead.phone}</div>}
                          </td>
                          <td style={{ fontSize: 12, color: MUT }}>{SOURCE_LABELS[lead.source] ?? lead.source}</td>
                          <td>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: sc }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc, display: "inline-block" }} />{lead.status}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: lead.response_time_seconds ? TXT : DIM }}>
                            {lead.response_time_seconds ? formatSeconds(lead.response_time_seconds) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alerts */}
            <div style={{ background: CARD }}>
              <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BD}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontFamily: BEBAS, fontSize: 20, fontWeight: 400, color: TXT, letterSpacing: "0.06em" }}>Alerts</h2>
                {alerts.length > 0 && <span style={{ fontFamily: INTER, fontSize: 11, color: "#EF4444", fontWeight: 600 }}>{alerts.length} open</span>}
              </div>
              <div>
                {alerts.length === 0 ? (
                  <div style={{ padding: "32px 24px", textAlign: "center", color: DIM, fontFamily: INTER, fontSize: 13 }}>No active alerts</div>
                ) : alerts.slice(0, 6).map((alert, i) => {
                  const c = alert.severity === "critical" ? "#EF4444" : alert.severity === "warning" ? G : "#3B82F6";
                  return (
                    <div key={alert.id}
                      style={{ padding: "13px 20px", borderBottom: i < Math.min(alerts.length, 6) - 1 ? `1px solid ${BD}` : "none", display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", transition: "background 0.15s" }}
                      onClick={() => router.push(`/${slug}/alerts`)}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#0E0E0E")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      <div style={{ width: 3, height: 36, background: c, flexShrink: 0, marginTop: 2 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: INTER, fontSize: 12, fontWeight: 600, color: TXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{alert.title}</div>
                        <div style={{ fontFamily: INTER, fontSize: 11, color: MUT, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{alert.description.slice(0, 50)}{alert.description.length > 50 ? "…" : ""}</div>
                      </div>
                    </div>
                  );
                })}
                {alerts.length > 0 && (
                  <button onClick={() => router.push(`/${slug}/alerts`)} style={{ width: "100%", padding: "11px 20px", background: "transparent", border: "none", borderTop: `1px solid ${BD}`, color: DIM, fontFamily: INTER, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "color 0.15s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = G)}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = DIM)}
                  >View all alerts <ChevronRight size={11} /></button>
                )}
              </div>
            </div>
          </div>

          {/* Response time chart */}
          <div style={{ background: CARD, border: `1px solid ${BD}` }}>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BD}` }}>
              <h2 style={{ fontFamily: BEBAS, fontSize: 20, fontWeight: 400, color: TXT, letterSpacing: "0.06em" }}>Response Time — Last 7 Days</h2>
              <p style={{ fontFamily: INTER, fontSize: 11, color: MUT, marginTop: 2 }}>Average minutes to first response</p>
            </div>
            <div style={{ padding: "16px 12px 12px", height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={responseData} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
                  <defs>
                    <linearGradient id="respGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={G} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={G} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={BD} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: DIM, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: DIM, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TIP} formatter={(v) => [`${v} min`, "Avg Response"]} />
                  <Area type="monotone" dataKey="minutes" stroke={G} strokeWidth={2} fill="url(#respGrad)" dot={false} name="Minutes" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 1024px) { .stat-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 768px) { .stat-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
