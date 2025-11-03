/**
 * Webhook Routes
 *
 * Handles incoming webhooks to trigger ensemble execution.
 */
import { Hono } from 'hono';
declare const app: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=webhooks.d.ts.map