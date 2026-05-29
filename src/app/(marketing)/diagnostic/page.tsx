"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { NovaLogo } from "@/components/NovaLogo";

const BG = "#0A0A0A";
const CARD = "#111111";
const BD = "#1C1C1C";
const TXT = "#F5F5F5";
const MUT = "#555555";
const G = "#C6A15B";
const BEBAS = "var(--font-bebas), 'Bebas Neue', sans-serif";
const INTER = "var(--font-inter), 'Inter', system-ui, sans-serif";

const focusStyle = { borderColor: "rgba(198,161,91,0.5)", boxShadow: "0 0 0 3px rgba(198,161,91,0.05)" };

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: MUT, fontFamily: INTER }}>
        {label}{required && <span style={{ color: G, marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ placeholder, value, onChange, type = "text" }: { placeholder?: string; value: string; onChange: (v: string) => void; type?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ background: CARD, border: `1px solid ${BD}`, color: TXT, fontSize: 14, padding: "14px 16px", outline: "none", width: "100%", transition: "border-color 0.2s, box-shadow 0.2s", fontFamily: INTER, ...(focused ? focusStyle : {}) }}
    />
  );
}

function SelectInput({ options, value, onChange, placeholder }: { options: string[]; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ background: CARD, border: `1px solid ${BD}`, color: value ? TXT : MUT, fontSize: 14, padding: "14px 40px 14px 16px", outline: "none", width: "100%", transition: "border-color 0.2s, box-shadow 0.2s", fontFamily: INTER, appearance: "none", cursor: "pointer", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23555555' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", ...(focused ? focusStyle : {}) }}
    >
      {placeholder && <option value="" disabled style={{ background: CARD }}>{placeholder}</option>}
      {options.map((o) => <option key={o} value={o} style={{ background: CARD, color: TXT }}>{o}</option>)}
    </select>
  );
}

function TextareaInput({ placeholder, value, onChange, rows = 4 }: { placeholder?: string; value: string; onChange: (v: string) => void; rows?: number }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      rows={rows}
      style={{ background: CARD, border: `1px solid ${BD}`, color: TXT, fontSize: 14, padding: "14px 16px", outline: "none", width: "100%", transition: "border-color 0.2s, box-shadow 0.2s", fontFamily: INTER, resize: "vertical", lineHeight: 1.6, ...(focused ? focusStyle : {}) }}
    />
  );
}

const BUSINESS_TYPES = ["HVAC", "Plumbing", "Electrical", "Landscaping", "Roofing", "Auto Repair", "Restaurant", "Law Firm", "Medical Office", "Real Estate", "Other"];
const CALLS_PER_WEEK = ["1–5", "5–10", "10–20", "20+", "Don't know"];
const REFERRAL_SOURCES = ["Google Search", "Social Media", "Word of Mouth", "Email", "Referral from Another Business", "Other"];

export default function DiagnosticPage() {
  const [form, setForm] = useState({ full_name: "", business_name: "", business_type: "", phone: "", email: "", monthly_leads: "", biggest_challenge: "", referral_source: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (v: string) => setForm((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/diagnostic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const json = await res.json(); setError(json.error ?? "Something went wrong. Please try again."); setLoading(false); return; }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 40 }}>
        <NovaLogo size={48} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: BEBAS, fontSize: "clamp(56px, 10vw, 96px)", color: G, letterSpacing: "0.04em", lineHeight: 1 }}>RECEIVED.</div>
          <div style={{ fontFamily: INTER, fontSize: 16, color: MUT, marginTop: 20, lineHeight: 1.6 }}>We will contact you within 24 hours.</div>
        </div>
        <Link href="/" style={{ fontFamily: BEBAS, fontSize: 18, letterSpacing: "0.1em", color: G, textDecoration: "none", border: `1px solid rgba(198,161,91,0.3)`, padding: "14px 40px", transition: "background 0.2s" }}>
          BACK TO HOME
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TXT }}>
      <nav style={{ padding: "0 40px", borderBottom: `1px solid ${BD}`, display: "flex", alignItems: "center", height: 64, gap: 14 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <NovaLogo size={28} />
          <span style={{ fontFamily: BEBAS, fontSize: 18, letterSpacing: "0.08em", color: TXT }}>Nova Systems</span>
        </Link>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "72px 24px 100px" }}>
        <div style={{ marginBottom: 64 }}>
          <h1 style={{ fontFamily: BEBAS, fontSize: "clamp(40px, 7vw, 56px)", color: TXT, letterSpacing: "0.04em", lineHeight: 1, marginBottom: 16 }}>
            LET&apos;S FIND YOUR<br />BLIND SPOTS.
          </h1>
          <p style={{ fontFamily: INTER, fontSize: 16, color: MUT, lineHeight: 1.6 }}>
            Two minutes. We contact you within 24 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="diag-two-col">
            <Field label="Full Name" required>
              <TextInput placeholder="John Smith" value={form.full_name} onChange={set("full_name")} />
            </Field>
            <Field label="Business Name" required>
              <TextInput placeholder="Smith HVAC LLC" value={form.business_name} onChange={set("business_name")} />
            </Field>
          </div>

          <Field label="Business Type" required>
            <SelectInput options={BUSINESS_TYPES} value={form.business_type} onChange={set("business_type")} placeholder="Select your business type..." />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="diag-two-col">
            <Field label="Phone Number" required>
              <TextInput placeholder="(203) 555-0100" value={form.phone} onChange={set("phone")} type="tel" />
            </Field>
            <Field label="Email Address" required>
              <TextInput placeholder="you@company.com" value={form.email} onChange={set("email")} type="email" />
            </Field>
          </div>

          <Field label="Calls per Week">
            <SelectInput options={CALLS_PER_WEEK} value={form.monthly_leads} onChange={set("monthly_leads")} placeholder="Approximate range..." />
          </Field>

          <Field label="Biggest Operational Challenge">
            <TextareaInput
              placeholder="Missed calls, slow follow-up, no lead visibility..."
              value={form.biggest_challenge}
              onChange={set("biggest_challenge")}
              rows={4}
            />
          </Field>

          <Field label="How Did You Hear About Us?">
            <SelectInput options={REFERRAL_SOURCES} value={form.referral_source} onChange={set("referral_source")} placeholder="Select an option..." />
          </Field>

          {error && (
            <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", fontFamily: INTER, fontSize: 13, color: "#EF4444" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 16, background: loading ? "rgba(198,161,91,0.6)" : G, color: BG, border: "none", padding: "20px 32px", fontFamily: BEBAS, fontSize: 22, letterSpacing: "0.1em", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s, box-shadow 0.2s", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}
            onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLElement).style.background = "#D4B06A"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(198,161,91,0.25)"; } }}
            onMouseLeave={(e) => { if (!loading) { (e.currentTarget as HTMLElement).style.background = G; (e.currentTarget as HTMLElement).style.boxShadow = "none"; } }}
          >
            {loading ? (
              <>
                <span style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: BG, borderRadius: "50%", animation: "spin 0.9s linear infinite", display: "inline-block" }} />
                SUBMITTING
              </>
            ) : "SUBMIT REQUEST"}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) { .diag-two-col { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
