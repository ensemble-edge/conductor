/**
 * Members Routes
 *
 * Endpoints for listing and discovering members.
 */
import { Hono } from 'hono';
declare const members: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default members;
//# sourceMappingURL=members.d.ts.map