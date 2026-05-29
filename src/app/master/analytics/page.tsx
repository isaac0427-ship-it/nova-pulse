"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { BarChart2, TrendingUp, Activity } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend,
} from "recharts";
import type { Business } from "@/types";

interface ClientRow extends Business {
  lead_count?: number;
  health_score?: number;
  active_leads?: number;
  missed_calls?: number;
  alert_count?: number;
}

const TOOLTIP_STYLE = {
  background: "#111827", border: "1px solid #1E2D3D", borderRadius: 0,
  fontSize: 12, color: "#F8FAFC", padding: "8px 14px",
};

export default function MasterAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [userName, setUserName] = useState("");

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
    setClients(json.businesses ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const healthData = clients.map((c) => ({
    name: c.name.split(" ")[0],
    health: c.health_score ?? 0,
    leads: c.lead_count ?? 0,
    missed: c.missed_calls ?? 0,
  })).sort((a, b) => b.health - a.health);

  const sourceData = [
    { source: "Phone", value: clients.reduce((s, c) => s + (c.missed_calls ?? 0) * 3, 0) },
    { source: "Web Form", value: clients.reduce((s, c) => s + (c.active_leads ?? 0), 0) },
    { source: "Email", value: Math.round(clients.reduce((s, c) => s + (c.lead_count ?? 0), 0) * 0.15) },
    { source: "SMS", value: Math.round(clients.reduce((s, c) => s + (c.lead_count ?? 0), 0) * 0.1) },
  ];

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
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em", marginTop: 4 }}>Analytics</h1>
        </div>

        <div style={{ flex: 1, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Client health comparison */}
          <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D" }}>
              <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, fontWeight: 600, color: "#F8FAFC" }}>Client Health Comparison</h2>
            </div>
            <div style={{ padding: "24px", height: 280 }}>
              {healthData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#4A5568", fontSize: 11 }} domain={[0, 100]} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(201,168,76,0.04)" }} />
                    <Bar dataKey="health" fill="#C9A84C" name="Health Score" maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#4A5568", fontSize: 13 }}>
                  No client data yet
                </div>
              )}
            </div>
          </div>

          {/* Lead volume + source breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#1E2D3D" }}>
            <div style={{ background: "#111827" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D" }}>
                <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, fontWeight: 600, color: "#F8FAFC" }}>Lead Volume by Client</h2>
              </div>
              <div style={{ padding: "24px", height: 260 }}>
                {healthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={healthData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(201,168,76,0.04)" }} />
                      <Bar dataKey="leads" fill="#3B82F6" name="Total Leads" maxBarSize={40} />
                      <Bar dataKey="missed" fill="#EF4444" name="Missed Calls" maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#4A5568", fontSize: 13 }}>No data</div>
                )}
              </div>
            </div>

            <div style={{ background: "#111827" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D" }}>
                <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, fontWeight: 600, color: "#F8FAFC" }}>Lead Sources (Estimated)</h2>
              </div>
              <div style={{ padding: "24px", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="source" type="category" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(201,168,76,0.04)" }} />
                    <Bar dataKey="value" fill="#C9A84C" name="Leads" maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Summary table */}
          <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D" }}>
              <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, fontWeight: 600, color: "#F8FAFC" }}>Client Summary</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {["Client", "Health", "Total Leads", "Active", "Missed Calls", "Alerts"].map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/${c.slug}`)}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: c.health_score && c.health_score >= 80 ? "#10B981" : c.health_score && c.health_score >= 60 ? "#F59E0B" : "#EF4444" }}>
                          {c.health_score ?? "—"}
                        </span>
                      </td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>{c.lead_count ?? 0}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>{c.active_leads ?? 0}</td>
                      <td><span style={{ color: (c.missed_calls ?? 0) > 0 ? "#EF4444" : "#4A5568" }}>{c.missed_calls ?? 0}</span></td>
                      <td><span style={{ color: (c.alert_count ?? 0) > 0 ? "#F59E0B" : "#4A5568" }}>{c.alert_count ?? 0}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
