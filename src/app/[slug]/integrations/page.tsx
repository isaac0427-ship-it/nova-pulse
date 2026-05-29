"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { Phone, Mail, Webhook, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import type { Business } from "@/types";

export default function IntegrationsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);

  const fetchData = useCallback(async () => {
    if (!slug) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const res = await fetch(`/api/admin/businesses/${slug}`);
    if (!res.ok) { router.push("/login"); return; }
    const json = await res.json();
    setBusiness(json.business);
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

  const hasTwilio = !!business.twilio_number;
  const hasGmail = business.gmail_connected;

  const integrations = [
    {
      icon: Phone,
      name: "Twilio",
      description: "Phone call and SMS tracking. All inbound calls route through your Twilio number and are logged automatically.",
      connected: hasTwilio,
      detail: hasTwilio ? `Number: ${business.twilio_number}` : "No number assigned",
      webhookLabel: "Voice Webhook",
      webhook: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://nova-systems.app"}/api/webhooks/twilio/voice`,
      smsWebhookLabel: "SMS Webhook",
      smsWebhook: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://nova-systems.app"}/api/webhooks/twilio/sms`,
    },
    {
      icon: Mail,
      name: "Gmail",
      description: "Email lead tracking. When a lead emails your connected Gmail account, it is automatically logged as a lead.",
      connected: hasGmail,
      detail: hasGmail ? "Connected" : "Not connected",
      webhookLabel: null,
      webhook: null,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", display: "flex" }}>
      <Sidebar variant="client" businessName={business.name} ownerName={business.owner_name} slug={slug} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="pt-14 lg:pt-0">
        <div style={{ padding: "20px 32px", borderBottom: "1px solid #1E2D3D", background: "#080C14", position: "sticky", top: 0, zIndex: 30 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A5568" }}>{business.name}</p>
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em", marginTop: 4 }}>Integrations</h1>
        </div>

        <div style={{ flex: 1, padding: "24px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
            {integrations.map((int) => {
              const IntIcon = int.icon;
              return (
                <div key={int.name} style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid #1E2D3D", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: "rgba(198,161,91,0.08)", border: "1px solid rgba(198,161,91,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <IntIcon size={18} color="#C6A15B" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#F8FAFC" }}>{int.name}</div>
                        <div style={{ fontSize: 11, color: "#4A5568", marginTop: 1 }}>{int.detail}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {int.connected
                        ? <><CheckCircle size={14} color="#10B981" /><span style={{ fontSize: 12, color: "#10B981", fontWeight: 600 }}>Connected</span></>
                        : <><AlertCircle size={14} color="#EF4444" /><span style={{ fontSize: 12, color: "#EF4444", fontWeight: 600 }}>Not Connected</span></>
                      }
                    </div>
                  </div>
                  <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                    <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.6 }}>{int.description}</p>
                    {int.webhook && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: 8 }}>{int.webhookLabel}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <code style={{ flex: 1, fontSize: 12, color: "#94A3B8", background: "#0D1421", border: "1px solid #1E2D3D", padding: "10px 14px", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {int.webhook}
                          </code>
                        </div>
                      </div>
                    )}
                    {int.smsWebhook && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: 8 }}>{int.smsWebhookLabel}</div>
                        <code style={{ display: "block", fontSize: 12, color: "#94A3B8", background: "#0D1421", border: "1px solid #1E2D3D", padding: "10px 14px", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {int.smsWebhook}
                        </code>
                      </div>
                    )}
                    {!int.connected && (
                      <p style={{ fontSize: 12, color: "#4A5568" }}>
                        Contact Nova Systems to configure this integration for your account.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
