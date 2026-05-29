"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Mail, Lock, Shield, TrendingUp, Bell, Zap, BarChart2 } from "lucide-react";

const G = "#C6A15B";
const BG = "#0A0A0A";
const NAVY = "#080C14";
const CARD = "#111111";
const BD = "#2A2A2A";
const TXT = "#F5F4F0";
const MUT = "#6B7A8D";
const BEBAS = "var(--font-bebas), 'Bebas Neue', sans-serif";
const INTER = "var(--font-inter), 'Inter', system-ui, sans-serif";

function InputField({
  label, type, value, onChange, placeholder, icon: Icon, rightSlot,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon: React.ElementType; rightSlot?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontFamily: INTER, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: G }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <Icon size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: MUT }} />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          required
          style={{
            background: "#111111",
            border: `1px solid ${focused ? G : BD}`,
            color: TXT,
            fontSize: 14,
            padding: "13px 40px 13px 42px",
            outline: "none",
            width: "100%",
            transition: "border-color 0.2s",
            fontFamily: INTER,
            borderRadius: 4,
            boxSizing: "border-box",
          }}
        />
        {rightSlot && (
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
}

const features = [
  { icon: TrendingUp, label: "Track Every Lead", desc: "From first contact to closed deal — nothing slips through." },
  { icon: Bell, label: "Smart Alerts", desc: "Instant notifications when revenue is at risk." },
  { icon: Zap, label: "Automate Workflows", desc: "Follow-ups and callbacks run without lifting a finger." },
  { icon: BarChart2, label: "Drive Revenue", desc: "Clear reports showing exactly where money is being left." },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) { setError("Invalid email or password"); setLoading(false); return; }

    const userEmail = authData.session?.user?.email;
    if (userEmail === "isaac_0427@icloud.com") { window.location.replace("/master"); return; }

    const { data: biz } = await supabase.from("businesses").select("slug").eq("owner_id", authData.session!.user.id).maybeSingle();
    if (biz?.slug) { window.location.replace("/" + biz.slug); return; }

    setError("Contact Nova Systems to activate your portal.");
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: BG, fontFamily: INTER }}>
      {/* LEFT PANEL */}
      <div style={{
        width: "55%",
        background: NAVY,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "40px 48px",
      }}
        className="hide-mobile"
      >
        {/* Dot grid pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(198,161,91,0.13) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }} />

        {/* Diagonal accent line */}
        <div style={{
          position: "absolute", top: 0, right: 80, width: 1, height: "140%",
          background: `linear-gradient(to bottom, transparent, rgba(198,161,91,0.15), transparent)`,
          transform: "rotate(-15deg)", transformOrigin: "top center",
          pointerEvents: "none",
        }} />

        {/* Top logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
          <div style={{ width: 36, height: 36, background: G, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: BEBAS, fontSize: 22, color: BG }}>N</span>
          </div>
          <span style={{ fontFamily: BEBAS, fontSize: 20, letterSpacing: "0.1em", color: G }}>NOVA SYSTEMS</span>
        </div>

        {/* Center content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1, maxWidth: 420 }}>
          <div style={{ fontFamily: INTER, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: G, marginBottom: 20 }}>
            OPERATIONAL INTELLIGENCE.
          </div>

          <h1 style={{ fontFamily: BEBAS, fontSize: "3rem", color: TXT, lineHeight: 1, marginBottom: 4, letterSpacing: "0.04em" }}>
            TOTAL VISIBILITY.
          </h1>
          <h1 style={{ fontFamily: BEBAS, fontSize: "3rem", color: G, lineHeight: 1, marginBottom: 28, letterSpacing: "0.04em" }}>
            TOTAL CONTROL.
          </h1>

          <p style={{ fontFamily: INTER, fontSize: 15, color: MUT, maxWidth: 360, lineHeight: 1.7, marginBottom: 40 }}>
            Stop losing revenue to missed calls, slow follow-ups, and invisible leads.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 32, height: 32, background: "rgba(198,161,91,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={14} color={G} />
                </div>
                <div>
                  <div style={{ fontFamily: INTER, fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontFamily: INTER, fontSize: 12, color: MUT, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", zIndex: 1 }}>
          <Shield size={13} color={MUT} />
          <span style={{ fontFamily: INTER, fontSize: 11, color: MUT }}>Secure. Reliable. Built for scale.</span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", background: BG }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Mobile logo */}
          <div className="show-mobile" style={{ display: "none", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div style={{ width: 32, height: 32, background: G, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: BEBAS, fontSize: 18, color: BG }}>N</span>
            </div>
            <span style={{ fontFamily: BEBAS, fontSize: 18, letterSpacing: "0.08em", color: G }}>NOVA SYSTEMS</span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "inline-block" }}>
              <div style={{ fontFamily: INTER, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: G, marginBottom: 4 }}>WELCOME BACK</div>
              <div style={{ height: 2, background: G, borderRadius: 1 }} />
            </div>
            <h2 style={{ fontFamily: INTER, fontSize: 24, fontWeight: 700, color: TXT, marginTop: 16, marginBottom: 4 }}>
              Log in to Nova Systems
            </h2>
            <p style={{ fontFamily: INTER, fontSize: 13, color: MUT }}>Enter your credentials below</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <InputField label="Email Address" type="email" value={email} onChange={setEmail} placeholder="you@company.com" icon={Mail} />
            <InputField
              label="Password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder="••••••••••"
              icon={Lock}
              rightSlot={
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ background: "none", border: "none", cursor: "pointer", color: MUT, display: "flex", padding: 0 }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" style={{ accentColor: G, width: 14, height: 14 }} />
                <span style={{ fontFamily: INTER, fontSize: 13, color: MUT }}>Remember me</span>
              </label>
              <a href="#" style={{ fontFamily: INTER, fontSize: 13, color: G, textDecoration: "none" }}>Forgot password?</a>
            </div>

            {error && (
              <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", fontFamily: INTER, fontSize: 13, color: "#EF4444", borderRadius: 4 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ background: loading ? "rgba(198,161,91,0.6)" : G, color: BG, border: "none", padding: "15px", fontFamily: INTER, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s, box-shadow 0.2s", width: "100%", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
              onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLElement).style.background = "#D4B06A"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(198,161,91,0.3)"; } }}
              onMouseLeave={(e) => { if (!loading) { (e.currentTarget as HTMLElement).style.background = G; (e.currentTarget as HTMLElement).style.boxShadow = "none"; } }}
            >
              {loading ? (
                <><span style={{ width: 15, height: 15, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: BG, borderRadius: "50%", display: "inline-block", animation: "spin 0.9s linear infinite" }} />SIGNING IN</>
              ) : "LOG IN"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: BD }} />
            <span style={{ fontFamily: INTER, fontSize: 11, color: MUT, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: 1, background: BD }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {["Google", "Microsoft"].map((name) => (
              <button key={name} onClick={() => alert("Coming soon")}
                style={{ background: "#1E1E1E", border: `1px solid ${BD}`, color: TXT, fontFamily: INTER, fontSize: 13, fontWeight: 500, padding: "12px", cursor: "pointer", borderRadius: 4, transition: "border-color 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(198,161,91,0.3)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BD; }}
              >
                {name}
              </button>
            ))}
          </div>

          <p style={{ fontFamily: INTER, fontSize: 13, color: MUT, textAlign: "center", marginTop: 28 }}>
            Don&apos;t have an account?{" "}
            <a href="/diagnostic" style={{ color: G, textDecoration: "none", fontWeight: 600 }}>Book a demo →</a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
