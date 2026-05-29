import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "https://nova-pulse.vercel.app";

export const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export function handleOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function requireAuth(req: NextRequest): Promise<
  | { user: { id: string; email: string | undefined }; businessId: string }
  | NextResponse
> {
  const limited = rateLimit(req);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json(
      { error: "Business not found. Complete onboarding first." },
      { status: 404, headers: corsHeaders }
    );
  }

  return {
    user: { id: user.id, email: user.email },
    businessId: business.id,
  };
}

export function isNextResponse(val: unknown): val is NextResponse {
  return val instanceof NextResponse;
}

export function apiError(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: corsHeaders });
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status, headers: corsHeaders });
}
