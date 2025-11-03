/**
 * Normalization Utilities
 *
 * Provides consistent normalization for common data types:
 * - URLs (lowercase, strip trailing slash, normalize www)
 * - Domains (lowercase, remove www)
 * - Company names (titlecase, remove suffixes)
 * - Emails (lowercase, trim)
 *
 * Follows registry pattern for extensibility.
 */
export type NormalizerFunction = (input: string) => string;
export interface NormalizerMetadata {
    name: string;
    description: string;
    examples?: Array<{
        input: string;
        output: string;
    }>;
}
export interface NormalizerEntry {
    metadata: NormalizerMetadata;
    normalizer: NormalizerFunction;
}
/**
 * Normalization Registry
 */
export declare class NormalizationRegistry {
    private normalizers;
    /**
     * Register a normalizer
     */
    register(metadata: NormalizerMetadata, normalizer: NormalizerFunction): void;
    /**
     * Get a normalizer by name
     */
    get(name: string): NormalizerFunction | null;
    /**
     * Check if a normalizer exists
     */
    has(name: string): boolean;
    /**
     * List all registered normalizers
     */
    list(): NormalizerMetadata[];
    /**
     * Normalize using a specific normalizer
     */
    normalize(name: string, input: string): string;
}
/**
 * URL Normalizer
 */
export declare function normalizeURL(url: string): string;
/**
 * Domain Normalizer
 */
export declare function normalizeDomain(domain: string): string;
/**
 * Company Name Normalizer
 */
export declare function normalizeCompanyName(name: string): string;
/**
 * Email Normalizer
 */
export declare function normalizeEmail(email: string): string;
/**
 * Get or create the global normalization registry
 */
export declare function getGlobalNormalizationRegistry(): NormalizationRegistry;
/**
 * Convenience function to normalize using the global registry
 */
export declare function normalize(type: string, input: string): string;
//# sourceMappingURL=normalization.d.ts.map