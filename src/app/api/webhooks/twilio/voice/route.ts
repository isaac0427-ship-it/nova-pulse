import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateTwilioSignature } from "@/lib/twilio";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nova-systems.app";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = Object.fromEntries(new URLSearchParams(body));

  const signature = req.headers.get("x-twilio-signature") ?? "";
  if (!validateTwilioSignature(signature, req.url, params)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { From: from, To: to, CallSid: callSid } = params;
  if (!from || !to || !callSid) {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  let forwardTo = process.env.TWILIO_PHONE_NUMBER ?? "+12037060504";

  try {
    const supabase = db();
    const { data: business } = await supabase
      .from("businesses")
      .select("id, forwarding_phone")
      .eq("twilio_number", to)
      .single();

    if (business) {
      if (business.forwarding_phone) forwardTo = business.forwarding_phone;

      // Find or create lead
      const { data: existing } = await supabase
        .from("leads")
        .select("id")
        .eq("business_id", business.id)
        .eq("phone", from)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let leadId: string;
      if (existing) {
        leadId = existing.id;
        await supabase.from("leads").update({ last_activity_at: new Date().toISOString() }).eq("id", leadId);
      } else {
        const { data: newLead } = await supabase
          .from("leads")
          .insert({
            business_id: business.id,
            source: "phone_call",
            status: "new",
            phone: from,
            first_contact_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        leadId = newLead?.id ?? "";
      }

      if (leadId) {
        await Promise.all([
          supabase.from("communications").insert({
            lead_id: leadId,
            business_id: business.id,
            type: "call",
            direction: "inbound",
            status: "completed",
            from_number: from,
            to_number: to,
            external_id: callSid,
          }),
          supabase.from("lead_events").insert({
            lead_id: leadId,
            business_id: business.id,
            type: "inbound_call",
            title: "Inbound Call",
            description: `Incoming call from ${from} — forwarding to ${forwardTo}`,
            metadata: { call_sid: callSid },
          }),
        ]);
      }
    }
  } catch {
    // Must always return TwiML
  }

  const actionUrl = `${APP_URL}/api/webhooks/twilio/voice/status`;
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${from}" timeout="20" action="${actionUrl}" method="POST">
    <Number>${forwardTo}</Number>
  </Dial>
</Response>`;

  return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
}
