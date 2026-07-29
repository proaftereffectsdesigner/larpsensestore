require('dotenv').config({ path: '.env.local' });
const botToken = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;
const categoryId = process.env.DISCORD_TICKETS_CATEGORY_ID;

(async () => {
  const ticketName = `ticket-4`;
  const permissionOverwrites = [
    {
      id: guildId, // @everyone role
      type: 0,
      deny: (1 << 10).toString(), // View Channel
    }
  ];
  console.log("Token:", botToken);
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
  console.log(channelRes.status);
  console.log(await channelRes.text());
})();
