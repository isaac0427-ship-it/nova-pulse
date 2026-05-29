import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// In-memory store — works for single-instance dev/low-traffic production.
// For multi-instance production, replace with Upstash Redis.
const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 100;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function rateLimit(req: NextRequest): NextResponse | null {
  const ip = getClientIp(req);
  const now = Date.now();

  const entry = store.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    store.set(ip, { count: 1, windowStart: now });
    return null; // allow
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil((entry.windowStart + WINDOW_MS) / 1000)),
        },
      }
    );
  }

  return null; // allow
}

// Prune entries older than 2 windows every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS * 2;
  for (const [key, entry] of store.entries()) {
    if (entry.windowStart < cutoff) store.delete(key);
  }
}, 300_000);
