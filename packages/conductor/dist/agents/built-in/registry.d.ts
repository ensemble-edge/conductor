/**
 * Built-In Agent Registry
 *
 * Manages registration, discovery, and lazy loading of built-in agents.
 *
 * Features:
 * - Lazy loading (only load agents when used)
 * - Auto-discovery (list all available agents)
 * - Versioning (each agent has a version)
 * - Metadata (description, schemas, examples)
 */
import type { BaseAgent } from '../base-agent.js';
import type { AgentConfig } from '../../runtime/parser.js';
import type { BuiltInAgentMetadata, BuiltInAgentFactory } from './types.js';
import type { ConductorEnv } from '../../types/env.js';
export declare class BuiltInAgentRegistry {
    private agents;
    /**
     * Register a built-in agent
     */
    register(metadata: BuiltInAgentMetadata, factory: BuiltInAgentFactory): void;
    /**
     * Check if a agent is built-in
     */
    isBuiltIn(name: string): boolean;
    /**
     * Get a built-in agent instance (lazy loading)
     */
    create(name: string, config: AgentConfig, env: ConductorEnv): Promise<BaseAgent>;
    /**
     * Get metadata for a built-in agent
     */
    getMetadata(name: string): BuiltInAgentMetadata | undefined;
    /**
     * List all built-in agents
     */
    list(): BuiltInAgentMetadata[];
    /**
     * Get available agent names
     */
    getAvailableNames(): string[];
    /**
     * Get agents by type
     */
    listByType(type: string): BuiltInAgentMetadata[];
    /**
     * Get agents by tag
     */
    listByTag(tag: string): BuiltInAgentMetadata[];
}
/**
 * Get the built-in agent registry (singleton)
 */
export declare function getBuiltInRegistry(): BuiltInAgentRegistry;
export declare const BuiltInMemberRegistry: typeof BuiltInAgentRegistry;
//# sourceMappingURL=registry.d.ts.map