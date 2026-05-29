import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function buildAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = buildAdminClient();

  const { data: business, error: bizError } = await admin
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .single();

  if (bizError || !business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Must be the owner or a super_admin
  const isOwner = business.owner_id === user.id;
  if (!isOwner) {
    const { data: myBiz } = await supabase
      .from("businesses")
      .select("role")
      .eq("owner_id", user.id)
      .single();
    if (myBiz?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const [leadsRes, alertsRes] = await Promise.all([
    admin
      .from("leads")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    admin
      .from("alerts")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_resolved", false)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return NextResponse.json({
    business,
    leads: leadsRes.data ?? [],
    alerts: alertsRes.data ?? [],
  });
}
