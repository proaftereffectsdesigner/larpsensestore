const fs = require('fs');

async function test() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const key = env.match(/OXAPAY_MERCHANT_KEY=(.*?)\r?\n/)[1].trim().replace(/\"/g, '');

  try {
    const res = await fetch("https://api.oxapay.com/merchants/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant: key, size: 5 })
    });
    console.log(JSON.stringify(await res.json(), null, 2));
  } catch (e) { console.error(e.message) }
}
test();
