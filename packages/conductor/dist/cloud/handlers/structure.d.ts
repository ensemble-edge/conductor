/**
 * Cloud Structure Endpoint
 *
 * GET /cloud/structure
 *
 * Returns the project structure (agents, ensembles, components).
 * This provides Cloud with a view of the deployed project shape.
 */
import type { CloudEnv } from '../types.js';
/**
 * Handle structure request
 *
 * Returns the project shape including agents, ensembles, and edgit-managed components.
 * This is used by Ensemble Cloud to understand what's deployed.
 */
export declare function handleStructure(_request: Request, env: CloudEnv): Promise<Response>;
//# sourceMappingURL=structure.d.ts.map