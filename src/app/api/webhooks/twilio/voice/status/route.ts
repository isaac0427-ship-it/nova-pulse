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
    const callSid = body.get('CallSid') as string
    const dialStatus = body.get('DialCallStatus') as string
    const duration = parseInt(body.get('DialCallDuration') as string || '0')

    const missed = ['no-answer', 'busy', 'failed', 'canceled'].includes(dialStatus)

    const { data: call } = await supabase
      .from('calls')
      .update({
        status: missed ? 'missed' : 'completed',
        duration_seconds: duration
      })
      .eq('twilio_call_sid', callSid)
      .select('client_id, lead_id, from_number')
      .single()

    if (!call) return new NextResponse('ok')

    await supabase
      .from('leads')
      .update({
        status: missed ? 'new' : 'contacted',
        first_contact_at: missed ? null : new Date().toISOString(),
        response_time_minutes: missed ? null : Math.round(duration / 60)
      })
      .eq('id', call.lead_id)

    if (missed) {
      await supabase.from('alerts').insert({
        client_id: call.client_id,
        lead_id: call.lead_id,
        type: 'missed_call',
        severity: 'high',
        message: `Missed call from ${call.from_number}`
      })

      const { data: client } = await supabase
        .from('clients')
        .select('name, notify_phone, forwarding_phone')
        .eq('id', call.client_id)
        .single()

      if (client?.forwarding_phone) {
        await twilioClient.messages.create({
          to: client.forwarding_phone,
          from: process.env.TWILIO_PHONE_NUMBER!,
          body: `📞 You missed a call from ${call.from_number}. This lead was tracked by Nova Systems. Call them back now: ${call.from_number}`
        })
      }

      await twilioClient.messages.create({
        to: '+12037060504',
        from: process.env.TWILIO_PHONE_NUMBER!,
        body: `⚠️ NOVA ALERT: ${client?.name || 'A client'} missed a call from ${call.from_number}. Dashboard: https://nova-systems.app`
      })
    }

  } catch (err) {
    console.error('Status error:', err)
  }

  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response/>',
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
