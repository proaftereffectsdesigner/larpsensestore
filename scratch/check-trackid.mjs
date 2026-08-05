import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const TRACK_ID = 147577233; // From discord screenshot
const OXAPAY_MERCHANT_KEY = process.env.OXAPAY_MERCHANT_KEY;

async function check() {
  console.log("Checking trackId:", TRACK_ID);
  const verRes = await fetch("https://api.oxapay.com/merchants/inquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant: OXAPAY_MERCHANT_KEY,
      trackId: TRACK_ID
    })
  });
  const data = await verRes.json();
  console.log("OxaPay Inquiry Result:", JSON.stringify(data, null, 2));
}

check().catch(console.error);
