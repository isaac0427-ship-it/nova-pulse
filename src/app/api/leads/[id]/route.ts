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
import { updateLeadSchema, uuidSchema, validationError } from "@/lib/validation";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) return apiError("Invalid lead ID", 400);

  const supabase = await createClient();

  const [leadRes, eventsRes, commsRes] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .eq("business_id", auth.businessId)
      .single(),
    supabase
      .from("lead_events")
      .select("id, lead_id, type, title, description, metadata, created_at")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("communications")
      .select("id, lead_id, type, direction, content, duration_seconds, status, from_number, to_number, created_at")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (leadRes.error || !leadRes.data)
    return apiError("Lead not found", 404);

  return NextResponse.json(
    {
      data: {
        ...leadRes.data,
        events: eventsRes.data ?? [],
        communications: commsRes.data ?? [],
      },
    },
    { headers: corsHeaders }
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) return apiError("Invalid lead ID", 400);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = updateLeadSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const now = new Date().toISOString();
  const supabase = await createClient();

  // Verify ownership via RLS — also explicitly check business_id
  const { data, error } = await supabase
    .from("leads")
    .update({ ...parsed.data, updated_at: now, last_activity_at: now })
    .eq("id", id)
    .eq("business_id", auth.businessId)
    .select()
    .single();

  if (error || !data) return apiError("Lead not found or update failed", 404);

  return apiSuccess(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) return apiError("Invalid lead ID", 400);

  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("business_id", auth.businessId);

  if (error) return apiError(error.message);
  return apiSuccess({ ok: true });
}
