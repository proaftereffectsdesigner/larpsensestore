import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { accountStr } = await req.json();

    if (!accountStr) {
      return NextResponse.json({ error: "Missing account parameter" }, { status: 400 });
    }

    const NFA_API_KEY = process.env.NFA_API_KEY!;
    const NFA_API_URL = process.env.NFA_API_URL || "https://www.nfa.pub/api/v1";

    const nfaRes = await fetch(`${NFA_API_URL}/check?account=${encodeURIComponent(accountStr)}`, {
      method: "POST",
      headers: {
        "X-Api-Key": NFA_API_KEY,
      },
    });

    let nfaData;
    const rawText = await nfaRes.text();
    try {
      nfaData = JSON.parse(rawText);
    } catch(e) {
      return NextResponse.json({ error: "Invalid response from NFA API", raw: rawText }, { status: 400 });
    }

    if (!nfaRes.ok || !nfaData.ok) {
      return NextResponse.json({ error: nfaData.error || nfaData.code || "Check failed at NFA" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, status: nfaData.status, message: nfaData.message });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
