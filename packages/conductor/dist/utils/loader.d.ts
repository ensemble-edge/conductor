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
    membersDir?: string;
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
export interface LoadedMember {
    config: AgentConfig;
    instance: BaseAgent;
}
/**
 * MemberLoader handles dynamic loading of user-created agents
 *
 * Note: In Cloudflare Workers, we can't use Node.js fs module.
 * Members must be bundled at build time using wrangler's module imports.
 *
 * For now, users will need to manually import and register their agents.
 * Future: We can build a CLI tool that generates the registration code.
 */
export declare class AgentLoader {
    private config;
    private loadedMembers;
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
     * const loader = new MemberLoader({ env, ctx });
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
     * Load a agent from Edgit by version reference
     *
     * This enables loading versioned agent configs at runtime for A/B testing,
     * environment-specific configs, and config-only deployments.
     *
     * @example
     * ```typescript
     * // Load specific version
     * await loader.loadMemberFromEdgit('analyze-company@v1.0.0');
     *
     * // Load production deployment
     * await loader.loadMemberFromEdgit('analyze-company@production');
     * ```
     */
    loadMemberFromEdgit(memberRef: string): Promise<BaseAgent>;
    /**
     * Create a agent instance based on type
     */
    private createMemberInstance;
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
    getAllMembers(): BaseAgent[];
    /**
     * Get all agent names
     */
    getMemberNames(): string[];
    /**
     * Check if a agent is loaded
     */
    hasMember(name: string): boolean;
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
//# sourceMappingURL=loader.d.ts.map