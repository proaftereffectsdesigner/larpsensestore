import { NextResponse } from "next/server";
import { requireAdmin } from '@/lib/auth';

const DISCORD_API = "https://discord.com/api/v10";

export async function POST(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;
    const { supabaseAdmin } = authResult;

    const { ticketId } = await req.json();
    if (!ticketId) {
      return NextResponse.json({ error: "Missing ticketId" }, { status: 400 });
    }

    // 1. Fetch ticket details
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (!ticket.discord_channel_id) {
      return NextResponse.json({ error: "Ticket has no associated Discord channel" }, { status: 400 });
    }

    const channelId = ticket.discord_channel_id;
    const botToken = process.env.DISCORD_BOT_TOKEN;

    // Send closing message
    await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: "🔒 **Ticket Closed by Staff.** Generating transcript and closing channel..."
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

      html += `
      <div class="message">
        <img src="${avatarUrl}" class="avatar" alt="avatar" />
        <div class="msg-body">
          <div class="msg-header">
            <span class="author">${msg.author.username} ${botTag}</span>
            <span class="timestamp">${date}</span>
          </div>
          <div class="content">${msg.content}</div>
        </div>
      </div>`;
    }

    html += `
    </div>
  </div>
</body>
</html>`;

    // 4. Make sure bucket exists (ignore error if it does)
    await supabaseAdmin.storage.createBucket('transcripts', { public: true });

    // 5. Upload to Supabase Storage
    const fileName = `ticket-${ticket.id}-${Date.now()}.html`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('transcripts')
      .upload(fileName, html, {
        contentType: 'text/html',
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload transcript" }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('transcripts')
      .getPublicUrl(fileName);

    const transcriptUrl = publicUrlData.publicUrl;

    // 6. Update DB
    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        status: 'closed',
        transcript_url: transcriptUrl
      })
      .eq('id', ticketId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update ticket status" }, { status: 500 });
    }

    // 7. Delete Discord Channel
    await fetch(`${DISCORD_API}/channels/${channelId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bot ${botToken}` }
    });

    return NextResponse.json({ success: true, transcript_url: transcriptUrl });

  } catch (error: any) {
    console.error("Close ticket API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
