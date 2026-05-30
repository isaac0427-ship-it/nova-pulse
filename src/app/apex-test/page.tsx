"use client";

import { useState } from "react";

const BUSINESS_ID = "aaaaaaaa-0427-0427-0427-aaaaaaaaaaaa";

const SERVICES = [
  "Roof Repair",
  "Roof Replacement",
  "Leak Inspection",
  "Storm Damage",
  "New Construction",
  "Other",
];

export default function ApexTestPage() {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", service: "", message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email || !form.service) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: BUSINESS_ID,
          name: form.name,
          phone: form.phone,
          email: form.email,
          source: "form",
          notes: `${form.service}${form.message ? ` — ${form.message}` : ""}`,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 56, marginBottom: 24 }}>✅</div>
          <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 700, margin: "0 0 12px 0" }}>
            Request Received!
          </h2>
          <p style={{ color: "#aaa", fontSize: 17, lineHeight: 1.6, margin: "0 0 32px 0" }}>
            Thank you! We&apos;ll call you within 15 minutes to discuss your roofing needs.
          </p>
          <div style={{ background: "#1a1a1a", border: "1px solid #333", padding: "20px 24px", borderRadius: 8 }}>
            <p style={{ color: "#C6A15B", fontWeight: 700, margin: 0 }}>Apex Roofing & Repair</p>
            <p style={{ color: "#aaa", fontSize: 13, margin: "4px 0 0 0" }}>Licensed & Insured · Serving Connecticut</p>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 16px", background: "#1a1a1a",
    border: "1px solid #333", color: "#fff", fontSize: 15,
    borderRadius: 6, outline: "none", boxSizing: "border-box",
    fontFamily: "system-ui, sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", color: "#aaa", fontSize: 12,
    fontWeight: 600, letterSpacing: "0.08em",
    textTransform: "uppercase", marginBottom: 6,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1a1a1a", borderBottom: "1px solid #2a2a2a", padding: "18px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "#C6A15B", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: "#000" }}>
            A
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1 }}>Apex Roofing & Repair</div>
            <div style={{ color: "#aaa", fontSize: 12, marginTop: 2 }}>Licensed & Insured · Connecticut</div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)", padding: "48px 24px 40px", textAlign: "center", borderBottom: "1px solid #2a2a2a" }}>
        <h1 style={{ color: "#fff", fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 800, margin: "0 0 12px 0", lineHeight: 1.15 }}>
          Free Estimate Request
        </h1>
        <p style={{ color: "#C6A15B", fontSize: 16, fontWeight: 600, margin: 0 }}>
          We&apos;ll get back to you within 15 minutes
        </p>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px 80px" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <div>
              <label style={labelStyle}>Full Name *</label>
              <input
                type="text" required value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="John Smith"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input
                type="tel" required value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(203) 555-0100"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Email Address *</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="john@email.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Service Needed *</label>
              <select
                required value={form.service}
                onChange={(e) => set("service", e.target.value)}
                style={{ ...inputStyle, cursor: "pointer", appearance: "none", WebkitAppearance: "none" }}
              >
                <option value="">Select a service...</option>
                {SERVICES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Message <span style={{ color: "#555", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <textarea
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder="Tell us more about what you need..."
                rows={4}
                style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
              />
            </div>

            {error && (
              <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontSize: 14, borderRadius: 6 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "rgba(198,161,91,0.6)" : "#C6A15B",
                color: "#000", border: "none", padding: "16px",
                fontSize: 15, fontWeight: 800, letterSpacing: "0.08em",
                textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
                borderRadius: 6, width: "100%", transition: "background 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                  Submitting...
                </>
              ) : "GET MY FREE ESTIMATE"}
            </button>

          </div>
        </form>

        <p style={{ textAlign: "center", color: "#444", fontSize: 12, marginTop: 20, lineHeight: 1.6 }}>
          By submitting, you agree to be contacted by Apex Roofing & Repair.<br />
          We never share your information.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input:focus, select:focus, textarea:focus { border-color: #C6A15B !important; } option { background: #1a1a1a; color: #fff; }`}</style>
    </div>
  );
}
