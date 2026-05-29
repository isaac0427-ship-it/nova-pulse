import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

  const { data: staleLeads } = await db
    .from("leads")
    .select("id, business_id, name, phone")
    .eq("status", "new")
    .lt("created_at", seventyTwoHoursAgo);

  if (!staleLeads?.length) return NextResponse.json({ marked_dead: 0 });

  let marked = 0;
  for (const lead of staleLeads) {
    const { error } = await db.from("leads").update({ status: "dead" }).eq("id", lead.id);
    if (!error) {
      await db.from("alerts").insert({
        business_id: lead.business_id,
        lead_id: lead.id,
        type: "dead_lead",
        severity: "critical",
        title: "Lead Gone Cold",
        description: `${lead.name || lead.phone || "Unknown lead"} — no contact in 72+ hours.`,
        is_read: false,
        is_resolved: false,
      });
      marked++;
    }
  }

  return NextResponse.json({ marked_dead: marked });
}
