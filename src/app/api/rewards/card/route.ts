import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// COOLDOWN CONFIGURATION:
// 24 hours cooldown for daily rewards card
export const CARD_COOLDOWN_SECONDS = 24 * 60 * 60;

const CARD_DROPS = [
  // Empty (Silver) - 70%
  { id: 0, name: "Empty", discountPct: 0, image: "/reward-empty.png", textColor: "#a1a1aa" },
  // Common (Green) - 15%
  { id: 1, name: "5% Discount", discountPct: 5, image: "/reward-common.png", textColor: "#22c55e" },
  // Rare (Blue) - 10%
  { id: 2, name: "10% Discount", discountPct: 10, image: "/reward-rare.png", textColor: "#60a5fa" },
  // Epic (Purple) - 4%
  { id: 3, name: "15% Discount", discountPct: 15, image: "/reward-epic.png", textColor: "#c084fc" },
  // Legendary (Gold) - 1%
  { id: 4, name: "20% Discount", discountPct: 20, image: "/reward-legendary.png", textColor: "#facc15" },
];

function getSupabaseClients(token?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const userClient = createClient(supabaseUrl, supabaseAnon, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });

  const adminClient = createClient(supabaseUrl, supabaseService);

  return { userClient, adminClient };
}

// GET: Check status, active card, cooldown
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ ok: true, notLoggedIn: true, canScratch: false });
    }

    const { userClient, adminClient } = getSupabaseClients(token);
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: true, notLoggedIn: true, canScratch: false });
    }

    const { data: adminUserData, error: adminUserError } = await adminClient.auth.admin.getUserById(user.id);
    if (adminUserError || !adminUserData?.user) {
      return NextResponse.json({ error: "Failed to load user data" }, { status: 500 });
    }

    const appMeta = adminUserData.user.app_metadata || {};
    const userMeta = adminUserData.user.user_metadata || {};
    const lastDrawnAt = appMeta.scratch_last_drawn_at || userMeta.scratch_last_drawn_at;
    let activeCard = appMeta.active_scratch_card || userMeta.active_scratch_card || null;

    let canScratch = true;
    let remainingSeconds = 0;

    if (lastDrawnAt) {
      const elapsed = (Date.now() - new Date(lastDrawnAt).getTime()) / 1000;
      if (elapsed < CARD_COOLDOWN_SECONDS) {
        canScratch = false;
        remainingSeconds = Math.max(1, Math.ceil(CARD_COOLDOWN_SECONDS - elapsed));
      }
    }

    // Verify if active card code has already been used on an order
    if (activeCard && activeCard.code && activeCard.status !== "used") {
      const { data: promoData } = await adminClient
        .from("promo_codes")
        .select("current_uses, max_uses")
        .eq("code", activeCard.code)
        .maybeSingle();

      if (promoData && promoData.max_uses && promoData.current_uses >= promoData.max_uses) {
        activeCard = { ...activeCard, status: "used" };
        // Sync both app_metadata and user_metadata
        await adminClient.auth.admin.updateUserById(user.id, {
          app_metadata: { ...appMeta, active_scratch_card: activeCard },
          user_metadata: { ...userMeta, active_scratch_card: activeCard }
        });
      }
    }

    return NextResponse.json({
      ok: true,
      canScratch,
      remainingSeconds,
      cooldownDuration: CARD_COOLDOWN_SECONDS,
      activeCard,
      history: appMeta.scratch_history || userMeta.scratch_history || [],
      lastDrawnAt
    });
  } catch (error: any) {
    console.error("Error in GET /api/rewards/card:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const inFlightRolls = new Set<string>();

export async function POST(request: Request) {
  let activeUserId: string | null = null;
  try {
    const authHeader = request.headers.get("Authorization");
    let token = authHeader?.replace("Bearer ", "");

    if (!token) {
      try {
        const body = await request.json();
        token = body.token;
      } catch {}
    }

    if (!token) {
      return NextResponse.json({ error: "You must be logged in to scratch a card." }, { status: 401 });
    }

    const { userClient, adminClient } = getSupabaseClients(token);
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid or expired session. Please log in." }, { status: 401 });
    }

    activeUserId = user.id;
    if (inFlightRolls.has(user.id)) {
      return NextResponse.json({ error: "A card draw is already processing." }, { status: 429 });
    }
    inFlightRolls.add(user.id);

    // Check if banned
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_banned")
      .eq("id", user.id)
      .single();

    if (profile?.is_banned) {
      return NextResponse.json({ error: "Your account is restricted." }, { status: 403 });
    }

    const { data: adminUserData, error: adminUserError } = await adminClient.auth.admin.getUserById(user.id);
    if (adminUserError || !adminUserData?.user) {
      return NextResponse.json({ error: "Failed to load user profile" }, { status: 500 });
    }

    const appMeta = adminUserData.user.app_metadata || {};
    const userMeta = adminUserData.user.user_metadata || {};
    const lastDrawnAt = appMeta.scratch_last_drawn_at || userMeta.scratch_last_drawn_at;

    // Strict cooldown validation
    if (lastDrawnAt) {
      const elapsed = (Date.now() - new Date(lastDrawnAt).getTime()) / 1000;
      if (elapsed < CARD_COOLDOWN_SECONDS) {
        const remaining = Math.max(1, Math.ceil(CARD_COOLDOWN_SECONDS - elapsed));
        return NextResponse.json({
          error: "Cooldown active",
          remainingSeconds: remaining,
          activeCard: appMeta.active_scratch_card || userMeta.active_scratch_card || null
        }, { status: 400 });
      }
    }

    // Server-side cryptographic roll: 0 to 9999
    const rand = crypto.randomInt(0, 10000);
    let drop = CARD_DROPS[0]; // Empty default
    if (rand < 7000) {
      drop = CARD_DROPS[0]; // 70% Empty
    } else if (rand < 8500) {
      drop = CARD_DROPS[1]; // 15% 5% Discount
    } else if (rand < 9500) {
      drop = CARD_DROPS[2]; // 10% 10% Discount
    } else if (rand < 9900) {
      drop = CARD_DROPS[3]; // 4% 15% Discount
    } else {
      drop = CARD_DROPS[4]; // 1% 20% Discount
    }

    let generatedCode: string | null = null;

    // If won a discount, create single-use promo code locked to this user account
    if (drop.discountPct > 0) {
      const userPrefix = user.id.replace(/-/g, "").slice(0, 8).toUpperCase();
      const randSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
      generatedCode = `CARD${drop.discountPct}-${userPrefix}-${randSuffix}`;

      const { error: insertError } = await adminClient.from("promo_codes").insert({
        code: generatedCode,
        discount_pct: drop.discountPct,
        max_uses: 1,
        current_uses: 0,
        min_spent: 0,
        created_at: new Date().toISOString()
      });

      if (insertError) {
        console.error("Failed to insert scratch promo code:", insertError);
        return NextResponse.json({ error: "Failed to generate reward code" }, { status: 500 });
      }
    }

    const cardRecord = {
      id: drop.id,
      name: drop.name,
      discountPct: drop.discountPct,
      image: drop.image,
      textColor: drop.textColor,
      code: generatedCode,
      status: drop.discountPct > 0 ? "unused" : "empty",
      wonAt: new Date().toISOString()
    };

    // Save timestamp & active card immediately to database (both app_metadata for security and user_metadata for client)
    const nowIso = new Date().toISOString();
    const currentCardHistory: any[] = appMeta.scratch_history || userMeta.scratch_history || [];
    const updatedCardHistory = [cardRecord, ...currentCardHistory].slice(0, 30);

    await adminClient.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...appMeta,
        scratch_last_drawn_at: nowIso,
        active_scratch_card: cardRecord,
        scratch_history: updatedCardHistory
      },
      user_metadata: {
        ...userMeta,
        scratch_last_drawn_at: nowIso,
        active_scratch_card: cardRecord,
        scratch_history: updatedCardHistory
      }
    });

    return NextResponse.json({
      ok: true,
      drop: cardRecord,
      history: updatedCardHistory,
      cooldownSeconds: CARD_COOLDOWN_SECONDS
    });
  } catch (error: any) {
    console.error("Error in POST /api/rewards/card:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    if (activeUserId) {
      inFlightRolls.delete(activeUserId);
    }
  }
}
