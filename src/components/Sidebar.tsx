"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NovaLogo } from "./NovaLogo";
import {
  LayoutDashboard, BarChart3, Users, TrendingUp, Activity,
  Bell, FileText, Settings, Plug, Phone, Mail, MessageSquare,
  AlertTriangle, Menu, LogOut, UserPlus, Skull,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const GOLD = "#C6A15B";
const NAVY = "#07111F";
const BORDER = "#1C1C1C";
const TEXT = "#F5F5F5";
const MUTED = "#555555";
const DIM = "#333333";

interface SidebarProps {
  variant: "master" | "client";
  businessName?: string;
  ownerName?: string;
  slug?: string;
  userName?: string;
  healthScore?: number;
  onAddClient?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: string;
  action?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

function masterSections(): NavSection[] {
  return [
    {
      label: "Overview",
      items: [
        { href: "/master", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: "/master/analytics", label: "Analytics", icon: BarChart3 },
      ],
    },
    {
      label: "Clients",
      items: [
        { href: "/master/clients", label: "All Clients", icon: Users },
        { href: "#add-client", label: "Add Client", icon: UserPlus, action: true },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/master/leads", label: "All Leads", icon: TrendingUp },
        { href: "/master/alerts", label: "All Alerts", icon: AlertTriangle },
        { href: "/master/reports", label: "Reports", icon: FileText },
      ],
    },
    {
      label: "System",
      items: [
        { href: "/master/settings", label: "Settings", icon: Settings },
      ],
    },
  ];
}

function clientSections(slug: string): NavSection[] {
  return [
    {
      label: "Overview",
      items: [
        { href: `/${slug}`, label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: `/${slug}/analytics`, label: "Analytics", icon: BarChart3 },
      ],
    },
    {
      label: "Leads",
      items: [
        { href: `/${slug}/leads`, label: "All Leads", icon: TrendingUp },
        { href: `/${slug}/leads?status=dead`, label: "Dead Leads", icon: Skull },
      ],
    },
    {
      label: "Communications",
      items: [
        { href: `/${slug}/calls`, label: "Calls", icon: Phone },
        { href: `/${slug}/emails`, label: "Emails", icon: Mail },
        { href: `/${slug}/sms`, label: "SMS", icon: MessageSquare },
      ],
    },
    {
      label: "Performance",
      items: [
        { href: `/${slug}/alerts`, label: "Alerts", icon: Bell },
        { href: `/${slug}/reports`, label: "Reports", icon: FileText },
        { href: `/${slug}/trends`, label: "Trends", icon: Activity },
      ],
    },
    {
      label: "Account",
      items: [
        { href: `/${slug}/settings`, label: "Settings", icon: Settings },
        { href: `/${slug}/integrations`, label: "Integrations", icon: Plug },
      ],
    },
  ];
}

function healthColor(score?: number): string {
  if (!score) return DIM;
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

export function Sidebar({ variant, businessName, ownerName, slug, userName, healthScore, onAddClient }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const sections = variant === "master" ? masterSections() : clientSections(slug ?? "");
  const displayName = variant === "master" ? "Nova Systems" : businessName;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const sidebarContent = (
    <div style={{
      width: 224,
      height: "100%",
      background: NAVY,
      borderRight: `1px solid rgba(198,161,91,0.12)`,
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ padding: "22px 18px 16px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <Link href={variant === "master" ? "/master" : `/${slug}`} style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <NovaLogo size={30} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: "0.08em", color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.1 }}>
              {displayName}
            </div>
            {variant === "client" && (
              <div style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif", fontSize: 10, color: DIM, marginTop: 2, letterSpacing: "0.04em" }}>Client Portal</div>
            )}
          </div>
        </Link>

        {variant === "client" && healthScore !== undefined && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 2, background: BORDER, borderRadius: 1 }}>
              <div style={{ height: "100%", width: `${healthScore}%`, background: healthColor(healthScore), borderRadius: 1, transition: "width 0.6s ease" }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, fontWeight: 500, color: healthColor(healthScore), minWidth: 26, textAlign: "right" }}>
              {healthScore}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        {sections.map((section, si) => (
          <div key={section.label} style={{ marginBottom: 2 }}>
            {si > 0 && <div style={{ height: 1, background: BORDER, margin: "8px 0 10px" }} />}
            <div className="sidebar-section-label" style={{ marginBottom: 5, marginTop: si > 0 ? 0 : 4 }}>
              {section.label}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              if (item.action) {
                return (
                  <button
                    key={item.href}
                    onClick={() => { setOpen(false); onAddClient?.(); }}
                    className="sidebar-nav-link"
                    style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
                  >
                    <Icon size={13} strokeWidth={1.5} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </button>
                );
              }
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={active ? "sidebar-nav-link-active" : "sidebar-nav-link"}
                >
                  <Icon size={13} strokeWidth={active ? 2 : 1.5} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ fontSize: 9, fontWeight: 700, background: "#EF4444", color: "#fff", padding: "1px 5px", borderRadius: 8 }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "12px 18px 18px", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 26, height: 26, background: BORDER, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 3, flexShrink: 0 }}>
            <span style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", fontSize: 13, color: GOLD }}>
              {(userName || ownerName || "A").charAt(0).toUpperCase()}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif", fontSize: 12, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {variant === "master" ? (userName || "Administrator") : ownerName}
            </div>
            <div style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif", fontSize: 10, color: DIM }}>
              {variant === "master" ? "Super Admin" : "Account Owner"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22C55E", animation: "dotPulse 2s ease-in-out infinite" }} />
          <span style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif", fontSize: 10, color: DIM, letterSpacing: "0.04em" }}>System Online</span>
        </div>

        <button
          onClick={handleSignOut}
          style={{ display: "flex", alignItems: "center", gap: 7, background: "transparent", border: "none", color: DIM, fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif", fontSize: 12, cursor: "pointer", padding: 0, transition: "color 0.15s", width: "100%" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = MUTED)}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = DIM)}
        >
          <LogOut size={11} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex" style={{ flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>
        {sidebarContent}
      </div>

      {/* Mobile top bar */}
      <div
        className="flex lg:hidden"
        style={{ position: "fixed", top: 0, left: 0, right: 0, height: 54, background: NAVY, borderBottom: `1px solid ${BORDER}`, alignItems: "center", padding: "0 16px", gap: 12, zIndex: 40 }}
      >
        <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 4 }}>
          <Menu size={18} />
        </button>
        <NovaLogo size={24} />
        <span style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: "0.08em", color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName}
        </span>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex" }}>
          <div style={{ flexShrink: 0, animation: "slideRight 0.22s cubic-bezier(0.16,1,0.3,1) both" }}>
            {sidebarContent}
          </div>
          <div
            style={{ flex: 1, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(2px)" }}
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}
