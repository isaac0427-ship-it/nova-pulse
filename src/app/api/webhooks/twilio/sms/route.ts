import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData()
    const from = body.get('From') as string
    const to = body.get('To') as string
    const messageBody = (body.get('Body') as string) || ''
    const messageSid = body.get('MessageSid') as string

    const { data: client } = await supabase
      .from('clients')
      .select('id, name, forwarding_phone, notify_phone')
      .eq('twilio_number', to)
      .single()

    const clientId = client?.id || null

    const { data: lead } = await supabase
      .from('leads')
      .insert({
        client_id: clientId,
        source: 'sms',
        status: 'new',
        contact_phone: from,
        lead_in_at: new Date().toISOString(),
        raw_data: { message_sid: messageSid, to_number: to }
      })
      .select()
      .single()

    await supabase.from('sms_messages').insert({
      client_id: clientId,
      lead_id: lead?.id,
      from_number: from,
      to_number: to,
      body: messageBody.slice(0, 1600),
      direction: 'inbound',
      message_sid: messageSid,
      received_at: new Date().toISOString()
    })

    await Promise.allSettled([
      twilioClient.messages.create({
        to: from,
        from: to,
        body: `Thanks for reaching out! We'll get back to you shortly.`
      }),
      client?.forwarding_phone
        ? twilioClient.messages.create({
            to: client.forwarding_phone,
            from: process.env.TWILIO_PHONE_NUMBER!,
            body: `📱 NOVA: New text from ${from}: "${messageBody.slice(0, 100)}"`
          })
        : Promise.resolve(),
      twilioClient.messages.create({
        to: '+12037060504',
        from: process.env.TWILIO_PHONE_NUMBER!,
        body: `📱 NOVA: ${client?.name || 'A client'} got a text from ${from}: "${messageBody.slice(0, 100)}"`
      })
    ])

  } catch (err) {
    console.error('SMS webhook error:', err)
  }

  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response/>',
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
