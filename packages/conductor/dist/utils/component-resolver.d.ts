/**
 * Component Resolution Utility
 *
 * Implements Alternative 1: Smart String Parsing
 *
 * Resolves values to their actual content:
 * - Inline values (strings, objects, arrays)
 * - Component references (type/name@version) - via KV in Workers
 *
 * Note: File system access is NOT available in Cloudflare Workers.
 * Use component references with KV storage (EDGIT or COMPONENTS namespace) instead.
 * File path references (./path/to/file) will throw an error in Workers runtime.
 *
 * @module component-resolver
 */
/**
 * Context for component resolution
 */
export interface ComponentResolutionContext {
    /** Cloudflare environment bindings */
    env?: {
        /** Edgit KV store for component versioning */
        EDGIT?: KVNamespace;
        /** Components KV store for scripts/templates */
        COMPONENTS?: KVNamespace;
        [key: string]: any;
    };
    /** Base directory for relative file paths (not used in Workers) */
    baseDir?: string;
}
/**
 * Result of component resolution
 */
export interface ResolvedComponent {
    /** The resolved content */
    content: any;
    /** How it was resolved */
    source: 'inline' | 'file' | 'component';
    /** Original reference (for debugging) */
    originalRef: any;
    /** Component metadata (if from Edgit) */
    metadata?: {
        path: string;
        version: string;
        fromEdgit: boolean;
    };
}
/**
 * Simple path utilities that work in both Node.js and Workers
 */
declare const pathUtils: {
    /**
     * Check if a path is absolute (starts with /)
     */
    isAbsolute(filePath: string): boolean;
    /**
     * Join path segments
     */
    join(...segments: string[]): string;
    /**
     * Get the basename of a path
     */
    basename(filePath: string): string;
    /**
     * Normalize a path (resolve . and ..)
     */
    normalize(filePath: string): string;
};
/**
 * Resolves any value to its actual content
 *
 * This is the main entry point for Alternative 1: Smart String Parsing
 *
 * Resolution logic:
 * 1. Non-string → inline value
 * 2. Multi-line string → inline content
 * 3. Starts with ./ or / → file reference (loads from KV in Workers)
 * 4. Matches path/name@version → component reference
 * 5. Matches path/name → unversioned component (adds @latest)
 * 6. Everything else → inline string
 *
 * @param value - Value to resolve
 * @param context - Resolution context
 * @returns Resolved component with metadata
 *
 * @example
 * // Inline value
 * await resolveValue({ foo: "bar" }, ctx)
 * // → { content: { foo: "bar" }, source: "inline", ... }
 *
 * // File path (loaded from KV in Workers)
 * await resolveValue("./prompts/my-prompt.md", ctx)
 * // → { content: "<file content from KV>", source: "file", ... }
 *
 * // Component reference
 * await resolveValue("prompts/extraction@v1.0.0", ctx)
 * // → { content: "<component content>", source: "component", ... }
 *
 * // Inline string (email)
 * await resolveValue("hello@example.com", ctx)
 * // → { content: "hello@example.com", source: "inline", ... }
 */
export declare function resolveValue(value: any, context: ComponentResolutionContext): Promise<ResolvedComponent>;
/**
 * Helper to check if a value needs resolution
 * (i.e., it's a file path or component reference)
 *
 * @param value - Value to check
 * @returns True if value needs async resolution
 */
export declare function needsResolution(value: any): boolean;
export { pathUtils };
//# sourceMappingURL=component-resolver.d.ts.map