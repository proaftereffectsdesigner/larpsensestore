import { NextRequest, NextResponse, NextFetchEvent } from "next/server";
import { rateLimit } from "./lib/rate-limit";

/**
 * Next.js Middleware — runs on the Edge before any page is rendered.
 * Tracks page views for analytics (non-blocking via waitUntil).
 * Admin auth is handled client-side by each /7evenejoyer page.
 */
export async function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;

  // Skip API routes, static files, etc.
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Build response immediately — never block the user
  const response = NextResponse.next();

  // Analytics Tracking (non-blocking)
  const userAgent = req.headers.get("user-agent") || "";
  let deviceType = "Desktop";
  if (/mobile/i.test(userAgent)) deviceType = "Mobile";
  if (/tablet|ipad/i.test(userAgent)) deviceType = "Tablet";

  let sessionId = req.cookies.get("analytics_session_id")?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    response.cookies.set("analytics_session_id", sessionId, { maxAge: 60 * 30, path: '/' });
  }

  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const referer = req.headers.get('referer') || '';

  // Protect Analytics DB with a lenient rate limit (max 60 views per minute per IP)
  const analyticsLimit = rateLimit(`analytics_${ipAddress}`, { maxRequests: 60, windowMs: 60000 });

  if (analyticsLimit.allowed) {
    // Fire and forget — waitUntil keeps the fetch alive after response is sent
    event.waitUntil(
      fetch(`${supabaseUrl}/rest/v1/page_views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          session_id: sessionId,
          path: pathname,
          user_agent: userAgent,
          device_type: deviceType,
          ip_address: ipAddress,
          referer: referer
        })
      }).catch(() => {})
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
