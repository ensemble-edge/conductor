/**
 * Rate limiting utilities for form submissions
 */
import type { RateLimitConfig } from '../types/index.js';
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    reset: number;
    limit: number;
}
/**
 * Check rate limit for form submission
 */
export declare function checkRateLimit(identifier: string, config: RateLimitConfig, kv: KVNamespace | undefined): Promise<RateLimitResult>;
/**
 * Get rate limit status without incrementing
 */
export declare function getRateLimitStatus(identifier: string, config: RateLimitConfig, kv: KVNamespace | undefined): Promise<RateLimitResult>;
/**
 * Reset rate limit for an identifier
 */
export declare function resetRateLimit(identifier: string, kv: KVNamespace | undefined): Promise<void>;
//# sourceMappingURL=rate-limit.d.ts.map