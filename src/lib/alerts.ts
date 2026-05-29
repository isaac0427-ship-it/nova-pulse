import { createClient } from "@/lib/supabase/server";
import { Alert, Lead } from "@/types";

const STALE_LEAD_HOURS = 24;
const SLOW_RESPONSE_MINUTES = 30;
const DEAD_LEAD_HOURS = 72;

export async function runAlertEngine(business_id: string): Promise<void> {
  const supabase = await createClient();
  const now = new Date();

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", business_id)
    .in("status", ["new", "contacted", "waiting", "quoted"]);

  if (!leads) return;

  for (const lead of leads) {
    await checkStaleLead(supabase, lead, now);
    await checkDeadLead(supabase, lead, now);
    await checkSlowResponse(supabase, lead, now);
  }
}

async function checkStaleLead(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  lead: Lead,
  now: Date
) {
  const lastActivity = new Date(lead.last_activity_at);
  const hoursSinceActivity =
    (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

  if (hoursSinceActivity >= STALE_LEAD_HOURS) {
    const { data: existingAlert } = await supabase
      .from("alerts")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("type", "stalled_lead")
      .eq("is_resolved", false)
      .single();

    if (!existingAlert) {
      await supabase.from("alerts").insert({
        business_id: lead.business_id,
        lead_id: lead.id,
        type: "stalled_lead",
        severity: "warning",
        title: "Stalled Lead",
        description: `Lead has been inactive for ${Math.floor(hoursSinceActivity)} hours`,
        is_read: false,
        is_resolved: false,
        metadata: { hours_inactive: Math.floor(hoursSinceActivity) },
      });
    }
  }
}

async function checkDeadLead(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  lead: Lead,
  now: Date
) {
  const lastActivity = new Date(lead.last_activity_at);
  const hoursSinceActivity =
    (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

  if (hoursSinceActivity >= DEAD_LEAD_HOURS && lead.status === "new") {
    const { data: existingAlert } = await supabase
      .from("alerts")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("type", "dead_lead")
      .eq("is_resolved", false)
      .single();

    if (!existingAlert) {
      await supabase.from("alerts").insert({
        business_id: lead.business_id,
        lead_id: lead.id,
        type: "dead_lead",
        severity: "critical",
        title: "Dead Lead Detected",
        description: `Lead has received no response for ${Math.floor(hoursSinceActivity)} hours`,
        is_read: false,
        is_resolved: false,
        metadata: { hours_without_response: Math.floor(hoursSinceActivity) },
      });

      await supabase
        .from("leads")
        .update({ status: "ignored" })
        .eq("id", lead.id);
    }
  }
}

async function checkSlowResponse(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  lead: Lead,
  now: Date
) {
  if (lead.status !== "new" || lead.first_response_at) return;

  const firstContact = new Date(lead.first_contact_at);
  const minutesSinceContact =
    (now.getTime() - firstContact.getTime()) / (1000 * 60);

  if (minutesSinceContact >= SLOW_RESPONSE_MINUTES) {
    const { data: existingAlert } = await supabase
      .from("alerts")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("type", "no_response")
      .eq("is_resolved", false)
      .single();

    if (!existingAlert) {
      await supabase.from("alerts").insert({
        business_id: lead.business_id,
        lead_id: lead.id,
        type: "no_response",
        severity: "warning",
        title: "No Response to New Lead",
        description: `New lead has not been contacted after ${Math.floor(minutesSinceContact)} minutes`,
        is_read: false,
        is_resolved: false,
        metadata: { minutes_without_response: Math.floor(minutesSinceContact) },
      });
    }
  }
}

export async function resolveAlert(alert_id: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("alerts")
    .update({ is_resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", alert_id);
}

export async function markAlertsRead(business_id: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("alerts")
    .update({ is_read: true })
    .eq("business_id", business_id)
    .eq("is_read", false);
}
