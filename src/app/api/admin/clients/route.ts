import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "").slice(0, 48);
}

export async function POST(req: NextRequest) {
  // Verify requester is super_admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: requesterBiz } = await supabase
    .from("businesses")
    .select("role")
    .eq("owner_id", user.id)
    .single();

  if (requesterBiz?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    name: string;
    owner_name: string;
    owner_email: string;
    phone: string;
    type: string;
    twilio_number?: string;
    slug?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, owner_name, owner_email, phone, type, twilio_number, slug } = body;

  if (!name || !owner_name || !owner_email || !phone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const finalSlug = slug || slugify(name);

  // Use service role to create auth user
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

  // Create auth user
  const tempPassword = `NovaSystems${Math.random().toString(36).slice(2, 10).toUpperCase()}!`;
  const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
    email: owner_email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: owner_name },
  });

  if (createUserError) {
    return NextResponse.json({ error: createUserError.message }, { status: 400 });
  }

  const defaultHours = {
    monday:    { open: true,  start: "08:00", end: "17:00" },
    tuesday:   { open: true,  start: "08:00", end: "17:00" },
    wednesday: { open: true,  start: "08:00", end: "17:00" },
    thursday:  { open: true,  start: "08:00", end: "17:00" },
    friday:    { open: true,  start: "08:00", end: "17:00" },
    saturday:  { open: false, start: "09:00", end: "14:00" },
    sunday:    { open: false, start: "09:00", end: "14:00" },
  };

  // Create business record
  const { data: business, error: bizError } = await adminClient
    .from("businesses")
    .insert({
      owner_id: newUser.user.id,
      name,
      type: type || "other",
      owner_name,
      phone,
      email: owner_email,
      timezone: "America/New_York",
      business_hours: defaultHours,
      twilio_number: twilio_number || null,
      gmail_connected: false,
      role: "client",
      slug: finalSlug,
    })
    .select()
    .single();

  if (bizError) {
    // Rollback: delete the created user
    await adminClient.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: bizError.message }, { status: 400 });
  }

  return NextResponse.json({
    business,
    temp_password: tempPassword,
    message: `Client created. Share these credentials with ${owner_name}: email=${owner_email}, password=${tempPassword}`,
  }, { status: 201 });
}
