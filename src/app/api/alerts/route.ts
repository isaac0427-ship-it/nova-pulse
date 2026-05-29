import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  requireAuth,
  isNextResponse,
  handleOptions,
  apiError,
  apiSuccess,
  corsHeaders,
} from "@/lib/api-helpers";
import {
  updateAlertSchema,
  alertActionSchema,
  validationError,
} from "@/lib/validation";
import { runAlertEngine } from "@/lib/alerts";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isNextResponse(auth)) return auth;

  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const resolved = searchParams.get("resolved") === "true";
  const unread = searchParams.get("unread") === "true";

  let query = supabase
    .from("alerts")
    .select(
      "id, type, severity, title, description, is_read, is_resolved, created_at, resolved_at, lead_id, lead:leads(id, name, phone, status)"
    )
    .eq("business_id", auth.businessId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!resolved) query = query.eq("is_resolved", false);
  if (unread) query = query.eq("is_read", false);

  const { data, error } = await query;
  if (error) return apiError(error.message);

  return NextResponse.json({ data }, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isNextResponse(auth)) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = alertActionSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();

  if (parsed.data.action === "run_engine") {
    await runAlertEngine(auth.businessId);
    return apiSuccess({ message: "Alert engine completed" });
  }

  if (parsed.data.action === "mark_all_read") {
    await supabase
      .from("alerts")
      .update({ is_read: true })
      .eq("business_id", auth.businessId)
      .eq("is_read", false);
    return apiSuccess({ ok: true });
  }

  return apiError("Unknown action", 400);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isNextResponse(auth)) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = updateAlertSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { id, ...updates } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("alerts")
    .update({
      ...updates,
      ...(updates.is_resolved ? { resolved_at: new Date().toISOString() } : {}),
    })
    .eq("id", id)
    .eq("business_id", auth.businessId)
    .select()
    .single();

  if (error || !data) return apiError("Alert not found", 404);
  return apiSuccess(data);
}
