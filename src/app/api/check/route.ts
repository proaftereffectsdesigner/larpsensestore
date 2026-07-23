import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
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
