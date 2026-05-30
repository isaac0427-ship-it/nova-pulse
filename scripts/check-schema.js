const { createClient } = require('@supabase/supabase-js')

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function probeCols(table, candidates) {
  const found = []
  for (const col of candidates) {
    const { error } = await sb.from(table).select(col).limit(1)
    if (!error) found.push(col)
  }
  console.log(`\n=== ${table} ===\n${found.join('\n')}`)
}

async function main() {
  await probeCols('calls', [
    'id','business_id','client_id','lead_id',
    'twilio_call_sid','call_sid','sid','external_id',
    'direction','status',
    'from_number','to_number','caller','recipient',
    'duration','duration_seconds','call_duration',
    'called_at','started_at','ended_at','created_at',
    'recording_url','recorded_url','transcript'
  ])
  await probeCols('sms_messages', [
    'id','business_id','client_id','lead_id',
    'from_number','to_number','body','content','message',
    'direction','status','message_sid','sid','external_id',
    'received_at','sent_at','created_at'
  ])
}
main()
