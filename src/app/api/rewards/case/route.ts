import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// COOLDOWN CONFIGURATION:
// 24 hours cooldown for daily rewards case
export const CASE_COOLDOWN_SECONDS = 24 * 60 * 60;

export interface CaseDropItem {
  id: number;
  name: string;
  amount: number;
  type: string;
  color: string;
  border: string;
  glowColor: string;
  textColor: string;
}

export const CASE_DROPS: CaseDropItem[] = [
  // Szara (Gray) - 60% total (12% each)
  { id: 1, name: "1 LSC", amount: 1, type: "coin", color: "bg-gray-500", border: "border-gray-500", glowColor: "rgba(107,114,128,0.4)", textColor: "#9ca3af" },
  { id: 2, name: "2 LSC", amount: 2, type: "coin", color: "bg-gray-500", border: "border-gray-500", glowColor: "rgba(107,114,128,0.4)", textColor: "#9ca3af" },
  { id: 3, name: "3 LSC", amount: 3, type: "coin", color: "bg-gray-500", border: "border-gray-500", glowColor: "rgba(107,114,128,0.4)", textColor: "#9ca3af" },
  { id: 4, name: "4 LSC", amount: 4, type: "coin", color: "bg-gray-500", border: "border-gray-500", glowColor: "rgba(107,114,128,0.4)", textColor: "#9ca3af" },
  { id: 5, name: "5 LSC", amount: 5, type: "coin", color: "bg-gray-500", border: "border-gray-500", glowColor: "rgba(107,114,128,0.4)", textColor: "#9ca3af" },

  // Niebieska (Blue) - 25% total (6.25% each)
  { id: 6, name: "10 LSC", amount: 10, type: "coin", color: "bg-blue-500", border: "border-blue-500", glowColor: "rgba(59,130,246,0.5)", textColor: "#60a5fa" },
  { id: 7, name: "15 LSC", amount: 15, type: "coin", color: "bg-blue-500", border: "border-blue-500", glowColor: "rgba(59,130,246,0.5)", textColor: "#60a5fa" },
  { id: 8, name: "20 LSC", amount: 20, type: "coin", color: "bg-blue-500", border: "border-blue-500", glowColor: "rgba(59,130,246,0.5)", textColor: "#60a5fa" },
  { id: 9, name: "25 LSC", amount: 25, type: "coin", color: "bg-blue-500", border: "border-blue-500", glowColor: "rgba(59,130,246,0.5)", textColor: "#60a5fa" },

  // Fioletowa (Purple) - 10% total (3.33% each)
  { id: 10, name: "50 LSC", amount: 50, type: "coin", color: "bg-purple-500", border: "border-purple-500", glowColor: "rgba(168,85,247,0.5)", textColor: "#c084fc" },
  { id: 11, name: "75 LSC", amount: 75, type: "coin", color: "bg-purple-500", border: "border-purple-500", glowColor: "rgba(168,85,247,0.5)", textColor: "#c084fc" },
  { id: 12, name: "100 LSC", amount: 100, type: "coin", color: "bg-purple-500", border: "border-purple-500", glowColor: "rgba(168,85,247,0.5)", textColor: "#c084fc" },

  // Rozowa (Pink) - 3.5% total (1.75% each)
  { id: 13, name: "250 LSC", amount: 250, type: "coin", color: "bg-pink-500", border: "border-pink-500", glowColor: "rgba(236,72,153,0.5)", textColor: "#f472b6" },
  { id: 14, name: "300 LSC", amount: 300, type: "coin", color: "bg-pink-500", border: "border-pink-500", glowColor: "rgba(236,72,153,0.5)", textColor: "#f472b6" },

  // Czerwona (Red) - 1.3% total (0.65% each)
  { id: 15, name: "700 LSC", amount: 700, type: "coin", color: "bg-red-500", border: "border-red-500", glowColor: "rgba(239,68,68,0.5)", textColor: "#f87171" },
  { id: 16, name: "800 LSC", amount: 800, type: "coin", color: "bg-red-500", border: "border-red-500", glowColor: "rgba(239,68,68,0.5)", textColor: "#f87171" },

  // Złoto (Gold) - 0.2%
  { id: 17, name: "1500 LSC", amount: 1500, type: "coin", color: "bg-yellow-500", border: "border-yellow-500", glowColor: "rgba(234,179,8,0.6)", textColor: "#facc15" },
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

// GET: Check Case status, cooldown, balance, real history
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ ok: true, notLoggedIn: true, canSpin: false, balance: 0, history: [] });
    }

    const { userClient, adminClient } = getSupabaseClients(token);
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: true, notLoggedIn: true, canSpin: false, balance: 0, history: [] });
    }

    const { data: adminUserData, error: adminUserError } = await adminClient.auth.admin.getUserById(user.id);
    if (adminUserError || !adminUserData?.user) {
      return NextResponse.json({ error: "Failed to load user data" }, { status: 500 });
    }

    const appMeta = adminUserData.user.app_metadata || {};
    const userMeta = adminUserData.user.user_metadata || {};
    const lastDrawnAt = appMeta.case_last_drawn_at || userMeta.case_last_drawn_at;
    const balance = typeof appMeta.lsc_balance === "number" ? appMeta.lsc_balance : (userMeta.lsc_balance || 0);
    const history = appMeta.case_history || userMeta.case_history || [];

    let canSpin = true;
    let remainingSeconds = 0;

    if (lastDrawnAt) {
      const elapsed = (Date.now() - new Date(lastDrawnAt).getTime()) / 1000;
      if (elapsed < CASE_COOLDOWN_SECONDS) {
        canSpin = false;
        remainingSeconds = Math.max(1, Math.ceil(CASE_COOLDOWN_SECONDS - elapsed));
      }
    }

    return NextResponse.json({
      ok: true,
      canSpin,
      remainingSeconds,
      cooldownDuration: CASE_COOLDOWN_SECONDS,
      balance,
      history,
      lastDrawnAt
    });
  } catch (error: any) {
    console.error("Error in GET /api/rewards/case:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const inFlightSpins = new Set<string>();

// POST: Spin the case server-side
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
      return NextResponse.json({ error: "You must be logged in to open a case." }, { status: 401 });
    }

    const { userClient, adminClient } = getSupabaseClients(token);
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session. Please log in." }, { status: 401 });
    }

    activeUserId = user.id;
    if (inFlightSpins.has(user.id)) {
      return NextResponse.json({ error: "Case spin already in progress." }, { status: 429 });
    }
    inFlightSpins.add(user.id);

    // Check ban
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
    const lastDrawnAt = appMeta.case_last_drawn_at || userMeta.case_last_drawn_at;
    const currentBalance = typeof appMeta.lsc_balance === "number" ? appMeta.lsc_balance : (userMeta.lsc_balance || 0);
    const currentHistory: any[] = appMeta.case_history || userMeta.case_history || [];

    // Strict cooldown validation
    if (lastDrawnAt) {
      const elapsed = (Date.now() - new Date(lastDrawnAt).getTime()) / 1000;
      if (elapsed < CASE_COOLDOWN_SECONDS) {
        const remaining = Math.max(1, Math.ceil(CASE_COOLDOWN_SECONDS - elapsed));
        return NextResponse.json({
          error: "Cooldown active",
          remainingSeconds: remaining,
          balance: currentBalance,
          history: currentHistory
        }, { status: 400 });
      }
    }

    // Cryptographic server roll between 0 and 99999 (100,000 steps)
    const rand = crypto.randomInt(0, 100000);
    let winningItem: CaseDropItem;

    if (rand < 60000) {
      // Gray (60%): 5 items, each 12,000 steps (12%)
      const grayIndex = Math.floor(rand / 12000);
      winningItem = CASE_DROPS[Math.min(4, grayIndex)];
    } else if (rand < 85000) {
      // Blue (25%): 4 items, each 6,250 steps (6.25%)
      const offset = rand - 60000;
      const blueIndex = Math.floor(offset / 6250);
      winningItem = CASE_DROPS[5 + Math.min(3, blueIndex)];
    } else if (rand < 95000) {
      // Purple (10%): 3 items (~3.33% each)
      const offset = rand - 85000;
      const purpleIndex = Math.floor(offset / 3334);
      winningItem = CASE_DROPS[9 + Math.min(2, purpleIndex)];
    } else if (rand < 98500) {
      // Pink (3.5%): 2 items (1.75% each, 1,750 steps)
      const offset = rand - 95000;
      const pinkIndex = Math.floor(offset / 1750);
      winningItem = CASE_DROPS[12 + Math.min(1, pinkIndex)];
    } else if (rand < 99800) {
      // Red (1.3%): 2 items (0.65% each, 650 steps)
      const offset = rand - 98500;
      const redIndex = Math.floor(offset / 650);
      winningItem = CASE_DROPS[14 + Math.min(1, redIndex)];
    } else {
      // Gold (0.2%): 200 steps
      winningItem = CASE_DROPS[16];
    }

    const nowIso = new Date().toISOString();
    const newBalance = currentBalance + winningItem.amount;

    const historyRecord = {
      id: crypto.randomUUID(),
      drop: {
        id: winningItem.id,
        name: winningItem.name,
        amount: winningItem.amount,
        textColor: winningItem.textColor,
        color: winningItem.color
      },
      time: nowIso
    };

    // Prepend new history record, keep last 30
    const updatedHistory = [historyRecord, ...currentHistory].slice(0, 30);

    // Save timestamp, balance, and real history to database
    await adminClient.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...appMeta,
        case_last_drawn_at: nowIso,
        lsc_balance: newBalance,
        case_history: updatedHistory
      },
      user_metadata: {
        ...userMeta,
        case_last_drawn_at: nowIso,
        lsc_balance: newBalance,
        case_history: updatedHistory
      }
    });

    return NextResponse.json({
      ok: true,
      drop: winningItem,
      newBalance,
      history: updatedHistory,
      cooldownSeconds: CASE_COOLDOWN_SECONDS
    });
  } catch (error: any) {
    console.error("Error in POST /api/rewards/case:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    if (activeUserId) {
      inFlightSpins.delete(activeUserId);
    }
  }
}
