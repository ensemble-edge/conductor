/**
 * Email Handler Routes
 *
 * Handle incoming emails via Cloudflare Email Routing to trigger ensembles.
 *
 * Setup in wrangler.toml:
 * [[email_handlers]]
 * destination = "https://your-worker.workers.dev/email"
 */
import { Hono } from 'hono';
import type { ConductorEnv } from '../../types/env.js';
declare const app: Hono<{
    Bindings: ConductorEnv;
}, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=email.d.ts.map