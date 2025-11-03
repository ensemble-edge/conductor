/**
 * Conductor SDK Client
 *
 * Type-safe client for the Conductor API.
 */
export interface ClientConfig {
    baseUrl: string;
    apiKey?: string;
    timeout?: number;
    headers?: Record<string, string>;
}
export interface ExecuteOptions {
    member: string;
    input: unknown;
    config?: unknown;
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
}
export interface ExecuteResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    metadata: {
        executionId: string;
        duration: number;
        timestamp: number;
    };
}
export interface Member {
    name: string;
    type: string;
    version?: string;
    description?: string;
    builtIn: boolean;
}
export interface MemberDetail extends Member {
    config?: {
        schema?: Record<string, unknown>;
        defaults?: Record<string, unknown>;
    };
    input?: {
        schema?: Record<string, unknown>;
        examples?: unknown[];
    };
    output?: {
        schema?: Record<string, unknown>;
    };
}
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: number;
    version: string;
    checks: {
        database?: boolean;
        cache?: boolean;
        queue?: boolean;
    };
}
export declare class ConductorError extends Error {
    code: string;
    details?: unknown | undefined;
    requestId?: string | undefined;
    constructor(code: string, message: string, details?: unknown | undefined, requestId?: string | undefined);
}
/**
 * Conductor API Client
 */
export declare class ConductorClient {
    private baseUrl;
    private apiKey?;
    private timeout;
    private headers;
    constructor(config: ClientConfig);
    execute<T = unknown>(options: ExecuteOptions): Promise<ExecuteResult<T>>;
    listMembers(): Promise<Member[]>;
    getMember(name: string): Promise<MemberDetail>;
    health(): Promise<HealthStatus>;
    ready(): Promise<boolean>;
    alive(): Promise<boolean>;
    private request;
}
export declare function createClient(config: ClientConfig): ConductorClient;
//# sourceMappingURL=client.d.ts.map