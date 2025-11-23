/**
 * Template Loader
 *
 * Handles loading templates from various sources:
 * - Inline strings
 * - KV storage (Edgit-versioned templates)
 * - R2 storage (static templates)
 * - File system (development)
 */
import type { TemplateSource, TemplateLoadResult, TemplateEngine } from '../types/index.js';
/**
 * Detect template engine from file extension or content (Workers-compatible)
 * Note: Only supports 'simple' and 'liquid' - both work in Workers without eval()
 */
export declare function detectTemplateEngine(key: string, content?: string): TemplateEngine;
/**
 * Load template from configured source
 */
export declare function loadTemplate(source: TemplateSource, env?: {
    TEMPLATES?: KVNamespace;
    ASSETS?: R2Bucket;
}): Promise<TemplateLoadResult>;
/**
 * Validate template source configuration
 */
export declare function validateTemplateSource(source: TemplateSource): {
    valid: boolean;
    errors?: string[];
};
/**
 * Normalize template source from string or object
 */
export declare function normalizeTemplateSource(source: string | TemplateSource): TemplateSource;
/**
 * Cache key for template loading
 */
export declare function getTemplateCacheKey(source: TemplateSource): string | null;
//# sourceMappingURL=template-loader.d.ts.map