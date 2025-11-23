/**
 * Cloudflare Workers Environment Bindings
 *
 * Typed interface for all Cloudflare Workers bindings used in Conductor.
 * Replaces the need for `as any` casts when accessing environment variables.
 */
/**
 * Conductor Environment with all Cloudflare bindings
 *
 * Note: This interface includes all bindings used by Conductor.
 * It's designed to be compatible with Cloudflare Workers Env type
 * while providing proper typing for all bindings.
 */
export interface ConductorEnv {
    /**
     * KV Namespace for general key-value storage
     */
    KV?: KVNamespace;
    /**
     * KV Namespace for session storage
     */
    SESSIONS?: KVNamespace;
    /**
     * Dedicated KV Namespace for catalog storage
     */
    CATALOG_KV?: KVNamespace;
    /**
     * D1 Database for structured data
     */
    DB?: D1Database;
    /**
     * R2 Bucket for object storage (catalog files)
     */
    CATALOG?: R2Bucket;
    /**
     * R2 Bucket for general storage
     */
    STORAGE?: R2Bucket;
    /**
     * Workers AI binding (required)
     */
    AI: any;
    /**
     * Vectorize binding for embeddings
     */
    VECTORIZE?: VectorizeIndex;
    /**
     * Analytics Engine binding
     */
    ANALYTICS?: AnalyticsEngineDataset;
    /**
     * Durable Object bindings
     */
    HITL_STATE?: DurableObjectNamespace;
    EXECUTION_STATE?: DurableObjectNamespace;
    /**
     * Hyperdrive binding for database connections
     */
    HYPERDRIVE?: Hyperdrive;
    /**
     * Queue bindings
     */
    QUEUE?: Queue;
    /**
     * KV Namespace for docs cache
     */
    DOCS_CACHE?: KVNamespace;
    /**
     * KV Namespace for page cache
     */
    PAGE_CACHE?: KVNamespace;
    /**
     * KV Namespace for rate limiting
     */
    RATE_LIMIT?: KVNamespace;
    /**
     * KV Namespace for components (Edgit)
     */
    COMPONENTS?: KVNamespace;
    /**
     * KV Namespace for general cache
     */
    CACHE?: KVNamespace;
    /**
     * Environment name (development, staging, production)
     */
    ENVIRONMENT?: string;
    /**
     * Index signature to allow dynamic access
     */
    [key: string]: any;
}
/**
 * Type guard to check if env has KV namespace
 */
export declare function hasKV(env: ConductorEnv): env is ConductorEnv & {
    KV: KVNamespace;
};
/**
 * Type guard to check if env has CATALOG_KV namespace
 */
export declare function hasCatalogKV(env: ConductorEnv): env is ConductorEnv & {
    CATALOG_KV: KVNamespace;
};
/**
 * Type guard to check if env has DB
 */
export declare function hasDB(env: ConductorEnv): env is ConductorEnv & {
    DB: D1Database;
};
/**
 * Type guard to check if env has R2 CATALOG bucket
 */
export declare function hasCatalog(env: ConductorEnv): env is ConductorEnv & {
    CATALOG: R2Bucket;
};
//# sourceMappingURL=env.d.ts.map