"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardMetrics, LeadFlowDataPoint, Alert, Lead } from "@/types";
import { calculateOperationalScore } from "@/lib/utils";
import { subDays, format } from "date-fns";

export function useDashboard(businessId: string | undefined) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<LeadFlowDataPoint[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!businessId) return;
    const supabase = createClient();
    setLoading(true);

    try {
      const now = new Date();
      const weekAgo = subDays(now, 7);
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const [leadsRes, missedCallsRes, alertsRes, recentLeadsRes] = await Promise.all([
        supabase.from("leads").select("*").eq("business_id", businessId),
        supabase
          .from("communications")
          .select("id")
          .eq("business_id", businessId)
          .eq("type", "call")
          .eq("status", "missed"),
        supabase
          .from("alerts")
          .select("*, lead:leads(id, name, phone, status)")
          .eq("business_id", businessId)
          .eq("is_resolved", false)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("leads")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const leads = leadsRes.data ?? [];
      const missedCalls = missedCallsRes.data?.length ?? 0;

      const activeLeads = leads.filter((l) =>
        ["new", "contacted", "waiting"].includes(l.status)
      ).length;

      const stalledLeads = leads.filter((l) => {
        const hoursSince =
          (now.getTime() - new Date(l.last_activity_at).getTime()) /
          (1000 * 60 * 60);
        return (
          hoursSince >= 24 &&
          ["new", "contacted", "waiting"].includes(l.status)
        );
      }).length;

      const responseTimes = leads
        .filter((l) => l.response_time_seconds != null)
        .map((l) => l.response_time_seconds as number);
      const avgResponseTime =
        responseTimes.length > 0
          ? Math.round(
              responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            )
          : 0;

      const recoveredOpps = leads.filter(
        (l) => l.status === "booked" || l.status === "closed"
      ).length;

      const leadsToday = leads.filter(
        (l) => new Date(l.created_at) >= todayStart
      ).length;

      const leadsThisWeek = leads.filter(
        (l) => new Date(l.created_at) >= weekAgo
      ).length;

      const operationalScore = calculateOperationalScore({
        missed_calls: missedCalls,
        total_leads: leads.length,
        avg_response_time_seconds: avgResponseTime,
        stalled_leads: stalledLeads,
        active_leads: activeLeads,
      });

      setMetrics({
        total_leads: leads.length,
        active_leads: activeLeads,
        missed_calls: missedCalls,
        avg_response_time_seconds: avgResponseTime,
        stalled_leads: stalledLeads,
        recovered_opportunities: recoveredOpps,
        operational_health_score: operationalScore,
        leads_today: leadsToday,
        leads_this_week: leadsThisWeek,
        unread_alerts:
          alertsRes.data?.filter((a) => !a.is_read).length ?? 0,
      });

      // Build 7-day chart data
      const days: LeadFlowDataPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(now, i);
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const dayLeads = leads.filter((l) => {
          const d = new Date(l.created_at);
          return d >= dayStart && d <= dayEnd;
        });

        days.push({
          date: format(day, "MMM d"),
          new: dayLeads.filter((l) => l.status === "new").length,
          contacted: dayLeads.filter((l) => l.status === "contacted").length,
          booked: dayLeads.filter((l) => l.status === "booked").length,
          lost: dayLeads.filter((l) => l.status === "lost").length,
        });
      }
      setChartData(days);
      setAlerts((alertsRes.data as Alert[]) ?? []);
      setRecentLeads((recentLeadsRes.data as Lead[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { metrics, chartData, alerts, recentLeads, loading, error, refresh: fetchData };
}
