/**
 * SDK Edgit Integration
 *
 * Helpers for loading versioned components from Cloudflare KV.
 * Components are stored in KV by Edgit's sync process, which reads
 * Git tags and pushes component content to KV.
 *
 * KV Key Format (type-specific namespaces):
 * - Prompts: `prompts/{name}/{version}`
 * - Schemas: `schemas/{name}/{version}`
 * - Templates: `templates/{name}/{version}`
 * - Agents: `agents/{name}/{version}`
 * - Queries: `queries/{name}/{version}`
 * - Configs: `configs/{name}/{version}`
 * - Scripts: `scripts/{name}/{version}`
 * - Ensembles: `ensembles/{name}/{version}`
 * - Tools: `tools/{name}/{version}`
 * - Legacy: `components/{name}/{version}` (backwards compatibility)
 *
 * Metadata Format (stored as KV metadata):
 * - sha: Git commit SHA
 * - date: Tag creation date
 * - author: Tag author
 * - type: Component type (prompt, schema, template, etc.)
 */
import { type AgentConfig } from '../runtime/parser.js';
import type { ConductorEnv } from '../types/env.js';
/**
 * Component types that can be stored in KV
 * Aligned with Edgit's EntityType for seamless integration
 */
export type ComponentType = 'agent' | 'prompt' | 'schema' | 'template' | 'query' | 'config' | 'script' | 'ensemble' | 'tool' | 'component';
/**
 * Component metadata stored in KV
 */
export interface ComponentMetadata {
    /** Git commit SHA this component was built from */
    sha: string;
    /** Tag creation date (ISO format) */
    date: string;
    /** Tag author */
    author?: string;
    /** Component type (prompt, schema, template, etc.) */
    type?: string;
}
/**
 * Full component with content and metadata
 */
export interface ComponentWithMetadata {
    /** Component content (YAML, prompt text, JSON string, etc.) */
    content: string;
    /** Metadata from KV */
    metadata: ComponentMetadata | null;
}
/**
 * Load a component from KV storage (prompts, queries, templates, etc.)
 *
 * Components are stored by Edgit's sync process which reads Git tags
 * and pushes content to Cloudflare KV.
 *
 * @param componentRef - Component reference in format: name@version (e.g., 'extraction-prompt@v1.0.0')
 * @param env - Conductor environment with KV bindings
 * @param componentType - Component type for namespace lookup (defaults to 'prompt' for backwards compatibility)
 *
 * @example
 * ```typescript
 * // Load specific version
 * const prompt = await loadComponent('extraction-prompt@v1.0.0', env, 'prompt');
 *
 * // Load production deployment
 * const prompt = await loadComponent('extraction-prompt@prod', env, 'prompt');
 *
 * // Load a schema
 * const schema = await loadComponent('user-schema@v1.0.0', env, 'schema');
 * ```
 */
export declare function loadComponent(componentRef: string, env: ConductorEnv, componentType?: ComponentType): Promise<string>;
/**
 * Load component with metadata
 *
 * @param componentRef - Component reference in format: name@version
 * @param env - Conductor environment with KV bindings
 * @param componentType - Component type for namespace lookup (defaults to 'prompt')
 *
 * @example
 * ```typescript
 * const { content, metadata } = await loadComponentWithMetadata('my-prompt@v1.0.0', env, 'prompt');
 * console.log(`Loaded from commit ${metadata?.sha}`);
 * ```
 */
export declare function loadComponentWithMetadata(componentRef: string, env: ConductorEnv, componentType?: ComponentType): Promise<ComponentWithMetadata>;
/**
 * Load an agent configuration from KV storage
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
export declare function loadMemberConfig(memberRef: string, env: ConductorEnv): Promise<AgentConfig>;
/**
 * Load component metadata without content
 *
 * Useful for checking component info without loading full content.
 *
 * @param componentRef - Component reference in format: name@version
 * @param env - Conductor environment with KV bindings
 * @param componentType - Component type for namespace lookup (defaults to 'prompt')
 */
export declare function loadComponentMetadata(componentRef: string, env: ConductorEnv, componentType?: ComponentType): Promise<{
    name: string;
    version: string;
    type: string | undefined;
    metadata: ComponentMetadata | null;
}>;
/**
 * List available component versions from KV
 *
 * @param componentName - Component name to list versions for
 * @param env - Conductor environment with KV bindings
 * @param componentType - Component type for namespace lookup (defaults to 'prompt')
 *
 * Note: This requires the Edgit sync process to store a versions index.
 * Format: `{namespace}/{name}/_versions` containing JSON array of versions.
 */
export declare function listComponentVersions(componentName: string, env: ConductorEnv, componentType?: ComponentType): Promise<string[]>;
/**
 * Get component deployment (resolve deployment tag to actual version)
 *
 * Deployments like 'prod', 'staging' are mutable tags that point to specific versions.
 * This resolves the deployment to the actual version it points to.
 *
 * @param componentName - Component name
 * @param deployment - Deployment tag (prod, staging, etc.)
 * @param env - Conductor environment with KV bindings
 * @param componentType - Component type for namespace lookup (defaults to 'prompt')
 *
 * @example
 * ```typescript
 * // Find out what version 'prod' points to
 * const version = await getComponentDeployment('my-prompt', 'prod', env, 'prompt');
 * // Returns 'v1.2.3'
 * ```
 */
export declare function getComponentDeployment(componentName: string, deployment: string, env: ConductorEnv, componentType?: ComponentType): Promise<string>;
/**
 * Check if a component exists in KV
 *
 * @param componentRef - Component reference in format: name@version
 * @param env - Conductor environment with KV bindings
 * @param componentType - Component type for namespace lookup (defaults to 'prompt')
 */
export declare function componentExists(componentRef: string, env: ConductorEnv, componentType?: ComponentType): Promise<boolean>;
//# sourceMappingURL=edgit.d.ts.map