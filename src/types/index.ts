export type LeadSource = "phone_call" | "web_form" | "email" | "sms" | "manual";

export type LeadStatus =
  | "new"
  | "contacted"
  | "waiting"
  | "booked"
  | "quoted"
  | "closed"
  | "lost"
  | "ignored";

export type AlertSeverity = "critical" | "warning" | "info";

export type AlertType =
  | "missed_call"
  | "no_response"
  | "dead_lead"
  | "slow_response"
  | "stalled_lead";

export type CommunicationType = "call" | "sms" | "email" | "note";

export type ReportPeriod = "weekly" | "monthly";

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  owner_name: string;
  phone: string;
  email: string;
  timezone: string;
  business_hours: BusinessHours;
  twilio_number?: string;
  twilio_sid?: string;
  gmail_connected: boolean;
  website?: string;
  role: "super_admin" | "client";
  slug?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: boolean;
  start: string;
  end: string;
}

export interface Lead {
  id: string;
  business_id: string;
  source: LeadSource;
  status: LeadStatus;
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  assigned_to?: string;
  first_contact_at: string;
  last_activity_at: string;
  first_response_at?: string;
  response_time_seconds?: number;
  created_at: string;
  updated_at: string;
  events?: LeadEvent[];
  communications?: Communication[];
}

export interface LeadEvent {
  id: string;
  lead_id: string;
  business_id: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  created_by?: string;
}

export interface Communication {
  id: string;
  lead_id: string;
  business_id: string;
  type: CommunicationType;
  direction: "inbound" | "outbound";
  content?: string;
  duration_seconds?: number;
  status: "completed" | "missed" | "failed" | "sent" | "received";
  from_number?: string;
  to_number?: string;
  external_id?: string;
  created_at: string;
}

export interface Alert {
  id: string;
  business_id: string;
  lead_id?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  is_read: boolean;
  is_resolved: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  resolved_at?: string;
  lead?: Lead;
}

export interface Report {
  id: string;
  business_id: string;
  period: ReportPeriod;
  period_start: string;
  period_end: string;
  total_leads: number;
  new_leads: number;
  converted_leads: number;
  lost_leads: number;
  ignored_leads: number;
  missed_calls: number;
  avg_response_time_seconds: number;
  source_breakdown: Record<LeadSource, number>;
  status_breakdown: Record<LeadStatus, number>;
  operational_score: number;
  bottlenecks: string[];
  observations: string[];
  generated_at: string;
  created_at: string;
}

export interface Integration {
  id: string;
  business_id: string;
  type: "twilio" | "gmail" | "webhook";
  status: "connected" | "disconnected" | "error";
  config: Record<string, unknown>;
  last_sync_at?: string;
  created_at: string;
}

export interface DashboardMetrics {
  total_leads: number;
  active_leads: number;
  missed_calls: number;
  avg_response_time_seconds: number;
  stalled_leads: number;
  recovered_opportunities: number;
  operational_health_score: number;
  leads_today: number;
  leads_this_week: number;
  unread_alerts: number;
}

export interface LeadFlowDataPoint {
  date: string;
  new: number;
  contacted: number;
  booked: number;
  lost: number;
}

export interface SourceBreakdown {
  source: LeadSource;
  count: number;
  percentage: number;
}

export interface OnboardingData {
  business_name: string;
  business_type: string;
  owner_name: string;
  phone: string;
  email: string;
  timezone: string;
  business_hours: BusinessHours;
}
