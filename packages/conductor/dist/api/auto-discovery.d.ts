/**
 * Auto-Discovery API Wrapper
 *
 * Provides a simplified API that auto-discovers agents and ensembles
 * from the project directory using Vite plugins.
 *
 * This is the recommended way to use Conductor for most projects.
 */
import type { ConductorEnv } from '../types/env.js';
import { type APIConfig } from './app.js';
import { AgentLoader } from '../utils/loader.js';
import { EnsembleLoader } from '../utils/ensemble-loader.js';
import { type CloudEnv } from '../cloud/index.js';
export interface AutoDiscoveryAPIConfig extends APIConfig {
    /**
     * Enable auto-discovery of agents and ensembles
     * @default true
     */
    autoDiscover?: boolean;
    /**
     * Virtual agents module (injected by Vite plugin)
     * If not provided, auto-discovery will be skipped
     */
    agents?: Array<{
        name: string;
        config: string;
        handler?: () => Promise<any>;
    }>;
    /**
     * Virtual ensembles module (injected by Vite plugin)
     * If not provided, auto-discovery will be skipped
     */
    ensembles?: Array<{
        name: string;
        config: string;
    }>;
    /**
     * Virtual docs module (injected by Vite plugin)
     * If not provided, docs pages will not be available
     */
    docs?: Array<{
        name: string;
        content: string;
    }>;
    /**
     * Configure custom error pages using ensembles
     * Maps HTTP error codes to ensemble names
     *
     * @example
     * ```typescript
     * errorPages: {
     *   404: 'error-404',      // Default 404 page
     *   401: 'error-401',      // Authentication error
     *   403: 'error-403',      // Authorization error
     *   500: 'smart-500',      // AI-powered 500 page with logging
     * }
     * ```
     */
    errorPages?: {
        [statusCode: number]: string;
    };
}
/**
 * Create Conductor API with auto-discovery support
 *
 * This is the recommended way to create a Conductor API for most projects.
 * It automatically discovers and registers agents and ensembles from your
 * project directory.
 *
 * @example
 * ```typescript
 * // src/index.ts
 * import { createConductorAPI } from '@ensemble-edge/conductor/api';
 * import { agents } from 'virtual:conductor-agents';
 * import { ensembles } from 'virtual:conductor-ensembles';
 *
 * export default createConductorAPI({
 *   autoDiscover: true,
 *   agents,
 *   ensembles,
 *   auth: {
 *     allowAnonymous: true,
 *   },
 *   logging: true,
 * });
 * ```
 */
export declare function createAutoDiscoveryAPI(config?: AutoDiscoveryAPIConfig): {
    fetch(request: Request, env: ConductorEnv & CloudEnv, ctx: ExecutionContext): Promise<Response>;
    scheduled(event: ScheduledEvent, env: ConductorEnv, ctx: ExecutionContext): Promise<void>;
};
/**
 * Get the initialized MemberLoader instance
 * Returns null if not yet initialized
 */
export declare function getMemberLoader(): AgentLoader | null;
/**
 * Get the initialized EnsembleLoader instance
 * Returns null if not yet initialized
 */
export declare function getEnsembleLoader(): EnsembleLoader | null;
//# sourceMappingURL=auto-discovery.d.ts.map