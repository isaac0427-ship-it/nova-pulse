"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { FileText, ExternalLink } from "lucide-react";

interface ClientSummary {
  id: string; name: string; slug: string;
  lead_count: number; health_score: number;
  missed_calls: number; active_leads: number;
}

function healthColor(score: number) {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

export default function MasterReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientSummary[]>([]);
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

  const totalLeads = clients.reduce((s, c) => s + c.lead_count, 0);
  const totalMissed = clients.reduce((s, c) => s + c.missed_calls, 0);
  const avgHealth = clients.length ? Math.round(clients.reduce((s, c) => s + c.health_score, 0) / clients.length) : 0;

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
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em", marginTop: 4 }}>Reports</h1>
        </div>

        <div style={{ flex: 1, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "#1E2D3D" }}>
            {[
              { label: "Total Leads", value: totalLeads.toLocaleString(), color: "#C9A84C" },
              { label: "Total Missed Calls", value: totalMissed, color: totalMissed > 0 ? "#EF4444" : "#10B981" },
              { label: "Avg Health Score", value: `${avgHealth}`, color: healthColor(avgHealth) },
            ].map((s) => (
              <div key={s.label} style={{ background: "#111827", padding: "24px 28px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: 10 }}>{s.label}</div>
                <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 36, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D", display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={14} color="#C9A84C" />
              <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, fontWeight: 600, color: "#F8FAFC" }}>Client Reports</h2>
            </div>
            <p style={{ padding: "16px 24px", fontSize: 13, color: "#4A5568", borderBottom: "1px solid #1E2D3D" }}>
              Click a client to view their full reports page with charts and generated weekly summaries.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>{["Client", "Health", "Total Leads", "Active", "Missed Calls", "Report"].map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {clients.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", color: "#4A5568", padding: "40px 0" }}>No clients to report on</td></tr>
                  ) : (
                    clients.map((c) => (
                      <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/${c.slug}/reports`)}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "#4A5568" }}>/{c.slug}</div>
                        </td>
                        <td><span style={{ fontWeight: 700, color: healthColor(c.health_score) }}>{c.health_score}</span></td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>{c.lead_count}</td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>{c.active_leads}</td>
                        <td><span style={{ color: c.missed_calls > 0 ? "#EF4444" : "#4A5568" }}>{c.missed_calls}</span></td>
                        <td>
                          <button style={{ background: "transparent", border: "1px solid #1E2D3D", color: "#4A5568", padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, transition: "border-color 0.15s, color 0.15s" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.3)"; (e.currentTarget as HTMLElement).style.color = "#C9A84C"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1E2D3D"; (e.currentTarget as HTMLElement).style.color = "#4A5568"; }}
                          >
                            <ExternalLink size={11} /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
