/**
 * HTTP testing utilities
 */
export interface HttpTestOptions {
    expectedStatus?: number;
    headers?: Record<string, string>;
    retries?: number;
    retryDelay?: number;
}
/**
 * Make an HTTP request with retries and assertions
 */
export declare function testEndpoint(url: string, options?: HttpTestOptions): Promise<{
    response: Response;
    body: string;
    json?: any;
}>;
/**
 * Test a JSON API endpoint
 */
export declare function testJsonEndpoint(url: string, options?: HttpTestOptions & {
    method?: string;
    body?: any;
}): Promise<any>;
//# sourceMappingURL=http.d.ts.map