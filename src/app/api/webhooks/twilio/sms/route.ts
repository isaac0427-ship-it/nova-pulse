import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateTwilioSignature, getTwilioClient } from "@/lib/twilio";

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

  const { From: from, To: to, Body: messageBody, MessageSid: messageSid } = params;
  if (!from || !to || !messageSid) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const safeBody = (messageBody ?? "").slice(0, 1600);

  try {
    const supabase = db();
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, forwarding_phone, notify_phone")
      .eq("twilio_number", to)
      .single();

    if (!business) return NextResponse.json({ ok: true });

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
          source: "sms",
          status: "new",
          phone: from,
          first_contact_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (!newLead) return NextResponse.json({ ok: false }, { status: 500 });
      leadId = newLead.id;
    }

    await Promise.all([
      supabase.from("communications").insert({
        lead_id: leadId,
        business_id: business.id,
        type: "sms",
        direction: "inbound",
        content: safeBody,
        status: "received",
        from_number: from,
        to_number: to,
        external_id: messageSid,
      }),
      supabase.from("lead_events").insert({
        lead_id: leadId,
        business_id: business.id,
        type: "inbound_sms",
        title: "Inbound SMS",
        description: `SMS received from ${from}`,
        metadata: { body: safeBody.slice(0, 200) },
      }),
    ]);

    // Auto-reply to lead + notification to business
    const twilio = getTwilioClient();
    await Promise.allSettled([
      twilio.messages.create({
        to: from,
        from: to,
        body: `Thanks for reaching out to ${business.name}! We received your message and will get back to you shortly.`,
      }),
      business.notify_phone
        ? twilio.messages.create({
            to: business.notify_phone,
            from: to,
            body: `📱 NOVA: New SMS from ${from}: "${safeBody.slice(0, 100)}" — nova-systems.app`,
          })
        : Promise.resolve(),
    ]);
  } catch {
    // Silent
  }

  return NextResponse.json({ ok: true });
}
