/**
 * Error handling utilities for Pages
 */
import type { Hono } from 'hono';
import type { PageAgent } from '../agents/page/page-agent.js';
/**
 * Register 404 handler with custom page
 */
export declare function register404Handler(app: Hono, notFoundPage?: PageAgent): void;
/**
 * Register 500 handler with custom page
 */
export declare function register500Handler(app: Hono, errorPage?: PageAgent): void;
//# sourceMappingURL=error-handling.d.ts.map