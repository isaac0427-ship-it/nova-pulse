const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  // Get first row to see real columns
  const { data, error } = await sb.from('businesses').select('*').limit(1)
  if (error) { console.log('businesses ERROR:', JSON.stringify(error)); return }
  if (data && data[0]) {
    console.log('=== businesses columns ===')
    console.log(Object.keys(data[0]).join('\n'))
    console.log('\nSample row:', JSON.stringify(data[0], null, 2))
  } else {
    console.log('businesses: no rows found')
  }
}
main()
