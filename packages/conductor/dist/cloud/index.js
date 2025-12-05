/**
 * Ensemble Cloud Module
 *
 * Provides /cloud/* endpoints for Ensemble Cloud integration.
 *
 * Architecture:
 * - Cloud reads project state via /cloud endpoints
 * - Changes are pushed through GitHub (not direct API writes)
 * - Each environment gets its own cloud key
 *
 * Endpoints:
 * - GET /cloud/health - Connection health check
 * - GET /cloud/structure - Project shape (agents, ensembles, components)
 * - GET /cloud/executions - Execution history
 * - GET /cloud/logs - Runtime logs
 * - POST /cloud/sync - Trigger refresh
 */
export { handleCloudRequest, isCloudRequest } from './handler.js';
