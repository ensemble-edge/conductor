/**
 * Built-In Members - Shared Types
 *
 * Common types and interfaces used across all built-in agents.
 */
import type { BaseAgent } from '../base-agent.js';
import type { AgentConfig } from '../../runtime/parser.js';
import { Operation } from '../../types/constants.js';
import type { ConductorEnv } from '../../types/env.js';
/**
 * Metadata for a built-in agent
 */
export interface BuiltInAgentMetadata {
    name: string;
    version: string;
    description: string;
    operation: Operation;
    configSchema?: Record<string, unknown>;
    inputSchema?: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
    tags?: string[];
    examples?: Array<{
        name: string;
        description: string;
        input: Record<string, unknown>;
        config?: Record<string, unknown>;
        output?: Record<string, unknown>;
    }>;
    documentation?: string;
}
/**
 * Factory function to create a built-in agent instance
 * Can be async to support dynamic imports for lazy loading
 */
export type BuiltInAgentFactory = (config: AgentConfig, env: ConductorEnv) => BaseAgent | Promise<BaseAgent>;
/**
 * Built-in agent registration entry
 */
export interface BuiltInAgentEntry {
    metadata: BuiltInAgentMetadata;
    factory: BuiltInAgentFactory;
    loaded: boolean;
}
export type BuiltInMemberMetadata = BuiltInAgentMetadata;
export type BuiltInMemberFactory = BuiltInAgentFactory;
export type BuiltInMemberEntry = BuiltInAgentEntry;
//# sourceMappingURL=types.d.ts.map