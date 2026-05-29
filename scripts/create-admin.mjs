// Run: node --env-file=.env.local scripts/create-admin.mjs
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing env vars — run with: node --env-file=.env.local scripts/create-admin.mjs");
  process.exit(1);
}

const EMAIL = "isaac_0427@icloud.com";
const PASSWORD = "isaac0427";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Creating admin user...");

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === EMAIL);

  let userId;

  if (existing) {
    console.log("User already exists, updating password...");
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = existing.id;
    console.log("User updated:", existing.id);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Isaac" },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log("User created:", userId);
  }

  const { data: existingBusiness } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .single();

  if (existingBusiness) {
    console.log("Business already exists:", existingBusiness.id);
  } else {
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .insert({
        owner_id: userId,
        name: "Nova Pulse Admin",
        type: "Home Services",
        owner_name: "Isaac",
        phone: "+12037060504",
        email: EMAIL,
        timezone: "America/New_York",
        business_hours: {
          monday: { open: true, start: "08:00", end: "17:00" },
          tuesday: { open: true, start: "08:00", end: "17:00" },
          wednesday: { open: true, start: "08:00", end: "17:00" },
          thursday: { open: true, start: "08:00", end: "17:00" },
          friday: { open: true, start: "08:00", end: "17:00" },
          saturday: { open: false, start: "08:00", end: "12:00" },
          sunday: { open: false, start: "08:00", end: "12:00" },
        },
        twilio_number: "+19789136892",
        gmail_connected: false,
      })
      .select()
      .single();

    if (bizError) throw bizError;
    console.log("Business created:", business.id);
  }

  console.log("\nAdmin setup complete!");
  console.log("Email:", EMAIL);
  console.log("Password:", PASSWORD);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
