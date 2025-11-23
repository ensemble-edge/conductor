/**
 * @ensemble-edge/conductor
 *
 * Edge-native orchestration for AI agents
 * Built on Cloudflare Workers
 */
// Core Runtime
export { Executor } from './runtime/executor.js';
export { Parser } from './runtime/parser.js';
export { StateManager } from './runtime/state-manager.js';
export { OperationRegistry, getOperationRegistry, } from './runtime/operation-registry.js';
// Durable Objects
// These are available via '@ensemble-edge/conductor/cloudflare' to avoid
// importing cloudflare: protocol modules in non-Cloudflare environments.
// See: src/cloudflare.ts for Cloudflare-specific exports
// Agent Types
export { BaseAgent } from './agents/base-agent.js';
export { FunctionAgent } from './agents/function-agent.js';
export { ThinkAgent } from './agents/think-agent.js';
export { DataAgent } from './agents/data-agent.js';
export { APIAgent } from './agents/api-agent.js';
export { PageAgent } from './agents/page/page-agent.js';
export { DocsMember } from './agents/docs/docs-agent.js';
// Utilities
export { MemberLoader, createLoader } from './utils/loader.js';
export { EnsembleLoader, createEnsembleLoader } from './utils/ensemble-loader.js';
// export { CacheManager } from './utils/cache.js';
// export { Normalizer } from './utils/normalize.js';
// API Layer
// export { Router } from './api/router.js';
// export { createHandler } from './api/handlers.js';
// export { authenticate } from './api/auth.js';
// Pages Module
export { PageRouter } from './pages/index.js';
// Authentication Module
export * from './auth/index.js';
// Routing Module
export { UnifiedRouter } from './routing/router.js';
export { isLifecyclePlugin, isFunctionalPlugin, buildPlugin } from './types/plugin.js';
// Docs - First-class component support for markdown documentation
export { DocsManager, getGlobalDocsManager } from './docs/index.js';
/**
 * Create a Cloudflare Worker handler with Conductor
 *
 * @example
 * ```typescript
 * import { createConductorHandler } from '@ensemble-edge/conductor';
 *
 * export default createConductorHandler({
 *   membersDir: './agents',
 *   ensemblesDir: './ensembles'
 * });
 * ```
 */
export function createConductorHandler(config) {
    return {
        async fetch(request, env, ctx) {
            // This will be implemented after we build the router and loader
            return new Response('Conductor initialized - handler implementation coming soon', {
                headers: { 'content-type': 'text/plain' },
            });
        },
    };
}
