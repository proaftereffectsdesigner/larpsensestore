import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!TOKEN || !CLIENT_ID || !supabaseUrl || !supabaseKey) {
  console.error("❌ Missing required environment variables in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds] 
});

const commands = [
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show store statistics for a user')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The user to check stats for (leave empty for yourself)')
        .setRequired(false))
];

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
  
  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands },
    );

    console.log('✅ Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error("❌ Error registering commands:", error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'stats') {
    const targetUser = interaction.options.getUser('target') || interaction.user;
    
    await interaction.deferReply(); // Show "bot is thinking..."

    try {
      // Find the user in our Supabase database by their discord_id
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('discord_id', targetUser.id);

      if (error) throw error;

      const profile = profiles?.[0];

      if (!profile) {
        return interaction.editReply(`❌ **${targetUser.username}** has not linked their Discord account to LarpSense Store yet.`);
      }

      // Fetch orders to compute stats
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', profile.id);

      let totalSpent = 0;
      let totalOrders = 0;
      if (orders && orders.length > 0) {
        totalOrders = orders.length;
        totalSpent = orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
      }

      const isElite = totalSpent > 50; // You can adjust this threshold
      
      const embed = new EmbedBuilder()
        .setColor(isElite ? 0x2ecc71 : 0x3498db) // Green for elite, Blue for normal
        .setTitle(`LarpSense Store Statistics`)
        .setAuthor({ 
          name: targetUser.username, 
          iconURL: targetUser.displayAvatarURL() 
        })
        .addFields(
          { name: '💶 Total Spent', value: `€${totalSpent.toFixed(2)}`, inline: true },
          { name: '📦 Total Orders', value: `${totalOrders}`, inline: true },
          { name: '👑 Rank', value: isElite ? 'Elite Buyer' : 'Verified Member', inline: false }
        )
        .setFooter({ text: 'Official LarpSense Store Integration' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ An error occurred while fetching statistics.");
    }
  }
});

client.login(TOKEN);
