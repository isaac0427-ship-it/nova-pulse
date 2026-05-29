"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { formatSeconds } from "@/lib/utils";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import type { Business, Lead } from "@/types";

const TOOLTIP_STYLE = { background: "#111827", border: "1px solid #1E2D3D", borderRadius: 0, fontSize: 12, color: "#F8FAFC", padding: "8px 14px" };

export default function TrendsPage() {
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

  const now = new Date();

  // Weekly aggregates for last 12 weeks
  const weeklyData = Array.from({ length: 12 }, (_, i) => {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekLeads = leads.filter((l) => { const d = new Date(l.created_at); return d >= weekStart && d < weekEnd; });
    const responded = weekLeads.filter((l) => l.response_time_seconds);
    const avgResponse = responded.length > 0 ? Math.round(responded.reduce((s, l) => s + (l.response_time_seconds ?? 0), 0) / responded.length) : 0;
    const conversion = weekLeads.length > 0 ? Math.round((weekLeads.filter((l) => l.status === "booked" || l.status === "closed").length / weekLeads.length) * 100) : 0;
    return {
      week: `W${12 - i}`,
      leads: weekLeads.length,
      missed: weekLeads.filter((l) => l.source === "phone_call" && !l.response_time_seconds).length,
      avgResponseMin: avgResponse > 0 ? Math.round(avgResponse / 60) : 0,
      conversion,
    };
  }).reverse();

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", display: "flex" }}>
      <Sidebar variant="client" businessName={business.name} ownerName={business.owner_name} slug={slug} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="pt-14 lg:pt-0">
        <div style={{ padding: "20px 32px", borderBottom: "1px solid #1E2D3D", background: "#080C14", position: "sticky", top: 0, zIndex: 30 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A5568" }}>{business.name}</p>
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em", marginTop: 4 }}>Trends</h1>
        </div>

        <div style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Lead volume trend */}
          <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D" }}>
              <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, fontWeight: 600, color: "#F8FAFC" }}>Lead Volume Trend — 12 Weeks</h2>
            </div>
            <div style={{ padding: "20px 12px", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C6A15B" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#C6A15B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="leads" stroke="#C6A15B" strokeWidth={2} fill="url(#leadGrad)" name="Leads" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Response time + conversion */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#1E2D3D" }}>
            <div style={{ background: "#111827" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D" }}>
                <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: "#F8FAFC" }}>Avg Response Time (min)</h3>
              </div>
              <div style={{ padding: "20px 12px", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" vertical={false} />
                    <XAxis dataKey="week" tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="avgResponseMin" stroke="#3B82F6" strokeWidth={2} dot={false} name="Min" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: "#111827" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D" }}>
                <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: "#F8FAFC" }}>Conversion Rate (%)</h3>
              </div>
              <div style={{ padding: "20px 12px", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" vertical={false} />
                    <XAxis dataKey="week" tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}%`, "Conversion"]} />
                    <Line type="monotone" dataKey="conversion" stroke="#10B981" strokeWidth={2} dot={false} name="%" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Missed calls trend */}
          <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D" }}>
              <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: "#F8FAFC" }}>Missed Calls Trend</h3>
            </div>
            <div style={{ padding: "20px 12px", height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="missedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="missed" stroke="#EF4444" strokeWidth={2} fill="url(#missedGrad)" name="Missed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
