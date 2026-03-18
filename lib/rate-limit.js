// lib/rate-limit.js
// ============================================================================
// SIMPLE IN-MEMORY RATE LIMITER FOR API ROUTES
// ============================================================================

const rateLimitStore = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > entry.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Create a rate limiter with configurable window and max requests.
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000)
 * @param {number} options.max - Max requests per window (default: 10)
 * @returns {function} - Rate limit checker that takes a key and returns { limited, remaining }
 */
export function createRateLimit({ windowMs = 60 * 1000, max = 10 } = {}) {
  return function checkRateLimit(key) {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      rateLimitStore.set(key, { windowStart: now, count: 1, windowMs });
      return { limited: false, remaining: max - 1 };
    }

    entry.count++;

    if (entry.count > max) {
      return { limited: true, remaining: 0 };
    }

    return { limited: false, remaining: max - entry.count };
  };
}

// Pre-configured rate limiters for common use cases
export const checkoutRateLimit = createRateLimit({ windowMs: 60 * 1000, max: 5 });
export const loginRateLimit = createRateLimit({ windowMs: 60 * 1000, max: 5 });
export const apiRateLimit = createRateLimit({ windowMs: 60 * 1000, max: 30 });
