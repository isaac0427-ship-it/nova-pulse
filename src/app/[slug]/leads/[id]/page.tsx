"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { ChevronLeft, Phone, Mail, MessageSquare, Clock, CheckCircle } from "lucide-react";
import type { Business, Lead, LeadStatus } from "@/types";

const STATUS_OPTIONS = ["new", "contacted", "waiting", "quoted", "booked", "closed", "lost", "ignored"];

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
  phone_call: "Phone Call", web_form: "Web Form", email: "Email", sms: "SMS", manual: "Manual Entry",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatSeconds(s: number) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${(s / 3600).toFixed(1)}h`;
}

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchData = useCallback(async () => {
    if (!slug || !id) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const [bizRes, leadRes] = await Promise.all([
      fetch(`/api/admin/businesses/${slug}`),
      supabase.from("leads").select("*").eq("id", id).maybeSingle(),
    ]);

    if (!bizRes.ok) { router.push("/login"); return; }
    const json = await bizRes.json();
    setBusiness(json.business);

    if (leadRes.data) {
      setLead(leadRes.data);
      setStatus(leadRes.data.status);
      setNotes(leadRes.data.notes ?? "");
    }
    setLoading(false);
  }, [slug, id, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("leads").update({ status, notes }).eq("id", lead.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setLead((prev) => prev ? { ...prev, status: status as LeadStatus, notes } : prev);
  };

  if (loading || !business || !lead) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <NovaLogo size={44} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const sc = STATUS_COLORS[lead.status] ?? { color: "#555555", bg: "transparent" };
  const age = Math.round((Date.now() - new Date(lead.created_at).getTime()) / 3600000);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex" }}>
      <Sidebar variant="client" businessName={business.name} ownerName={business.owner_name} slug={slug} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="pt-14 lg:pt-0">
        <div style={{ padding: "20px 32px", borderBottom: "1px solid #1C1C1C", background: "#0A0A0A", position: "sticky", top: 0, zIndex: 30, display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.push(`/${slug}/leads`)} style={{ background: "none", border: "none", color: "#555555", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#333333" }}>{business.name} / Leads</p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F5F5F5", letterSpacing: "-0.02em", marginTop: 2 }}>{lead.name || "Unknown Lead"}</h1>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span className="status-pill" style={{ color: sc.color, background: sc.bg, fontSize: 11 }}>{lead.status}</span>
          </div>
        </div>

        <div style={{ flex: 1, padding: "28px 32px", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>

          {/* Left column — lead info */}
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Contact info */}
            <div style={{ background: "#111111", border: "1px solid #1C1C1C" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #1C1C1C" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F5" }}>Contact Information</h2>
              </div>
              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                {lead.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Phone size={13} color="#333333" />
                    <span style={{ fontSize: 14, color: "#F5F5F5" }}>{lead.phone}</span>
                  </div>
                )}
                {lead.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Mail size={13} color="#333333" />
                    <span style={{ fontSize: 14, color: "#F5F5F5" }}>{lead.email}</span>
                  </div>
                )}
                {!lead.phone && !lead.email && (
                  <span style={{ fontSize: 13, color: "#333333" }}>No contact info</span>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div style={{ background: "#111111", border: "1px solid #1C1C1C" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #1C1C1C" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F5" }}>Timeline</h2>
              </div>
              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "flex", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#C6A15B", flexShrink: 0, marginTop: 4 }} />
                    <div style={{ width: 1, flex: 1, background: "#1C1C1C", marginTop: 6, marginBottom: 0 }} />
                  </div>
                  <div style={{ paddingBottom: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F5" }}>Lead created</div>
                    <div style={{ fontSize: 11, color: "#333333", marginTop: 3 }}>{formatDate(lead.created_at)}</div>
                    <div style={{ fontSize: 11, color: "#555555", marginTop: 4 }}>
                      Source: {SOURCE_LABELS[lead.source] ?? lead.source}
                    </div>
                  </div>
                </div>

                {lead.response_time_seconds && (
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", flexShrink: 0, marginTop: 4 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F5" }}>First response</div>
                      <div style={{ fontSize: 11, color: "#333333", marginTop: 3 }}>
                        Response time: {formatSeconds(lead.response_time_seconds)}
                      </div>
                    </div>
                  </div>
                )}

                {!lead.response_time_seconds && (
                  <div style={{ display: "flex", gap: 14, opacity: 0.5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1C1C1C", flexShrink: 0, marginTop: 4 }} />
                    <div style={{ fontSize: 13, color: "#333333" }}>No response recorded</div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ background: "#111111", border: "1px solid #1C1C1C" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #1C1C1C" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F5" }}>Lead Stats</h2>
              </div>
              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Age", value: age < 24 ? `${age} hours` : `${Math.floor(age / 24)} days` },
                  { label: "Source", value: SOURCE_LABELS[lead.source] ?? lead.source },
                  { label: "Response Time", value: lead.response_time_seconds ? formatSeconds(lead.response_time_seconds) : "None" },
                  { label: "Current Status", value: lead.status },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#333333" }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#F5F5F5", textTransform: "capitalize" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — edit */}
          <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Status update */}
            <div style={{ background: "#111111", border: "1px solid #1C1C1C" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #1C1C1C" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F5" }}>Update Status</h2>
              </div>
              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {STATUS_OPTIONS.map((s) => {
                  const sColor = STATUS_COLORS[s] ?? { color: "#555555", bg: "transparent" };
                  const isSelected = status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: isSelected ? sColor.bg : "transparent", border: `1px solid ${isSelected ? sColor.color : "#1C1C1C"}`, cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}
                    >
                      {isSelected ? <CheckCircle size={13} color={sColor.color} /> : <div style={{ width: 13, height: 13, borderRadius: "50%", border: "1px solid #1C1C1C" }} />}
                      <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? sColor.color : "#555555", textTransform: "capitalize" }}>{s}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div style={{ background: "#111111", border: "1px solid #1C1C1C" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #1C1C1C" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F5" }}>Notes</h2>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={5}
                  style={{ width: "100%", background: "#07111F", border: "1px solid #1C1C1C", color: "#F5F5F5", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", lineHeight: 1.6, transition: "border-color 0.2s" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(198,161,91,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#1C1C1C")}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-gold"
              style={{ width: "100%", padding: "14px" }}
            >
              {saved ? <><CheckCircle size={14} /> Saved</> : saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
