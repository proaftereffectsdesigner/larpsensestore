

const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const url = `https://discord.com/api/v10/applications/${DISCORD_CLIENT_ID}/role-connections/metadata`;

const body = [
  {
    key: 'total_spent',
    name: 'Total Spent',
    description: 'Total amount spent in euros',
    type: 2, // INTEGER_GREATER_THAN_OR_EQUAL
  },
  {
    key: 'orders_count',
    name: 'Total Orders',
    description: 'Number of completed orders',
    type: 2, // INTEGER_GREATER_THAN_OR_EQUAL
  },
  {
    key: 'is_elite',
    name: 'Elite Spender',
    description: 'Has spent more than €100',
    type: 7, // BOOLEAN_EQUAL
  }
];

async function registerSchema() {
  console.log("Registering Discord Linked Roles schema...");
  try {
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Schema successfully registered!', data);
    } else {
      const error = await response.text();
      console.error('Failed to register schema:', error);
    }
  } catch (err) {
    console.error(err);
  }
}

registerSchema();
