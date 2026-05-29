"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { Settings, User, Bell, Key, Shield } from "lucide-react";

export default function MasterSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Isaac");
    setUserEmail(user.email ?? "");

    const { data: userBiz } = await supabase.from("businesses").select("role").eq("owner_id", user.id).single();
    if (userBiz?.role !== "super_admin" && user.email !== "isaac_0427@icloud.com") { router.push("/login"); return; }
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080C14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <NovaLogo size={44} />
      </div>
    );
  }

  const SectionCard = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <div style={{ background: "#111827", border: "1px solid #1E2D3D" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E2D3D", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={14} color="#C9A84C" strokeWidth={1.5} />
        <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: "#F8FAFC" }}>{title}</h2>
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#F8FAFC", padding: "12px 14px", background: "#0D1421", border: "1px solid #1E2D3D" }}>{value}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", display: "flex" }}>
      <Sidebar variant="master" userName={userName} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="pt-14 lg:pt-0">
        <div style={{ padding: "20px 32px", borderBottom: "1px solid #1E2D3D", background: "#080C14", position: "sticky", top: 0, zIndex: 30 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A5568" }}>Master View</p>
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em", marginTop: 4 }}>Settings</h1>
        </div>

        <div style={{ flex: 1, padding: "28px 32px", maxWidth: 680 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SectionCard title="Profile" icon={User}>
              <Field label="Name" value={userName} />
              <Field label="Email" value={userEmail} />
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: 6 }}>Role</div>
                <span className="status-pill" style={{ color: "#C9A84C", background: "rgba(201,168,76,0.1)" }}>
                  <Shield size={9} />
                  Super Admin
                </span>
              </div>
            </SectionCard>

            <SectionCard title="Notifications" icon={Bell}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "New client alerts", desc: "Receive alerts when a new client has critical activity" },
                  { label: "Weekly summary email", desc: "System-wide summary every Monday morning" },
                  { label: "Missed call alerts", desc: "Notify when any client misses more than 5 calls" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F8FAFC" }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: "#4A5568", marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <div style={{ width: 36, height: 20, background: "#C9A84C", borderRadius: 10, position: "relative", flexShrink: 0, cursor: "pointer" }}>
                      <div style={{ width: 14, height: 14, background: "#080C14", borderRadius: "50%", position: "absolute", right: 3, top: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="API Keys" icon={Key}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Resend API Key", value: "re_•••••••••••••••••••••••••••••••" },
                  { label: "Supabase URL", value: "https://••••••••.supabase.co" },
                  { label: "Twilio SID", value: "AC•••••••••••••••••••••••••••••••" },
                ].map((k) => (
                  <div key={k.label}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: 6 }}>{k.label}</div>
                    <div style={{ fontSize: 13, color: "#4A5568", padding: "10px 14px", background: "#0D1421", border: "1px solid #1E2D3D", fontFamily: "monospace" }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
