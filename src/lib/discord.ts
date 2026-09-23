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
  paymentMethod: "Stripe" | "OxaPay" | "Crypto" | "Balance",
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

    // Determine embed styling
    let embedColor = 0x6366f1; // Indigo for Stripe
    let embedTitle = "🛒 Nowe zamówienie w sklepie!";
    let methodDisplay = paymentMethod as string;

    if (paymentMethod === "OxaPay" || paymentMethod === "Crypto") {
      embedColor = 0xf59e0b; // Amber for Crypto
      methodDisplay = "Crypto (OxaPay)";
    } else if (paymentMethod === "Balance") {
      embedColor = 0x10b981; // Emerald for Wallet Balance
      methodDisplay = "Saldo konta (Portfel)";
      embedTitle = "🛒 Nowe zamówienie w sklepie (Saldo)!";
    }

    // 4. Send via Discord REST API
    const embed: any = {
      title: embedTitle,
      color: embedColor,
      fields: [
        { name: "Kupujący", value: discordMention, inline: true },
        { name: "Produkt", value: `${productName} (x${quantity})`, inline: true },
        { name: "Kwota zapłacona", value: `${totalPricePaid.toFixed(2)} EUR`, inline: true },
        { name: "Metoda płatności", value: methodDisplay, inline: true },
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

export async function sendTopUpNotification(
  supabaseAdmin: any,
  userId: string,
  amountAdded: number,
  newBalance: number,
  paymentMethod: "Stripe" | "Crypto",
  orderId?: string
) {
  if (!DISCORD_BOT_TOKEN) return;

  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, email, avatar_url")
      .eq("id", userId)
      .single();

    const discordMention = profile 
      ? `**${profile.display_name || "Unknown"}**\n${profile.email || "N/A"}`
      : "Unknown User";

    const embed: any = {
      title: "💳 Nowe doładowanie portfela (Top-Up)!",
      color: 0x3b82f6, // Blue
      fields: [
        { name: "Użytkownik", value: discordMention, inline: true },
        { name: "Kwota doładowania", value: `+${amountAdded.toFixed(2)} EUR`, inline: true },
        { name: "Nowe saldo", value: `${newBalance.toFixed(2)} EUR`, inline: true },
        { name: "Metoda płatności", value: paymentMethod === "Stripe" ? "Karta (Stripe)" : "Krypto (OxaPay)", inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: `Top-Up ID: ${orderId || "N/A"}` }
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
      console.error("Failed to send Discord top-up notification", await res.text());
    }
  } catch (error) {
    console.error("Error sending top-up notification to Discord:", error);
  }
}

