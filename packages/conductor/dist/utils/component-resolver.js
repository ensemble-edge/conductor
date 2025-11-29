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
import { createLogger } from '../observability/index.js';
const logger = createLogger({ serviceName: 'component-resolver' });
/**
 * Checks if a string matches the component reference pattern
 *
 * Component references follow: path/to/component@version
 *
 * @param value - String to check
 * @returns True if it's a component reference
 *
 * @example
 * isComponentReference("prompts/extraction@v1.0.0") // true
 * isComponentReference("hello@example.com") // false (no path)
 * isComponentReference("user@server") // false (no path)
 */
function isComponentReference(value) {
    // Component pattern: word/word@version or word/word/word@version
    // Must have at least one / before the @
    const componentPattern = /^[a-z0-9-_]+\/[a-z0-9-_/]+@[a-z0-9.-]+$/i;
    return componentPattern.test(value);
}
/**
 * Checks if a string is an unversioned component path
 *
 * @param value - String to check
 * @returns True if it's a component path without version
 *
 * @example
 * isUnversionedComponent("prompts/extraction") // true
 * isUnversionedComponent("prompts/extraction@v1.0.0") // false (has version)
 */
function isUnversionedComponent(value) {
    // Must have path structure but no @
    const pathPattern = /^[a-z0-9-_]+\/[a-z0-9-_/]+$/i;
    return pathPattern.test(value) && !value.includes('@');
}
/**
 * Checks if a string looks like a file path
 *
 * @param value - String to check
 * @returns True if it looks like a file path
 */
function isFilePath(value) {
    return /^\.{0,2}\//.test(value);
}
/**
 * Simple path utilities that work in both Node.js and Workers
 */
const pathUtils = {
    /**
     * Check if a path is absolute (starts with /)
     */
    isAbsolute(filePath) {
        return filePath.startsWith('/');
    },
    /**
     * Join path segments
     */
    join(...segments) {
        return segments.join('/').replace(/\/+/g, '/').replace(/\/$/, '');
    },
    /**
     * Get the basename of a path
     */
    basename(filePath) {
        const parts = filePath.split('/');
        return parts[parts.length - 1] || '';
    },
    /**
     * Normalize a path (resolve . and ..)
     */
    normalize(filePath) {
        const parts = filePath.split('/');
        const result = [];
        for (const part of parts) {
            if (part === '..') {
                result.pop();
            }
            else if (part !== '.' && part !== '') {
                result.push(part);
            }
        }
        const normalized = result.join('/');
        return filePath.startsWith('/') ? '/' + normalized : normalized;
    },
};
/**
 * Loads content from KV storage (Workers-compatible file loading)
 *
 * In Cloudflare Workers, we can't use the filesystem directly.
 * Instead, files should be stored in KV and loaded from there.
 *
 * @param filePath - Path to file (used as KV key)
 * @param context - Resolution context with KV bindings
 * @returns File content as string
 */
