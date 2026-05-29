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
import { createReportSchema, validationError } from "@/lib/validation";
import { generateReport } from "@/lib/reports";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isNextResponse(auth)) return auth;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("business_id", auth.businessId)
    .order("created_at", { ascending: false })
    .limit(50);

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

  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const report = await generateReport(auth.businessId, parsed.data.period);
    return apiSuccess(report, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Report generation failed";
    return apiError(msg);
  }
}
