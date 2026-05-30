import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData()
    const callSid = body.get('CallSid') as string
    const from = body.get('From') as string
    const to = body.get('To') as string

    const { data: client } = await supabase
      .from('clients')
      .select('id, name, forwarding_phone, notify_phone, email')
      .eq('twilio_number', to)
      .single()

    const forwardTo = client?.forwarding_phone || '+12037060504'
    const clientId = client?.id || null

    const { data: lead } = await supabase
      .from('leads')
      .insert({
        client_id: clientId,
        source: 'phone',
        status: 'new',
        contact_phone: from,
        lead_in_at: new Date().toISOString(),
        raw_data: { call_sid: callSid, to_number: to }
      })
      .select()
      .single()

    await supabase.from('calls').insert({
      client_id: clientId,
      lead_id: lead?.id,
      twilio_call_sid: callSid,
      direction: 'inbound',
      from_number: from,
      to_number: to,
      status: 'in-progress',
      called_at: new Date().toISOString()
    })

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${to}" timeout="20"
        action="https://nova-systems.app/api/webhooks/twilio/voice/status"
        method="POST">
    <Number>${forwardTo}</Number>
  </Dial>
</Response>`

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    })

  } catch (err) {
    console.error('Voice webhook error:', err)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="+19789136892" timeout="20">
    <Number>+12037060504</Number>
  </Dial>
</Response>`
    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    })
  }
}
