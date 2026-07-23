import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with the Service Role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify that the user making the request is an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, is_banned")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    // Process the request
    const { targetUserId, flags } = await req.json();

    if (!targetUserId || !flags) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // You cannot ban yourself (prevents locking yourself out)
    if (targetUserId === user.id && flags.is_banned === true) {
      return NextResponse.json({ error: "You cannot ban yourself." }, { status: 400 });
    }

    // Get target user's current data to know their IP
    const { data: targetUser } = await supabase
      .from("profiles")
      .select("last_ip, is_banned")
      .eq("id", targetUserId)
      .single();

    // Determine banned_at
    let banned_at = undefined;
    if (flags.is_banned !== undefined && targetUser) {
      if (flags.is_banned === true && targetUser.is_banned === false) {
        banned_at = new Date().toISOString();
      } else if (flags.is_banned === false) {
        banned_at = null;
      }
    }

    // Update the user's flags
    const updateData: any = {
        is_banned: flags.is_banned,
        can_topup: flags.can_topup,
        can_purchase: flags.can_purchase,
        can_update_profile: flags.can_update_profile,
        ban_reason: flags.ban_reason,
        ban_type: flags.ban_type,
        ban_expires_at: flags.ban_expires_at,
        ban_acknowledged: flags.ban_acknowledged
    };
    if (banned_at !== undefined) updateData.banned_at = banned_at;

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", targetUserId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    let cascadeType = null;
    
    const isFullUnban = flags.is_banned === false && 
                        flags.can_topup === true && 
                        flags.can_purchase === true && 
                        flags.can_update_profile === true;

    // Cascade ban to other accounts on the same IP if this is a ban action
    if (flags.is_banned === true && targetUser?.last_ip) {
      cascadeType = 'ban';
      const { error: cascadeError } = await supabase
        .from("profiles")
        .update({
          is_banned: true,
          can_topup: false,
          can_purchase: false,
          can_update_profile: false,
          ban_reason: flags.ban_reason || 'Multiple accounts',
          ban_type: flags.ban_type || 'manual',
          ban_expires_at: flags.ban_expires_at,
          ban_acknowledged: false,
          banned_at: banned_at
        })
        .eq("last_ip", targetUser.last_ip)
        .neq("id", targetUserId)
        .neq("is_admin", true); // never auto-ban admins
        
      if (cascadeError) {
        console.error("Cascade ban error:", cascadeError);
      }
    } else if (flags.is_banned === false && isFullUnban && targetUser?.last_ip) {
      cascadeType = 'unban';
      // Cascade UNBAN to all related accounts
      const { error: cascadeUnbanError } = await supabase
        .from("profiles")
        .update({
          is_banned: false,
          can_topup: true,
          can_purchase: true,
          can_update_profile: true,
          ban_reason: null,
          ban_type: null,
          ban_expires_at: null,
          ban_acknowledged: true,
          banned_at: null
        })
        .eq("last_ip", targetUser.last_ip)
        .neq("id", targetUserId)
        .neq("is_admin", true);
        
      if (cascadeUnbanError) {
        console.error("Cascade unban error:", cascadeUnbanError);
      }
    } else if (flags.is_banned === false && !isFullUnban && targetUser?.last_ip) {
      cascadeType = 'restrict';
      // Cascade RESTRICTION to all related accounts
      const { error: cascadeRestrictError } = await supabase
        .from("profiles")
        .update({
          is_banned: false,
          can_topup: flags.can_topup,
          can_purchase: flags.can_purchase,
          can_update_profile: flags.can_update_profile,
          ban_reason: flags.ban_reason || 'Account restricted (Related account)',
          ban_type: flags.ban_type || 'manual',
          ban_expires_at: flags.ban_expires_at,
          ban_acknowledged: false,
          banned_at: null
        })
        .eq("last_ip", targetUser.last_ip)
        .neq("id", targetUserId)
        .neq("is_admin", true);
        
      if (cascadeRestrictError) {
        console.error("Cascade restrict error:", cascadeRestrictError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      user: data, 
      cascaded: cascadeType !== null,
      cascadeType: cascadeType,
      targetIp: targetUser?.last_ip
    });
  } catch (error: any) {
    console.error("Update flags error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
