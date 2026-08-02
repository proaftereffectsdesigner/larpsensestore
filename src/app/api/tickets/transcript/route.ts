import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl || !targetUrl.startsWith('https://')) {
      return new NextResponse("Invalid URL", { status: 400 });
    }

    const res = await fetch(targetUrl);
    if (!res.ok) {
      return new NextResponse("Failed to fetch transcript", { status: res.status });
    }

    const html = await res.text();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