async function loadFromKV(filePath, context) {
    // Normalize the path for KV lookup
    const normalizedPath = pathUtils.normalize(filePath).replace(/^\.\//, '');
    // Try COMPONENTS KV first, then EDGIT
    const kv = context.env?.COMPONENTS || context.env?.EDGIT;
    if (!kv) {
        throw new Error(`Cannot load file "${filePath}" in Workers runtime without KV storage.\n` +
            `Configure COMPONENTS or EDGIT KV namespace, or use inline content instead.`);
    }
    try {
        const content = await kv.get(`files/${normalizedPath}`);
        if (content) {
            return content;
        }
        // Try without prefix
        const contentAlt = await kv.get(normalizedPath);
        if (contentAlt) {
            return contentAlt;
        }
        throw new Error(`File not found in KV: ${normalizedPath}`);
    }
    catch (error) {
        throw new Error(`Failed to load file from KV: ${filePath}\n` +
            `Looked for keys: files/${normalizedPath}, ${normalizedPath}\n` +
            `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Resolves a component reference from Edgit KV
 *
 * @param ref - Component reference (e.g., "prompts/extraction@v1.0.0")
 * @param context - Resolution context
 * @returns Resolved component content
 */
async function resolveComponentRef(ref, context) {
    const [pathPart, version] = ref.split('@');
    // Try Edgit KV (if available)
    if (context.env?.EDGIT) {
        const edgitPath = `components/${pathPart}/${version}`;
        try {
            const content = await context.env.EDGIT.get(edgitPath);
            if (content) {
                // Parse if it's YAML/JSON, otherwise return as string
                try {
                    return JSON.parse(content);
                }
                catch {
                    return content;
                }
            }
        }
        catch (error) {
            logger.warn(`Failed to fetch from Edgit: ${edgitPath}`, { error: String(error) });
            // Fall through to COMPONENTS KV
        }
    }
    // Try COMPONENTS KV as fallback
    if (context.env?.COMPONENTS) {
        const componentPath = `${pathPart}/${version}`;
        try {
            const content = await context.env.COMPONENTS.get(componentPath);
            if (content) {
                try {
                    return JSON.parse(content);
                }
                catch {
                    return content;
                }
            }
        }
        catch (error) {
            logger.warn(`Failed to fetch from COMPONENTS: ${componentPath}`, { error: String(error) });
        }
    }
    throw new Error(`Component not found: ${ref}\n` +
        `Tried EDGIT: components/${pathPart}/${version}\n` +
        `Tried COMPONENTS: ${pathPart}/${version}\n` +
        `Make sure the component is stored in KV storage.`);
}
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
export async function resolveValue(value, context) {
    // CASE 1: Non-string (object, array, number, boolean, null)
    // → Use as-is (inline value)
    if (typeof value !== 'string') {
        return {
            content: value,
            source: 'inline',
            originalRef: value,
        };
    }
    // CASE 2: Multi-line string
    // → Inline content (prompt text, markdown, etc.)
    if (value.includes('\n')) {
        return {
            content: value,
            source: 'inline',
            originalRef: value,
        };
    }
    // CASE 3: File path (starts with ./ or ../ or /)
    // → Load from KV storage (Workers don't have filesystem access)
    if (isFilePath(value)) {
        const content = await loadFromKV(value, context);
        return {
            content,
            source: 'file',
            originalRef: value,
        };
    }
    // CASE 4: Component reference (path/name@version)
    // → Resolve from Edgit or COMPONENTS KV
    if (isComponentReference(value)) {
        const content = await resolveComponentRef(value, context);
        const [pathPart, version] = value.split('@');
        return {
            content,
            source: 'component',
            originalRef: value,
            metadata: {
                path: pathPart,
                version,
                fromEdgit: !!context.env?.EDGIT,
            },
        };
    }
    // CASE 5: Unversioned component (path/name without @)
    // → Resolve with @latest
    if (isUnversionedComponent(value)) {
        const versionedRef = `${value}@latest`;
        const content = await resolveComponentRef(versionedRef, context);
        return {
            content,
            source: 'component',
            originalRef: value,
            metadata: {
                path: value,
                version: 'latest',
                fromEdgit: !!context.env?.EDGIT,
            },
        };
    }
    // CASE 6: Everything else
    // → Inline string value
    return {
        content: value,
        source: 'inline',
        originalRef: value,
    };
}
/**
 * Helper to check if a value needs resolution
 * (i.e., it's a file path or component reference)
 *
 * @param value - Value to check
 * @returns True if value needs async resolution
 */
export function needsResolution(value) {
    if (typeof value !== 'string') {
        return false;
    }
    // File path
    if (isFilePath(value)) {
        return true;
    }
    // Component reference
    if (isComponentReference(value) || isUnversionedComponent(value)) {
        return true;
    }
    return false;
}
// Export path utilities for testing
export { pathUtils };
