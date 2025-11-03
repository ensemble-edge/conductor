/**
 * Fetch Member - Type Definitions
 */
export interface FetchConfig {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    retry?: number;
    timeout?: number;
    retryDelay?: number;
}
export interface FetchInput {
    url: string;
    body?: unknown;
    headers?: Record<string, string>;
}
export interface FetchResult {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
    duration: number;
    attempt: number;
}
//# sourceMappingURL=types.d.ts.map