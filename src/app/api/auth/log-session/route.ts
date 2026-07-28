import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "Unknown IP";
    
    // Parse User Agent
    const userAgentStr = req.headers.get("user-agent") || "";
    let userAgent = "Unknown Device";
    if (userAgentStr.includes("Windows")) userAgent = "Windows PC";
    else if (userAgentStr.includes("Mac OS")) userAgent = "Mac";
    else if (userAgentStr.includes("iPhone")) userAgent = "iPhone";
    else if (userAgentStr.includes("iPad")) userAgent = "iPad";
    else if (userAgentStr.includes("Android") && userAgentStr.includes("Mobile")) userAgent = "Android Phone";
    else if (userAgentStr.includes("Android")) userAgent = "Android Tablet";
    else if (userAgentStr.includes("Linux")) userAgent = "Linux PC";
    else userAgent = userAgentStr.substring(0, 30); // fallback snippet

    if (userAgentStr.includes("Chrome") && !userAgentStr.includes("Edg") && !userAgentStr.includes("OPR")) userAgent += " (Chrome)";
    else if (userAgentStr.includes("Safari") && !userAgentStr.includes("Chrome")) userAgent += " (Safari)";
    else if (userAgentStr.includes("Firefox")) userAgent += " (Firefox)";
    else if (userAgentStr.includes("Edg")) userAgent += " (Edge)";
    else if (userAgentStr.includes("OPR") || userAgentStr.includes("Opera")) userAgent += " (Opera)";

    // Geo-lookup using free API that allows datacenter requests (Vercel)
    let location = "Unknown Location";
    if (ip !== "Unknown IP" && ip !== "::1" && ip !== "127.0.0.1") {
      try {
        const geoRes = await fetch(`https://freeipapi.com/api/json/${ip}`);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo.cityName && geo.countryName) {
            location = `${geo.cityName}, ${geo.countryName}`;
          }
        }
      } catch (err) {
        console.error("Geo lookup failed", err);
      }
    }

    let action = "login";
    try {
      if (req.method === "POST" && req.headers.get("content-type")?.includes("application/json")) {
        const body = await req.json().catch(() => ({}));
        if (body.action) action = body.action;
      }
    } catch (e) {}

    const { error: insertError } = await supabaseAdmin.from("login_activity").insert({
      user_id: user.id,
      ip_address: ip,
      location,
      user_agent: userAgent,
      action
    });

    if (insertError) {
      console.error("Failed to log session", insertError);
      return NextResponse.json({ error: "Failed to log" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Log session error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
