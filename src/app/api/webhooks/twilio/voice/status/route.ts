import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateTwilioSignature, getTwilioClient } from "@/lib/twilio";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const EMPTY_XML = `<?xml version="1.0" encoding="UTF-8"?><Response/>`;

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

  const callSid = params.CallSid as string;
  const dialStatus = params.DialCallStatus as string;
  const duration = parseInt(params.DialCallDuration ?? "0", 10);
  const missed = ["no-answer", "busy", "failed", "canceled"].includes(dialStatus);

  try {
    const supabase = db();

    const { data: comm } = await supabase
      .from("communications")
      .update({ status: missed ? "missed" : "completed", duration_seconds: duration })
      .eq("external_id", callSid)
      .select("business_id, lead_id, from_number")
      .single();

    if (missed && comm) {
      await supabase.from("leads").update({ status: "new" }).eq("id", comm.lead_id);

      await supabase.from("alerts").insert({
        business_id: comm.business_id,
        lead_id: comm.lead_id,
        type: "missed_call",
        severity: "critical",
        title: "Missed Call",
        description: `Missed call from ${comm.from_number}. No callback sent yet.`,
        is_read: false,
        is_resolved: false,
      });

      await supabase.from("lead_events").insert({
        lead_id: comm.lead_id,
        business_id: comm.business_id,
        type: "missed_call",
        title: "Missed Call",
        description: `Call from ${comm.from_number} was not answered`,
        metadata: { call_sid: callSid, dial_status: dialStatus },
      });

      const { data: business } = await supabase
        .from("businesses")
        .select("notify_phone, name")
        .eq("id", comm.business_id)
        .single();

      if (business?.notify_phone) {
        const twilio = getTwilioClient();
        await twilio.messages.create({
          to: business.notify_phone,
          from: process.env.TWILIO_PHONE_NUMBER!,
          body: `⚠️ NOVA: Missed call from ${comm.from_number} for ${business.name}. Log in: https://nova-systems.app`,
        });
      }
    }
  } catch {
    // Silent — webhook must return 200
  }

  return new NextResponse(EMPTY_XML, { headers: { "Content-Type": "text/xml" } });
}
