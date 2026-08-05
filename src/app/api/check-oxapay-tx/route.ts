import { NextResponse } from 'next/server';

const OXAPAY_MERCHANT_KEY = process.env.OXAPAY_MERCHANT_KEY;

export async function POST(req: Request) {
  try {
    if (!OXAPAY_MERCHANT_KEY) {
      console.error("Missing OXAPAY_MERCHANT_KEY in env");
      return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    const body = await req.json();
    const { trackId } = body;

    if (!trackId) {
      return NextResponse.json({ error: "Missing trackId" }, { status: 400 });
    }

    // Ping OxaPay API to check transaction status
    const inquiryRes = await fetch("https://api.oxapay.com/v1/payment/inquiry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        merchant: OXAPAY_MERCHANT_KEY,
        trackId: trackId
      })
    });

    const inquiryData = await inquiryRes.json();
    const status = inquiryData?.data?.status || inquiryData?.status;

    // "Paid" means transaction was completed in blockchain and processed by Oxapay
    // We send back the status to frontend modal
    return NextResponse.json({ status: status });

  } catch (err: any) {
    console.error("OxaPay Inquiry Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
