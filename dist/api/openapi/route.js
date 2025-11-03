/**
 * OpenAPI Route
 *
 * Serves the OpenAPI specification in JSON and YAML formats.
 */
import { Hono } from 'hono';
import { openAPISpec } from './spec';
import { stringify as yamlStringify } from 'yaml';
const openapi = new Hono();
/**
 * GET /openapi.json - Get OpenAPI spec as JSON
 */
openapi.get('/openapi.json', (c) => {
    return c.json(openAPISpec);
});
/**
 * GET /openapi.yaml - Get OpenAPI spec as YAML
 */
openapi.get('/openapi.yaml', (c) => {
    const yaml = yamlStringify(openAPISpec);
    return c.text(yaml, 200, {
        'Content-Type': 'application/x-yaml',
    });
});
/**
 * GET /docs - Redirect to API documentation
 */
openapi.get('/docs', (c) => {
    // In production, this would redirect to Swagger UI or similar
    return c.json({
        message: 'API documentation',
        openapi: '/openapi.json',
        yaml: '/openapi.yaml',
    });
});
export default openapi;
