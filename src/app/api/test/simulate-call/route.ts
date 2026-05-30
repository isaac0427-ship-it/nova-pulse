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
    const fakeSid = `CAtest${Date.now()}`

    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .insert({
        client_id: client?.id || null,
        source: 'phone',
        status: 'new',
        contact_phone: fakePhone,
        lead_in_at: new Date().toISOString(),
        raw_data: { call_sid: fakeSid, test: true }
      })
      .select()
      .single()

    if (leadErr) throw leadErr

    const { error: callErr } = await supabase.from('calls').insert({
      client_id: client?.id || null,
      lead_id: lead.id,
      twilio_call_sid: fakeSid,
      direction: 'inbound',
      from_number: fakePhone,
      to_number: '+19789136892',
      status: 'completed',
      duration_seconds: 142,
      called_at: new Date().toISOString()
    })

    if (callErr) throw callErr

    return NextResponse.json({
      ok: true,
      message: `✅ Lead created | Call logged | Check dashboard`,
      lead_id: lead.id,
      phone: fakePhone,
      client: client?.name || 'No client found'
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
