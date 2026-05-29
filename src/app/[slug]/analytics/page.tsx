"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { calculateOperationalScore, formatSeconds } from "@/lib/utils";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import type { Business, Lead } from "@/types";

const TOOLTIP_STYLE = { background: "#111827", border: "1px solid #1E2D3D", borderRadius: 0, fontSize: 12, color: "#F8FAFC", padding: "8px 14px" };
const PIE_COLORS = ["#C6A15B", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"];

export default function ClientAnalyticsPage() {
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

  // 30-day lead volume
  const now = new Date();
  const volumeData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const de = new Date(ds); de.setDate(de.getDate() + 1);
    const label = i % 7 === 0 ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
    const count = leads.filter((l) => { const c = new Date(l.created_at); return c >= ds && c < de; }).length;
    return { date: label, count, fullDate: d.toLocaleDateString() };
  });

  // Source breakdown
  const sourceMap: Record<string, number> = {};
  leads.forEach((l) => { sourceMap[l.source] = (sourceMap[l.source] ?? 0) + 1; });
  const sourceData = Object.entries(sourceMap).map(([source, value]) => ({
    name: { phone_call: "Phone", web_form: "Web", email: "Email", sms: "SMS", manual: "Manual" }[source] ?? source, value,
  }));

  // Conversion funnel
  const statusOrder = ["new", "contacted", "quoted", "booked", "closed"];
  const funnelData = statusOrder.map((s) => ({
    stage: s.charAt(0).toUpperCase() + s.slice(1),
    count: leads.filter((l) => l.status === s).length,
  }));

  // Response time buckets
  const responded = leads.filter((l) => l.response_time_seconds);
  const rtBuckets = [
    { label: "< 5 min", count: responded.filter((l) => (l.response_time_seconds ?? 0) < 300).length },
    { label: "5-30 min", count: responded.filter((l) => { const s = l.response_time_seconds ?? 0; return s >= 300 && s < 1800; }).length },
    { label: "30-60 min", count: responded.filter((l) => { const s = l.response_time_seconds ?? 0; return s >= 1800 && s < 3600; }).length },
    { label: "1-4 hr", count: responded.filter((l) => { const s = l.response_time_seconds ?? 0; return s >= 3600 && s < 14400; }).length },
    { label: "4+ hr", count: responded.filter((l) => (l.response_time_seconds ?? 0) >= 14400).length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", display: "flex" }}>
      <Sidebar variant="client" businessName={business.name} ownerName={business.owner_name} slug={slug} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="pt-14 lg:pt-0">
        <div style={{ padding: "20px 32px", borderBottom: "1px solid #1E2D3D", background: "#080C14", position: "sticky", top: 0, zIndex: 30 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A5568" }}>{business.name}</p>
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em", marginTop: 4 }}>Analytics</h1>
        </div>

        <div style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* 30-day volume */}
          <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D" }}>
              <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, fontWeight: 600, color: "#F8FAFC" }}>Lead Volume — Last 30 Days</h2>
            </div>
            <div style={{ padding: "20px 16px", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#4A5568", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(198,161,91,0.04)" }} />
                  <Bar dataKey="count" fill="#C6A15B" name="Leads" maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Source + Funnel */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#1E2D3D" }}>
            <div style={{ background: "#111827" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D" }}>
                <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: "#F8FAFC" }}>Source Breakdown</h3>
              </div>
              <div style={{ padding: "20px 8px", height: 220, display: "flex", alignItems: "center", gap: 16 }}>
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} cx="50%" cy="50%" outerRadius={70} dataKey="value" strokeWidth={0}>
                      {sourceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sourceData.map((s, i) => (
                    <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>{s.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#F8FAFC" }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: "#111827" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D" }}>
                <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: "#F8FAFC" }}>Conversion Funnel</h3>
              </div>
              <div style={{ padding: "20px 16px", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="stage" type="category" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="count" fill="#3B82F6" name="Leads" maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Response time */}
          <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D" }}>
              <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: "#F8FAFC" }}>Response Time Distribution</h3>
            </div>
            <div style={{ padding: "20px 16px", height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rtBuckets} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="#10B981" name="Leads" maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
