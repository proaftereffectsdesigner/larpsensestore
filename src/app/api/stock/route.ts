import { NextResponse } from "next/server";

export async function GET() {
  const NFA_API_KEY = process.env.NFA_API_KEY;
  const NFA_API_URL = process.env.NFA_API_URL || "https://www.nfa.pub/api/v1";

  const mockFallback = {
    ok: true,
    stock: {
      cs2: {
        "prime": { available: 142 },
        "premier": { available: 58 },
        "premier-4-medals": { available: 12 },
        "premier-10-medals": { available: 0 },
        "premier-10k": { available: 5 },
        "premier-15k": { available: 2 },
        "premier-20k": { available: 0 },
        "premier-rare": { available: 1 }
      }
    }
  };

  // Use the actual API call
  try {
    const res = await fetch(`${NFA_API_URL}/stock?result=json&key=${NFA_API_KEY || ""}`, {
      headers: {
        "X-Api-Key": NFA_API_KEY || "",
      },
      cache: 'no-store'
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      console.error("NFA API error:", text);
      return NextResponse.json(mockFallback);
    }

    if (!res.ok || !data.ok) {
      console.error("NFA API returned error:", data);
      return NextResponse.json(mockFallback);
    }

    // Transform the array from NFA API to the nested object format expected by the frontend
    // Note: The real API returns `products` instead of `stock` and uses `stock` instead of `available`.
    const items = data.products || data.stock;
    if (items && Array.isArray(items)) {
      const formattedStock: Record<string, Record<string, any>> = {};
      items.forEach((item: any) => {
        if (!item.endpoint || !item.type) return;
        if (!formattedStock[item.endpoint]) {
          formattedStock[item.endpoint] = {};
        }
        formattedStock[item.endpoint][item.type] = {
          available: item.stock !== undefined ? item.stock : item.available,
          price_eur: item.unit_price_eur !== undefined ? item.unit_price_eur : item.price_eur
        };
      });
      data.stock = formattedStock;
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("NFA API fetch failed:", err);
    return NextResponse.json(mockFallback);
  }
}
