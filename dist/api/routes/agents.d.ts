/**
 * Members Routes
 *
 * Endpoints for listing and discovering agents.
 */
import { Hono } from 'hono';
declare const agents: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default agents;
//# sourceMappingURL=agents.d.ts.map