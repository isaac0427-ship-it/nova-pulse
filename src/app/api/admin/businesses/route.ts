import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function buildAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: myBiz } = await supabase
    .from("businesses")
    .select("role")
    .eq("owner_id", user.id)
    .single();

  if (myBiz?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = buildAdminClient();

  const { data: businesses, error } = await admin
    .from("businesses")
    .select("*")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all(
    (businesses ?? []).map(async (biz) => {
      const [leadsRes, alertsRes] = await Promise.all([
        admin
          .from("leads")
          .select("id, status, response_time_seconds, source", { count: "exact" })
          .eq("business_id", biz.id),
        admin
          .from("alerts")
          .select("id", { count: "exact" })
          .eq("business_id", biz.id)
          .eq("is_resolved", false),
      ]);

      const leads = leadsRes.data ?? [];
      const totalLeadsCount = leadsRes.count ?? 0;
      const activeLeadsCount = leads.filter((l) =>
        ["new", "contacted", "waiting", "quoted"].includes(l.status)
      ).length;
      const missedCallsCount = leads.filter(
        (l) => l.source === "phone_call" && !l.response_time_seconds && ["new", "ignored"].includes(l.status)
      ).length;
      const respondedLeads = leads.filter((l) => l.response_time_seconds);
      const avgResponse =
        respondedLeads.length > 0
          ? respondedLeads.reduce((sum, l) => sum + (l.response_time_seconds ?? 0), 0) / respondedLeads.length
          : 0;
      const stalledLeads = leads.filter((l) => l.status === "waiting").length;

      let score = 100;
      if (totalLeadsCount > 0) {
        score -= (missedCallsCount / totalLeadsCount) * 30;
        if (avgResponse > 3600) score -= 20;
        else if (avgResponse > 1800) score -= 10;
        else if (avgResponse > 900) score -= 5;
        score -= (stalledLeads / Math.max(activeLeadsCount, 1)) * 20;
      }

      return {
        ...biz,
        lead_count: totalLeadsCount,
        health_score: Math.max(0, Math.min(100, Math.round(score))),
        active_leads: activeLeadsCount,
        missed_calls: missedCallsCount,
        alert_count: alertsRes.count ?? 0,
      };
    })
  );

  const totalLeads = enriched.reduce((s, b) => s + b.lead_count, 0);
  const { count: totalAlerts } = await admin
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .eq("is_resolved", false);

  return NextResponse.json({ businesses: enriched, totalLeads, totalAlerts: totalAlerts ?? 0 });
}
