/**
 * NFA Reseller API — shared helper for buying CS2 accounts.
 * Docs: https://www.nfa.pub/docs/cs2
 *
 * Response: { ok: true, accounts: ["login:password:..."], charged_eur: 0.45 }
 */

const NFA_BASE = "https://www.nfa.pub/api/v1";

export interface NfaBuyResult {
  ok: boolean;
  accounts: string[];
  charged_eur: number;
}

/**
 * Buy CS2 accounts from NFA API.
 * @param type    Product type — must match NFA type exactly (prime, premier, premier-15k, etc.)
 * @param quantity How many accounts to buy (1–100)
 * @param idempotencyKey Unique key to prevent double-charges on webhook retries
 */
export async function buyNfaAccounts(
  type: string,
  quantity: number,
  idempotencyKey: string
): Promise<NfaBuyResult> {
  const apiKey = process.env.NFA_API_KEY;
  if (!apiKey) throw new Error("NFA_API_KEY is not set");

  const url = `${NFA_BASE}/cs2?type=${encodeURIComponent(type)}&quantity=${quantity}&result=json`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      // Idempotency-Key prevents double charges if the webhook fires twice
      "Idempotency-Key": idempotencyKey,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NFA API error ${res.status}: ${text}`);
  }

  const data = await res.json();

  if (!data.ok) {
    throw new Error(`NFA API returned ok=false: ${JSON.stringify(data)}`);
  }

  return {
    ok: data.ok,
    accounts: Array.isArray(data.accounts) ? data.accounts : [],
    charged_eur: Number(data.charged_eur ?? 0),
  };
}
