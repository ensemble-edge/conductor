/**
 * Ensembles Routes
 *
 * Endpoints for listing and discovering ensembles.
 */
import { Hono } from 'hono';
declare const ensembles: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default ensembles;
//# sourceMappingURL=ensembles.d.ts.map