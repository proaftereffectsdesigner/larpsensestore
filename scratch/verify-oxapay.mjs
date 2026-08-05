import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const TRACK_ID = "134931291";
const OXAPAY_MERCHANT_KEY = process.env.OXAPAY_MERCHANT_KEY;

async function check() {
  console.log("Checking trackId:", TRACK_ID);
  const verifyRes = await fetch("https://api.oxapay.com/merchants/inquiry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ merchant: OXAPAY_MERCHANT_KEY, trackId: TRACK_ID })
  });
  const data = await verifyRes.json();
  console.log("Response from OxaPay Merchant API:", JSON.stringify(data, null, 2));
}

check();
