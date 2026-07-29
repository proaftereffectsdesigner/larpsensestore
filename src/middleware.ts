import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Next.js Middleware — runs on the Edge before any page is rendered.
 * Protects /7evenejoyer routes: verifies the session token from cookies
 * and checks is_admin flag in Supabase. Non-admins are redirected to /.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Analytics Tracking (non-blocking)
  if (!pathname.startsWith("/api") && !pathname.startsWith("/_next") && !pathname.includes(".")) {
    const userAgent = req.headers.get("user-agent") || "";
    let deviceType = "Desktop";
    if (/mobile/i.test(userAgent)) deviceType = "Mobile";
    if (/tablet|ipad/i.test(userAgent)) deviceType = "Tablet";
    
    let sessionId = req.cookies.get("analytics_session_id")?.value;
    const response = NextResponse.next();
    
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      // Set session cookie for 30 minutes
      response.cookies.set("analytics_session_id", sessionId, { maxAge: 60 * 30, path: '/' });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Fire and forget tracking
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
        ip_address: ipAddress
      })
    }).catch(() => {});

    // Only protect the hidden admin route
    if (!pathname.startsWith("/7evenejoyer")) {
      return response;
    }
  }

  // Only protect the hidden admin route
  if (!pathname.startsWith("/7evenejoyer")) {
    return NextResponse.next();
  }

  const allCookies = req.cookies.getAll();
  // ... rest of the code for admin validation ...
  let accessToken: string | undefined;

  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")) {
      const cookieValue = cookie.value;
      try {
        const decoded = decodeURIComponent(cookieValue);
        const parsed = JSON.parse(decoded);
        accessToken = parsed?.access_token ?? parsed?.[0] ?? parsed;
      } catch {
        try {
          const parsed = JSON.parse(cookieValue);
          accessToken = parsed?.access_token ?? parsed?.[0] ?? parsed;
        } catch {
          accessToken = cookieValue;
        }
      }
      if (typeof accessToken === 'object' && accessToken !== null) {
        accessToken = (accessToken as any).access_token;
      }
      break;
    }
  }

  if (!accessToken) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!userRes.ok) return NextResponse.redirect(new URL("/", req.url));

    const userData = await userRes.json();
    const userId = userData?.id;

    if (!userId) return NextResponse.redirect(new URL("/", req.url));

    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=is_admin`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: supabaseAnonKey,
          Accept: "application/json",
        },
      }
    );

    if (!profileRes.ok) return NextResponse.redirect(new URL("/", req.url));

    const profiles = await profileRes.json();
    const isAdmin = profiles?.[0]?.is_admin === true;

    if (!isAdmin) return NextResponse.redirect(new URL("/", req.url));

    // If it's an admin route, we might have created a response object with cookies earlier
    const adminResponse = NextResponse.next();
    // Copy the analytics cookie if it was just created
    const sessionCookie = req.cookies.get("analytics_session_id") || adminResponse.cookies.get("analytics_session_id");
    if (!req.cookies.get("analytics_session_id") && sessionCookie) {
         adminResponse.cookies.set("analytics_session_id", sessionCookie.value, { maxAge: 60 * 30, path: '/' });
    }
    return adminResponse;
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }
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
