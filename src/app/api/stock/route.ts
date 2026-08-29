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
    const res = await fetch(`${NFA_API_URL}/stock?result=json`, {
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

    const items = data.products || data.stock;
    const formattedStock: Record<string, Record<string, any>> = {};
    
    // Map new NFA IDs to old endpoint/type format
    const idMapping: Record<string, {endpoint: string, type: string}> = {
      "prime-ready": {endpoint: "cs2", type: "prime"},
      "premier-ready": {endpoint: "cs2", type: "premier"},
      "premier-ready-4-medals": {endpoint: "cs2", type: "premier-4-medals"},
      "premier-ready-10-medals": {endpoint: "cs2", type: "premier-10-medals"},
      "premier-ready-10k-rating": {endpoint: "cs2", type: "premier-10k"},
      "premier-ready-15k-rating": {endpoint: "cs2", type: "premier-15k"},
      "premier-ready-20k-rating": {endpoint: "cs2", type: "premier-20k"},
      "premier-ready-knife-glove": {endpoint: "cs2", type: "premier-rare"},
      "rust-1-99-hours": {endpoint: "rust", type: "1-99"},
      "rust-100-199-hours": {endpoint: "rust", type: "100-199"},
      "rust-200-499-hours": {endpoint: "rust", type: "200-499"},
      "rust-500-999-hours": {endpoint: "rust", type: "500-999"},
      "rust-1000-plus-hours": {endpoint: "rust", type: "1000-plus"},
      "xg-arc-0-100h": {endpoint: "extra", type: "arc"},
      "xg-arc-100-200h": {endpoint: "extra", type: "arc"},
      "xg-arc-200h-plus": {endpoint: "extra", type: "arc"},
      "xg-apex-0-100h": {endpoint: "extra", type: "apex"},
      "xg-apex-100-200h": {endpoint: "extra", type: "apex"},
      "xg-apex-200h-plus": {endpoint: "extra", type: "apex"},
      "xg-r6": {endpoint: "extra", type: "r6"},
      "xg-dayz": {endpoint: "extra", type: "dayz"},
      "xg-bf6": {endpoint: "extra", type: "bf6"},
    };

    if (items && Array.isArray(items)) {
      items.forEach((item: any) => {
        let endpoint = item.endpoint;
        let type = item.type;

        // If using the new API format
        if (item.id && idMapping[item.id]) {
          endpoint = idMapping[item.id].endpoint;
          type = idMapping[item.id].type;
        }

        if (!endpoint || !type) return;
        if (!formattedStock[endpoint]) {
          formattedStock[endpoint] = {};
        }
        
        // ONLY expose the available count to prevent leaking wholesale cost prices
        const availableCount = item.stock !== undefined ? item.stock : (item.available !== undefined ? item.available : 0);
        
        // Handle cases where multiple NFA IDs map to the same type (like apex/arc)
        if (formattedStock[endpoint][type]) {
             formattedStock[endpoint][type].available += availableCount;
        } else {
             formattedStock[endpoint][type] = { available: availableCount };
        }
      });
    }

    // Return a clean object without wholesale data
    return NextResponse.json({
      ok: true,
      stock: formattedStock
    });
  } catch (err) {
    console.error("NFA API fetch failed:", err);
    return NextResponse.json(mockFallback);
  }
}
