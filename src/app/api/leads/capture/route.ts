import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  // Log env vars immediately — visible in Vercel function logs
  console.log('[capture] ENV CHECK:', {
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    TWILIO_SID: !!process.env.TWILIO_ACCOUNT_SID,
    TWILIO_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE: !!process.env.TWILIO_PHONE_NUMBER,
  })

  try {
    // Parse body
    let body: Record<string, string>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
    }

    const { business_id, name, phone, email, source = 'form', notes } = body
    console.log('[capture] STEP 1 — body received:', { business_id, name, phone, email, source })

    if (!name || !phone || !email || !business_id) {
      return NextResponse.json({ ok: false, error: 'Missing required fields: name, phone, email, business_id' }, { status: 400 })
    }

    // Init clients inside handler so missing env vars don't crash the module
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // STEP 2 — Insert lead
    console.log('[capture] STEP 2 — inserting lead into Supabase')
    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .insert({ business_id, name, phone, email, source, notes, status: 'new' })
      .select()
      .single()

    if (leadErr) {
      console.error('[capture] STEP 2 FAILED — lead insert error:', leadErr)
      return NextResponse.json({ ok: false, error: `DB error: ${leadErr.message}`, details: leadErr }, { status: 500 })
    }
    console.log('[capture] STEP 2 OK — lead_id:', lead.id)

    const service = notes?.split(' — ')[0] || 'Service request'

    // STEP 3 — Email Isaac
    console.log('[capture] STEP 3 — sending email to Isaac via Resend')
    try {
      const resend = new Resend(process.env.RESEND_API_KEY!)
      const emailResult = await resend.emails.send({
        from: 'Nova Systems <noreply@nova-systems.app>',
        to: 'isaac_0427@icloud.com',
        subject: `🔥 NEW LEAD — Apex Roofing: ${name} needs ${service}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#C6A15B;margin:0 0 24px 0;">🔥 New Form Lead — Apex Roofing & Repair</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#888;width:100px;">Name</td><td style="padding:8px 0;font-weight:700;">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Phone</td><td style="padding:8px 0;font-weight:700;"><a href="tel:${phone}" style="color:#C6A15B;">${phone}</a></td></tr>
            <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;">${email}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Service</td><td style="padding:8px 0;">${service}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Notes</td><td style="padding:8px 0;">${notes || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Time</td><td style="padding:8px 0;">${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</td></tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:#111;border-left:4px solid #C6A15B;">
            <strong style="color:#C6A15B;">Call them now:</strong> <a href="tel:${phone}" style="color:#fff;font-size:18px;">${phone}</a>
          </div>
          <p style="margin-top:16px;"><a href="https://nova-systems.app/master" style="color:#C6A15B;">View in Dashboard →</a></p>
        </div>`
      })
      console.log('[capture] STEP 3 OK — Resend email id:', emailResult.data?.id, 'error:', emailResult.error)
    } catch (emailErr) {
      console.error('[capture] STEP 3 FAILED — email error:', emailErr)
    }

    // STEP 4 — SMS Isaac via Twilio
    console.log('[capture] STEP 4 — sending SMS to Isaac via Twilio')
    try {
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
      const sms = await twilioClient.messages.create({
        to: '+12037060504',
        from: process.env.TWILIO_PHONE_NUMBER!,
        body: `🔥 NEW FORM LEAD — Apex Roofing\nName: ${name}\nPhone: ${phone}\nService: ${service}\nCall them now!`
      })
      console.log('[capture] STEP 4 OK — SMS sid:', sms.sid)
    } catch (smsErr) {
      console.error('[capture] STEP 4 FAILED — SMS error:', smsErr)
    }

    // STEP 5 — Confirmation email to lead
    console.log('[capture] STEP 5 — sending confirmation email to lead:', email)
    try {
      const resend = new Resend(process.env.RESEND_API_KEY!)
      await resend.emails.send({
        from: 'Apex Roofing & Repair <noreply@nova-systems.app>',
        to: email,
        subject: 'We received your request — Apex Roofing & Repair',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#1a1a2e;margin:0 0 16px 0;">Apex Roofing & Repair</h2>
          <p style="font-size:16px;">Hi ${name},</p>
          <p>Thanks for reaching out! We received your request for <strong>${service}</strong>.</p>
          <p>We'll call you at <strong>${phone}</strong> within 15 minutes.</p>
          <p style="color:#888;font-size:13px;margin-top:32px;">If you have any questions, reply to this email.</p>
        </div>`
      })
      console.log('[capture] STEP 5 OK — confirmation email sent')
    } catch (confErr) {
      console.error('[capture] STEP 5 FAILED — confirmation email error:', confErr)
    }

    console.log('[capture] ALL DONE — returning ok')
    return NextResponse.json({ ok: true, lead_id: lead.id })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[capture] TOP-LEVEL CATCH:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
