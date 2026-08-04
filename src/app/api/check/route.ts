import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Rate limit: max 10 per minute per IP
    const ip = getClientIp(req);
    const rl = rateLimit(`check-account:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rl.resetInSeconds}s.` },
        { status: 429 }
      );
    }

    const { accountStr } = await req.json();

    if (!accountStr) {
      return NextResponse.json({ error: "Missing account parameter" }, { status: 400 });
    }

    // NFA API does not provide a public /check endpoint.
    // We will perform a local sanity check instead.
    if (!accountStr.includes(":")) {
      return NextResponse.json({ error: "Invalid account format" }, { status: 400 });
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({ 
      ok: true, 
      status: "Unknown", 
      message: "Account format looks good. If it does not work, use the 'Replace' button." 
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
