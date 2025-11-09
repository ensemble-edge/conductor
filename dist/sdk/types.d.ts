/**
 * SDK Type Definitions
 */
import type { MemberExecutionContext, MemberResponse } from '../members/base-member.js';
import type { MemberConfig } from '../runtime/parser.js';
import { MemberType } from '../types/constants.js';
export type { MemberExecutionContext, MemberResponse, MemberConfig };
export { MemberType };
/**
 * Member handler function signature
 */
export type MemberHandler<TInput = unknown, TOutput = unknown> = (context: MemberExecutionContext) => Promise<TOutput> | TOutput;
/**
 * Options for creating a member
 */
export interface CreateMemberOptions {
    name: string;
    type: MemberType.Function | MemberType.Think | MemberType.Data | MemberType.API | MemberType.Email | MemberType.SMS;
    description?: string;
    config?: Record<string, unknown>;
    schema?: {
        input?: Record<string, unknown>;
        output?: Record<string, unknown>;
    };
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
        members: Array<{
            name: string;
            duration: number;
            cached: boolean;
            success: boolean;
        }>;
        cacheHits: number;
    };
}
/**
 * Member execution result
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