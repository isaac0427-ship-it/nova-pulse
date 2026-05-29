"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { X } from "lucide-react";

interface AddClientModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const businessTypes = [
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "roofing", label: "Roofing" },
  { value: "landscaping", label: "Landscaping" },
  { value: "cleaning", label: "Cleaning" },
  { value: "pest_control", label: "Pest Control" },
  { value: "home_services", label: "Home Services" },
  { value: "shipping", label: "Shipping & Logistics" },
  { value: "other", label: "Other" },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "").slice(0, 48);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555555" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function AddClientModal({ onClose, onSuccess }: AddClientModalProps) {
  const [form, setForm] = useState({
    name: "",
    owner_name: "",
    owner_email: "",
    phone: "",
    type: "hvac",
    twilio_number: "",
    slug: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, val: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "name") next.slug = slugify(val);
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create client");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const selectStyle: CSSProperties = {
    background: "#07111F",
    border: "1px solid #1C1C1C",
    color: "#F5F5F5",
    fontSize: 14,
    padding: "12px 14px",
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s",
    cursor: "pointer",
    appearance: "none",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ background: "#111111", border: "1px solid #1C1C1C", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1C1C1C", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#F5F5F5" }}>Add Client</h2>
            <p style={{ fontSize: 12, color: "#555555", marginTop: 4 }}>Creates an account and client portal</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555555", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Business Name">
            <input
              className="input-luxury"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Arctic Air HVAC"
              required
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Owner Name">
              <input className="input-luxury" value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} placeholder="Mike Torres" required />
            </Field>
            <Field label="Owner Email">
              <input className="input-luxury" type="email" value={form.owner_email} onChange={(e) => set("owner_email", e.target.value)} placeholder="mike@business.com" required />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Phone">
              <input className="input-luxury" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+18605550100" required />
            </Field>
            <Field label="Business Type">
              <select value={form.type} onChange={(e) => set("type", e.target.value)} style={selectStyle}>
                {businessTypes.map((t) => (
                  <option key={t.value} value={t.value} style={{ background: "#111111" }}>{t.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Twilio Number">
            <input className="input-luxury" value={form.twilio_number} onChange={(e) => set("twilio_number", e.target.value)} placeholder="+19789136892" />
          </Field>

          <Field label="URL Slug">
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#555555", pointerEvents: "none" }}>
                nova-systems.app/
              </span>
              <input className="input-luxury" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="arctic-air" required style={{ paddingLeft: 130 }} />
            </div>
          </Field>

          {error && (
            <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 13, color: "#EF4444" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, paddingTop: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ padding: "12px 20px", fontSize: 13 }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-gold" style={{ padding: "12px 24px", fontSize: 13 }}>
              {loading ? "Creating..." : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
