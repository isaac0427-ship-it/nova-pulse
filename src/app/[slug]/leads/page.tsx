"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { Search } from "lucide-react";
import type { Business, Lead } from "@/types";

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  new: { color: "#C6A15B", bg: "rgba(198,161,91,0.1)" },
  contacted: { color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  waiting: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  quoted: { color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  booked: { color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  closed: { color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  lost: { color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  ignored: { color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

const SOURCE_LABELS: Record<string, string> = {
  phone_call: "Phone", web_form: "Web Form", email: "Email", sms: "SMS", manual: "Manual",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatSeconds(s: number) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${(s / 3600).toFixed(1)}h`;
}

const ALL_STATUSES = ["all", "new", "contacted", "waiting", "quoted", "booked", "closed", "lost", "ignored"];
const DEAD_STATUSES = ["lost", "ignored"];

export default function LeadsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    if (!slug) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const res = await fetch(`/api/admin/businesses/${slug}`);
    if (!res.ok) { router.push("/login"); return; }
    const json = await res.json();
    setBusiness(json.business);
    setLeads(json.leads ?? []);
    setLoading(false);
  }, [slug, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = leads.filter((l) => {
    const matchStatus = filter === "all" ? true : filter === "dead" ? DEAD_STATUSES.includes(l.status) : l.status === filter;
    const matchSearch = !search || (l.name ?? "").toLowerCase().includes(search.toLowerCase()) || (l.phone ?? "").includes(search);
    return matchStatus && matchSearch;
  });

  if (loading || !business) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <NovaLogo size={44} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex" }}>
      <Sidebar variant="client" businessName={business.name} ownerName={business.owner_name} slug={slug} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="pt-14 lg:pt-0">
        <div style={{ padding: "20px 32px", borderBottom: "1px solid #1C1C1C", background: "#0A0A0A", position: "sticky", top: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#333333" }}>{business.name}</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#F5F5F5", letterSpacing: "-0.02em", marginTop: 4 }}>
              {filter === "dead" ? "Dead Leads" : "All Leads"}
            </h1>
          </div>
        </div>

        <div style={{ flex: 1, padding: "24px 32px" }}>
          <div style={{ background: "#111111", border: "1px solid #1C1C1C" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1C1C1C", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#333333" }} />
                <input placeholder="Search name, phone..." value={search} onChange={(e) => setSearch(e.target.value)}
                  style={{ background: "#07111F", border: "1px solid #1C1C1C", color: "#F5F5F5", fontSize: 13, padding: "8px 12px 8px 32px", outline: "none", width: "100%" }} />
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[...ALL_STATUSES, "dead"].map((s) => (
                  <button key={s} onClick={() => setFilter(s)}
                    style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, background: filter === s ? "#C6A15B" : "transparent", color: filter === s ? "#0A0A0A" : "#333333", border: `1px solid ${filter === s ? "#C6A15B" : "#1C1C1C"}`, cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize" }}>
                    {s === "all" ? "All" : s}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 12, color: "#333333" }}>{filtered.length} leads</span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>{["Name", "Source", "Status", "Response Time", "Date", "Notes"].map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", color: "#333333", padding: "48px 0" }}>No leads match this filter</td></tr>
                  ) : (
                    filtered.map((lead) => {
                      const sc = STATUS_COLORS[lead.status] ?? { color: "#555555", bg: "transparent" };
                      return (
                        <tr key={lead.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/${slug}/leads/${lead.id}`)}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{lead.name || "Unknown"}</div>
                            {lead.phone && <div style={{ fontSize: 11, color: "#333333" }}>{lead.phone}</div>}
                            {lead.email && <div style={{ fontSize: 11, color: "#333333" }}>{lead.email}</div>}
                          </td>
                          <td style={{ color: "#555555", fontSize: 12 }}>{SOURCE_LABELS[lead.source] ?? lead.source}</td>
                          <td>
                            <span className="status-pill" style={{ color: sc.color, background: sc.bg }}>{lead.status}</span>
                          </td>
                          <td className="tabular-nums" style={{ color: lead.response_time_seconds ? "#F5F5F5" : "#333333" }}>
                            {lead.response_time_seconds ? formatSeconds(lead.response_time_seconds) : "No response"}
                          </td>
                          <td style={{ color: "#333333", fontSize: 12 }}>{formatDate(lead.created_at)}</td>
                          <td style={{ color: "#333333", fontSize: 12, maxWidth: 200 }}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                              {lead.notes || "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
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
