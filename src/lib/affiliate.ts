import { createClient } from "@supabase/supabase-js";

export async function processAffiliateCommission(
  supabaseAdmin: any,
  userId: string,
  totalPricePaid: number,
  appliedPromoCode?: string
) {
  try {
    let affiliateOwnerId = null;
    let commissionPct = 10;

    // Check current profile referral status first
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("referred_by")
      .eq("id", userId)
      .single();

    if (profile?.referred_by && profile.referred_by !== userId) {
      // User is ALREADY bound to a lifetime affiliate (Creator A)
      affiliateOwnerId = profile.referred_by;
      const { data: ownerCode } = await supabaseAdmin
        .from("affiliate_codes")
        .select("commission_pct")
        .eq("owner_id", affiliateOwnerId)
        .maybeSingle();
      commissionPct = ownerCode?.commission_pct || 10;
    } else if (appliedPromoCode) {
      // First time using an affiliate code
      const { data: codeData } = await supabaseAdmin
        .from("affiliate_codes")
        .select("*")
        .ilike("code", appliedPromoCode.trim())
        .maybeSingle();

      if (codeData && codeData.owner_id && codeData.owner_id !== userId) {
        affiliateOwnerId = codeData.owner_id;
        commissionPct = codeData.commission_pct || 10;

        // Update total uses
        await supabaseAdmin
          .from("affiliate_codes")
          .update({ total_uses: (codeData.total_uses || 0) + 1 })
          .eq("code", codeData.code);

        // Link the user for lifetime
        await supabaseAdmin
          .from("profiles")
          .update({
            referred_by: affiliateOwnerId,
            used_first_discount: true,
          })
          .eq("id", userId);
      }
    }

    // 3. Give commission to the affiliate owner
    if (affiliateOwnerId && affiliateOwnerId !== userId && commissionPct > 0) {
      const commission = Number((totalPricePaid * (commissionPct / 100)).toFixed(2));
      if (commission > 0) {
        const { data: affProfile } = await supabaseAdmin
          .from("profiles")
          .select("balance")
          .eq("id", affiliateOwnerId)
          .single();

        if (affProfile) {
          const newAffBalance = Number(affProfile.balance) + commission;
          await supabaseAdmin
            .from("profiles")
            .update({ balance: newAffBalance })
            .eq("id", affiliateOwnerId);
        }
      }
    }
  } catch (error) {
    console.error("Error processing affiliate commission:", error);
  }
}
