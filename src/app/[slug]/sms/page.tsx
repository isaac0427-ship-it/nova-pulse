"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { MessageSquare } from "lucide-react";
import type { Business, Lead } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatSeconds(s: number) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${(s / 3600).toFixed(1)}h`;
}

export default function SmsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [smsLeads, setSmsLeads] = useState<Lead[]>([]);

  const fetchData = useCallback(async () => {
    if (!slug) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const res = await fetch(`/api/admin/businesses/${slug}`);
    if (!res.ok) { router.push("/login"); return; }
    const json = await res.json();
    setBusiness(json.business);
    setSmsLeads((json.leads ?? []).filter((l: Lead) => l.source === "sms"));
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

  const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    new: { color: "#C6A15B", bg: "rgba(198,161,91,0.1)" },
    contacted: { color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
    waiting: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
    booked: { color: "#10B981", bg: "rgba(16,185,129,0.1)" },
    closed: { color: "#10B981", bg: "rgba(16,185,129,0.1)" },
    lost: { color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
    ignored: { color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
    quoted: { color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", display: "flex" }}>
      <Sidebar variant="client" businessName={business.name} ownerName={business.owner_name} slug={slug} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="pt-14 lg:pt-0">
        <div style={{ padding: "20px 32px", borderBottom: "1px solid #1E2D3D", background: "#080C14", position: "sticky", top: 0, zIndex: 30 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A5568" }}>{business.name}</p>
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em", marginTop: 4 }}>SMS</h1>
        </div>

        <div style={{ flex: 1, padding: "24px 32px" }}>
          <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D", display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare size={14} color="#C6A15B" strokeWidth={1.5} />
              <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, fontWeight: 600, color: "#F8FAFC" }}>SMS Leads</h2>
              <span style={{ fontSize: 11, color: "#4A5568", marginLeft: 4 }}>{smsLeads.length} total</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>{["Name", "Phone", "Status", "Response Time", "Date"].map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {smsLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "#4A5568", padding: "48px 0" }}>
                        No SMS leads yet. Connect Twilio to start tracking text messages.
                      </td>
                    </tr>
                  ) : (
                    smsLeads.map((lead) => {
                      const sc = STATUS_COLORS[lead.status] ?? { color: "#94A3B8", bg: "transparent" };
                      return (
                        <tr key={lead.id}>
                          <td style={{ fontWeight: 600 }}>{lead.name || "Unknown"}</td>
                          <td style={{ color: "#94A3B8", fontSize: 13 }}>{lead.phone || "—"}</td>
                          <td><span className="status-pill" style={{ color: sc.color, background: sc.bg }}>{lead.status}</span></td>
                          <td style={{ color: lead.response_time_seconds ? "#F8FAFC" : "#4A5568", fontVariantNumeric: "tabular-nums" }}>
                            {lead.response_time_seconds ? formatSeconds(lead.response_time_seconds) : "—"}
                          </td>
                          <td style={{ color: "#4A5568", fontSize: 12 }}>{formatDate(lead.created_at)}</td>
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
