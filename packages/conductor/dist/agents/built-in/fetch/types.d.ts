/**
 * Fetch Agent - Type Definitions
 */
export interface FetchConfig {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    retry?: number;
    timeout?: number;
    retryDelay?: number;
    /**
     * Allow requests to private/internal IP addresses
     *
     * WARNING: Enabling this bypasses SSRF protection and allows the fetch agent
     * to access internal network resources, cloud metadata services, and localhost.
     * Only enable if you trust the input URLs completely.
     *
     * @default false
     */
    allowInternalRequests?: boolean;
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