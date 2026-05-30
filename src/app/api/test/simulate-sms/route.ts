import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    const { data: client } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1)
      .single()

    const fakePhone = `+1203555${Math.floor(1000 + Math.random() * 9000)}`
    const fakeSid = `SMtest${Date.now()}`
    const fakeBody = 'Hi, I saw your ad and wanted to get a quote for my HVAC system.'

    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .insert({
        client_id: client?.id || null,
        source: 'sms',
        status: 'new',
        contact_phone: fakePhone,
        lead_in_at: new Date().toISOString(),
        raw_data: { message_sid: fakeSid, test: true }
      })
      .select()
      .single()

    if (leadErr) throw leadErr

    const { error: smsErr } = await supabase.from('sms_messages').insert({
      client_id: client?.id || null,
      lead_id: lead.id,
      from_number: fakePhone,
      to_number: '+19789136892',
      body: fakeBody,
      direction: 'inbound',
      message_sid: fakeSid,
      received_at: new Date().toISOString()
    })

    if (smsErr) throw smsErr

    return NextResponse.json({
      ok: true,
      message: `✅ SMS lead created | Check dashboard`,
      lead_id: lead.id,
      phone: fakePhone,
      client: client?.name || 'No client found'
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
