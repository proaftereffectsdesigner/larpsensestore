async function makeLiveInvoice() {
  const res = await fetch("https://www.larpsensestore.com/api/create-oxapay-invoice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: "test-uuid-from-e2e",
      productId: "prime",
      amount: 1,
      price: 0.69
    })
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Invoice data:", data);
}
makeLiveInvoice();
