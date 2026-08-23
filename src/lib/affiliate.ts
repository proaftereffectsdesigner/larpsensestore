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

    // 1. If they used a promo code on this transaction, link them to the owner
    if (appliedPromoCode) {
      const { data: codeData } = await supabaseAdmin
        .from("affiliate_codes")
        .select("*")
        .eq("code", appliedPromoCode.toUpperCase())
        .single();

      if (codeData && codeData.owner_id) {
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
    } else {
      // 2. No promo code used, check if they are already referred
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("referred_by")
        .eq("id", userId)
        .single();

      if (profile && profile.referred_by) {
        affiliateOwnerId = profile.referred_by;
        commissionPct = 10; // Default lifetime commission
      }
    }

    // 3. Give commission to the affiliate owner
    if (affiliateOwnerId && commissionPct > 0) {
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
