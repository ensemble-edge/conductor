/**
 * Build and pack Conductor locally for integration testing
 *
 * Uses file-based locking to prevent parallel builds across vitest workers.
 */
/**
 * Build and pack Conductor into a tarball
 *
 * Uses file-based locking to ensure only one build happens at a time,
 * even when vitest runs tests in parallel across worker processes.
 *
 * @returns Path to the tarball
 */
export declare function buildAndPackConductor(): Promise<string>;
/**
 * Clear the cache (useful for forcing rebuild)
 */
export declare function clearCache(): Promise<void>;
//# sourceMappingURL=build-pack.d.ts.map