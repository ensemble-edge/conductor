/**
 * OpenAPI Route
 *
 * DEPRECATED: This file is now minimal.
 * All documentation routes (/docs, /openapi.json, /openapi.yaml) are now
 * provided by the standalone docs agent and docs-serve ensemble.
 *
 * This file is kept for backwards compatibility but registers no routes.
 * Projects should use the docs-serve ensemble from ensembles/system/docs/serve.yaml
 */
import { Hono } from 'hono';
declare const openapi: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default openapi;
//# sourceMappingURL=route.d.ts.map