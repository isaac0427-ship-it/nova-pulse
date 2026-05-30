"use client";

import { useState } from "react";

const G = "#C6A15B";
const BG = "#0A0A0A";
const CARD = "#111111";
const BD = "#2A2A2A";
const TXT = "#F5F4F0";
const MUT = "#6B7A8D";
const INTER = "'Inter', system-ui, sans-serif";
const BEBAS = "'Bebas Neue', sans-serif";

type Status = { ok: boolean; message: string; detail?: string } | null;

function TestButton({
  label,
  description,
  endpoint,
}: {
  label: string;
  description: string;
  endpoint: string;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const run = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      const detail = JSON.stringify(data, null, 2);
      if (data.ok) {
        setStatus({ ok: true, message: data.message || "Success", detail });
      } else {
        setStatus({ ok: false, message: data.error || "Failed", detail });
      }
    } catch (err) {
      setStatus({ ok: false, message: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: CARD, border: `1px solid ${BD}`, padding: "24px 28px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontFamily: INTER, fontSize: 14, fontWeight: 700, color: TXT, marginBottom: 4 }}>{label}</div>
          <div style={{ fontFamily: INTER, fontSize: 12, color: MUT }}>{description}</div>
        </div>
        <button
          onClick={run}
          disabled={loading}
          style={{
            background: loading ? "rgba(198,161,91,0.5)" : G,
            color: BG,
            border: "none",
            padding: "10px 24px",
            fontFamily: INTER,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer",
            borderRadius: 4,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 120,
            justifyContent: "center",
          }}
        >
          {loading ? (
            <>
              <span style={{
                width: 12, height: 12, border: "2px solid rgba(0,0,0,0.2)",
                borderTopColor: BG, borderRadius: "50%",
                display: "inline-block", animation: "spin 0.8s linear infinite",
              }} />
              Running
            </>
          ) : "Run Test"}
        </button>
      </div>

      {status && (
        <div style={{
          marginTop: 16,
          padding: "12px 16px",
          background: status.ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${status.ok ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
          borderRadius: 4,
        }}>
          <div style={{ fontFamily: INTER, fontSize: 13, color: status.ok ? "#22C55E" : "#EF4444", fontWeight: 600 }}>
            {status.message}
          </div>
          {status.detail && (
            <pre style={{
              marginTop: 8, fontFamily: "monospace", fontSize: 11,
              color: MUT, whiteSpace: "pre-wrap", wordBreak: "break-word",
              maxHeight: 200, overflowY: "auto",
            }}>
              {status.detail}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pwErr, setPwErr] = useState(false);

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER }}>
        <div style={{ background: CARD, border: `1px solid ${BD}`, padding: "40px 48px", width: "100%", maxWidth: 380 }}>
          <div style={{ fontFamily: BEBAS, fontSize: 22, color: G, letterSpacing: "0.1em", marginBottom: 4 }}>NOVA SYSTEMS</div>
          <div style={{ fontFamily: INTER, fontSize: 14, color: MUT, marginBottom: 28 }}>Internal Test Panel</div>
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setPwErr(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { if (pw === "nova2024") { setAuthed(true); } else { setPwErr(true); } } }}
            placeholder="Enter password"
            style={{
              background: "#0A0A0A", border: `1px solid ${pwErr ? "#EF4444" : BD}`,
              color: TXT, fontFamily: INTER, fontSize: 14, padding: "12px 16px",
              width: "100%", outline: "none", borderRadius: 4, boxSizing: "border-box", marginBottom: 12,
            }}
          />
          {pwErr && <div style={{ color: "#EF4444", fontSize: 12, marginBottom: 12 }}>Incorrect password</div>}
          <button
            onClick={() => { if (pw === "nova2024") { setAuthed(true); } else { setPwErr(true); } }}
            style={{ background: G, color: BG, border: "none", padding: "12px", width: "100%", fontFamily: INTER, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", borderRadius: 4 }}
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TXT, fontFamily: INTER, padding: "40px 32px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: BEBAS, fontSize: 28, color: G, letterSpacing: "0.1em", marginBottom: 4 }}>NOVA SYSTEMS</div>
          <div style={{ fontFamily: BEBAS, fontSize: 18, color: TXT, letterSpacing: "0.08em", marginBottom: 4 }}>INTERNAL TEST PANEL</div>
          <div style={{ fontFamily: INTER, fontSize: 12, color: MUT }}>
            All tests create real data in Supabase and send real SMS/emails.
          </div>
        </div>

        <div style={{ fontFamily: INTER, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: G, marginBottom: 16 }}>
          PHONE TRACKING
        </div>
        <TestButton
          label="Simulate Inbound Call"
          description="Creates a fake inbound call record + lead in Supabase. Simulates a customer calling the tracked number."
          endpoint="/api/test/simulate-call"
        />

        <div style={{ fontFamily: INTER, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: G, marginBottom: 16, marginTop: 32 }}>
          SMS TRACKING
        </div>
        <TestButton
          label="Simulate Inbound SMS"
          description="Creates a fake SMS lead in Supabase. Simulates a customer texting the tracked number."
          endpoint="/api/test/simulate-sms"
        />

        <div style={{ fontFamily: INTER, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: G, marginBottom: 16, marginTop: 32 }}>
          EMAIL TRACKING
        </div>
        <TestButton
          label="Simulate Email Lead"
          description="Creates a fake email lead and sends a real notification email to isaac_0427@icloud.com via Resend."
          endpoint="/api/test/simulate-email"
        />

        <div style={{ fontFamily: INTER, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: G, marginBottom: 16, marginTop: 32 }}>
          MISSED CALL ALERT
        </div>
        <TestButton
          label="Simulate Missed Call"
          description="Creates a missed call alert in Supabase and sends a real SMS to +12037060504 (Isaac)."
          endpoint="/api/test/simulate-missed-call"
        />

        <div style={{ fontFamily: INTER, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: G, marginBottom: 16, marginTop: 32 }}>
          WEEKLY REPORT
        </div>
        <TestButton
          label="Send Weekly Report Now"
          description="Runs the full weekly report for all active clients and sends real emails via Resend."
          endpoint="/api/reports/weekly"
        />

        <div style={{ fontFamily: INTER, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: G, marginBottom: 16, marginTop: 32 }}>
          FORM TRACKING
        </div>
        <div style={{ background: CARD, border: `1px solid ${BD}`, padding: "24px 28px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontFamily: INTER, fontSize: 14, fontWeight: 700, color: TXT, marginBottom: 4 }}>Open Lead Capture Form</div>
              <div style={{ fontFamily: INTER, fontSize: 12, color: MUT }}>Opens the Apex Roofing & Repair form page. Submit it to fire a real lead + SMS + email to Isaac.</div>
            </div>
            <a
              href="https://nova-systems.app/apex-test"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: G, color: BG, border: "none", padding: "10px 24px",
                fontFamily: INTER, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", cursor: "pointer", borderRadius: 4,
                flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
                minWidth: 120, justifyContent: "center", textDecoration: "none",
              }}
            >
              Open Form ↗
            </a>
          </div>
        </div>

        <div style={{ marginTop: 48, borderTop: `1px solid ${BD}`, paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: INTER, fontSize: 11, color: "#2A2A2A", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            NOVA SYSTEMS INTERNAL
          </span>
          <a href="/master" style={{ fontFamily: INTER, fontSize: 12, color: G, textDecoration: "none" }}>
            Master Dashboard →
          </a>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
