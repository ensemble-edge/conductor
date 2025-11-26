/**
 * Execute Routes
 *
 * Endpoints for executing agents and ensembles synchronously.
 *
 * Route structure:
 * - POST /ensemble/:name - Execute ensemble by name (URL-based, preferred)
 * - POST /agent/:name - Execute agent by name (URL-based, if allowed)
 * - POST / - Execute by body { agent: "name" } or { ensemble: "name" } (legacy)
 * - POST /:name - Execute ensemble by name (legacy, for backward compat)
 */
import { Hono } from 'hono';
declare const execute: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default execute;
//# sourceMappingURL=execute.d.ts.map