import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST() {
  try {
    const { data: client } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1)
      .single()

    const fakeEmail = `test.lead.${Date.now()}@example.com`
    const fakeSubject = 'Interested in HVAC service quote'
    const fakeBody = 'Hi, I need a quote for my home HVAC system. Please get back to me.'

    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .insert({
        client_id: client?.id || null,
        source: 'email',
        status: 'new',
        contact_email: fakeEmail,
        lead_in_at: new Date().toISOString(),
        raw_data: { subject: fakeSubject, test: true }
      })
      .select()
      .single()

    if (leadErr) throw leadErr

    await supabase.from('alerts').insert({
      client_id: client?.id || null,
      lead_id: lead.id,
      type: 'email_lead',
      severity: 'medium',
      message: `Test email lead from ${fakeEmail}: "${fakeSubject}"`
    })

    await resend.emails.send({
      from: 'Nova Systems <noreply@nova-systems.app>',
      to: 'isaac_0427@icloud.com',
      subject: `NOVA TEST: New email lead — ${fakeSubject}`,
      html: `<div style="font-family:sans-serif;padding:24px;">
        <h2 style="color:#C6A15B;">Test Email Lead</h2>
        <p><strong>Client:</strong> ${client?.name || 'No client'}</p>
        <p><strong>From:</strong> ${fakeEmail}</p>
        <p><strong>Subject:</strong> ${fakeSubject}</p>
        <p>${fakeBody}</p>
        <p><a href="https://nova-systems.app/master">View Dashboard →</a></p>
      </div>`
    })

    return NextResponse.json({
      ok: true,
      message: `✅ Email sent to isaac_0427@icloud.com | Lead created`,
      lead_id: lead.id,
      email: fakeEmail,
      client: client?.name || 'No client found'
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
