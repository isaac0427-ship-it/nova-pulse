import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { LeadSource, LeadStatus, AlertSeverity } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return "just now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === "1") {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export function getLeadStatusConfig(status: LeadStatus) {
  const configs: Record<LeadStatus, { label: string; color: string; bg: string }> = {
    new: { label: "New", color: "#3498DB", bg: "rgba(52,152,219,0.1)" },
    contacted: { label: "Contacted", color: "#2ECC71", bg: "rgba(46,204,113,0.1)" },
    waiting: { label: "Waiting", color: "#F39C12", bg: "rgba(243,156,18,0.1)" },
    booked: { label: "Booked", color: "#C9A84C", bg: "rgba(201,168,76,0.1)" },
    quoted: { label: "Quoted", color: "#9B59B6", bg: "rgba(155,89,182,0.1)" },
    closed: { label: "Closed", color: "#27AE60", bg: "rgba(39,174,96,0.1)" },
    lost: { label: "Lost", color: "#E74C3C", bg: "rgba(231,76,60,0.1)" },
    ignored: { label: "Ignored", color: "#5A6480", bg: "rgba(90,100,128,0.1)" },
  };
  return configs[status];
}

export function getLeadSourceConfig(source: LeadSource) {
  const configs: Record<LeadSource, { label: string; icon: string }> = {
    phone_call: { label: "Phone Call", icon: "phone" },
    web_form: { label: "Web Form", icon: "globe" },
    email: { label: "Email", icon: "mail" },
    sms: { label: "SMS", icon: "message-square" },
    manual: { label: "Manual", icon: "user-plus" },
  };
  return configs[source];
}

export function getAlertSeverityConfig(severity: AlertSeverity) {
  const configs: Record<AlertSeverity, { color: string; bg: string; label: string }> = {
    critical: { color: "#E74C3C", bg: "rgba(231,76,60,0.1)", label: "Critical" },
    warning: { color: "#F39C12", bg: "rgba(243,156,18,0.1)", label: "Warning" },
    info: { color: "#3498DB", bg: "rgba(52,152,219,0.1)", label: "Info" },
  };
  return configs[severity];
}

export function calculateOperationalScore(metrics: {
  missed_calls: number;
  total_leads: number;
  avg_response_time_seconds: number;
  stalled_leads: number;
  active_leads: number;
}): number {
  if (metrics.total_leads === 0) return 100;

  let score = 100;

  const missedCallRate = metrics.missed_calls / metrics.total_leads;
  score -= missedCallRate * 30;

  if (metrics.avg_response_time_seconds > 3600) score -= 20;
  else if (metrics.avg_response_time_seconds > 1800) score -= 10;
  else if (metrics.avg_response_time_seconds > 900) score -= 5;

  const stalledRate = metrics.stalled_leads / Math.max(metrics.active_leads, 1);
  score -= stalledRate * 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
}
