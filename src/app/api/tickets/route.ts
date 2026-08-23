import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    // Limit to 5 ticket attempts per minute per IP to prevent Discord spam
    const rl = rateLimit(`tickets_${ip}`, { maxRequests: 5, windowMs: 60000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const { issueType, orderId, description, transactionId, paymentMethod } = await req.json();
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token || !issueType || !description) {
      return NextResponse.json({ error: "Missing parameters or token" }, { status: 400 });
    }

    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    );

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: Check if user already has an open ticket
    const { data: existingTickets } = await authenticatedSupabase
      .from('tickets')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'open');

    if (existingTickets && existingTickets.length >= 3) {
      return NextResponse.json({ error: "You have too many open tickets. Please wait for a response." }, { status: 429 });
    }

    // Get user's profile to see if they have discord linked
    const { data: profile } = await authenticatedSupabase
      .from('profiles')
      .select('discord_id, email, display_name')
      .eq('id', user.id)
      .single();

    let dbDescription = description;
    if (paymentMethod) dbDescription = `Payment Method: ${paymentMethod}\n` + dbDescription;
    if (transactionId) dbDescription = `Transaction ID: ${transactionId}\n` + dbDescription;

    // Create the ticket in Supabase
    const { data: ticketData, error: ticketError } = await authenticatedSupabase
      .from('tickets')
      .insert({
        user_id: user.id,
        order_id: orderId || null,
        issue_type: issueType,
        description: dbDescription,
        status: 'open'
      })
      .select()
      .single();

    if (ticketError || !ticketData) {
      console.error("Ticket DB Error:", ticketError);
      return NextResponse.json({ error: ticketError?.message || "Failed to create ticket" }, { status: 500 });
    }

    // Integrate with Discord if credentials are set
    const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
    const guildId = process.env.DISCORD_GUILD_ID?.trim();
    let categoryId = process.env.DISCORD_TICKETS_CATEGORY_ID?.trim();

    if (issueType === 'affiliate_application') {
      categoryId = '1541097145136971807';
    }

    if (botToken && guildId && categoryId) {
      try {
        const ticketName = `ticket-${ticketData.ticket_number}`;
        const issueTypeLabels: Record<string, string> = {
          'invalid_token': 'Invalid / Expired Token',
          'missing_delivery': 'Order not delivered',
          'payment_issue': 'Payment Issue / Top-up failed',
          'general_question': 'General Question',
          'affiliate_application': 'Affiliate Program Application',
          'other': 'Other'
        };
        const formattedIssueType = issueTypeLabels[issueType] || issueType;
        const permissionOverwrites: any[] = [
          {
            id: guildId, // @everyone role
            type: 0,
            deny: (1 << 10).toString(), // View Channel
          }
        ];

        if (profile?.discord_id) {
          permissionOverwrites.push({
            id: profile.discord_id,
            type: 1, // member
            allow: ((1 << 10) | (1 << 11)).toString(), // View Channel + Send Messages
          });
        }

        const payload = {
          name: ticketName,
          type: 0,
          parent_id: categoryId,
          permission_overwrites: permissionOverwrites
        };
        console.log("Sending Discord API Request. guildId:", guildId, "categoryId:", categoryId, "payload:", JSON.stringify(payload));

        // Create channel
        const channelRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (channelRes.ok) {
          const channel = await channelRes.json();
          
          // Update supabase with discord channel id using Admin (RLS bypass)
          await supabaseAdmin.from('tickets').update({ discord_channel_id: channel.id }).eq('id', ticketData.id);

          // Ping roles
          const userName = profile?.display_name || user.email || 'User';
          const pingContent = `<@&1531838773049163986> <@&1531840906632626236> New ticket created by ${userName}: ${formattedIssueType}`;
          await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bot ${botToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: pingContent })
          });

          // Send the ticket description/application content as a follow-up message
          if (dbDescription) {
            // Discord has a 2000 char limit, truncate if needed
            const descContent = dbDescription.length > 1900 
              ? dbDescription.substring(0, 1900) + '\n... (truncated)'
              : dbDescription;
            await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ content: descContent })
            });
          }
        } else {
          console.error("Discord Channel Creation Failed:", await channelRes.text());
        }
      } catch (e) {
        console.error("Discord integration error:", e);
      }
    }

    return NextResponse.json({ ok: true, ticket_number: ticketData.ticket_number });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
