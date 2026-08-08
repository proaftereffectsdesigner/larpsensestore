import { NextResponse } from "next/server";
import { requireAuth } from '@/lib/auth';

const DISCORD_API = "https://discord.com/api/v10";
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
    const isBot = authHeader === process.env.SUPABASE_SERVICE_ROLE_KEY;

    let supabaseAdmin, user, isAdmin;

    if (isBot) {
      supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      isAdmin = true;
    } else {
      const authResult = await requireAuth(req);
      if ('error' in authResult) return authResult.error;
      supabaseAdmin = authResult.supabaseAdmin;
      user = authResult.user;
      isAdmin = authResult.isAdmin;
    }

    const { ticketId, reason, closedByName } = await req.json();
    if (!ticketId) {
      return NextResponse.json({ error: "Missing ticketId" }, { status: 400 });
    }

    // 1. Fetch ticket details
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('ticket_number', parseInt(ticketId))
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (!isAdmin && user && ticket.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You don't have permission to close this ticket" }, { status: 403 });
    }

    if (!ticket.discord_channel_id) {
      // If there's no Discord channel, just close it in the database
      const { error: updateError } = await supabaseAdmin
        .from('tickets')
        .update({ status: 'closed' })
        .eq('ticket_number', parseInt(ticketId));

      if (updateError) {
        return NextResponse.json({ error: "Failed to update ticket status" }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Ticket closed locally." });
    }

    const channelId = ticket.discord_channel_id;
    const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
    const transcriptsChannelId = process.env.DISCORD_TRANSCRIPTS_CHANNEL_ID?.trim();

    const closedByText = isBot && closedByName ? closedByName : (isBot ? "Bot" : (isAdmin ? "Staff" : "User"));
    const reasonText = reason ? `\n**Reason:** ${reason}` : "";
    
    // Send closing message
    await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: `🔒 **Ticket Closed by ${closedByText}.**${reasonText} Generating transcript and closing channel...`
      })
    });

    // 2. Fetch messages from Discord
    const msgsRes = await fetch(`${DISCORD_API}/channels/${channelId}/messages?limit=100`, {
      headers: { 'Authorization': `Bot ${botToken}` }
    });

    if (!msgsRes.ok) {
      const errTxt = await msgsRes.text();
      console.error("Discord msgs error:", errTxt);
      return NextResponse.json({ error: "Failed to fetch Discord messages" }, { status: 500 });
    }

    let messages = await msgsRes.json();
    messages = messages.reverse(); // oldest first

    // 3. Generate HTML Transcript
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Transcript - Ticket #${ticket.ticket_number || ticket.id.split('-')[0]}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #fff; margin: 0; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: #141414; border-radius: 12px; padding: 20px; border: 1px solid #333; }
    .header { border-bottom: 1px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { color: #10b981; margin: 0 0 10px 0; }
    .header p { color: #888; margin: 0; font-size: 14px; }
    .message { display: flex; gap: 15px; margin-bottom: 20px; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #333; }
    .msg-body { flex: 1; }
    .msg-header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 5px; }
    .author { font-weight: bold; color: #fff; }
    .timestamp { font-size: 12px; color: #666; }
    .content { color: #ddd; line-height: 1.5; white-space: pre-wrap; }
    .bot-tag { background: #5865F2; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; border: none; font-weight: bold; }
    .embed { border-left: 4px solid #5865F2; background: #202225; padding: 10px 15px; border-radius: 4px; margin-top: 8px; }
    .embed-title { font-weight: bold; margin-bottom: 5px; color: #fff; }
    .embed-desc { font-size: 13px; color: #dcddde; white-space: pre-wrap; }
    .embed-field { margin-top: 8px; }
    .embed-field-name { font-size: 12px; font-weight: bold; color: #fff; }
    .embed-field-value { font-size: 13px; color: #dcddde; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LarpSense Ticket Transcript</h1>
      <p>Ticket ID: ${ticket.id}</p>
      <p>Subject: ${ticket.issue_type.replace(/_/g, ' ')}</p>
      <p>Closed At: ${new Date().toUTCString()}</p>
    </div>
    <div class="messages">
`;

    for (const msg of messages) {
      const avatarUrl = msg.author.avatar 
        ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
        : "https://cdn.discordapp.com/embed/avatars/0.png";
      
      const date = new Date(msg.timestamp).toLocaleString();
      const botTag = msg.author.bot ? '<span class="bot-tag">BOT</span>' : '';

      let embedsHtml = '';
      if (msg.embeds && msg.embeds.length > 0) {
        for (const embed of msg.embeds) {
          embedsHtml += `<div class="embed">`;
          if (embed.title) embedsHtml += `<div class="embed-title">${embed.title}</div>`;
          if (embed.description) embedsHtml += `<div class="embed-desc">${embed.description}</div>`;
          if (embed.fields && embed.fields.length > 0) {
            for (const field of embed.fields) {
              embedsHtml += `<div class="embed-field">
                <div class="embed-field-name">${field.name}</div>
                <div class="embed-field-value">${field.value}</div>
              </div>`;
            }
          }
          embedsHtml += `</div>`;
        }
      }

      let attachmentsHtml = '';
      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          const type = att.content_type || '';
          if (type.startsWith('image/')) {
            attachmentsHtml += `<div style="margin-top: 10px;"><img src="${att.url}" style="max-width: 100%; max-height: 400px; border-radius: 8px;" alt="attachment" /></div>`;
          } else if (type.startsWith('video/')) {
            attachmentsHtml += `<div style="margin-top: 10px;"><video controls src="${att.url}" style="max-width: 100%; max-height: 400px; border-radius: 8px;"></video></div>`;
          } else if (type.startsWith('audio/')) {
            attachmentsHtml += `<div style="margin-top: 10px;"><audio controls src="${att.url}"></audio></div>`;
          } else {
            attachmentsHtml += `<div style="margin-top: 10px;"><a href="${att.url}" target="_blank" style="color: #5865F2;">Download ${att.filename || 'Attachment'}</a></div>`;
          }
        }
      }

      html += `
      <div class="message">
        <img src="${avatarUrl}" class="avatar" alt="avatar" />
        <div class="msg-body">
          <div class="msg-header">
            <span class="author">${msg.author.username} ${botTag}</span>
            <span class="timestamp">${date}</span>
          </div>
          <div class="content">${msg.content}</div>
          ${embedsHtml}
          ${attachmentsHtml}
        </div>
      </div>`;
    }

    html += `
    </div>
  </div>
</body>
</html>`;

    // 4. Upload to Supabase Storage to host the HTML (like Ticket Tool)
    // (Note: Images/Videos are NOT saved here, they are hotlinked from Discord, so this is just a 5KB text file)
    await supabaseAdmin.storage.createBucket('transcripts', { public: true }).catch(() => {});
    
    const fileName = `ticket-${ticket.id}-${Date.now()}.html`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('transcripts')
      .upload(fileName, html, {
        contentType: 'text/html; charset=utf-8',
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload transcript to storage" }, { status: 500 });
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const hostedUrl = `${protocol}://${host}/api/tickets/public-transcript?file=${fileName}`;

    // 5. Send Embed with Button to Discord
    if (transcriptsChannelId) {
      await fetch(`${DISCORD_API}/channels/${transcriptsChannelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embeds: [{
            title: `Transcript for Ticket #${ticket.ticket_number || ticket.id.split('-')[0]}`,
            description: `**Subject:** ${ticket.issue_type.replace(/_/g, ' ')}\n**Closed by:** ${closedByText}${reasonText}`,
            color: 0x10b981
          }],
          components: [{
            type: 1, // Action Row
            components: [{
              type: 2, // Button
              style: 5, // Link Button
              label: "Open Transcript",
              url: hostedUrl
            }]
          }]
        })
      });
    }

    // 6. Update DB (Close ticket and save transcript_url so client can view it)
    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        status: 'closed',
        transcript_url: hostedUrl
      })
      .eq('ticket_number', parseInt(ticketId));

    if (updateError) {
      return NextResponse.json({ error: "Failed to update ticket status" }, { status: 500 });
    }

    // 6. Delete Discord Channel
    await fetch(`${DISCORD_API}/channels/${channelId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bot ${botToken}` }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Close ticket API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
