import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function POST(req: Request) {
  try {
    const { issueType, orderId, description } = await req.json();
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token || !issueType || !description) {
      return NextResponse.json({ error: "Missing parameters or token" }, { status: 400 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: Check if user already has an open ticket
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'open');

    if (existingTickets && existingTickets.length >= 3) {
      return NextResponse.json({ error: "You have too many open tickets. Please wait for a response." }, { status: 429 });
    }

    // Get user's profile to see if they have discord linked
    const { data: profile } = await supabase
      .from('profiles')
      .select('discord_id, email, display_name')
      .eq('id', user.id)
      .single();

    // Create the ticket in Supabase
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        user_id: user.id,
        order_id: orderId || null,
        issue_type: issueType,
        description: description,
        status: 'open'
      })
      .select()
      .single();

    if (ticketError || !ticketData) {
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }

    // Integrate with Discord if credentials are set
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;
    const categoryId = process.env.DISCORD_TICKETS_CATEGORY_ID;

    if (botToken && guildId && categoryId) {
      try {
        const ticketName = `ticket-${ticketData.ticket_number}`;
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

        // Create channel
        const channelRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: ticketName,
            type: 0,
            parent_id: categoryId,
            permission_overwrites: permissionOverwrites
          })
        });

        if (channelRes.ok) {
          const channel = await channelRes.json();
          
          // Update supabase with discord channel id
          await supabase.from('tickets').update({ discord_channel_id: channel.id }).eq('id', ticketData.id);

          // Post initial message
          await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bot ${botToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: profile?.discord_id ? `<@${profile.discord_id}>` : "",
              embeds: [{
                title: `New Ticket: ${issueType}`,
                color: 0x3498db,
                fields: [
                  { name: 'User Email', value: profile?.email || user.email || 'Unknown', inline: true },
                  { name: 'Order ID', value: orderId ? orderId.split('-')[0] : 'N/A', inline: true },
                  { name: 'Description', value: description, inline: false }
                ],
                footer: { text: `Ticket #${ticketData.ticket_number} • Use /close to close` }
              }]
            })
          });
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
