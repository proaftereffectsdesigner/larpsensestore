// SERVER-ONLY: Wholesale purchase costs for internal admin calculations (profit margin, analytics)
// WARNING: NEVER import this file into any client component or expose via public API response!

export const PRODUCT_COSTS: Record<string, number> = {
  // CS2 Products
  "prime": 0.40,
  "premier": 0.50,
  "premier-4-medals": 0.80,
  "premier-10-medals": 1.00,
  "premier-inactive": 0.90,
  "premier-10k": 1.10,
  "premier-15k": 1.50,
  "premier-20k": 2.50,
  "premier-rare": 2.80,

  // Rust Products
  "rust-1-99": 0.90,
  "rust-100-199": 1.00,
  "rust-200-499": 1.10,
  "rust-500-999": 1.25,
  "rust-1000-plus": 1.50,

  // Extra Products
  "r6": 0.70,
  "dayz": 0.70,
  "bf6": 0.70,
  "apex": 0.70,
};

/**
 * Returns wholesale cost in EUR for internal admin analytics.
 * Returns 0 if product ID is unknown.
 */
export function getProductCost(productId: string): number {
  if (!productId) return 0;
  return PRODUCT_COSTS[productId] ?? 0;
}
