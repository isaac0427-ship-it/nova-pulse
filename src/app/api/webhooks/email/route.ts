import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    let data: Record<string, string>
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      data = await req.json()
    } else {
      const form = await req.formData()
      data = Object.fromEntries(
        Array.from(form.entries()).map(([k, v]) => [k, String(v)])
      )
    }

    const senderEmail = data.from || data.sender || ''
    const subject = data.subject || '(no subject)'
    const bodyText = data.text || data.plain || data.body || ''
    const toAddress = data.to || ''

    // Find client by their tracking email
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, email, forwarding_email, avg_customer_value')
      .eq('forwarding_email', toAddress)
      .single()

    const clientId = client?.id || null

    const { data: lead } = await supabase
      .from('leads')
      .insert({
        client_id: clientId,
        source: 'email',
        status: 'new',
        contact_email: senderEmail,
        lead_in_at: new Date().toISOString(),
        raw_data: { subject, to: toAddress, preview: bodyText.slice(0, 200) }
      })
      .select()
      .single()

    await supabase.from('alerts').insert({
      client_id: clientId,
      lead_id: lead?.id,
      type: 'email_lead',
      severity: 'medium',
      message: `New email lead from ${senderEmail}: "${subject}"`
    })

    const emailBody = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <p><strong>From:</strong> ${senderEmail}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr/>
        <p>${bodyText.slice(0, 500).replace(/\n/g, '<br/>')}</p>
        <hr/>
        <p style="color:#888;font-size:12px;">Tracked by Nova Systems</p>
      </div>`

    await Promise.allSettled([
      client?.email
        ? resend.emails.send({
            from: 'Nova Systems <noreply@nova-systems.app>',
            to: client.email,
            subject: `NOVA: New email lead — ${subject}`,
            html: emailBody
          })
        : Promise.resolve(),
      resend.emails.send({
        from: 'Nova Systems <noreply@nova-systems.app>',
        to: 'isaac_0427@icloud.com',
        subject: `NOVA: New email lead${client ? ` for ${client.name}` : ''} — ${subject}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#C6A15B;">New Email Lead</h2>
          ${client ? `<p><strong>Client:</strong> ${client.name}</p>` : ''}
          <p><strong>From:</strong> ${senderEmail}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr/>
          <p>${bodyText.slice(0, 300).replace(/\n/g, '<br/>')}</p>
          <p><a href="https://nova-systems.app/master">View Dashboard →</a></p>
        </div>`
      })
    ])

  } catch (err) {
    console.error('Email webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
