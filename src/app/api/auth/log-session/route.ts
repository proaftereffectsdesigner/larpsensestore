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
    const userAgent = req.headers.get("user-agent") || "Unknown Device";

    // Basic Geo-lookup using free API
    let location = "Unknown Location";
    if (ip !== "Unknown IP" && ip !== "::1" && ip !== "127.0.0.1") {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,city`);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo.city && geo.country) {
            location = `${geo.city}, ${geo.country}`;
          }
        }
      } catch (err) {
        console.error("Geo lookup failed", err);
      }
    }

    const { error: insertError } = await supabaseAdmin.from("login_activity").insert({
      user_id: user.id,
      ip_address: ip,
      location,
      user_agent: userAgent
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
