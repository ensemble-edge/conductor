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
import { Parser } from '../runtime/parser.js';
/**
 * KV namespace binding name for components
 * Must be configured in wrangler.toml as COMPONENTS_KV
 */
const COMPONENTS_KV_BINDING = 'COMPONENTS_KV';
/**
 * Get the KV namespace for components
 * Falls back to EDGIT_KV for backwards compatibility
 */
function getComponentsKV(env) {
    // Check for COMPONENTS_KV first, then fall back to EDGIT_KV
    const kv = env[COMPONENTS_KV_BINDING];
    if (kv)
        return kv;
    // Fallback for backwards compatibility
    const legacyKv = env['EDGIT_KV'];
    return legacyKv || null;
}
/**
 * Get namespace prefix for component type
 * Pluralizes the type name to create the namespace
 *
 * Examples:
 * - 'agent' → 'agents'
 * - 'prompt' → 'prompts'
 * - 'schema' → 'schemas'
 * - 'query' → 'queries' (special case)
 * - 'component' → 'components' (legacy)
 */
function getNamespace(componentType) {
    switch (componentType) {
        case 'agent':
            return 'agents';
        case 'query':
            return 'queries'; // Special pluralization
        case 'component':
            return 'components'; // Legacy support
        default:
            // Standard pluralization: add 's'
            return `${componentType}s`;
    }
}
/**
 * Build KV key for a component
 * Uses type-specific namespaces (prompts/, schemas/, etc.)
 */
function buildComponentKey(name, version, componentType) {
    const namespace = getNamespace(componentType);
    return `${namespace}/${name}/${version}`;
}
/**
 * Build KV key with legacy fallback
 * Tries type-specific namespace first, then falls back to 'components/'
 *
 * @internal
 */
