/**
 * OpenAPI Route
 *
 * Serves the OpenAPI specification in JSON and YAML formats.
 */
import { Hono } from 'hono';
declare const openapi: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default openapi;
//# sourceMappingURL=route.d.ts.map