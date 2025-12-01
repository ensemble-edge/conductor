/**
 * API Routes - Exports
 *
 * Note: docs routes have been removed from the core package.
 * Documentation is now provided by the standalone docs agent/ensemble:
 * - ensembles/system/docs/serve.yaml
 * - agents/system/docs/docs.ts
 */
export { default as execute } from './execute.js';
export { default as agents } from './agents.js';
export { default as ensembles } from './ensembles.js';
export { default as health } from './health.js';
export { default as stream } from './stream.js';
export { default as async } from './async.js';
export { default as webhooks } from './webhooks.js';
export { default as executions } from './executions.js';
export { default as schedules } from './schedules.js';
export { default as mcp } from './mcp.js';
export { default as email } from './email.js';
export { default as callbacks } from './callbacks.js';
