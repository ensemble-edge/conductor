/**
 * Webhook Routes
 *
 * Lists registered webhook endpoints from ensemble configurations.
 *
 * Note: User-defined webhook triggers (e.g., /webhooks/github) are registered
 * dynamically via the trigger system in built-in-triggers.ts. Users can define
 * any path they want for their webhooks - we recommend /webhooks/* for clarity.
 *
 * DEPRECATED: The legacy /webhooks/:ensembleName endpoint has been removed.
 * Use trigger configuration in ensemble YAML instead.
 *
 * For workflow resumption (HITL), use /callbacks/resume/:token
 *
 * @see https://docs.ensemble.ai/api/http/webhooks
 * @see https://docs.ensemble.ai/conductor/agents/hitl
 */
import { Hono } from 'hono';
declare const app: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=webhooks.d.ts.map