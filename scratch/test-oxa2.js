const fs = require('fs');

async function test() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const key = env.match(/OXAPAY_MERCHANT_KEY=(.*?)\r?\n/)[1].trim().replace(/\"/g, '');

  console.log("Key:", key.substring(0, 5) + "...");

  // Test 4: v1/payment/inquiry with merchant_api_key in headers
  try {
    const res4 = await fetch("https://api.oxapay.com/v1/payment/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json", "merchant_api_key": key },
      body: JSON.stringify({ trackId: 9984920 })
    });
    console.log("Test 4 (v1/payment/inquiry headers):", await res4.json());
  } catch (e) { console.error(e.message) }
}
test();
