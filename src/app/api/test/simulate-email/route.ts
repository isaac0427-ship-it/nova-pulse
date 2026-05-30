import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

const TEST_BUSINESS_ID = '915819ad-4189-4809-a1d3-71f4d71f426a'

function errMsg(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (e.message) return String(e.message)
    if (e.details) return `${e.code}: ${e.details}`
    return JSON.stringify(err)
  }
  return String(err)
}

export async function POST() {
  try {
    const fakeEmail = `test.lead.${Date.now()}@example.com`
    const fakeSubject = 'Interested in HVAC service quote'
    const fakeBody = 'Hi, I need a quote for my home HVAC system. Please get back to me.'

    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .insert({
        business_id: TEST_BUSINESS_ID,
        source: 'email',
        status: 'new',
        email: fakeEmail,
        notes: `Subject: ${fakeSubject}\n\n${fakeBody}`
      })
      .select()
      .single()

    if (leadErr) {
      return NextResponse.json({ ok: false, error: `leads insert: ${errMsg(leadErr)}`, hint: leadErr }, { status: 500 })
    }

    const { error: alertErr } = await supabase.from('alerts').insert({
      business_id: TEST_BUSINESS_ID,
      lead_id: lead.id,
      type: 'email_lead',
      severity: 'medium',
      title: 'New Email Lead',
      description: `Test email from ${fakeEmail}: "${fakeSubject}"`,
      is_read: false,
      is_resolved: false
    })

    if (alertErr) {
      return NextResponse.json({ ok: false, error: `alerts insert: ${errMsg(alertErr)}`, hint: alertErr }, { status: 500 })
    }

    const emailResult = await resend.emails.send({
      from: 'Nova Systems <noreply@nova-systems.app>',
      to: 'isaac_0427@icloud.com',
      subject: `NOVA TEST: New email lead — ${fakeSubject}`,
      html: `<div style="font-family:sans-serif;padding:24px;">
        <h2 style="color:#C6A15B;">Test Email Lead</h2>
        <p><strong>Business ID:</strong> ${TEST_BUSINESS_ID}</p>
        <p><strong>From:</strong> ${fakeEmail}</p>
        <p><strong>Subject:</strong> ${fakeSubject}</p>
        <p>${fakeBody}</p>
        <p><a href="https://nova-systems.app/master">View Dashboard →</a></p>
      </div>`
    })

    return NextResponse.json({
      ok: true,
      message: '✅ Email sent to isaac_0427@icloud.com | Lead created',
      lead_id: lead.id,
      email: fakeEmail,
      business_id: TEST_BUSINESS_ID,
      resend_id: emailResult.data?.id ?? null
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: errMsg(err) }, { status: 500 })
  }
}
