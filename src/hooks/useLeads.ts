"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Lead, LeadStatus, LeadSource } from "@/types";

interface LeadsFilter {
  status?: LeadStatus;
  source?: LeadSource;
  search?: string;
}

export function useLeads(businessId: string | undefined, filter: LeadsFilter = {}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!businessId) return;
    const supabase = createClient();
    setLoading(true);

    try {
      let query = supabase
        .from("leads")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (filter.status) query = query.eq("status", filter.status);
      if (filter.source) query = query.eq("source", filter.source);
      if (filter.search) {
        query = query.or(
          `name.ilike.%${filter.search}%,phone.ilike.%${filter.search}%,email.ilike.%${filter.search}%`
        );
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setLeads((data as Lead[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [businessId, filter.status, filter.source, filter.search]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, loading, error, refresh: fetchLeads };
}

export function useLead(leadId: string | undefined) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLead = useCallback(async () => {
    if (!leadId) return;
    const supabase = createClient();
    setLoading(true);

    try {
      const [leadRes, eventsRes, commsRes] = await Promise.all([
        supabase.from("leads").select("*").eq("id", leadId).single(),
        supabase
          .from("lead_events")
          .select("*")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false }),
        supabase
          .from("communications")
          .select("*")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false }),
      ]);

      if (leadRes.error) throw leadRes.error;
      setLead({
        ...(leadRes.data as Lead),
        events: eventsRes.data ?? [],
        communications: commsRes.data ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lead");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  return { lead, loading, error, refresh: fetchLead };
}
