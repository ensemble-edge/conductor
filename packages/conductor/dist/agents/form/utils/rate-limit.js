/**
 * Rate limiting utilities for form submissions
 */
/**
 * Check rate limit for form submission
 */
export async function checkRateLimit(identifier, config, kv) {
    if (!kv) {
        // No KV available, allow request (rate limiting disabled)
        return {
            allowed: true,
            remaining: config.max,
            reset: Date.now() + config.window * 1000,
            limit: config.max,
        };
    }
    const key = `rate-limit:${identifier}`;
    const now = Date.now();
    const windowMs = config.window * 1000;
    // Get current rate limit data
    const stored = await kv.get(key, 'json');
    let data;
    if (stored) {
        data = stored;
        // Check if window has expired
        if (now > data.resetAt) {
            // Reset window
            data = {
                count: 0,
                resetAt: now + windowMs,
            };
        }
    }
    else {
        // First request in window
        data = {
            count: 0,
            resetAt: now + windowMs,
        };
    }
    // Check if limit exceeded
    if (data.count >= config.max) {
        return {
            allowed: false,
            remaining: 0,
            reset: data.resetAt,
            limit: config.max,
        };
    }
    // Increment count
    data.count++;
    // Store updated data
    const ttl = Math.ceil((data.resetAt - now) / 1000);
    await kv.put(key, JSON.stringify(data), {
        expirationTtl: ttl,
    });
    return {
        allowed: true,
        remaining: config.max - data.count,
        reset: data.resetAt,
        limit: config.max,
    };
}
/**
 * Get rate limit status without incrementing
 */
export async function getRateLimitStatus(identifier, config, kv) {
    if (!kv) {
        return {
            allowed: true,
            remaining: config.max,
            reset: Date.now() + config.window * 1000,
            limit: config.max,
        };
    }
    const key = `rate-limit:${identifier}`;
    const now = Date.now();
    const windowMs = config.window * 1000;
    const stored = await kv.get(key, 'json');
    if (!stored) {
        return {
            allowed: true,
            remaining: config.max,
            reset: now + windowMs,
            limit: config.max,
        };
    }
    const data = stored;
    // Check if window has expired
    if (now > data.resetAt) {
        return {
            allowed: true,
            remaining: config.max,
            reset: now + windowMs,
            limit: config.max,
        };
    }
    return {
        allowed: data.count < config.max,
        remaining: Math.max(0, config.max - data.count),
        reset: data.resetAt,
        limit: config.max,
    };
}
/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(identifier, kv) {
    if (!kv) {
        return;
    }
    const key = `rate-limit:${identifier}`;
    await kv.delete(key);
}
