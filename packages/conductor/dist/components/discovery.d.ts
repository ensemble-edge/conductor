/**
 * Discovery Registries for Agents and Ensembles
 *
 * Provides read-only access to discover and inspect registered agents and ensembles.
 * Used by TypeScript handlers that need to enumerate available resources (e.g., OpenAPI generation).
 *
 * @module components/discovery
 */
import type { BaseAgent } from '../agents/base-agent.js';
import type { EnsembleConfig } from '../runtime/parser.js';
/**
 * Metadata about a registered agent
 */
export interface AgentMetadata {
    /** Agent name */
    name: string;
    /** Operation type (think, code, data, api, etc.) */
    operation: string;
    /** Agent description */
    description?: string;
    /** Input schema if defined */
    inputSchema?: Record<string, unknown>;
    /** Output schema if defined */
    outputSchema?: Record<string, unknown>;
    /** Whether this is a built-in agent */
    builtIn: boolean;
}
/**
 * Metadata about a registered ensemble
 */
export interface EnsembleMetadata {
    /** Ensemble name */
    name: string;
    /** Ensemble description */
    description?: string;
    /** Triggers configured for this ensemble */
    triggers: Array<{
        type: string;
        path?: string;
        methods?: string[];
        cron?: string;
    }>;
    /** Input schema if defined */
    inputSchema?: Record<string, unknown>;
    /** Output schema if defined */
    outputSchema?: unknown;
    /** Source type (yaml or typescript) */
    source: 'yaml' | 'typescript';
    /** Names of agents used in the flow */
    agentNames: string[];
    /** Number of steps in the flow */
    stepCount: number;
}
/**
 * Read-only registry for discovering agents
 *
 * @example
 * ```typescript
 * export default async function(ctx: AgentExecutionContext) {
 *   const agents = ctx.agentRegistry?.list() || []
 *
 *   // Find all data agents
 *   const dataAgents = agents.filter(a => a.operation === 'data')
 *
 *   // Get specific agent metadata
 *   const scraper = ctx.agentRegistry?.get('scrape')
 *
 *   return { agentCount: agents.length }
 * }
 * ```
 */
export interface AgentRegistry {
    /**
     * List all registered agents with their metadata
     */
    list(): AgentMetadata[];
    /**
     * Get metadata for a specific agent by name
     */
    get(name: string): AgentMetadata | undefined;
    /**
     * Check if an agent is registered
     */
    has(name: string): boolean;
}
/**
 * Read-only registry for discovering ensembles
 *
 * @example
 * ```typescript
 * export default async function(ctx: AgentExecutionContext) {
 *   const ensembles = ctx.ensembleRegistry?.list() || []
 *
 *   // Find all HTTP-triggered ensembles
 *   const httpEnsembles = ensembles.filter(e =>
 *     e.triggers.some(t => t.type === 'http')
 *   )
 *
 *   // Generate OpenAPI paths
 *   const paths = {}
 *   for (const ensemble of httpEnsembles) {
 *     for (const trigger of ensemble.triggers) {
 *       if (trigger.type === 'http' && trigger.path) {
 *         paths[trigger.path] = { ... }
 *       }
 *     }
 *   }
 *
 *   return { paths }
 * }
 * ```
 */
export interface EnsembleRegistry {
    /**
     * List all registered ensembles with their metadata
     */
    list(): EnsembleMetadata[];
    /**
     * Get metadata for a specific ensemble by name
     */
    get(name: string): EnsembleMetadata | undefined;
    /**
     * Check if an ensemble is registered
     */
    has(name: string): boolean;
}
/**
 * Create an AgentRegistry from a Map of BaseAgent instances
 */
export declare function createAgentRegistry(agents: Map<string, BaseAgent>): AgentRegistry;
/**
 * Create an EnsembleRegistry from a Map of EnsembleConfig instances
 */
export declare function createEnsembleRegistry(ensembles: Map<string, {
    config: EnsembleConfig;
    source: 'yaml' | 'typescript';
}>): EnsembleRegistry;
//# sourceMappingURL=discovery.d.ts.map