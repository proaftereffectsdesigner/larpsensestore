const fs = require('fs');

async function test() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const key = env.match(/OXAPAY_MERCHANT_KEY=(.*?)\r?\n/)[1].trim().replace(/\"/g, '');

  console.log("Key:", key.substring(0, 5) + "...");

  // Test 1: v1/payment/inquiry (the one in check-oxapay-tx)
  try {
    const res1 = await fetch("https://api.oxapay.com/v1/payment/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant: key, trackId: 9984920 })
    });
    console.log("Test 1 (v1/payment/inquiry body):", await res1.json());
  } catch (e) { console.error(e.message) }

  // Test 2: merchants/inquiry with body
  try {
    const res2 = await fetch("https://api.oxapay.com/merchants/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant: key, trackId: 9984920 })
    });
    console.log("Test 2 (merchants/inquiry body):", await res2.json());
  } catch (e) { console.error(e.message) }

  // Test 3: merchants/inquiry with headers
  try {
    const res3 = await fetch("https://api.oxapay.com/merchants/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json", "merchant_api_key": key },
      body: JSON.stringify({ trackId: 9984920 })
    });
    console.log("Test 3 (merchants/inquiry headers):", await res3.json());
  } catch (e) { console.error(e.message) }
}
test();
