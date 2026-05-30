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
    const { searchParams } = new URL(req.url)
    const leadId = searchParams.get('lead_id')
    const businessId = searchParams.get('business_id')

    const body = await req.formData()
    const dialStatus = body.get('DialCallStatus') as string
    const duration = parseInt(body.get('DialCallDuration') as string || '0')
    const from = body.get('From') as string

    const missed = ['no-answer', 'busy', 'failed', 'canceled'].includes(dialStatus)

    if (leadId) {
      await supabase
        .from('leads')
        .update({
          status: missed ? 'new' : 'contacted',
          first_contact_at: missed ? null : new Date().toISOString(),
          response_time_seconds: missed ? null : duration
        })
        .eq('id', leadId)
    }

    if (missed && businessId) {
      await supabase.from('alerts').insert({
        business_id: businessId,
        lead_id: leadId || null,
        type: 'missed_call',
        severity: 'high',
        title: 'Missed Call',
        description: `Missed call from ${from}`,
        is_read: false,
        is_resolved: false
      })

      const { data: business } = await supabase
        .from('businesses')
        .select('name, phone')
        .eq('id', businessId)
        .single()

      if (business?.phone) {
        await twilioClient.messages.create({
          to: business.phone,
          from: process.env.TWILIO_PHONE_NUMBER!,
          body: `📞 You missed a call from ${from}. This lead was tracked by Nova Systems. Call them back now: ${from}`
        })
      }

      await twilioClient.messages.create({
        to: '+12037060504',
        from: process.env.TWILIO_PHONE_NUMBER!,
        body: `⚠️ NOVA ALERT: ${business?.name || 'A client'} missed a call from ${from}. Dashboard: https://nova-systems.app`
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
