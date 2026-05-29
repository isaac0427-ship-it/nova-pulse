"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { NovaLogo } from "@/components/NovaLogo";
import { ArrowRight, Check, Menu, X, Phone, Clock, TrendingUp, Zap, Shield, BarChart2 } from "lucide-react";

const G = "#C6A15B";
const BG = "#0A0A0A";
const NAVY = "#080C14";
const CARD = "#111111";
const BD = "#1E1E1E";
const TXT = "#F5F4F0";
const MUT = "#6B7A8D";
const BEBAS = "var(--font-bebas), 'Bebas Neue', sans-serif";
const INTER = "var(--font-inter), 'Inter', system-ui, sans-serif";

function FloatCard({ children, delay, style }: { children: React.ReactNode; delay: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BD}`, padding: "14px 18px",
      display: "flex", alignItems: "center", gap: 12,
      animation: `float 4s ease-in-out ${delay}ms infinite`,
      position: "absolute", minWidth: 220, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: 0.05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(28px)", transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mob, setMob] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const lnk: React.CSSProperties = {
    fontFamily: INTER, fontSize: 12, fontWeight: 500, letterSpacing: "0.08em",
    textTransform: "uppercase", color: MUT, textDecoration: "none", transition: "color 0.2s",
  };

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 64,
        background: scrolled ? "rgba(10,10,10,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid ${BD}` : "1px solid transparent",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <NovaLogo size={30} />
            <span style={{ fontFamily: BEBAS, fontSize: 20, letterSpacing: "0.12em", color: G }}>NOVA SYSTEMS</span>
          </Link>

          <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 36 }}>
            <Link href="#how" style={lnk}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = TXT)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = MUT)}
            >How It Works</Link>
            <Link href="#pricing" style={lnk}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = TXT)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = MUT)}
            >Pricing</Link>
            <Link href="/login" style={lnk}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = TXT)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = MUT)}
            >Client Login</Link>
            <Link href="/diagnostic"
              style={{ ...lnk, border: `1px solid ${G}`, color: G, padding: "10px 24px" }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = G; el.style.color = BG; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = G; }}
            >BOOK A DEMO</Link>
          </div>

          <button className="show-mobile" onClick={() => setMob(true)} style={{ background: "none", border: "none", color: MUT, cursor: "pointer", padding: 8, display: "none" }}>
            <Menu size={20} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {mob && (
        <div style={{ position: "fixed", inset: 0, background: BG, zIndex: 200, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 64, borderBottom: `1px solid ${BD}` }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }} onClick={() => setMob(false)}>
              <NovaLogo size={24} /><span style={{ fontFamily: BEBAS, fontSize: 16, letterSpacing: "0.12em", color: G }}>NOVA SYSTEMS</span>
            </Link>
            <button onClick={() => setMob(false)} style={{ background: "none", border: "none", color: MUT, cursor: "pointer" }}><X size={20} /></button>
          </div>
          <div style={{ flex: 1, padding: "48px 32px", display: "flex", flexDirection: "column", gap: 0 }}>
            {[["How It Works", "#how"], ["Pricing", "#pricing"], ["Client Login", "/login"]].map(([label, href]) => (
              <Link key={label} href={href} onClick={() => setMob(false)} style={{ fontFamily: INTER, fontSize: 18, color: MUT, padding: "20px 0", textDecoration: "none", borderBottom: `1px solid ${BD}`, display: "block" }}>{label}</Link>
            ))}
            <Link href="/diagnostic" onClick={() => setMob(false)} style={{ marginTop: 40, background: G, color: BG, padding: "18px 32px", fontFamily: BEBAS, fontSize: 20, letterSpacing: "0.12em", textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
              BOOK A DEMO <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export default function MarketingPage() {
  return (
    <div style={{ background: BG, color: TXT }}>
      <Nav />

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "100px 40px 80px", overflow: "hidden" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }} className="hero-grid">
          {/* Left */}
          <div>
            <p style={{ fontFamily: INTER, fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: G, marginBottom: 20 }}>
              OPERATIONAL INTELLIGENCE
            </p>
            <h1 style={{ fontFamily: BEBAS, fontSize: "clamp(56px, 7vw, 96px)", color: TXT, lineHeight: 0.92, letterSpacing: "0.02em", marginBottom: 28 }}>
              STOP LOSING<br /><span style={{ color: G }}>REVENUE.</span>
            </h1>
            <p style={{ fontFamily: INTER, fontSize: 16, color: MUT, lineHeight: 1.8, maxWidth: 420, marginBottom: 40 }}>
              We connect to your phone and CRM, track every lead, and build the systems that stop money from walking out the door.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link href="/diagnostic"
                style={{ display: "inline-flex", alignItems: "center", gap: 12, background: G, color: BG, padding: "16px 40px", fontFamily: BEBAS, fontSize: 15, letterSpacing: "0.14em", textDecoration: "none", transition: "background 0.2s, box-shadow 0.2s" }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "#D4B06A"; el.style.boxShadow = "0 8px 40px rgba(198,161,91,0.35)"; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = G; el.style.boxShadow = "none"; }}
              >SEE WHAT YOU&apos;RE LOSING <ArrowRight size={14} /></Link>
              <Link href="/login"
                style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "transparent", color: MUT, padding: "16px 32px", fontFamily: INTER, fontSize: 13, letterSpacing: "0.04em", textDecoration: "none", border: `1px solid ${BD}`, transition: "border-color 0.2s, color 0.2s" }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(198,161,91,0.3)"; el.style.color = TXT; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = BD; el.style.color = MUT; }}
              >Client Login</Link>
            </div>
          </div>

          {/* Right — animated grid + floating cards */}
          <div style={{ position: "relative", height: 480 }} className="hide-mobile">
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(circle, rgba(198,161,91,0.18) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              animation: "gridMove 20s linear infinite",
            }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 60% 40%, rgba(198,161,91,0.07) 0%, transparent 70%)" }} />

            <FloatCard delay={0} style={{ top: 40, left: 20 }}>
              <div style={{ width: 32, height: 32, background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Phone size={14} color="#EF4444" />
              </div>
              <div>
                <div style={{ fontFamily: INTER, fontSize: 11, fontWeight: 700, color: TXT }}>Missed Call</div>
                <div style={{ fontFamily: INTER, fontSize: 10, color: MUT }}>+1 (203) 555-0182 · just now</div>
              </div>
              <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }} />
            </FloatCard>

            <FloatCard delay={800} style={{ top: 160, right: 10 }}>
              <div style={{ width: 32, height: 32, background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp size={14} color="#22C55E" />
              </div>
              <div>
                <div style={{ fontFamily: INTER, fontSize: 11, fontWeight: 700, color: TXT }}>Lead Recovered</div>
                <div style={{ fontFamily: INTER, fontSize: 10, color: MUT }}>$3,200 · Arctic Air HVAC</div>
              </div>
            </FloatCard>

            <FloatCard delay={400} style={{ bottom: 160, left: 40 }}>
              <div style={{ width: 32, height: 32, background: "rgba(198,161,91,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={14} color={G} />
              </div>
              <div>
                <div style={{ fontFamily: INTER, fontSize: 11, fontWeight: 700, color: TXT }}>Response Alert</div>
                <div style={{ fontFamily: INTER, fontSize: 10, color: MUT }}>Lead waiting 4+ hours</div>
              </div>
              <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: G }} />
            </FloatCard>

            <FloatCard delay={1200} style={{ bottom: 48, right: 30 }}>
              <div style={{ width: 32, height: 32, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart2 size={14} color="#3B82F6" />
              </div>
              <div>
                <div style={{ fontFamily: INTER, fontSize: 11, fontWeight: 700, color: TXT }}>Weekly Report</div>
                <div style={{ fontFamily: INTER, fontSize: 10, color: MUT }}>12 leads · 3 converted</div>
              </div>
            </FloatCard>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div style={{ background: NAVY, borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}`, padding: "20px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ fontFamily: INTER, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: MUT, whiteSpace: "nowrap" }}>TRUSTED BY BUSINESSES IN</span>
          {["HVAC", "ROOFING", "PLUMBING", "REMODELING", "LANDSCAPING"].map((ind) => (
            <span key={ind} style={{ fontFamily: BEBAS, fontSize: 16, letterSpacing: "0.14em", color: "rgba(198,161,91,0.45)" }}>{ind}</span>
          ))}
        </div>
      </div>

      {/* ── THE NUMBER ── */}
      <section style={{ background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 32px" }}>
        <Reveal style={{ textAlign: "center" }}>
          <p style={{ fontFamily: INTER, fontSize: 11, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: G, marginBottom: 24 }}>
            THE AVERAGE BUSINESS LOSES
          </p>
          <div style={{ fontFamily: BEBAS, fontSize: "clamp(100px, 18vw, 200px)", color: G, lineHeight: 1, letterSpacing: "0.02em" }}>23%</div>
          <p style={{ fontFamily: INTER, fontSize: 20, color: TXT, marginTop: 20, fontWeight: 300 }}>of leads every week.</p>
          <p style={{ fontFamily: INTER, fontSize: 15, color: MUT, marginTop: 12, maxWidth: 420, margin: "12px auto 0", lineHeight: 1.8 }}>
            Missed calls. Slow responses. Dead leads.<br />You don&apos;t see it happening. We do.
          </p>
        </Reveal>
      </section>

      {/* ── PROBLEM ── */}
      <section style={{ background: BG, padding: "120px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal>
            <p style={{ fontFamily: INTER, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: G, marginBottom: 12 }}>THE PROBLEM</p>
            <h2 style={{ fontFamily: BEBAS, fontSize: "clamp(48px, 6vw, 80px)", color: TXT, lineHeight: 0.95, letterSpacing: "0.02em", marginBottom: 64 }}>
              WHERE IS YOUR MONEY GOING?
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 1, background: BD }}>
            {[
              { icon: Phone, title: "MISSED CALLS", desc: "Every unanswered call is a lead going to your competitor. Most businesses don't even know how many they miss.", color: "#EF4444", rgb: "239,68,68" },
              { icon: Clock, title: "SLOW FOLLOW-UPS", desc: "Lead response time is everything. After 5 minutes, conversion drops 80%. After 24 hours, it's gone.", color: G, rgb: "198,161,91" },
              { icon: TrendingUp, title: "DEAD LEADS", desc: "Leads that never got followed up sit in your system costing nothing — but losing you everything.", color: "#F59E0B", rgb: "245,158,11" },
            ].map(({ icon: Icon, title, desc, color, rgb }) => (
              <Reveal key={title}>
                <div style={{ background: CARD, padding: "48px 40px", height: "100%" }}>
                  <div style={{ width: 48, height: 48, background: `rgba(${rgb},0.1)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                    <Icon size={20} color={color} />
                  </div>
                  <h3 style={{ fontFamily: BEBAS, fontSize: 28, color: TXT, letterSpacing: "0.06em", marginBottom: 16 }}>{title}</h3>
                  <p style={{ fontFamily: INTER, fontSize: 14, color: MUT, lineHeight: 1.8 }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section style={{ background: NAVY, padding: "120px 40px", borderTop: `1px solid ${BD}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal>
            <p style={{ fontFamily: INTER, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: G, marginBottom: 12 }}>THE SOLUTION</p>
            <h2 style={{ fontFamily: BEBAS, fontSize: "clamp(48px, 6vw, 80px)", color: TXT, lineHeight: 0.95, letterSpacing: "0.02em", marginBottom: 64 }}>
              TOTAL VISIBILITY.<br /><span style={{ color: G }}>TOTAL CONTROL.</span>
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 40 }}>
            {[
              { icon: TrendingUp, label: "Track Every Lead", desc: "From first contact to closed deal — every interaction logged automatically." },
              { icon: Phone, label: "Never Miss a Call", desc: "Instant alerts for every missed call with automatic follow-up triggers." },
              { icon: Zap, label: "Automate Workflows", desc: "Follow-ups and callbacks run without lifting a finger." },
              { icon: BarChart2, label: "Drive Revenue", desc: "Clear reports showing exactly where money is being made and lost." },
            ].map(({ icon: Icon, label, desc }) => (
              <Reveal key={label}>
                <div style={{ display: "flex", gap: 20 }}>
                  <div style={{ width: 44, height: 44, background: "rgba(198,161,91,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color={G} />
                  </div>
                  <div>
                    <div style={{ fontFamily: INTER, fontSize: 14, fontWeight: 700, color: TXT, marginBottom: 8 }}>{label}</div>
                    <p style={{ fontFamily: INTER, fontSize: 13, color: MUT, lineHeight: 1.7 }}>{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ background: BG, padding: "120px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Reveal>
            <p style={{ fontFamily: INTER, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: G, marginBottom: 12 }}>THE PROCESS</p>
            <h2 style={{ fontFamily: BEBAS, fontSize: "clamp(48px, 6vw, 80px)", color: TXT, lineHeight: 0.95, letterSpacing: "0.02em", marginBottom: 80 }}>HOW IT WORKS.</h2>
          </Reveal>
          {[
            { n: "01", title: "CONNECT", desc: "We plug into your phone, email, and calendar in 24 hours." },
            { n: "02", title: "DIAGNOSE", desc: "Nova maps every lead and finds exactly where revenue is leaking." },
            { n: "03", title: "REPORT", desc: "Every 15 days you receive a complete operational intelligence report." },
            { n: "04", title: "BUILD", desc: "We engineer custom systems to close every gap — permanently installed." },
          ].map((step, i) => (
            <Reveal key={i} delay={i * 80}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 32, paddingTop: 40, paddingBottom: 40, borderTop: `1px solid ${i === 0 ? "rgba(198,161,91,0.2)" : BD}` }}>
                <span style={{ fontFamily: BEBAS, fontSize: 52, color: G, opacity: 0.25, lineHeight: 1, flexShrink: 0, minWidth: 64 }}>{step.n}</span>
                <div>
                  <div style={{ fontFamily: BEBAS, fontSize: 32, color: TXT, letterSpacing: "0.04em", marginBottom: 12 }}>{step.title}</div>
                  <p style={{ fontFamily: INTER, fontSize: 15, color: MUT, lineHeight: 1.7, maxWidth: 480 }}>{step.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
          <div style={{ borderTop: `1px solid rgba(198,161,91,0.2)` }} />
        </div>
      </section>

      {/* ── RESULTS ── */}
      <section style={{ background: NAVY, padding: "120px 40px", borderTop: `1px solid ${BD}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal>
            <p style={{ fontFamily: INTER, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: G, marginBottom: 12 }}>THE RESULTS</p>
            <h2 style={{ fontFamily: BEBAS, fontSize: "clamp(48px, 6vw, 80px)", color: TXT, lineHeight: 0.95, letterSpacing: "0.02em", marginBottom: 64 }}>WHAT CLIENTS SEE.</h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, background: BD, marginBottom: 1 }}>
            {[
              { stat: "23%", label: "Average leads recovered in first 30 days" },
              { stat: "$8K+", label: "Average monthly revenue found per client" },
              { stat: "4 min", label: "Average response time after Nova install" },
            ].map(({ stat, label }) => (
              <Reveal key={stat}>
                <div style={{ background: CARD, padding: "48px 40px" }}>
                  <div style={{ fontFamily: BEBAS, fontSize: 64, color: G, lineHeight: 1, letterSpacing: "0.02em", marginBottom: 12 }}>{stat}</div>
                  <p style={{ fontFamily: INTER, fontSize: 13, color: MUT, lineHeight: 1.6 }}>{label}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div style={{ background: CARD, border: `1px solid ${BD}`, padding: "52px 56px" }}>
              <div style={{ fontFamily: BEBAS, fontSize: "clamp(22px, 3vw, 38px)", color: TXT, lineHeight: 1.2, letterSpacing: "0.02em", fontStyle: "italic", marginBottom: 32 }}>
                &ldquo;THE FIRST MORNING I LOGGED IN, I FOUND THREE LEADS WE HAD NEVER CONTACTED. WE CONVERTED TWO THAT WEEK.&rdquo;
              </div>
              <p style={{ fontFamily: INTER, fontSize: 13, color: G, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                — M.R. · HVAC OWNER · CONNECTICUT
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ background: BG, padding: "120px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <p style={{ fontFamily: INTER, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: G, marginBottom: 12 }}>INVESTMENT</p>
            <h2 style={{ fontFamily: BEBAS, fontSize: "clamp(48px, 6vw, 80px)", color: TXT, lineHeight: 0.95, letterSpacing: "0.02em", marginBottom: 80 }}>SIMPLE PRICING.</h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 1, background: BD }}>
            {[
              { name: "STARTER", price: "$1,500", period: "/mo", desc: "Track. Monitor. Alert.", features: ["Missed call tracking", "Response time monitoring", "15-day operational reports", "SMS + email alerts"], cta: "GET STARTED", gold: false },
              { name: "GROWTH", price: "$2,500", period: "/mo", desc: "Track. Build. Fix.", features: ["Everything in Starter", "Dead lead recovery", "Custom system builds", "Monthly strategy call", "Lead automation workflows"], cta: "GET STARTED", gold: true, badge: "RECOMMENDED" },
              { name: "ENTERPRISE", price: "CUSTOM", period: "", desc: "Full infrastructure.", features: ["Everything in Growth", "Unlimited custom systems", "Dedicated operations manager", "White label available"], cta: "SUBMIT INQUIRY", gold: false },
            ].map((tier, i) => (
              <Reveal key={i} delay={i * 60}>
                <div style={{ background: CARD, padding: "52px 44px", display: "flex", flexDirection: "column", position: "relative", borderTop: tier.gold ? `2px solid ${G}` : "2px solid transparent", height: "100%" }}>
                  {tier.badge && (
                    <div style={{ position: "absolute", top: -1, right: 32, background: G, color: BG, fontFamily: INTER, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", padding: "4px 12px" }}>{tier.badge}</div>
                  )}
                  <p style={{ fontFamily: BEBAS, fontSize: 13, letterSpacing: "0.2em", color: G, marginBottom: 20 }}>{tier.name}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
                    <span style={{ fontFamily: BEBAS, fontSize: 56, color: G, lineHeight: 1 }}>{tier.price}</span>
                    {tier.period && <span style={{ fontFamily: INTER, fontSize: 14, color: MUT }}>{tier.period}</span>}
                  </div>
                  <p style={{ fontFamily: INTER, fontSize: 13, color: MUT, marginBottom: 40, lineHeight: 1.5 }}>{tier.desc}</p>
                  <ul style={{ flex: 1, listStyle: "none", display: "flex", flexDirection: "column", gap: 16, marginBottom: 44 }}>
                    {tier.features.map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontFamily: INTER, fontSize: 14, color: "#888", lineHeight: 1.4 }}>
                        <Check size={13} color={G} strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />{f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/diagnostic" style={{ background: tier.gold ? G : "transparent", border: tier.gold ? "none" : `1px solid ${BD}`, color: tier.gold ? BG : MUT, padding: "16px 24px", fontFamily: BEBAS, fontSize: 16, letterSpacing: "0.12em", textDecoration: "none", textAlign: "center", display: "block", transition: "background 0.2s, color 0.2s, box-shadow 0.2s" }}
                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; if (tier.gold) { el.style.background = "#D4B06A"; el.style.boxShadow = "0 4px 20px rgba(198,161,91,0.3)"; } else { el.style.borderColor = G; el.style.color = G; } }}
                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; if (tier.gold) { el.style.background = G; el.style.boxShadow = "none"; } else { el.style.borderColor = BD; el.style.color = MUT; } }}
                  >{tier.cta}</Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: NAVY, padding: "120px 32px", borderTop: `1px solid ${BD}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, background: "radial-gradient(circle, rgba(198,161,91,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <Reveal style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: BEBAS, fontSize: "clamp(64px, 10vw, 120px)", color: TXT, lineHeight: 0.9, letterSpacing: "0.02em" }}>READY?</h2>
          <p style={{ fontFamily: INTER, fontSize: 18, color: MUT, marginTop: 20, lineHeight: 1.7 }}>
            Find out what your business is losing.<br />It takes two minutes.
          </p>
          <div style={{ marginTop: 48 }}>
            <Link href="/diagnostic"
              style={{ display: "inline-flex", alignItems: "center", gap: 16, background: G, color: BG, padding: "20px 64px", fontFamily: BEBAS, fontSize: 18, letterSpacing: "0.16em", textDecoration: "none", transition: "background 0.2s, box-shadow 0.2s" }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "#D4B06A"; el.style.boxShadow = "0 12px 48px rgba(198,161,91,0.45)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = G; el.style.boxShadow = "none"; }}
            >REQUEST FREE DIAGNOSTIC <ArrowRight size={18} /></Link>
          </div>
          <p style={{ fontFamily: INTER, fontSize: 12, color: "#2A2A2A", marginTop: 20, letterSpacing: "0.04em" }}>No commitment. No pressure.</p>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#050505", borderTop: `1px solid rgba(198,161,91,0.2)`, padding: "56px 40px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40, flexWrap: "wrap", marginBottom: 48 }}>
            <div>
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 16 }}>
                <NovaLogo size={28} /><span style={{ fontFamily: BEBAS, fontSize: 18, letterSpacing: "0.12em", color: TXT }}>NOVA SYSTEMS</span>
              </Link>
              <p style={{ fontFamily: INTER, fontSize: 13, color: MUT, lineHeight: 1.6 }}>Operational infrastructure for modern businesses.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-end" }}>
              <a href="mailto:isaac_0427@icloud.com" style={{ fontFamily: INTER, fontSize: 13, color: G, textDecoration: "none" }}>isaac_0427@icloud.com</a>
              <Link href="/login" style={{ fontFamily: INTER, fontSize: 13, color: MUT, textDecoration: "none" }}>Client Login</Link>
              <Link href="/diagnostic" style={{ fontFamily: INTER, fontSize: 13, color: MUT, textDecoration: "none" }}>Free Diagnostic</Link>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${BD}`, paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <p style={{ fontFamily: INTER, fontSize: 11, color: "#2A2A2A", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              © MMXXVI NOVA SYSTEMS · ALL RIGHTS RESERVED
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Shield size={11} color={MUT} />
              <span style={{ fontFamily: INTER, fontSize: 11, color: MUT }}>Secure. Reliable. Built for scale.</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes gridMove { 0% { background-position: 0 0; } 100% { background-position: 32px 32px; } }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @media (max-width: 768px) { .hide-mobile { display: none !important; } .show-mobile { display: flex !important; } .hero-grid { grid-template-columns: 1fr !important; } }
        @media (min-width: 769px) { .show-mobile { display: none !important; } }
      `}</style>
    </div>
  );
}
