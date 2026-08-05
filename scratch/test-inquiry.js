const fs = require('fs');
async function run() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const key = env.match(/OXAPAY_MERCHANT_KEY=(.*?)\r?\n/)[1].trim().replace(/\"/g, '');
  const res = await fetch('https://api.oxapay.com/merchants/inquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant: key, trackId: '152785793' })
  });
  console.log(await res.json());
}
run();
