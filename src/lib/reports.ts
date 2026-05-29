import { createClient } from "@/lib/supabase/server";
import { Report, ReportPeriod, LeadSource, LeadStatus } from "@/types";
import { calculateOperationalScore } from "@/lib/utils";

export async function generateReport(
  business_id: string,
  period: ReportPeriod
): Promise<Report> {
  const supabase = await createClient();

  const now = new Date();
  let periodStart: Date;

  if (period === "weekly") {
    periodStart = new Date(now);
    periodStart.setDate(now.getDate() - 7);
  } else {
    periodStart = new Date(now);
    periodStart.setMonth(now.getMonth() - 1);
  }

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", business_id)
    .gte("created_at", periodStart.toISOString())
    .lte("created_at", now.toISOString());

  const { data: missedCallComms } = await supabase
    .from("communications")
    .select("id")
    .eq("business_id", business_id)
    .eq("type", "call")
    .eq("status", "missed")
    .gte("created_at", periodStart.toISOString());

  const allLeads = leads ?? [];
  const totalLeads = allLeads.length;
  const newLeads = allLeads.filter((l) => l.status === "new").length;
  const convertedLeads = allLeads.filter(
    (l) => l.status === "closed" || l.status === "booked"
  ).length;
  const lostLeads = allLeads.filter((l) => l.status === "lost").length;
  const ignoredLeads = allLeads.filter((l) => l.status === "ignored").length;
  const missedCalls = missedCallComms?.length ?? 0;

  const responseTimes = allLeads
    .filter((l) => l.response_time_seconds != null)
    .map((l) => l.response_time_seconds as number);
  const avgResponseTime =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

  const sourceBreakdown = {} as Record<LeadSource, number>;
  const statusBreakdown = {} as Record<LeadStatus, number>;

  for (const lead of allLeads) {
    sourceBreakdown[lead.source as LeadSource] =
      (sourceBreakdown[lead.source as LeadSource] ?? 0) + 1;
    statusBreakdown[lead.status as LeadStatus] =
      (statusBreakdown[lead.status as LeadStatus] ?? 0) + 1;
  }

  const activeLeads = allLeads.filter(
    (l) => l.status === "new" || l.status === "contacted" || l.status === "waiting"
  ).length;

  const stalledLeads = allLeads.filter((l) => {
    const lastActivity = new Date(l.last_activity_at);
    const hoursSince =
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
    return hoursSince >= 24 && ["new", "contacted", "waiting"].includes(l.status);
  }).length;

  const operationalScore = calculateOperationalScore({
    missed_calls: missedCalls,
    total_leads: totalLeads,
    avg_response_time_seconds: avgResponseTime,
    stalled_leads: stalledLeads,
    active_leads: activeLeads,
  });

  const bottlenecks: string[] = [];
  const observations: string[] = [];

  if (missedCalls > 0) {
    bottlenecks.push(`${missedCalls} missed call${missedCalls > 1 ? "s" : ""} during this period`);
  }
  if (stalledLeads > 0) {
    bottlenecks.push(`${stalledLeads} lead${stalledLeads > 1 ? "s" : ""} became stalled without follow-up`);
  }
  if (avgResponseTime > 1800) {
    bottlenecks.push(`Average response time of ${Math.round(avgResponseTime / 60)} minutes exceeds recommended 30 minutes`);
  }

  if (convertedLeads > 0) {
    observations.push(`${convertedLeads} lead${convertedLeads > 1 ? "s" : ""} converted during this period`);
  }
  if (operationalScore >= 80) {
    observations.push("Strong operational performance this period");
  } else if (operationalScore < 60) {
    observations.push("Operational performance needs attention — review bottlenecks above");
  }

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      business_id,
      period,
      period_start: periodStart.toISOString(),
      period_end: now.toISOString(),
      total_leads: totalLeads,
      new_leads: newLeads,
      converted_leads: convertedLeads,
      lost_leads: lostLeads,
      ignored_leads: ignoredLeads,
      missed_calls: missedCalls,
      avg_response_time_seconds: avgResponseTime,
      source_breakdown: sourceBreakdown,
      status_breakdown: statusBreakdown,
      operational_score: operationalScore,
      bottlenecks,
      observations,
      generated_at: now.toISOString(),
    })
    .select()
    .single();

  if (error || !report) throw new Error("Failed to generate report");
  return report as Report;
}
