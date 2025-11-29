/**
 * Health Routes
 *
 * Health check and status endpoints.
 */
import { Hono } from 'hono';
import type { ConductorEnv } from '../../types/env.js';
declare const health: Hono<{
    Bindings: ConductorEnv;
}, import("hono/types").BlankSchema, "/">;
export default health;
//# sourceMappingURL=health.d.ts.map