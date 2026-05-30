const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  // Clear twilio_number from any existing row that owns +19789136892
  const { error: clearErr } = await sb
    .from('businesses')
    .update({ twilio_number: null })
    .eq('twilio_number', '+19789136892')
    .neq('id', 'aaaaaaaa-0427-0427-0427-aaaaaaaaaaaa')

  if (clearErr) console.warn('Clear existing twilio_number:', clearErr.message)
  else console.log('✅ Cleared twilio_number from existing owner')

  // Upsert Apex Roofing
  const defaultHours = {
    monday:    { open: true,  start: '08:00', end: '17:00' },
    tuesday:   { open: true,  start: '08:00', end: '17:00' },
    wednesday: { open: true,  start: '08:00', end: '17:00' },
    thursday:  { open: true,  start: '08:00', end: '17:00' },
    friday:    { open: true,  start: '08:00', end: '17:00' },
    saturday:  { open: false, start: '09:00', end: '14:00' },
    sunday:    { open: false, start: '09:00', end: '14:00' },
  }

  const { data, error } = await sb
    .from('businesses')
    .upsert({
      id: 'aaaaaaaa-0427-0427-0427-aaaaaaaaaaaa',
      owner_id: '40171125-2935-49d8-8a46-5ddf8ab65dfd',
      name: 'Apex Roofing & Repair',
      type: 'Roofing',
      owner_name: 'Isaac (Test)',
      phone: '+12037060504',
      email: 'isaac_0427@icloud.com',
      twilio_number: '+19789136892',
      slug: 'apex-roofing',
      role: 'client',
      timezone: 'America/New_York',
      gmail_connected: false,
      business_hours: defaultHours,
    }, { onConflict: 'id' })
    .select()

  if (error) {
    console.error('❌ Upsert failed:', JSON.stringify(error, null, 2))
    process.exit(1)
  }
  console.log('✅ Apex Roofing & Repair upserted successfully')
  console.log('   ID:', 'aaaaaaaa-0427-0427-0427-aaaaaaaaaaaa')
  console.log('   Twilio:', '+19789136892')
  console.log('   Forward to:', '+12037060504')
}

main()
