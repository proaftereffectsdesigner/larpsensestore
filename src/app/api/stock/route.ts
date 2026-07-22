import { NextResponse } from "next/server";

export async function GET() {
  const NFA_API_KEY = process.env.NFA_API_KEY;
  const NFA_API_URL = process.env.NFA_API_URL || "https://www.nfa.pub/api/v1";

  if (!NFA_API_KEY) {
    return NextResponse.json({ error: "Missing NFA_API_KEY in environment" }, { status: 500 });
  }

  try {
    const res = await fetch(`${NFA_API_URL}/stock`, {
      headers: {
        "X-Api-Key": NFA_API_KEY,
      },
      next: { revalidate: 60 } // Cache na 60 sekund by nie spamować API NFA
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      return NextResponse.json({ error: "Invalid response from NFA API", raw: text }, { status: 400 });
    }

    if (!res.ok || !data.ok) {
      return NextResponse.json({ error: data.error || "Failed to fetch stock" }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
