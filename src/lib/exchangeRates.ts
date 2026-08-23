let cachedRates: Record<string, number> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function getExchangeRates(): Promise<Record<string, number>> {
  if (cachedRates && (Date.now() - lastFetchTime < CACHE_DURATION)) {
    return cachedRates;
  }

  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/EUR");
    if (!res.ok) throw new Error("Failed to fetch rates");
    const data = await res.json();
    cachedRates = data.rates;
    lastFetchTime = Date.now();
    return cachedRates!;
  } catch (error) {
    console.error("Error fetching rates:", error);
    // Fallback rates if API fails
    const fallbackRates = { EUR: 1, PLN: 4.3, USD: 1.1, GBP: 0.85, CHF: 0.95, SEK: 11.5, NOK: 11.5, CAD: 1.45, AUD: 1.65 };
    return fallbackRates;
  }
}

export async function convertToCurrency(amountInEur: number, targetCurrency: string): Promise<number> {
  const target = targetCurrency?.toUpperCase() || "EUR";
  if (target === "EUR") return amountInEur;
  
  const rates = await getExchangeRates();
  const rate = rates[target] || 1;
  return amountInEur * rate;
}
