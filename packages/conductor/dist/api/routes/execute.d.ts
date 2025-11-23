/**
 * Execute Routes
 *
 * Endpoints for executing agents and ensembles synchronously.
 */
import { Hono } from 'hono';
declare const execute: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default execute;
//# sourceMappingURL=execute.d.ts.map