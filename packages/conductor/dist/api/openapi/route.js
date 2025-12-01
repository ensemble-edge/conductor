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
const openapi = new Hono();
// No routes registered - docs are now handled by the docs-serve ensemble
// See: ensembles/system/docs/serve.yaml and agents/system/docs/docs.ts
export default openapi;
