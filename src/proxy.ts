import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login" || pathname === "/diagnostic") return true;
  // Test panel — public, password-protected on the page itself
  if (pathname === "/test" || pathname.startsWith("/test/")) return true;
  if (pathname.startsWith("/api/test/")) return true;
  // Webhooks + reports cron never need auth
  if (pathname.startsWith("/api/webhooks/")) return true;
  if (pathname.startsWith("/api/reports/")) return true;
  if (pathname.startsWith("/api/diagnostic")) return true;
  // Static assets
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/sitemap.xml" || pathname === "/robots.txt" || pathname === "/manifest.json") return true;
  if (pathname.includes(".")) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return response;
  }

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
