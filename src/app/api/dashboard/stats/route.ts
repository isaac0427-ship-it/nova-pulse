import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("business_id");
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const db = admin();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [leadsRes, commsRes, alertsRes] = await Promise.all([
    db.from("leads").select("*").eq("business_id", businessId),
    db.from("communications").select("*").eq("business_id", businessId).eq("type", "call").gte("created_at", sevenDaysAgo),
    db.from("alerts").select("*").eq("business_id", businessId).eq("is_read", false).eq("is_resolved", false),
  ]);

  const leads = leadsRes.data ?? [];
  const comms = commsRes.data ?? [];
  const unreadAlerts = alertsRes.data ?? [];

  const totalLeads = leads.length;
  const convertedLeads = leads.filter((l) => ["booked", "closed"].includes(l.status)).length;
  const deadLeads = leads.filter((l) => ["dead", "lost", "ignored"].includes(l.status)).length;
  const missedCalls = comms.filter((c) => c.status === "missed").length;

  const respondedLeads = leads.filter((l) => l.response_time_seconds);
  const avgResponseSecs = respondedLeads.length
    ? Math.round(respondedLeads.reduce((s, l) => s + (l.response_time_seconds ?? 0), 0) / respondedLeads.length)
    : 0;

  // Source breakdown
  const sourceMap: Record<string, number> = {};
  leads.forEach((l) => { sourceMap[l.source] = (sourceMap[l.source] || 0) + 1; });
  const leadsBySource = Object.entries(sourceMap).map(([source, count]) => ({ source, count }));

  // Status breakdown
  const statusMap: Record<string, number> = {};
  leads.forEach((l) => { statusMap[l.status] = (statusMap[l.status] || 0) + 1; });
  const leadsByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  // Health score
  const stalledLeads = leads.filter((l) => l.status === "waiting").length;
  const missedAllTime = leads.filter((l) => l.source === "phone_call" && !l.response_time_seconds && ["new","ignored"].includes(l.status)).length;
  let health = 100;
  if (totalLeads > 0) {
    health -= (missedAllTime / totalLeads) * 30;
    if (avgResponseSecs > 3600) health -= 20;
    else if (avgResponseSecs > 1800) health -= 10;
    else if (avgResponseSecs > 900) health -= 5;
    health -= (stalledLeads / Math.max(leads.filter(l => ["new","contacted","waiting","quoted"].includes(l.status)).length, 1)) * 20;
  }
  const healthScore = Math.max(0, Math.min(100, Math.round(health)));

  // Lead flow (last 7 days)
  const leadFlow = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
    const dayLeads = leads.filter((l) => l.created_at >= dayStart && l.created_at < dayEnd);
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      incoming: dayLeads.length,
      contacted: dayLeads.filter((l) => ["contacted","booked","closed"].includes(l.status)).length,
      converted: dayLeads.filter((l) => ["booked","closed"].includes(l.status)).length,
    };
  });

  // This week vs last week
  const thisWeekLeads = leads.filter((l) => l.created_at >= sevenDaysAgo).length;
  const lastWeekLeads = leads.filter((l) => l.created_at >= fourteenDaysAgo && l.created_at < sevenDaysAgo).length;

  return NextResponse.json({
    total_leads: totalLeads,
    converted_leads: convertedLeads,
    conversion_rate: totalLeads ? Math.round((convertedLeads / totalLeads) * 100) : 0,
    dead_leads: deadLeads,
    missed_calls: missedCalls,
    avg_response_seconds: avgResponseSecs,
    operational_health_score: healthScore,
    unread_alerts: unreadAlerts.length,
    leads_by_source: leadsBySource,
    leads_by_status: leadsByStatus,
    lead_flow: leadFlow,
    recent_alerts: unreadAlerts.slice(0, 5),
    this_week_leads: thisWeekLeads,
    last_week_leads: lastWeekLeads,
  });
}
