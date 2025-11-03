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
export interface ConductorEnv extends Env {
	/**
	 * KV Namespace for general key-value storage
	 */
	KV?: KVNamespace;

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
	AI: any; // Cloudflare AI type not yet exported

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
}

/**
 * Type guard to check if env has KV namespace
 */
export function hasKV(env: ConductorEnv): env is ConductorEnv & { KV: KVNamespace } {
	return env.KV !== undefined;
}

/**
 * Type guard to check if env has CATALOG_KV namespace
 */
export function hasCatalogKV(env: ConductorEnv): env is ConductorEnv & { CATALOG_KV: KVNamespace } {
	return env.CATALOG_KV !== undefined;
}

/**
 * Type guard to check if env has DB
 */
export function hasDB(env: ConductorEnv): env is ConductorEnv & { DB: D1Database } {
	return env.DB !== undefined;
}

/**
 * Type guard to check if env has R2 CATALOG bucket
 */
export function hasCatalog(env: ConductorEnv): env is ConductorEnv & { CATALOG: R2Bucket } {
	return env.CATALOG !== undefined;
}
