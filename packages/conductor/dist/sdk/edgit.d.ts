/**
 * SDK Edgit Integration
 *
 * Helpers for loading components from Edgit
 */
import { type AgentConfig } from '../runtime/parser.js';
/**
 * Load a component from Edgit (prompts, queries, templates, etc.)
 *
 * @example
 * ```typescript
 * const prompt = await loadComponent('extraction-prompt@v1.0.0', env);
 * ```
 */
export declare function loadComponent(componentRef: string, env: Env): Promise<string>;
/**
 * Load a agent configuration from Edgit
 *
 * This loads versioned agent.yaml files, enabling configuration-only deployments
 * and A/B testing without code changes.
 *
 * @example
 * ```typescript
 * // Load specific version
 * const config = await loadMemberConfig('analyze-company@v1.0.0', env);
 *
 * // Load production deployment
 * const config = await loadMemberConfig('analyze-company@production', env);
 * ```
 */
export declare function loadMemberConfig(memberRef: string, env: Env): Promise<AgentConfig>;
/**
 * Load component metadata
 */
export declare function loadComponentMetadata(componentRef: string, env: Env): Promise<{
    name: string;
    version: string;
    type: string;
    tags: string[];
    deployments: Record<string, string>;
}>;
/**
 * List available component versions
 */
export declare function listComponentVersions(componentName: string, env: Env): Promise<string[]>;
/**
 * Get component deployment
 */
export declare function getComponentDeployment(componentName: string, deployment: string, env: Env): Promise<string>;
//# sourceMappingURL=edgit.d.ts.map