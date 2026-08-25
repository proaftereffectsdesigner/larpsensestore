import { createClient } from "@supabase/supabase-js";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Hardcoded channel ID provided by the user
const NOTIFICATION_CHANNEL_ID = "1541087666865705060";

export async function sendOrderNotification(
  supabaseAdmin: any,
  userId: string,
  productId: string,
  quantity: number,
  totalPricePaid: number,
  paymentMethod: "Stripe" | "OxaPay",
  orderId?: string
) {
  if (!DISCORD_BOT_TOKEN) return;

  try {
    // 1. Fetch user data
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, email, avatar_url")
      .eq("id", userId)
      .single();

    // 2. Format the message
    const discordMention = profile 
      ? `**${profile.display_name || "Unknown"}**\n${profile.email || "N/A"}`
      : "Unknown User";
    
    // 3. Format product name
    const { products } = await import("@/lib/products");
    const product = products.find(p => p.id === productId);
    const productName = product ? product.name : productId;

    // 4. Send via Discord REST API
    const embed: any = {
      title: "🛒 Nowe zamówienie w sklepie!",
      color: paymentMethod === "Stripe" ? 0x6366f1 : 0xf59e0b, // Indigo for Stripe, Amber for Crypto
      fields: [
        { name: "Kupujący", value: discordMention, inline: true },
        { name: "Produkt", value: `${productName} (x${quantity})`, inline: true },
        { name: "Kwota zapłacona", value: `${totalPricePaid.toFixed(2)} EUR`, inline: true },
        { name: "Metoda płatności", value: paymentMethod, inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: `Order ID: ${orderId || "N/A"}` }
    };

    if (profile?.avatar_url) {
      embed.thumbnail = { url: profile.avatar_url };
    }

    const res = await fetch(`https://discord.com/api/v10/channels/${NOTIFICATION_CHANNEL_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        embeds: [embed]
      })
    });

    if (!res.ok) {
      console.error("Failed to send Discord notification", await res.text());
    }
  } catch (error) {
    console.error("Error sending order notification to Discord:", error);
  }
}
