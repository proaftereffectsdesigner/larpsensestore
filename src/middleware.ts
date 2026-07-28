import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Next.js Middleware — runs on the Edge before any page is rendered.
 * Protects /7evenejoyer routes: verifies the session token from cookies
 * and checks is_admin flag in Supabase. Non-admins are redirected to /.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect the hidden admin route
  if (!pathname.startsWith("/7evenejoyer")) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Extract the Supabase session token from cookies
  let accessToken: string | undefined;

  const allCookies = req.cookies.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")) {
      const cookieValue = cookie.value;
      try {
        // The custom storage adapter might double encode or just JSON encode
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
      // If it's a JSON object but access_token is missing, we might have accidentally parsed the raw token
      if (typeof accessToken === 'object' && accessToken !== null) {
        accessToken = (accessToken as any).access_token;
      }
      break;
    }
  }

  if (!accessToken) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Verify token and check admin flag using Supabase REST (no Node.js APIs — Edge compatible)
  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const userData = await userRes.json();
    const userId = userData?.id;

    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Check is_admin in profiles table
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

    if (!profileRes.ok) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const profiles = await profileRes.json();
    const isAdmin = profiles?.[0]?.is_admin === true;

    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: ["/7evenejoyer", "/7evenejoyer/:path*"],
};
