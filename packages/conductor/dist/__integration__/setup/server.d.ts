/**
 * Dev server management for integration tests
 */
export interface ServerOptions {
    port?: number;
    timeout?: number;
}
/**
 * Manages a wrangler dev server for testing
 */
export declare class TestServer {
    private projectDir;
    private process?;
    private port;
    constructor(projectDir: string, options?: ServerOptions);
    /**
     * Start the dev server
     */
    start(): Promise<void>;
    /**
     * Wait for server to respond to HTTP requests
     */
    waitForReady(maxWait?: number): Promise<void>;
    /**
     * Stop the dev server
     */
    stop(): Promise<void>;
    /**
     * Get the server URL
     */
    getUrl(path?: string): string;
}
//# sourceMappingURL=server.d.ts.map