const fs = require('fs');

async function test() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const key = env.match(/OXAPAY_MERCHANT_KEY=(.*?)\r?\n/)[1].trim().replace(/\"/g, '');

  try {
    const createRes = await fetch("https://api.oxapay.com/v1/payment/white-label", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "merchant_api_key": key
      },
      body: JSON.stringify({
        amount: 1.0,
        currency: "EUR",
        order_id: "test-123",
        lifeTime: 60,
        pay_currency: "LTC",
        network: "litecoin"
      })
    });
    console.log("Create:", await createRes.json());
  } catch (e) { console.error(e.message) }
}
test();
