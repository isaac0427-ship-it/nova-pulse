"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { Settings, Phone, Mail, Globe, Clock, Building2 } from "lucide-react";
import type { Business } from "@/types";

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, color: value ? "#F8FAFC" : "#333333", padding: "11px 14px", background: "#0D1421", border: "1px solid #1E2D3D" }}>
        {value || "Not configured"}
      </div>
    </div>
  );
}

export default function SettingsPage() {
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

  const SectionCard = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={14} color="#C6A15B" strokeWidth={1.5} />
        <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: "#F8FAFC" }}>{title}</h2>
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", display: "flex" }}>
      <Sidebar variant="client" businessName={business.name} ownerName={business.owner_name} slug={slug} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="pt-14 lg:pt-0">
        <div style={{ padding: "20px 32px", borderBottom: "1px solid #1E2D3D", background: "#080C14", position: "sticky", top: 0, zIndex: 30 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A5568" }}>{business.name}</p>
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em", marginTop: 4 }}>Settings</h1>
        </div>

        <div style={{ flex: 1, padding: "24px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 680 }}>
            <SectionCard title="Business Information" icon={Building2}>
              <InfoField label="Business Name" value={business.name} />
              <InfoField label="Industry" value={business.type?.replace(/_/g, " ")} />
              <InfoField label="Owner" value={business.owner_name} />
              <InfoField label="Portal URL" value={`nova-systems.app/${business.slug}`} />
            </SectionCard>

            <SectionCard title="Contact Details" icon={Phone}>
              <InfoField label="Phone Number" value={business.phone} />
              <InfoField label="Email" value={business.email} />
              <InfoField label="Website" value={business.website} />
            </SectionCard>

            <SectionCard title="Configuration" icon={Clock}>
              <InfoField label="Timezone" value={business.timezone} />
              <InfoField label="Twilio Number" value={business.twilio_number} />
              <div style={{ marginTop: 4, fontSize: 12, color: "#333333" }}>
                Gmail: {business.gmail_connected ? (
                  <span style={{ color: "#10B981" }}>Connected</span>
                ) : (
                  <span style={{ color: "#EF4444" }}>Not connected</span>
                )}
              </div>
            </SectionCard>

            <p style={{ fontSize: 12, color: "#333333" }}>
              To update your settings or configure integrations, contact Nova Systems at isaac_0427@icloud.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
