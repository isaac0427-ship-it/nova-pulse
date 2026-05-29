import twilio from "twilio";
import { createClient } from "@/lib/supabase/server";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

export function getTwilioClient() {
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }
  return twilio(accountSid, authToken);
}

export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!authToken) return false;
  return twilio.validateRequest(authToken, signature, url, params);
}

export async function sendSMS(to: string, from: string, body: string) {
  const client = getTwilioClient();
  return client.messages.create({ to, from, body });
}

export async function logInboundCall(params: {
  business_id: string;
  from: string;
  to: string;
  call_sid: string;
  call_status: string;
  duration?: number;
}) {
  const supabase = await createClient();

  const isMissed =
    params.call_status === "no-answer" ||
    params.call_status === "busy" ||
    params.call_status === "failed";

  // Find or create lead
  let lead_id: string;
  const { data: existingLead } = await supabase
    .from("leads")
    .select("id")
    .eq("business_id", params.business_id)
    .eq("phone", params.from)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingLead) {
    lead_id = existingLead.id;
    await supabase
      .from("leads")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", lead_id);
  } else {
    const { data: newLead, error } = await supabase
      .from("leads")
      .insert({
        business_id: params.business_id,
        source: "phone_call",
        status: isMissed ? "new" : "contacted",
        phone: params.from,
        first_contact_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !newLead) throw new Error("Failed to create lead");
    lead_id = newLead.id;
  }

  // Log communication
  await supabase.from("communications").insert({
    lead_id,
    business_id: params.business_id,
    type: "call",
    direction: "inbound",
    status: isMissed ? "missed" : "completed",
    from_number: params.from,
    to_number: params.to,
    duration_seconds: params.duration ?? 0,
    external_id: params.call_sid,
  });

  // Log event
  await supabase.from("lead_events").insert({
    lead_id,
    business_id: params.business_id,
    type: isMissed ? "missed_call" : "inbound_call",
    title: isMissed ? "Missed Call" : "Inbound Call",
    description: `${isMissed ? "Missed" : "Received"} call from ${params.from}`,
    metadata: { call_sid: params.call_sid, status: params.call_status },
  });

  // Create alert for missed calls
  if (isMissed) {
    await supabase.from("alerts").insert({
      business_id: params.business_id,
      lead_id,
      type: "missed_call",
      severity: "critical",
      title: "Missed Call",
      description: `Missed incoming call from ${params.from}`,
      is_read: false,
      is_resolved: false,
    });
  }

  return { lead_id, isMissed };
}
