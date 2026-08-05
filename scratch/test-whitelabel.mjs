import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const OXAPAY_MERCHANT_KEY = process.env.OXAPAY_MERCHANT_KEY;

async function testWhiteLabelV1() {
  console.log("Testing White Label API V1 with new key...");
  try {
    const res = await fetch("https://api.oxapay.com/v1/payment/white-label", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "merchant_api_key": OXAPAY_MERCHANT_KEY
      },
      body: JSON.stringify({
        amount: 5,
        currency: "EUR",
        payCurrency: "LTC",
        orderId: "test-order-123",
        lifeTime: 30
      })
    });
    console.log("Response V1:", await res.json());
  } catch(e) { console.error("Error", e); }
}

testWhiteLabelV1().catch(console.error);
