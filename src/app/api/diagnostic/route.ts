import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function buildAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      full_name,
      business_name,
      business_type,
      phone,
      email,
      monthly_leads,
      biggest_challenge,
      referral_source,
    } = data;

    if (!full_name || !business_name || !business_type || !phone || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save to database
    const admin = buildAdminClient();
    const { error: dbError } = await admin.from("diagnostic_requests").insert({
      full_name,
      business_name,
      business_type,
      phone,
      email,
      website: null,
      monthly_leads,
      biggest_challenge,
      referral_source,
      best_contact_time: null,
    });

    if (dbError) {
      console.error("[diagnostic] DB error:", dbError.message, dbError.details);
      return NextResponse.json({ error: "Failed to save request" }, { status: 500 });
    }

    console.log("[diagnostic] Saved to DB:", business_name, email);

    // Admin notification email
    const r1 = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer re_PpMRkB7o_5osTdRdaQtpgY8nbqvUkHv9",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: "isaac_0427@icloud.com",
        subject: `New Diagnostic — ${data.business_name}`,
        html: `<h2>New Diagnostic Request</h2>
          <p><b>Name:</b> ${data.full_name}</p>
          <p><b>Business:</b> ${data.business_name}</p>
          <p><b>Type:</b> ${data.business_type}</p>
          <p><b>Phone:</b> ${data.phone}</p>
          <p><b>Email:</b> ${data.email}</p>
          <p><b>Missed calls/week:</b> ${data.monthly_leads}</p>
          <p><b>Challenge:</b> ${data.biggest_challenge}</p>
          <p><b>Source:</b> ${data.referral_source}</p>`,
      }),
    });
    console.log("Resend status:", r1.status, await r1.json());

    // Confirmation to submitter
    const r2 = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer re_PpMRkB7o_5osTdRdaQtpgY8nbqvUkHv9",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: data.email,
        subject: "Nova Systems — We Received Your Request",
        html: `<h2>Thank you, ${data.full_name}.</h2>
          <p>We received your request for ${data.business_name}.</p>
          <p>Our team will contact you within 24 hours.</p>
          <br><p>— Nova Systems</p>`,
      }),
    });
    console.log("Confirmation email status:", r2.status);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[diagnostic] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
