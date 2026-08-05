async function run() {
  const res = await fetch("https://www.larpsensestore.com/api/webhook/oxapay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trackId: "123771713",
      status: "Paid"
    })
  });
  console.log("Status:", res.status);
  console.log("Text:", await res.text());
}
run();
