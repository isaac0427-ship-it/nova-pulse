"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing } from "lucide-react";
import type { Business, Lead } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatSeconds(s: number) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${(s / 3600).toFixed(1)}h`;
}

export default function CallsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [calls, setCalls] = useState<Lead[]>([]);

  const fetchData = useCallback(async () => {
    if (!slug) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const res = await fetch(`/api/admin/businesses/${slug}`);
    if (!res.ok) { router.push("/login"); return; }
    const json = await res.json();
    setBusiness(json.business);
    setCalls((json.leads ?? []).filter((l: Lead) => l.source === "phone_call"));
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

  const answered = calls.filter((c) => c.response_time_seconds).length;
  const missed = calls.filter((c) => !c.response_time_seconds && ["new", "ignored"].includes(c.status)).length;

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", display: "flex" }}>
      <Sidebar variant="client" businessName={business.name} ownerName={business.owner_name} slug={slug} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="pt-14 lg:pt-0">
        <div style={{ padding: "20px 32px", borderBottom: "1px solid #1E2D3D", background: "#080C14", position: "sticky", top: 0, zIndex: 30 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A5568" }}>{business.name}</p>
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em", marginTop: 4 }}>Calls</h1>
        </div>

        <div style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "#1E2D3D" }}>
            {[
              { label: "Total Calls", value: calls.length, color: "#F8FAFC" },
              { label: "Answered", value: answered, color: "#10B981" },
              { label: "Missed", value: missed, color: missed > 0 ? "#EF4444" : "#10B981" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#111827", padding: "22px 24px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Calls table */}
          <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D", display: "flex", alignItems: "center", gap: 8 }}>
              <Phone size={14} color="#C6A15B" strokeWidth={1.5} />
              <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, fontWeight: 600, color: "#F8FAFC" }}>Call Log</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>{["Type", "Caller", "Status", "Response Time", "Date"].map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {calls.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", color: "#4A5568", padding: "48px 0" }}>No calls recorded yet</td></tr>
                  ) : (
                    calls.map((call) => {
                      const isMissed = !call.response_time_seconds && ["new", "ignored"].includes(call.status);
                      const Icon = isMissed ? PhoneMissed : PhoneIncoming;
                      const color = isMissed ? "#EF4444" : "#10B981";
                      return (
                        <tr key={call.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Icon size={13} color={color} />
                              <span style={{ fontSize: 12, color, fontWeight: 600 }}>{isMissed ? "Missed" : "Inbound"}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{call.name || "Unknown"}</div>
                            {call.phone && <div style={{ fontSize: 11, color: "#4A5568" }}>{call.phone}</div>}
                          </td>
                          <td>
                            <span className="status-pill" style={{ color: isMissed ? "#EF4444" : "#10B981", background: isMissed ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)" }}>
                              {call.status}
                            </span>
                          </td>
                          <td style={{ color: call.response_time_seconds ? "#F8FAFC" : "#4A5568", fontVariantNumeric: "tabular-nums" }}>
                            {call.response_time_seconds ? formatSeconds(call.response_time_seconds) : "No response"}
                          </td>
                          <td style={{ color: "#4A5568", fontSize: 12 }}>{formatDate(call.created_at)}</td>
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
