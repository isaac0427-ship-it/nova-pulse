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

    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, phone, email')
      .eq('twilio_number', to)
      .single()

    const forwardTo = business?.phone || '+12037060504'
    const businessId = business?.id || null

    const { data: lead } = await supabase
      .from('leads')
      .insert({
        business_id: businessId,
        source: 'phone',
        status: 'new',
        phone: from,
      })
      .select()
      .single()

    // calls table only has: id, client_id, created_at, transcript
    await supabase.from('calls').insert({
      client_id: businessId,
      transcript: JSON.stringify({ call_sid: callSid, from_number: from, to_number: to, direction: 'inbound', lead_id: lead?.id })
    })

    const leadId = lead?.id ?? ''
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${to}" timeout="20"
        action="https://nova-systems.app/api/webhooks/twilio/voice/status?lead_id=${leadId}&business_id=${businessId}"
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
