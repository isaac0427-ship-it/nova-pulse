"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { Search, ExternalLink } from "lucide-react";

interface LeadRow {
  id: string;
  business_id: string;
  business_name?: string;
  business_slug?: string;
  name?: string;
  phone?: string;
  email?: string;
  source: string;
  status: string;
  first_contact_at: string;
  response_time_seconds?: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  new: { color: "#C6A15B", bg: "rgba(198,161,91,0.1)" },
  contacted: { color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  waiting: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  quoted: { color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  booked: { color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  closed: { color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  lost: { color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  ignored: { color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

const SOURCE_LABELS: Record<string, string> = {
  phone_call: "Phone", web_form: "Web Form", email: "Email", sms: "SMS", manual: "Manual",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatSeconds(s: number) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${(s / 3600).toFixed(1)}h`;
}

export default function MasterLeadsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [userName, setUserName] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Isaac");

    const { data: userBiz } = await supabase.from("businesses").select("role").eq("owner_id", user.id).single();
    if (userBiz?.role !== "super_admin" && user.email !== "isaac_0427@icloud.com") { router.push("/login"); return; }

    // Fetch all clients, then aggregate their leads
    const res = await fetch("/api/admin/businesses");
    if (!res.ok) { router.push("/login"); return; }
    const json = await res.json();
    const bizList = json.businesses ?? [];

    // For each business, fetch their leads
    const allLeads: LeadRow[] = [];
    await Promise.all(
      bizList.slice(0, 10).map(async (biz: { slug: string; id: string; name: string }) => {
        const r = await fetch(`/api/admin/businesses/${biz.slug}`);
        if (r.ok) {
          const d = await r.json();
          (d.leads ?? []).forEach((l: LeadRow) => {
            allLeads.push({ ...l, business_name: biz.name, business_slug: biz.slug });
          });
        }
      })
    );

    allLeads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setLeads(allLeads);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = leads.filter((l) => {
    const matchSearch = !search || (l.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (l.phone ?? "").includes(search) || (l.business_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

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
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em", marginTop: 4 }}>All Leads</h1>
        </div>

        <div style={{ flex: 1, padding: "28px 32px" }}>
          <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#4A5568" }} />
                <input
                  placeholder="Search leads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ background: "#0D1421", border: "1px solid #1E2D3D", color: "#F8FAFC", fontSize: 13, padding: "8px 12px 8px 32px", outline: "none", width: "100%", fontFamily: '"Inter", system-ui, sans-serif' }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ background: "#0D1421", border: "1px solid #1E2D3D", color: "#94A3B8", fontSize: 13, padding: "8px 12px", outline: "none", fontFamily: '"Inter", system-ui, sans-serif', cursor: "pointer" }}
              >
                {["all", "new", "contacted", "waiting", "quoted", "booked", "closed", "lost", "ignored"].map((s) => (
                  <option key={s} value={s} style={{ background: "#111827" }}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <span style={{ fontSize: 12, color: "#4A5568" }}>{filtered.length} leads</span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {["Name", "Client", "Source", "Status", "Response Time", "Date", ""].map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((lead) => {
                    const sc = STATUS_COLORS[lead.status] ?? { color: "#94A3B8", bg: "rgba(148,163,184,0.1)" };
                    return (
                      <tr key={lead.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: "#F8FAFC" }}>{lead.name || "Unknown"}</div>
                          {lead.phone && <div style={{ fontSize: 11, color: "#4A5568", marginTop: 1 }}>{lead.phone}</div>}
                        </td>
                        <td>
                          <span
                            style={{ fontSize: 12, color: "#C6A15B", cursor: "pointer" }}
                            onClick={() => router.push(`/${lead.business_slug}`)}
                          >
                            {lead.business_name}
                          </span>
                        </td>
                        <td style={{ color: "#94A3B8", fontSize: 12 }}>{SOURCE_LABELS[lead.source] ?? lead.source}</td>
                        <td>
                          <span className="status-pill" style={{ color: sc.color, background: sc.bg }}>{lead.status}</span>
                        </td>
                        <td style={{ color: lead.response_time_seconds ? "#F8FAFC" : "#4A5568", fontVariantNumeric: "tabular-nums" }}>
                          {lead.response_time_seconds ? formatSeconds(lead.response_time_seconds) : "—"}
                        </td>
                        <td style={{ color: "#4A5568", fontSize: 12 }}>{formatDate(lead.created_at)}</td>
                        <td>
                          <button
                            onClick={() => router.push(`/${lead.business_slug}/leads`)}
                            style={{ background: "transparent", border: "none", color: "#4A5568", cursor: "pointer", padding: "4px", display: "flex", transition: "color 0.15s" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C6A15B")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#4A5568")}
                          >
                            <ExternalLink size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: "center", color: "#4A5568", padding: "40px 0" }}>No leads found</td></tr>
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
