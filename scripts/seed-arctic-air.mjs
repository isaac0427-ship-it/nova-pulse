// Run: node --env-file=.env.local scripts/seed-arctic-air.mjs
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAT              = process.env.SUPABASE_PAT;
const REF              = process.env.SUPABASE_PROJECT_REF;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing env vars — run with: node --env-file=.env.local scripts/seed-arctic-air.mjs");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function mgmtQuery(q) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  return { status: res.status, ok: res.ok, body };
}

function daysAgo(n, hoursOffset = 9) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hoursOffset, Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}

function addSeconds(isoDate, seconds) {
  return new Date(new Date(isoDate).getTime() + seconds * 1000).toISOString();
}

// ─── 1. Ensure Arctic Air exists ─────────────────────────────────────────────
console.log("▶  Checking for Arctic Air business…");

const { data: existing } = await supabase
  .from("businesses")
  .select("id, name, slug")
  .eq("slug", "arctic-air")
  .maybeSingle();

let businessId;
if (existing) {
  businessId = existing.id;
  console.log(`✅  Found existing business: ${existing.name} (${businessId})`);
} else {
  // Need an owner_id — use Isaac's auth user
  const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const isaac = users?.users?.find((u) => u.email === "isaac_0427@icloud.com");
  if (!isaac) throw new Error("Isaac auth user not found — cannot create business");

  const { data: biz, error } = await supabase
    .from("businesses")
    .insert({
      owner_id:        isaac.id,
      name:            "Arctic Air HVAC",
      type:            "hvac",
      owner_name:      "Mike Caldwell",
      phone:           "(978) 555-0142",
      email:           "mike@arcticairhvac.com",
      timezone:        "America/New_York",
      twilio_number:   "+19789136892",
      gmail_connected: true,
      website:         "https://arcticairhvac.com",
      slug:            "arctic-air",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create business: ${error.message}`);
  businessId = biz.id;
  console.log(`✅  Created Arctic Air HVAC (${businessId})`);
}

// ─── 2. Clear existing seeded data ───────────────────────────────────────────
console.log("▶  Clearing existing leads / alerts / reports for clean seed…");
await supabase.from("reports").delete().eq("business_id", businessId);
await supabase.from("alerts").delete().eq("business_id", businessId);
// communications cascade from leads
await supabase.from("leads").delete().eq("business_id", businessId);
console.log("✅  Cleared");

// ─── 3. Insert 47 leads ───────────────────────────────────────────────────────
console.log("▶  Inserting 47 leads…");

const leads = [
  // WEEK 12 (most recent, ~0-7 days ago)
  { name: "James Whitmore",   phone: "(617) 555-0191", email: null,                        source: "phone_call", status: "booked",    notes: "Central AC install, 3-ton unit, scheduled for Tuesday",       created_at: daysAgo(1, 8),  response_time_seconds: 180 },
  { name: "Sandra Reyes",     phone: "(781) 555-0248", email: "sreyes@gmail.com",          source: "web_form",  status: "quoted",    notes: "Furnace replacement, 80k BTU, waiting on approval",            created_at: daysAgo(1, 14), response_time_seconds: 420 },
  { name: "Derek Olson",      phone: "(508) 555-0377", email: null,                        source: "phone_call", status: "contacted", notes: "AC not cooling, possible refrigerant leak",                    created_at: daysAgo(2, 10), response_time_seconds: 95 },
  { name: "Patricia Huang",   phone: "(617) 555-0502", email: "phuang@outlook.com",        source: "email",     status: "quoted",    notes: "Mini-split install, 2 zones, home office + master bedroom",    created_at: daysAgo(2, 16), response_time_seconds: 1800 },
  { name: null,               phone: "(978) 555-0614", email: null,                        source: "phone_call", status: "new",       notes: "Missed call — no voicemail",                                   created_at: daysAgo(3, 9),  response_time_seconds: null },
  { name: "Kevin Marsh",      phone: "(339) 555-0729", email: null,                        source: "phone_call", status: "booked",    notes: "Annual maintenance tune-up, 2 units",                          created_at: daysAgo(3, 11), response_time_seconds: 240 },
  { name: "Tiffany Brooks",   phone: "(617) 555-0831", email: "tbrooks@gmail.com",        source: "sms",       status: "contacted", notes: "Heat pump making grinding noise",                               created_at: daysAgo(4, 15), response_time_seconds: 320 },
  { name: null,               phone: "(781) 555-0956", email: null,                        source: "phone_call", status: "ignored",   notes: "Missed call — called back twice, no answer",                   created_at: daysAgo(4, 8),  response_time_seconds: null },
  { name: "Marcus Chen",      phone: "(508) 555-1047", email: "mchen@me.com",             source: "web_form",  status: "new",       notes: "Requesting quote for new construction HVAC system",             created_at: daysAgo(5, 10), response_time_seconds: null },
  { name: "Angela Petrov",    phone: "(617) 555-1183", email: null,                        source: "phone_call", status: "quoted",    notes: "Ductwork replacement, older home, 1600 sq ft",                 created_at: daysAgo(5, 13), response_time_seconds: 660 },
  { name: "Tom Vance",        phone: "(978) 555-1224", email: "tvance@gmail.com",         source: "email",     status: "booked",    notes: "Emergency no-heat call, boiler tune-up",                        created_at: daysAgo(6, 7),  response_time_seconds: 480 },
  { name: "Brenda Lawson",    phone: "(339) 555-1345", email: null,                        source: "phone_call", status: "closed",    notes: "AC repair, capacitor replaced, $340 job",                      created_at: daysAgo(6, 14), response_time_seconds: 150 },
  { name: "Paul Donovan",     phone: "(617) 555-1467", email: "pdonovan@hotmail.com",     source: "web_form",  status: "lost",      notes: "Price shopped, went with competitor",                           created_at: daysAgo(7, 11), response_time_seconds: 3600 },

  // WEEK 11 (8-14 days ago)
  { name: "Michelle Torres",  phone: "(781) 555-1578", email: null,                        source: "phone_call", status: "closed",    notes: "Furnace repair, igniter replaced, $285",                       created_at: daysAgo(8, 9),  response_time_seconds: 210 },
  { name: "Aaron Singh",      phone: "(508) 555-1689", email: "asingh@gmail.com",         source: "sms",       status: "quoted",    notes: "New AC unit, replacing 14-year-old R22 system",                created_at: daysAgo(8, 12), response_time_seconds: 900 },
  { name: null,               phone: "(617) 555-1790", email: null,                        source: "phone_call", status: "new",       notes: "Missed call, evening hours",                                   created_at: daysAgo(9, 17), response_time_seconds: null },
  { name: "Gloria Kim",       phone: "(978) 555-1802", email: "gloriakim@icloud.com",     source: "web_form",  status: "booked",    notes: "Spring AC maintenance, 2-story colonial",                       created_at: daysAgo(9, 10), response_time_seconds: 1200 },
  { name: "Steve MacIntyre",  phone: "(339) 555-1923", email: null,                        source: "phone_call", status: "contacted", notes: "Thermostat not responding, possible wiring issue",              created_at: daysAgo(10, 8), response_time_seconds: 380 },
  { name: "Diane Kowalski",   phone: "(617) 555-2034", email: "dkowalski@gmail.com",      source: "email",     status: "closed",    notes: "Heat pump install complete, $6,200 job",                        created_at: daysAgo(10, 14),response_time_seconds: 2400 },
  { name: "Gary Thornton",    phone: "(781) 555-2145", email: null,                        source: "phone_call", status: "booked",    notes: "AC not starting, contactor issue likely",                       created_at: daysAgo(11, 9), response_time_seconds: 120 },
  { name: "Rachel Nguyen",    phone: "(508) 555-2256", email: "rnguyen@outlook.com",      source: "web_form",  status: "quoted",    notes: "Whole-home dehumidifier installation",                          created_at: daysAgo(11, 15),response_time_seconds: 5400 },
  { name: null,               phone: "(617) 555-2367", email: null,                        source: "phone_call", status: "ignored",   notes: "Missed — called back, disconnected number",                    created_at: daysAgo(12, 11),response_time_seconds: null },
  { name: "Carlos Mendoza",   phone: "(978) 555-2478", email: "cmendoza@gmail.com",       source: "sms",       status: "closed",    notes: "Drain pan overflow, emergency visit, $195",                    created_at: daysAgo(13, 8), response_time_seconds: 540 },
  { name: "Linda Park",       phone: "(339) 555-2589", email: "lindapark@me.com",         source: "web_form",  status: "lost",      notes: "Moved to another state, cancelled request",                     created_at: daysAgo(13, 16),response_time_seconds: 7200 },
  { name: "Frank Bellows",    phone: "(617) 555-2690", email: null,                        source: "phone_call", status: "booked",    notes: "Zoning system install, 4-zone setup",                           created_at: daysAgo(14, 10),response_time_seconds: 280 },

  // WEEK 10 (15-21 days ago)
  { name: "Nancy Roth",       phone: "(781) 555-2701", email: "nroth@gmail.com",          source: "email",     status: "closed",    notes: "Boiler service + zone valve replacement, $890",                created_at: daysAgo(15, 9), response_time_seconds: 3600 },
  { name: "Victor Huang",     phone: "(508) 555-2812", email: null,                        source: "phone_call", status: "closed",    notes: "Emergency AC call, fan motor replaced, $420",                  created_at: daysAgo(15, 14),response_time_seconds: 180 },
  { name: null,               phone: "(617) 555-2923", email: null,                        source: "phone_call", status: "new",       notes: "Missed call, no voicemail",                                    created_at: daysAgo(16, 8), response_time_seconds: null },
  { name: "Pamela Grant",     phone: "(978) 555-3034", email: "pgrant@hotmail.com",       source: "web_form",  status: "quoted",    notes: "Air handler replacement, attic installation",                   created_at: daysAgo(16, 13),response_time_seconds: 1500 },
  { name: "Dave Harrison",    phone: "(339) 555-3145", email: null,                        source: "phone_call", status: "closed",    notes: "Annual maintenance contract signed, $349/yr",                  created_at: daysAgo(17, 11),response_time_seconds: 95 },
  { name: "Susan Fletcher",   phone: "(617) 555-3256", email: "sfletcher@gmail.com",      source: "sms",       status: "contacted", notes: "AC making rattling noise, belt issue suspected",                created_at: daysAgo(17, 15),response_time_seconds: 720 },
  { name: "Bob Tanaka",       phone: "(781) 555-3367", email: "btanaka@icloud.com",       source: "web_form",  status: "booked",    notes: "New construction, 4-ton system for 2,400 sq ft",               created_at: daysAgo(18, 10),response_time_seconds: 9000 },
  { name: null,               phone: "(508) 555-3478", email: null,                        source: "phone_call", status: "ignored",   notes: "Missed — left no callback, number unknown",                    created_at: daysAgo(18, 16),response_time_seconds: null },
  { name: "Cynthia Okafor",   phone: "(617) 555-3589", email: "cokafor@gmail.com",        source: "email",     status: "closed",    notes: "UV air purifier installed, $1,100",                            created_at: daysAgo(19, 8), response_time_seconds: 4200 },
  { name: "Edward Walsh",     phone: "(978) 555-3690", email: null,                        source: "phone_call", status: "contacted", notes: "Filter replacement + coil cleaning",                           created_at: daysAgo(20, 9), response_time_seconds: 310 },
  { name: "Dorothy Simmons",  phone: "(339) 555-3701", email: "dsimmons@outlook.com",     source: "web_form",  status: "quoted",    notes: "Ductless mini-split, sunroom addition",                         created_at: daysAgo(20, 14),response_time_seconds: 2100 },

  // WEEK 9 (22-28 days ago)
  { name: "Chris Yamamoto",   phone: "(617) 555-3812", email: null,                        source: "phone_call", status: "closed",    notes: "Capacitor + refrigerant charge, $310",                         created_at: daysAgo(22, 10),response_time_seconds: 200 },
  { name: "Amy Washington",   phone: "(781) 555-3923", email: "awashington@gmail.com",    source: "sms",       status: "booked",    notes: "Full system replacement, heat pump + air handler",             created_at: daysAgo(23, 13),response_time_seconds: 480 },
  { name: null,               phone: "(508) 555-4034", email: null,                        source: "phone_call", status: "new",       notes: "Missed, after hours",                                          created_at: daysAgo(23, 18),response_time_seconds: null },
  { name: "George Patel",     phone: "(617) 555-4145", email: "gpatel@gmail.com",         source: "web_form",  status: "closed",    notes: "Commercial RTU service call, rooftop unit, $750",              created_at: daysAgo(24, 9), response_time_seconds: 1800 },
  { name: "Helen Russo",      phone: "(978) 555-4256", email: null,                        source: "phone_call", status: "contacted", notes: "High electric bill, efficiency audit requested",                created_at: daysAgo(25, 11),response_time_seconds: 440 },
  { name: null,               phone: "(339) 555-4367", email: null,                        source: "phone_call", status: "ignored",   notes: "Missed — called 3x, no answer",                                created_at: daysAgo(25, 8), response_time_seconds: null },
  { name: "Walter Bishop",    phone: "(617) 555-4478", email: "wbishop@icloud.com",       source: "email",     status: "booked",    notes: "Smart thermostat install + wifi thermostat, Ecobee 4",          created_at: daysAgo(26, 14),response_time_seconds: 3000 },
  { name: "Rose O'Brien",     phone: "(781) 555-4589", email: "robrien@gmail.com",        source: "web_form",  status: "lost",      notes: "No budget right now, asked to follow up in fall",               created_at: daysAgo(27, 10),response_time_seconds: 6000 },
  { name: "Larry Stanton",    phone: "(508) 555-4690", email: null,                        source: "phone_call", status: "closed",    notes: "Emergency furnace repair, heat exchanger crack, $1,800",       created_at: daysAgo(28, 8), response_time_seconds: 90 },
];

const insertedLeads = [];
for (const lead of leads) {
  const first_response_at = lead.response_time_seconds
    ? addSeconds(lead.created_at, lead.response_time_seconds)
    : null;

  const { data, error } = await supabase
    .from("leads")
    .insert({
      business_id:           businessId,
      source:                lead.source,
      status:                lead.status,
      name:                  lead.name ?? null,
      phone:                 lead.phone,
      email:                 lead.email ?? null,
      notes:                 lead.notes,
      first_contact_at:      lead.created_at,
      last_activity_at:      first_response_at ?? lead.created_at,
      first_response_at,
      response_time_seconds: lead.response_time_seconds ?? null,
      created_at:            lead.created_at,
      updated_at:            lead.created_at,
    })
    .select("id, name, source, status, created_at")
    .single();

  if (error) {
    console.error(`  ❌ Failed to insert lead "${lead.name ?? "(missed call)"}": ${error.message}`);
  } else {
    insertedLeads.push(data);
  }
}
console.log(`✅  Inserted ${insertedLeads.length} leads`);

// ─── 4. Insert communications (call logs) ────────────────────────────────────
console.log("▶  Inserting call logs…");

const callLogs = [];
for (const lead of insertedLeads) {
  const original = leads[insertedLeads.indexOf(lead)];

  if (original.source === "phone_call") {
    const isMissed = !original.response_time_seconds;
    callLogs.push({
      lead_id:          lead.id,
      business_id:      businessId,
      type:             "call",
      direction:        "inbound",
      content:          isMissed ? null : original.notes?.split(",")[0] ?? null,
      duration_seconds: isMissed ? null : Math.floor(Math.random() * 300 + 60),
      status:           isMissed ? "missed" : "completed",
      from_number:      original.phone,
      to_number:        "+19789136892",
      created_at:       original.created_at,
    });

    // Add outbound callback for non-missed calls
    if (!isMissed && original.response_time_seconds) {
      callLogs.push({
        lead_id:          lead.id,
        business_id:      businessId,
        type:             "call",
        direction:        "outbound",
        content:          "Follow-up call",
        duration_seconds: Math.floor(Math.random() * 180 + 60),
        status:           "completed",
        from_number:      "+19789136892",
        to_number:        original.phone,
        created_at:       addSeconds(original.created_at, original.response_time_seconds),
      });
    }
  } else if (original.source === "sms") {
    callLogs.push({
      lead_id:          lead.id,
      business_id:      businessId,
      type:             "sms",
      direction:        "inbound",
      content:          `"${original.notes?.substring(0, 80)}"`,
      duration_seconds: null,
      status:           "received",
      from_number:      original.phone,
      to_number:        "+19789136892",
      created_at:       original.created_at,
    });
    if (original.response_time_seconds) {
      callLogs.push({
        lead_id:          lead.id,
        business_id:      businessId,
        type:             "sms",
        direction:        "outbound",
        content:          "Thanks for reaching out to Arctic Air! We'll have someone call you shortly.",
        duration_seconds: null,
        status:           "sent",
        from_number:      "+19789136892",
        to_number:        original.phone,
        created_at:       addSeconds(original.created_at, original.response_time_seconds),
      });
    }
  } else if (original.source === "email") {
    callLogs.push({
      lead_id:          lead.id,
      business_id:      businessId,
      type:             "email",
      direction:        "inbound",
      content:          original.notes ?? "Email inquiry",
      duration_seconds: null,
      status:           "received",
      from_number:      original.email ?? original.phone,
      to_number:        "mike@arcticairhvac.com",
      created_at:       original.created_at,
    });
  }
}

const { error: commError } = await supabase.from("communications").insert(callLogs);
if (commError) {
  console.error(`  ❌ Communications insert error: ${commError.message}`);
} else {
  console.log(`✅  Inserted ${callLogs.length} communication records`);
}

// ─── 5. Insert alerts ─────────────────────────────────────────────────────────
console.log("▶  Inserting alerts…");

// Find missed-call leads
const missedLeads = insertedLeads.filter((l, i) => {
  const orig = leads[i];
  return orig.source === "phone_call" && !orig.response_time_seconds;
});

// Find slow response leads (> 1 hour)
const slowLeads = insertedLeads.filter((l, i) => {
  const orig = leads[i];
  return orig.response_time_seconds && orig.response_time_seconds > 3600;
});

// Find stalled leads (quoted or contacted but old)
const stalledLeads = insertedLeads.filter((l, i) => {
  const orig = leads[i];
  const ageMs = Date.now() - new Date(orig.created_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return (orig.status === "quoted" || orig.status === "contacted") && ageDays > 5;
});

const alertsToInsert = [];

// Missed call alerts
for (const lead of missedLeads) {
  const orig = leads[insertedLeads.indexOf(lead)];
  alertsToInsert.push({
    business_id:  businessId,
    lead_id:      lead.id,
    type:         "missed_call",
    severity:     "critical",
    title:        "Missed Call — No Follow-Up",
    description:  `Inbound call from ${orig.phone} received at ${new Date(orig.created_at).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })} — no callback logged.`,
    is_read:      false,
    is_resolved:  false,
    created_at:   addSeconds(orig.created_at, 3600),
  });
}

// Slow response alerts
for (const lead of slowLeads.slice(0, 4)) {
  const orig = leads[insertedLeads.indexOf(lead)];
  const mins = Math.round((orig.response_time_seconds ?? 0) / 60);
  alertsToInsert.push({
    business_id:  businessId,
    lead_id:      lead.id,
    type:         "slow_response",
    severity:     orig.response_time_seconds > 7200 ? "critical" : "warning",
    title:        "Slow Response Time Detected",
    description:  `Response to ${orig.name ?? "lead"} took ${mins} minutes. Industry benchmark is under 5 minutes.`,
    is_read:      false,
    is_resolved:  orig.status === "closed" || orig.status === "booked",
    resolved_at:  (orig.status === "closed" || orig.status === "booked") ? addSeconds(orig.created_at, (orig.response_time_seconds ?? 0) + 3600) : null,
    created_at:   addSeconds(orig.created_at, orig.response_time_seconds ?? 0),
  });
}

// Stalled lead alerts
for (const lead of stalledLeads.slice(0, 3)) {
  const orig = leads[insertedLeads.indexOf(lead)];
  alertsToInsert.push({
    business_id:  businessId,
    lead_id:      lead.id,
    type:         "stalled_lead",
    severity:     "warning",
    title:        "Lead Stalled — No Recent Activity",
    description:  `${orig.name ?? "Lead"} has been in "${orig.status}" status for over 5 days with no activity logged.`,
    is_read:      true,
    is_resolved:  false,
    created_at:   addSeconds(orig.created_at, 5 * 24 * 3600),
  });
}

// No-response alert for a web form lead
const noResponseLead = insertedLeads.find((l, i) => {
  const orig = leads[i];
  return orig.source === "web_form" && orig.status === "new" && !orig.response_time_seconds;
});
if (noResponseLead) {
  const origNR = leads[insertedLeads.indexOf(noResponseLead)];
  alertsToInsert.push({
    business_id:  businessId,
    lead_id:      noResponseLead.id,
    type:         "no_response",
    severity:     "critical",
    title:        "Web Form Lead — No Response",
    description:  `${origNR.name ?? "New web form lead"} submitted a request ${Math.round((Date.now() - new Date(origNR.created_at).getTime()) / (1000 * 60 * 60))} hours ago with no response.`,
    is_read:      false,
    is_resolved:  false,
    created_at:   addSeconds(origNR.created_at, 2 * 3600),
  });
}

// Dead lead alert (lost + old)
const lostLeads = insertedLeads.filter((l, i) => leads[i].status === "lost");
for (const lead of lostLeads.slice(0, 2)) {
  const orig = leads[insertedLeads.indexOf(lead)];
  alertsToInsert.push({
    business_id:  businessId,
    lead_id:      lead.id,
    type:         "dead_lead",
    severity:     "info",
    title:        "Lead Marked Lost",
    description:  `${orig.name ?? "Lead"} was marked as lost. Revenue opportunity missed.`,
    is_read:      true,
    is_resolved:  true,
    resolved_at:  addSeconds(orig.created_at, 7 * 24 * 3600),
    created_at:   addSeconds(orig.created_at, 3 * 24 * 3600),
  });
}

const { error: alertErr } = await supabase.from("alerts").insert(alertsToInsert);
if (alertErr) {
  console.error(`  ❌ Alerts insert error: ${alertErr.message}`);
} else {
  console.log(`✅  Inserted ${alertsToInsert.length} alerts`);
}

// ─── 6. Insert weekly report ──────────────────────────────────────────────────
console.log("▶  Inserting weekly report…");

const periodStart = new Date(); periodStart.setDate(periodStart.getDate() - 7); periodStart.setHours(0,0,0,0);
const periodEnd   = new Date(); periodEnd.setHours(23,59,59,999);

const weekLeads     = insertedLeads.filter((l, i) => new Date(leads[i].created_at) >= periodStart);
const totalLeads    = weekLeads.length;
const bookedClosed  = weekLeads.filter((l, i) => {
  const orig = leads[insertedLeads.indexOf(l)];
  return orig.status === "booked" || orig.status === "closed";
}).length;
const lostCount     = weekLeads.filter((l, i) => leads[insertedLeads.indexOf(l)].status === "lost").length;
const ignoredCount  = weekLeads.filter((l, i) => leads[insertedLeads.indexOf(l)].status === "ignored").length;
const missedCount   = weekLeads.filter((l, i) => {
  const orig = leads[insertedLeads.indexOf(l)];
  return orig.source === "phone_call" && !orig.response_time_seconds;
}).length;

const respondedWeek = weekLeads.filter((l, i) => leads[insertedLeads.indexOf(l)].response_time_seconds);
const avgRT = respondedWeek.length > 0
  ? Math.round(respondedWeek.reduce((s, l, i) => s + (leads[insertedLeads.indexOf(l)].response_time_seconds ?? 0), 0) / respondedWeek.length)
  : 0;

const srcBreakdown = {};
weekLeads.forEach((l, i) => {
  const src = leads[insertedLeads.indexOf(l)].source;
  srcBreakdown[src] = (srcBreakdown[src] ?? 0) + 1;
});

const statusBreakdown = {};
weekLeads.forEach((l, i) => {
  const st = leads[insertedLeads.indexOf(l)].status;
  statusBreakdown[st] = (statusBreakdown[st] ?? 0) + 1;
});

const convRate = totalLeads > 0 ? Math.round((bookedClosed / totalLeads) * 100) : 0;
const missRate = totalLeads > 0 ? Math.round((missedCount / totalLeads) * 100) : 0;
const opScore  = Math.max(0, Math.min(100,
  100 - (missRate * 1.5) - (avgRT > 1800 ? 20 : avgRT > 300 ? 10 : 0) - (lostCount * 3)
));

const { error: reportErr } = await supabase.from("reports").insert({
  business_id:              businessId,
  period:                   "weekly",
  period_start:             periodStart.toISOString(),
  period_end:               periodEnd.toISOString(),
  total_leads:              totalLeads,
  new_leads:                weekLeads.filter((l, i) => leads[insertedLeads.indexOf(l)].status === "new").length,
  converted_leads:          bookedClosed,
  lost_leads:               lostCount,
  ignored_leads:            ignoredCount,
  missed_calls:             missedCount,
  avg_response_time_seconds: avgRT,
  source_breakdown:         srcBreakdown,
  status_breakdown:         statusBreakdown,
  operational_score:        Math.round(opScore),
  bottlenecks: [
    missedCount > 2 ? `${missedCount} missed calls this week — after-hours coverage gap` : null,
    avgRT > 600 ? `Average response time ${Math.round(avgRT / 60)} min — target is under 5 min` : null,
    lostCount > 0 ? `${lostCount} leads lost to competitors — follow-up speed needs improvement` : null,
  ].filter(Boolean),
  observations: [
    `${totalLeads} total leads this week (${srcBreakdown.phone_call ?? 0} phone, ${srcBreakdown.web_form ?? 0} web, ${srcBreakdown.email ?? 0} email, ${srcBreakdown.sms ?? 0} SMS)`,
    `Conversion rate: ${convRate}% — ${convRate >= 40 ? "above" : "below"} average for HVAC`,
    `Operational health score: ${Math.round(opScore)}/100`,
  ],
  generated_at: new Date().toISOString(),
  created_at:   new Date().toISOString(),
});

if (reportErr) {
  console.error(`  ❌ Report insert error: ${reportErr.message}`);
} else {
  console.log(`✅  Inserted weekly report (score: ${Math.round(opScore)}, leads: ${totalLeads}, converted: ${bookedClosed})`);
}

// ─── 7. Final summary ─────────────────────────────────────────────────────────
console.log("\n────────────────────────────────────────────");
const { count: finalLeads } = await supabase.from("leads").select("*", { count: "exact", head: true }).eq("business_id", businessId);
const { count: finalAlerts } = await supabase.from("alerts").select("*", { count: "exact", head: true }).eq("business_id", businessId);
const { count: finalComms } = await supabase.from("communications").select("*", { count: "exact", head: true }).eq("business_id", businessId);
const { count: finalReports } = await supabase.from("reports").select("*", { count: "exact", head: true }).eq("business_id", businessId);

console.log(`✅  Arctic Air HVAC seed complete:`);
console.log(`    Leads:          ${finalLeads}`);
console.log(`    Communications: ${finalComms}`);
console.log(`    Alerts:         ${finalAlerts}`);
console.log(`    Reports:        ${finalReports}`);
console.log(`\n🌐  Live at: https://nova-systems.app/arctic-air`);
