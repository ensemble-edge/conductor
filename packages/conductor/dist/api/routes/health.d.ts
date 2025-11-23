/**
 * Health Routes
 *
 * Health check and status endpoints.
 */
import { Hono } from 'hono';
declare const health: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default health;
//# sourceMappingURL=health.d.ts.map