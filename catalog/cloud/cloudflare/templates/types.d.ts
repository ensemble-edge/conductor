/**
 * Type declarations for Conductor project
 *
 * This file provides global type declarations for:
 * - YAML/YML file imports
 * - Cloudflare Workers environment bindings
 */

// YAML module declarations
// Allows importing .yaml and .yml files in TypeScript
declare module '*.yaml' {
	const content: any;
	export default content;
}

declare module '*.yml' {
	const content: any;
	export default content;
}

// Cloudflare Workers Environment Bindings
// Define all your environment variables and bindings here
interface Env {
	// Cloudflare AI binding (required by Conductor for Think members)
	AI: Ai;

	// Add your other environment bindings below:
	// KV Namespaces
	// MY_KV?: KVNamespace;

	// D1 Databases
	// MY_DB?: D1Database;

	// R2 Buckets
	// MY_BUCKET?: R2Bucket;

	// Environment Variables
	// API_KEY?: string;
	// ENVIRONMENT?: 'development' | 'staging' | 'production';

	// Durable Objects
	// MY_DURABLE_OBJECT?: DurableObjectNamespace;

	// Vectorize Indexes
	// MY_VECTORIZE?: VectorizeIndex;
}
