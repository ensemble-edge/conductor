/**
 * Callbacks Routes
 *
 * Handles callback URLs for workflow resumption (HITL, async continuations).
 * These endpoints use token-based authentication (the token IS the auth).
 *
 * Simplified design (mounted at configurable base path, default "/callback"):
 * - POST /callback/:token - Resume with body data { approved: true/false, ... }
 * - GET  /callback/:token - Get token metadata
 *
 * Configure base path via APIConfig.hitl.resumeBasePath
 *
 * @see https://docs.ensemble.ai/conductor/agents/hitl
 */
import { Hono } from 'hono';
declare const app: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=callbacks.d.ts.map