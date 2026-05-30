import { NextResponse } from 'next/server'
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
    const fakePhone = `+1203555${Math.floor(1000 + Math.random() * 9000)}`
    const fakeSid = `CAtest_missed_${Date.now()}`

    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .insert({
        business_id: TEST_BUSINESS_ID,
        source: 'phone',
        status: 'new',
        phone: fakePhone,
      })
      .select()
      .single()

    if (leadErr) {
      return NextResponse.json({ ok: false, error: `leads insert: ${errMsg(leadErr)}`, hint: leadErr }, { status: 500 })
    }

    const { error: callErr } = await supabase.from('calls').insert({
      client_id: TEST_BUSINESS_ID,
      transcript: JSON.stringify({ call_sid: fakeSid, from_number: fakePhone, to_number: '+19789136892', direction: 'inbound', status: 'missed', lead_id: lead.id, test: true })
    })

    if (callErr) {
      return NextResponse.json({ ok: false, error: `calls insert: ${errMsg(callErr)}`, hint: callErr }, { status: 500 })
    }

    const { error: alertErr } = await supabase.from('alerts').insert({
      business_id: TEST_BUSINESS_ID,
      lead_id: lead.id,
      type: 'missed_call',
      severity: 'high',
      title: 'Missed Call',
      description: `TEST: Missed call from ${fakePhone}`,
      is_read: false,
      is_resolved: false
    })

    if (alertErr) {
      return NextResponse.json({ ok: false, error: `alerts insert: ${errMsg(alertErr)}`, hint: alertErr }, { status: 500 })
    }

    await twilioClient.messages.create({
      to: '+12037060504',
      from: process.env.TWILIO_PHONE_NUMBER!,
      body: `⚠️ NOVA TEST ALERT: Arctic Air HVAC missed a call from ${fakePhone}. Dashboard: https://nova-systems.app`
    })

    return NextResponse.json({
      ok: true,
      message: '✅ Alert created | SMS sent to Isaac',
      lead_id: lead.id,
      phone: fakePhone,
      business_id: TEST_BUSINESS_ID
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: errMsg(err) }, { status: 500 })
  }
}
