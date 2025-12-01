/**
 * Agent Loader Utility
 *
 * Dynamically loads user-created agents from their project directory
 * This runs in the user's project context, not in the conductor package
 *
 * Note: tools, validate, autorag agents have been moved to template-based agents.
 * They now use `operation: code` with handlers like any other agent.
 * See: catalog/cloud/cloudflare/templates/agents/system/
 */
import { type AgentConfig } from '../runtime/parser.js';
import { BaseAgent } from '../agents/base-agent.js';
import { type FunctionImplementation } from '../agents/function-agent.js';
import type { ConductorEnv } from '../types/env.js';
export interface LoaderConfig {
    /**
     * Base directory where agents are located
     * @default './agents'
     */
    agentsDir?: string;
    /**
     * Base directory where ensembles are located
     * @default './ensembles'
     */
    ensemblesDir?: string;
    /**
     * Environment context (passed from Worker)
     */
    env: ConductorEnv;
    /**
     * Execution context (passed from Worker)
     */
    ctx: ExecutionContext;
}
export interface LoadedAgent {
    config: AgentConfig;
    instance: BaseAgent;
}
/**
 * AgentLoader handles dynamic loading of user-created agents
 *
 * Note: In Cloudflare Workers, we can't use Node.js fs module.
 * Agents must be bundled at build time using wrangler's module imports.
 *
 * For now, users will need to manually import and register their agents.
 * Future: We can build a CLI tool that generates the registration code.
 */
export declare class AgentLoader {
    private config;
    private loadedAgents;
    constructor(config: LoaderConfig);
    /**
     * Auto-discover and register agents from virtual module
     *
     * This method is designed to work with the Vite plugin system that generates
     * a virtual module containing all agent definitions at build time.
     *
     * @param discoveredAgents - Array of agent definitions from virtual:conductor-agents
     *
     * @example
     * ```typescript
     * import { agents as discoveredAgents } from 'virtual:conductor-agents';
     *
     * const loader = new AgentLoader({ env, ctx });
     * await loader.autoDiscover(discoveredAgents);
     * ```
     */
    autoDiscover(discoveredAgents: Array<{
        name: string;
        config: string;
        handler?: () => Promise<any>;
    }>): Promise<void>;
    /**
     * Register a agent manually
     *
     * @example
     * ```typescript
     * import greetConfig from './agents/greet/agent.yaml.js';
     * import greetFunction from './agents/greet/index.js';
     *
     * loader.registerAgent(greetConfig, greetFunction);
     * ```
     */
    registerAgent(agentConfig: AgentConfig | string, implementation?: FunctionImplementation): BaseAgent;
    /**
     * Load an agent from Edgit by version reference
     *
     * This enables loading versioned agent configs at runtime for A/B testing,
     * environment-specific configs, and config-only deployments.
     *
     * @example
     * ```typescript
     * // Load specific version
     * await loader.loadAgentFromEdgit('analyze-company@v1.0.0');
     *
     * // Load production deployment
     * await loader.loadAgentFromEdgit('analyze-company@production');
     * ```
     */
    loadAgentFromEdgit(agentRef: string): Promise<BaseAgent>;
    /**
     * Create an agent instance based on type
     */
    private createAgentInstance;
    /**
     * Get a loaded agent by name
     */
    getAgent(name: string): BaseAgent | undefined;
    /**
     * Get agent config by name
     */
    getAgentConfig(name: string): AgentConfig | undefined;
    /**
     * Get all loaded agents
     */
    getAllAgents(): BaseAgent[];
    /**
     * Get all agent names
     */
    getAgentNames(): string[];
    /**
     * Check if an agent is loaded
     */
    hasAgent(name: string): boolean;
    /**
     * Clear all loaded agents
     */
    clear(): void;
}
/**
 * Helper function to create a loader instance
 */
export declare function createLoader(config: LoaderConfig): AgentLoader;
export declare const MemberLoader: typeof AgentLoader;
export type LoadedMember = LoadedAgent;
//# sourceMappingURL=loader.d.ts.map