async function getComponentKeyWithFallback(name, version, componentType, kv) {
    // Try type-specific namespace first
    const typeSpecificKey = buildComponentKey(name, version, componentType);
    let content = await kv.get(typeSpecificKey);
    if (content !== null) {
        return { key: typeSpecificKey, content };
    }
    // Fall back to legacy 'components/' namespace
    if (componentType !== 'component') {
        const legacyKey = `components/${name}/${version}`;
        content = await kv.get(legacyKey);
        if (content !== null) {
            return { key: legacyKey, content };
        }
    }
    return { key: typeSpecificKey, content: null };
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
export async function loadComponent(componentRef, env, componentType = 'prompt') {
    const [name, version] = componentRef.split('@');
    if (!name || !version) {
        throw new Error(`Invalid component reference: ${componentRef}. Expected format: name@version`);
    }
    const kv = getComponentsKV(env);
    if (!kv) {
        throw new Error(`Components KV not configured. Add ${COMPONENTS_KV_BINDING} binding to wrangler.toml:\n` +
            `[[kv_namespaces]]\nbinding = "${COMPONENTS_KV_BINDING}"\nid = "your-kv-namespace-id"`);
    }
    // Try type-specific namespace with legacy fallback
    const { content } = await getComponentKeyWithFallback(name, version, componentType, kv);
    if (content === null) {
        const namespace = getNamespace(componentType);
        throw new Error(`Component not found: ${componentRef} (looked in ${namespace}/${name}/${version}). ` +
            `Ensure the component is synced to KV using Edgit: edgit sync ${name}@${version}`);
    }
    return content;
}
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
export async function loadComponentWithMetadata(componentRef, env, componentType = 'prompt') {
    const [name, version] = componentRef.split('@');
    if (!name || !version) {
        throw new Error(`Invalid component reference: ${componentRef}. Expected format: name@version`);
    }
    const kv = getComponentsKV(env);
    if (!kv) {
        throw new Error(`Components KV not configured. Add ${COMPONENTS_KV_BINDING} binding to wrangler.toml`);
    }
    // Try type-specific namespace with legacy fallback
    const typeSpecificKey = buildComponentKey(name, version, componentType);
    let result = await kv.getWithMetadata(typeSpecificKey);
    // Try legacy namespace if type-specific not found
    if (result.value === null && componentType !== 'component') {
        const legacyKey = `components/${name}/${version}`;
        result = await kv.getWithMetadata(legacyKey);
    }
    if (result.value === null) {
        throw new Error(`Component not found: ${componentRef}`);
    }
    return {
        content: result.value,
        metadata: result.metadata,
    };
}
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
export async function loadMemberConfig(memberRef, env) {
    const { name, version } = Parser.parseAgentReference(memberRef);
    if (!version) {
        throw new Error(`Agent reference must include version: ${memberRef}`);
    }
    const kv = getComponentsKV(env);
    if (!kv) {
        throw new Error(`Components KV not configured. Add ${COMPONENTS_KV_BINDING} binding to wrangler.toml`);
    }
    // Load agent YAML from KV (agents use agents/ namespace)
    const key = buildComponentKey(name, version, 'agent');
    const yamlContent = await kv.get(key);
    if (yamlContent === null) {
        throw new Error(`Agent config not found: ${memberRef}. ` +
            `Ensure the agent is synced to KV using Edgit: edgit sync ${name}@${version}`);
    }
    // Parse YAML to get AgentConfig
    const config = Parser.parseAgent(yamlContent);
    // If config has a versioned prompt reference, resolve it
    const promptRef = config.config?.prompt;
    if (promptRef && promptRef.includes('@')) {
        try {
            const promptContent = await loadComponent(promptRef, env);
            config.config = config.config || {};
            config.config.systemPrompt = promptContent;
        }
        catch {
            // Log warning but don't fail - prompt might be inline or optional
            // The agent can handle missing prompts at runtime
        }
    }
    return config;
}
/**
 * Load component metadata without content
 *
 * Useful for checking component info without loading full content.
 *
 * @param componentRef - Component reference in format: name@version
 * @param env - Conductor environment with KV bindings
 * @param componentType - Component type for namespace lookup (defaults to 'prompt')
 */
export async function loadComponentMetadata(componentRef, env, componentType = 'prompt') {
    const [name, version] = componentRef.split('@');
    if (!name || !version) {
        throw new Error(`Invalid component reference: ${componentRef}`);
    }
    const kv = getComponentsKV(env);
    if (!kv) {
        throw new Error(`Components KV not configured`);
    }
    // Try type-specific namespace with legacy fallback
    const typeSpecificKey = buildComponentKey(name, version, componentType);
    let result = await kv.getWithMetadata(typeSpecificKey, { type: 'text' });
    // Try legacy namespace if type-specific not found
    if (result.value === null && componentType !== 'component') {
        const legacyKey = `components/${name}/${version}`;
        result = await kv.getWithMetadata(legacyKey, { type: 'text' });
    }
    if (result.value === null) {
        throw new Error(`Component not found: ${componentRef}`);
    }
    return {
        name,
        version,
        type: result.metadata?.type,
        metadata: result.metadata,
    };
}
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
export async function listComponentVersions(componentName, env, componentType = 'prompt') {
    const kv = getComponentsKV(env);
    if (!kv) {
        throw new Error(`Components KV not configured`);
    }
    const namespace = getNamespace(componentType);
    // Try to get versions index first (type-specific namespace)
    const indexKey = `${namespace}/${componentName}/_versions`;
    let versionsJson = await kv.get(indexKey);
    // Try legacy namespace if not found
    if (!versionsJson && componentType !== 'component') {
        versionsJson = await kv.get(`components/${componentName}/_versions`);
    }
    if (versionsJson) {
        try {
            return JSON.parse(versionsJson);
        }
        catch {
            // Fall back to list approach
        }
    }
    // Fallback: List all keys with prefix and extract versions
    // Note: KV list is eventually consistent and may not include recent writes
    let listResult = await kv.list({ prefix: `${namespace}/${componentName}/` });
    // Try legacy namespace if empty
    if (listResult.keys.length === 0 && componentType !== 'component') {
        listResult = await kv.list({ prefix: `components/${componentName}/` });
    }
    const versions = listResult.keys
        .map((key) => {
        // Extract version from key (remove namespace/name/ prefix)
        const parts = key.name.split('/');
        return parts[parts.length - 1];
    })
        .filter((v) => !!v && !v.startsWith('_')) // Exclude metadata keys like _versions
        .filter((v) => /^v?\d+\.\d+\.\d+/.test(v) ||
        ['prod', 'staging', 'canary', 'latest', 'dev'].includes(v));
    return versions;
}
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
export async function getComponentDeployment(componentName, deployment, env, componentType = 'prompt') {
    const kv = getComponentsKV(env);
    if (!kv) {
        throw new Error(`Components KV not configured`);
    }
    // Deployment tags are stored at the same path as version tags
    // The content is the actual component content, but metadata.version contains the target version
    const key = buildComponentKey(componentName, deployment, componentType);
    let result = await kv.getWithMetadata(key);
    // Try legacy namespace if not found
    if (result.value === null && componentType !== 'component') {
        const legacyKey = `components/${componentName}/${deployment}`;
        result = await kv.getWithMetadata(legacyKey);
    }
    if (result.value === null) {
        throw new Error(`Deployment not found: ${componentName}@${deployment}`);
    }
    // If metadata includes the target version, return it
    if (result.metadata?.version) {
        return result.metadata.version;
    }
    // Otherwise, return the deployment tag itself (it IS the version)
    return deployment;
}
/**
 * Check if a component exists in KV
 *
 * @param componentRef - Component reference in format: name@version
 * @param env - Conductor environment with KV bindings
 * @param componentType - Component type for namespace lookup (defaults to 'prompt')
 */
export async function componentExists(componentRef, env, componentType = 'prompt') {
    const [name, version] = componentRef.split('@');
    if (!name || !version) {
        return false;
    }
    const kv = getComponentsKV(env);
    if (!kv) {
        return false;
    }
    // Try type-specific namespace with legacy fallback
    const { content } = await getComponentKeyWithFallback(name, version, componentType, kv);
    return content !== null;
}
