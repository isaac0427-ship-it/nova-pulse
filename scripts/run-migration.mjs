// Run: node --env-file=.env.local scripts/run-migration.mjs
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const PAT              = process.env.SUPABASE_PAT;
const REF              = process.env.SUPABASE_PROJECT_REF;
const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !PAT || !REF) {
  console.error("Missing env vars — run with: node --env-file=.env.local scripts/run-migration.mjs");
  console.error("Also add SUPABASE_PAT and SUPABASE_PROJECT_REF to .env.local");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, "../supabase/migrations/003_add_role_slug.sql"), "utf8");

async function mgmtQuery(q) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: q }),
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  return { status: res.status, ok: res.ok, body };
}

console.log("▶  Executing migration 003_add_role_slug.sql …\n");
const mig = await mgmtQuery(sql);

if (mig.ok) {
  console.log(`✅  Migration executed — HTTP ${mig.status}\n`);
} else {
  console.error(`❌  Migration failed — HTTP ${mig.status}`);
  console.error(JSON.stringify(mig.body, null, 2).slice(0, 1000));
  process.exit(1);
}

const isaacQ = await mgmtQuery(`
  SELECT b.name, b.role, b.slug, u.email
  FROM businesses b
  JOIN auth.users u ON u.id = b.owner_id
  WHERE u.email = 'isaac_0427@icloud.com'
  LIMIT 1;
`);

if (isaacQ.ok && Array.isArray(isaacQ.body) && isaacQ.body.length > 0) {
  const r = isaacQ.body[0];
  const ok = r.role === "super_admin";
  console.log(`${ok ? "✅" : "⚠️"}  Isaac — email: ${r.email} | role: ${r.role} | slug: ${r.slug}`);
} else {
  console.log("⚠️  Mgmt API Isaac check got:", JSON.stringify(isaacQ.body).slice(0, 200));
}

const arcticQ = await mgmtQuery(`
  SELECT
    b.name, b.slug, b.role, b.owner_id,
    COUNT(l.id)::int AS lead_count,
    COUNT(l.id) FILTER (
      WHERE l.source = 'phone_call'
        AND l.response_time_seconds IS NULL
        AND l.status IN ('new', 'ignored')
    )::int AS missed_calls
  FROM businesses b
  LEFT JOIN leads l ON l.business_id = b.id
  WHERE b.slug = 'arctic-air'
  GROUP BY b.id;
`);

if (arcticQ.ok && Array.isArray(arcticQ.body) && arcticQ.body.length > 0) {
  const r = arcticQ.body[0];
  console.log(`✅  Arctic Air — slug: ${r.slug} | role: ${r.role} | leads: ${r.lead_count} | missed: ${r.missed_calls}`);
} else {
  console.log("⚠️  Arctic Air query:", JSON.stringify(arcticQ.body).slice(0, 300));
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
const mike  = users?.users?.find(u => u.email === "mike@arcticairhvac.com");
const isaac = users?.users?.find(u => u.email === "isaac_0427@icloud.com");

console.log(`${mike  ? "✅" : "❌"}  mike@arcticairhvac.com: ${mike ? "exists" : "NOT FOUND"}`);
console.log(`${isaac ? "✅" : "❌"}  isaac_0427@icloud.com:  ${isaac ? "exists" : "NOT FOUND"}`);
console.log("\n─── All checks complete ────────────────────────");
