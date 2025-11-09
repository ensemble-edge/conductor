/**
 * CSRF token utilities for form security
 */
import type { CsrfConfig } from '../types/index.js';
/**
 * Generate a CSRF token
 */
export declare function generateCsrfToken(config: CsrfConfig, env: {
    [key: string]: unknown;
}): Promise<string>;
/**
 * Validate a CSRF token
 */
export declare function validateCsrfToken(token: string, config: CsrfConfig, env: {
    [key: string]: unknown;
}): Promise<boolean>;
//# sourceMappingURL=csrf.d.ts.map