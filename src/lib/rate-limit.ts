/**
 * Simple in-memory rate limiter reusable across API routes.
 * Resets automatically after `windowMs` milliseconds.
 * Works per-IP (or any string key you provide).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function rateLimit(
  key: string,
  options: { maxRequests: number; windowMs: number }
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // Start fresh window
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.maxRequests - 1, resetInSeconds: Math.ceil(options.windowMs / 1000) };
  }

  if (entry.count >= options.maxRequests) {
    const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  entry.count++;
  return { allowed: true, remaining: options.maxRequests - entry.count, resetInSeconds: Math.ceil((entry.resetAt - now) / 1000) };
}

/** Get client IP from request headers (works behind Vercel/Cloudflare proxies) */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
