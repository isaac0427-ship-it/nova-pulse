import { NextRequest, NextResponse } from 'next/server'

const FALLBACK_TWIML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thanks for reaching out! We'll get back to you shortly.</Message>
</Response>`

function twimlResponse(xml: string) {
  return new NextResponse(xml, { status: 200, headers: { 'Content-Type': 'text/xml' } })
}

export async function POST(req: NextRequest) {
  // Always return valid TwiML — never let this crash
  try {
    const body = await req.formData()
    const from = body.get('From') as string
    const to = body.get('To') as string
    const messageBody = (body.get('Body') as string) || ''

    console.log('[sms] incoming message:', { from, to, body: messageBody.slice(0, 50) })

    // Init clients inside handler — missing env vars crash module-level init
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let businessId: string | null = null
    let businessName = 'A client'
    let businessPhone: string | null = null
    let leadId: string | null = null

    try {
      const { data: business } = await supabase
        .from('businesses')
        .select('id, name, phone')
        .eq('twilio_number', to)
        .single()
      businessId = business?.id || null
      businessName = business?.name || 'A client'
      businessPhone = business?.phone || null
      console.log('[sms] business lookup:', { businessId, businessName })
    } catch (bizErr) {
      console.error('[sms] business lookup failed:', bizErr)
    }

    try {
      const { data: lead } = await supabase
        .from('leads')
        .insert({ business_id: businessId, source: 'sms', status: 'new', phone: from })
        .select()
        .single()
      leadId = lead?.id || null
      console.log('[sms] lead created:', leadId)
    } catch (leadErr) {
      console.error('[sms] lead insert failed:', leadErr)
    }

    try {
      await supabase.from('sms_messages').insert({
        client_id: businessId,
        lead_id: leadId,
        from_number: from,
        to_number: to,
        body: messageBody.slice(0, 1600),
        direction: 'inbound',
        status: 'received',
        sent_at: new Date().toISOString()
      })
    } catch (smsDbErr) {
      console.error('[sms] sms_messages insert failed:', smsDbErr)
    }

    // Send notifications via Twilio API (separate from TwiML response)
    try {
      const twilio = (await import('twilio')).default
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
      const notifications = [
        // Notify business owner
        businessPhone
          ? twilioClient.messages.create({
              to: businessPhone,
              from: process.env.TWILIO_PHONE_NUMBER!,
              body: `📱 NOVA: New text from ${from}: "${messageBody.slice(0, 100)}"`
            })
          : Promise.resolve(),
        // Notify Isaac
        twilioClient.messages.create({
          to: '+12037060504',
          from: process.env.TWILIO_PHONE_NUMBER!,
          body: `📱 NOVA: ${businessName} got a text from ${from}: "${messageBody.slice(0, 100)}"`
        }),
      ]
      await Promise.allSettled(notifications)
      console.log('[sms] notifications sent')
    } catch (notifyErr) {
      console.error('[sms] notifications failed:', notifyErr)
    }

    // TwiML auto-reply to sender
    return twimlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thanks for reaching out! We'll get back to you shortly.</Message>
</Response>`)

  } catch (err) {
    console.error('[sms] TOP-LEVEL CRASH — returning fallback TwiML:', err)
    return twimlResponse(FALLBACK_TWIML)
  }
}
