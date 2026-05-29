import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login" || pathname === "/diagnostic") return true;
  if (pathname.startsWith("/api/webhooks/")) return true;
  if (pathname.startsWith("/api/diagnostic")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/sitemap.xml" || pathname === "/robots.txt" || pathname === "/manifest.json") return true;
  if (pathname.includes(".")) return true;
  return false;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Public paths always pass through
  if (isPublicPath(pathname)) {
    return response;
  }

  // Protected paths: only block unauthenticated access
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated users pass through — pages handle role checks
  return response;
}
