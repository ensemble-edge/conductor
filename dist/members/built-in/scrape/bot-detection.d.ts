/**
 * Bot Protection Detection
 *
 * Detects common bot protection mechanisms like Cloudflare, Captcha, etc.
 */
import type { BotProtectionResult } from './types.js';
/**
 * Detect if content contains bot protection
 */
export declare function detectBotProtection(content: string): BotProtectionResult;
/**
 * Check if content is successful (no bot protection, sufficient length)
 */
export declare function isContentSuccessful(content: string): boolean;
//# sourceMappingURL=bot-detection.d.ts.map