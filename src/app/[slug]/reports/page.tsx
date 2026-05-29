"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { calculateOperationalScore, formatSeconds } from "@/lib/utils";
import { FileText } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from "recharts";
import type { Business, Lead } from "@/types";

const TOOLTIP_STYLE = { background: "#111827", border: "1px solid #1E2D3D", borderRadius: 0, fontSize: 12, color: "#F8FAFC", padding: "8px 14px" };

const SOURCE_LABELS: Record<string, string> = {
  phone_call: "Phone", web_form: "Web Form", email: "Email", sms: "SMS", manual: "Manual",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New", contacted: "Contacted", waiting: "Waiting", quoted: "Quoted",
  booked: "Booked", closed: "Closed", lost: "Lost", ignored: "Ignored",
};

const CHART_COLORS = ["#C6A15B", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#94A3B8", "#4A5568"];

export default function ReportsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

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

  if (loading || !business) {
    return (
      <div style={{ minHeight: "100vh", background: "#080C14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <NovaLogo size={44} />
      </div>
    );
  }

  // Metrics
  const active = leads.filter((l) => ["new", "contacted", "waiting", "quoted"].includes(l.status)).length;
  const missedCalls = leads.filter((l) => l.source === "phone_call" && !l.response_time_seconds && ["new", "ignored"].includes(l.status)).length;
  const responded = leads.filter((l) => l.response_time_seconds);
  const avgResponse = responded.length > 0 ? Math.round(responded.reduce((s, l) => s + (l.response_time_seconds ?? 0), 0) / responded.length) : 0;
  const stalled = leads.filter((l) => l.status === "waiting").length;
  const score = calculateOperationalScore({ missed_calls: missedCalls, total_leads: leads.length, avg_response_time_seconds: avgResponse, stalled_leads: stalled, active_leads: active });

  // Source breakdown
  const sourceMap: Record<string, number> = {};
  leads.forEach((l) => { sourceMap[l.source] = (sourceMap[l.source] ?? 0) + 1; });
  const sourceData = Object.entries(sourceMap).map(([source, count]) => ({
    source: SOURCE_LABELS[source] ?? source, count,
  }));

  // Status breakdown
  const statusMap: Record<string, number> = {};
  leads.forEach((l) => { statusMap[l.status] = (statusMap[l.status] ?? 0) + 1; });
  const statusData = Object.entries(statusMap).map(([status, count]) => ({
    name: STATUS_LABELS[status] ?? status, value: count,
  }));

  // 7-day lead flow
  const now = new Date();
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const de = new Date(ds); de.setDate(de.getDate() + 1);
    const day = leads.filter((l) => { const c = new Date(l.created_at); return c >= ds && c < de; });
    return { date: label, new: day.filter((l) => l.status === "new").length, contacted: day.filter((l) => l.status === "contacted").length, booked: day.filter((l) => l.status === "booked").length };
  });

  // Weekly report text
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = leads.filter((l) => new Date(l.created_at) >= weekAgo);
  const bookedThisWeek = thisWeek.filter((l) => l.status === "booked" || l.status === "closed").length;
  const missedThisWeek = thisWeek.filter((l) => l.source === "phone_call" && !l.response_time_seconds).length;

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", display: "flex" }}>
      <Sidebar variant="client" businessName={business.name} ownerName={business.owner_name} slug={slug} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="pt-14 lg:pt-0">
        <div style={{ padding: "20px 32px", borderBottom: "1px solid #1E2D3D", background: "#080C14", position: "sticky", top: 0, zIndex: 30 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A5568" }}>{business.name}</p>
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em", marginTop: 4 }}>Reports</h1>
        </div>

        <div style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Key stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 1, background: "#1E2D3D" }}>
            {[
              { label: "Total Leads", value: leads.length, color: "#F8FAFC" },
              { label: "Active", value: active, color: "#C6A15B" },
              { label: "Missed Calls", value: missedCalls, color: missedCalls > 0 ? "#EF4444" : "#10B981" },
              { label: "Avg Response", value: avgResponse > 0 ? formatSeconds(avgResponse) : "—", color: "#3B82F6" },
              { label: "Health Score", value: score, color: score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#111827", padding: "20px 22px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Weekly summary */}
          <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D", display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={14} color="#C6A15B" />
              <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, fontWeight: 600, color: "#F8FAFC" }}>This Week&apos;s Summary</h2>
            </div>
            <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
              <div style={{ padding: "16px 20px", background: "#0D1421", border: "1px solid #1E2D3D" }}>
                <div style={{ fontSize: 11, color: "#4A5568", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>New Leads</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#C6A15B" }}>{thisWeek.length}</div>
              </div>
              <div style={{ padding: "16px 20px", background: "#0D1421", border: "1px solid #1E2D3D" }}>
                <div style={{ fontSize: 11, color: "#4A5568", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Converted</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#10B981" }}>{bookedThisWeek}</div>
              </div>
              <div style={{ padding: "16px 20px", background: "#0D1421", border: "1px solid #1E2D3D" }}>
                <div style={{ fontSize: 11, color: "#4A5568", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Missed Calls</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: missedThisWeek > 0 ? "#EF4444" : "#10B981" }}>{missedThisWeek}</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#1E2D3D" }}>
            <div style={{ background: "#111827" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D" }}>
                <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: "#F8FAFC" }}>Lead Flow (7 Days)</h3>
              </div>
              <div style={{ padding: "20px 12px", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="new" stroke="#C6A15B" strokeWidth={2} dot={false} name="New" />
                    <Line type="monotone" dataKey="contacted" stroke="#3B82F6" strokeWidth={2} dot={false} name="Contacted" />
                    <Line type="monotone" dataKey="booked" stroke="#10B981" strokeWidth={2} dot={false} name="Booked" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: "#111827" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D" }}>
                <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: "#F8FAFC" }}>Lead Sources</h3>
              </div>
              <div style={{ padding: "20px 12px", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" vertical={false} />
                    <XAxis dataKey="source" tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="count" fill="#C6A15B" name="Leads" maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Status breakdown */}
          <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D" }}>
              <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: "#F8FAFC" }}>Status Breakdown</h3>
            </div>
            <div style={{ padding: "24px", display: "flex", flexWrap: "wrap", gap: 10 }}>
              {statusData.map((s, i) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#0D1421", border: "1px solid #1E2D3D" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>{s.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC", fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                </div>
              ))}
              {statusData.length === 0 && <div style={{ fontSize: 13, color: "#4A5568" }}>No leads yet</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
