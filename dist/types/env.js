/**
 * Cloudflare Workers Environment Bindings
 *
 * Typed interface for all Cloudflare Workers bindings used in Conductor.
 * Replaces the need for `as any` casts when accessing environment variables.
 */
/**
 * Type guard to check if env has KV namespace
 */
export function hasKV(env) {
    return env.KV !== undefined;
}
/**
 * Type guard to check if env has CATALOG_KV namespace
 */
export function hasCatalogKV(env) {
    return env.CATALOG_KV !== undefined;
}
/**
 * Type guard to check if env has DB
 */
export function hasDB(env) {
    return env.DB !== undefined;
}
/**
 * Type guard to check if env has R2 CATALOG bucket
 */
export function hasCatalog(env) {
    return env.CATALOG !== undefined;
}
