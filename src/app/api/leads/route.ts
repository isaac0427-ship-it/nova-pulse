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
import { createLeadSchema, validationError } from "@/lib/validation";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isNextResponse(auth)) return auth;

  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const source = searchParams.get("source");
  const search = searchParams.get("search");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0"), 0);

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("business_id", auth.businessId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const validStatuses = ["new","contacted","waiting","booked","quoted","closed","lost","ignored"];
  const validSources = ["phone_call","web_form","email","sms","manual"];

  if (status && validStatuses.includes(status)) query = query.eq("status", status);
  if (source && validSources.includes(source)) query = query.eq("source", source);

  if (search) {
    const safe = search.replace(/[%_\\]/g, "\\$&").slice(0, 100);
    query = query.or(
      `name.ilike.%${safe}%,phone.ilike.%${safe}%,email.ilike.%${safe}%`
    );
  }

  const { data, count, error } = await query;
  if (error) return apiError(error.message);

  return NextResponse.json({ data, count }, { headers: corsHeaders });
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

  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const now = new Date().toISOString();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      business_id: auth.businessId,
      ...parsed.data,
      first_contact_at: now,
      last_activity_at: now,
    })
    .select()
    .single();

  if (error) return apiError(error.message);
  return apiSuccess(data, 201);
}
