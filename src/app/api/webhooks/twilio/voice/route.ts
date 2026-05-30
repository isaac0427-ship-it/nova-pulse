import { NextRequest, NextResponse } from 'next/server'

const FALLBACK_TWIML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="20">
    <Number>+12037060504</Number>
  </Dial>
</Response>`

function twimlResponse(xml: string) {
  return new NextResponse(xml, { status: 200, headers: { 'Content-Type': 'text/xml' } })
}

export async function POST(req: NextRequest) {
  // Always return valid TwiML — never let this crash
  try {
    const body = await req.formData()
    const callSid = body.get('CallSid') as string
    const from = body.get('From') as string
    const to = body.get('To') as string

    console.log('[voice] incoming call:', { callSid, from, to })

    // Init Supabase inside handler — missing env vars crash module-level init
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let forwardTo = '+12037060504'
    let businessId: string | null = null
    let leadId = ''

    try {
      const { data: business } = await supabase
        .from('businesses')
        .select('id, name, phone')
        .eq('twilio_number', to)
        .single()

      forwardTo = business?.phone || '+12037060504'
      businessId = business?.id || null
      console.log('[voice] business lookup:', { businessId, forwardTo })
    } catch (bizErr) {
      console.error('[voice] business lookup failed:', bizErr)
    }

    try {
      const { data: lead } = await supabase
        .from('leads')
        .insert({ business_id: businessId, source: 'phone', status: 'new', phone: from })
        .select()
        .single()
      leadId = lead?.id ?? ''
      console.log('[voice] lead created:', leadId)
    } catch (leadErr) {
      console.error('[voice] lead insert failed:', leadErr)
    }

    try {
      await supabase.from('calls').insert({
        client_id: businessId,
        transcript: JSON.stringify({ call_sid: callSid, from_number: from, to_number: to, direction: 'inbound', lead_id: leadId })
      })
    } catch (callErr) {
      console.error('[voice] call insert failed:', callErr)
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${to}" timeout="20"
        action="https://nova-systems.app/api/webhooks/twilio/voice/status?lead_id=${leadId}&business_id=${businessId}"
        method="POST">
    <Number>${forwardTo}</Number>
  </Dial>
</Response>`

    console.log('[voice] returning TwiML, forwarding to:', forwardTo)
    return twimlResponse(twiml)

  } catch (err) {
    console.error('[voice] TOP-LEVEL CRASH — returning fallback TwiML:', err)
    return twimlResponse(FALLBACK_TWIML)
  }
}
