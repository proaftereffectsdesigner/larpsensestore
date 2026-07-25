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
  // Supabase stores the access token in a cookie named sb-<project-ref>-auth-token
  let accessToken: string | undefined;

  for (const [name, value] of req.cookies) {
    if (name.startsWith("sb-") && name.endsWith("-auth-token")) {
      try {
        const parsed = JSON.parse(decodeURIComponent(value));
        accessToken = parsed?.access_token ?? parsed?.[0];
      } catch {
        // try raw value
        accessToken = value;
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
