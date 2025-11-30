/**
 * SDK Type Definitions
 */
import type { AgentExecutionContext, AgentResponse } from '../agents/base-agent.js';
import type { AgentConfig } from '../runtime/parser.js';
import { Operation } from '../types/constants.js';
export type { AgentExecutionContext, AgentResponse, AgentConfig };
export { Operation };
/**
 * Agent handler function signature
 */
export type MemberHandler<TInput = unknown, TOutput = unknown> = (context: AgentExecutionContext) => Promise<TOutput> | TOutput;
/**
 * Options for creating an agent
 */
export interface CreateAgentOptions {
    name: string;
    operation: Operation.code | Operation.think | Operation.storage | Operation.data | Operation.http | Operation.email | Operation.sms;
    description?: string;
    config?: Record<string, unknown>;
    schema?: {
        input?: Record<string, unknown>;
        output?: Record<string, unknown>;
    };
    /**
     * Control whether this agent can be executed via the Execute API
     * (/api/v1/execute/agent/:name)
     *
     * When api.execution.agents.requireExplicit is false (default):
     *   - Agents are executable unless apiExecutable: false
     * When api.execution.agents.requireExplicit is true:
     *   - Agents need apiExecutable: true to be executable
     */
    apiExecutable?: boolean;
    handler: MemberHandler;
}
/**
 * Client options for connecting to deployed Conductor
 */
export interface ClientOptions {
    baseUrl: string;
    apiKey?: string;
    timeout?: number;
    headers?: Record<string, string>;
}
/**
 * Execution result from client
 */
export interface ExecutionResult {
    success: boolean;
    output?: unknown;
    error?: string;
    metrics: {
        ensemble: string;
        totalDuration: number;
        agents: Array<{
            name: string;
            duration: number;
            cached: boolean;
            success: boolean;
        }>;
        cacheHits: number;
    };
}
/**
 * Agent execution result
 */
export interface MemberResult {
    success: boolean;
    data?: unknown;
    error?: string;
    timestamp: string;
    cached: boolean;
    executionTime: number;
}
/**
 * Health check status
 */
export interface HealthStatus {
    status: 'ok' | 'degraded' | 'down';
    version: string;
    timestamp: string;
    checks?: Record<string, boolean>;
}
//# sourceMappingURL=types.d.ts.map