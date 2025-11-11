/**
 * Component Resolution Utility
 *
 * Implements Alternative 1: Smart String Parsing
 *
 * Resolves values to their actual content:
 * - Inline values (strings, objects, arrays)
 * - File paths (./path/to/file)
 * - Component references (type/name@version)
 *
 * @module component-resolver
 */
import * as fs from 'fs/promises';
import * as path from 'path';
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
 * Loads content from a file path
 *
 * @param filePath - Path to file (relative or absolute)
 * @param context - Resolution context
 * @returns File content as string
 */
async function loadFromFile(filePath, context) {
    const baseDir = context.baseDir || process.cwd();
    const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(baseDir, filePath);
    try {
        return await fs.readFile(absolutePath, 'utf-8');
    }
    catch (error) {
        throw new Error(`Failed to load file: ${filePath}\nResolved to: ${absolutePath}\nError: ${error}`);
    }
}
/**
 * Resolves a component reference from Edgit or local fallback
 *
 * @param ref - Component reference (e.g., "prompts/extraction@v1.0.0")
 * @param context - Resolution context
 * @returns Resolved component content
 */
async function resolveComponentRef(ref, context) {
    const [pathPart, version] = ref.split('@');
    // Try Edgit first (if available)
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
            console.warn(`Failed to fetch from Edgit: ${edgitPath}`, error);
            // Fall through to local fallback
        }
    }
    // Local fallback: path/to/component@version → ./path/to/component.yaml
    const localPath = `./${pathPart}.yaml`;
    try {
        const content = await loadFromFile(localPath, context);
        // Try parsing as YAML (simple parse, just JSON for now)
        try {
            return JSON.parse(content);
        }
        catch {
            return content;
        }
    }
    catch (error) {
        throw new Error(`Component not found: ${ref}\n` +
            `Tried Edgit: components/${pathPart}/${version}\n` +
            `Tried local: ${localPath}\n` +
            `Error: ${error}`);
    }
}
/**
 * Resolves any value to its actual content
 *
 * This is the main entry point for Alternative 1: Smart String Parsing
 *
 * Resolution logic:
 * 1. Non-string → inline value
 * 2. Multi-line string → inline content
 * 3. Starts with ./ or / → file path
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
 * // File path
 * await resolveValue("./prompts/my-prompt.md", ctx)
 * // → { content: "<file content>", source: "file", ... }
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
    // → Load from filesystem
    if (value.match(/^\.{0,2}\//)) {
        const content = await loadFromFile(value, context);
        return {
            content,
            source: 'file',
            originalRef: value,
        };
    }
    // CASE 4: Component reference (path/name@version)
    // → Resolve from Edgit or local
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
    if (value.match(/^\.{0,2}\//)) {
        return true;
    }
    // Component reference
    if (isComponentReference(value) || isUnversionedComponent(value)) {
        return true;
    }
    return false;
}
