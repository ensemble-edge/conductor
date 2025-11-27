/**
 * Prompt Registry
 *
 * Provides typed access to prompt templates with rendering support.
 * Wraps the ComponentRegistry for prompt-specific operations.
 *
 * @module components/prompts
 */
import { parseNameWithVersion } from './registry.js';
/**
 * Prompt registry - access and render prompts
 *
 * @example
 * ```typescript
 * // Get a prompt template
 * const prompt = await ctx.prompts.get('extraction')
 * const promptWithVersion = await ctx.prompts.get('extraction@v1.0.0')
 *
 * // Render with variables
 * const rendered = await ctx.prompts.render('docs-writer', {
 *   page: 'getting-started',
 *   projectName: 'MyApp'
 * })
 * ```
 */
export class PromptRegistry {
    constructor(parent) {
        this.parent = parent;
    }
    /**
     * Get a prompt template by name (with optional @version)
     *
     * Returns the raw prompt template string.
     *
     * @param nameOrRef - Prompt name with optional version
     * @returns Prompt template string
     *
     * @example
     * ```typescript
     * ctx.prompts.get('extraction')           // extraction@latest
     * ctx.prompts.get('extraction@v1.0.0')    // exact version
     * ```
     */
    async get(nameOrRef) {
        const { name, version } = parseNameWithVersion(nameOrRef);
        const ref = `prompts/${name}@${version}`;
        const content = await this.parent.resolve(ref);
        // Handle both string prompts and prompt objects with content field
        if (typeof content === 'string') {
            return content;
        }
        if (content && typeof content.content === 'string') {
            return content.content;
        }
        return String(content);
    }
    /**
     * Get prompt with metadata
     *
     * @param nameOrRef - Prompt name with optional version
     * @returns Prompt template with metadata
     */
    async getWithMetadata(nameOrRef) {
        const { name, version } = parseNameWithVersion(nameOrRef);
        const ref = `prompts/${name}@${version}`;
        const resolved = await this.parent.resolveWithMetadata(ref);
        const content = resolved.content;
        // Handle both string prompts and prompt objects
        if (typeof content === 'string') {
            return {
                content,
                metadata: {
                    name,
                    version: resolved.metadata?.version || version,
                },
            };
        }
        if (content && typeof content.content === 'string') {
            return {
                content: content.content,
                metadata: {
                    name,
                    description: content.description,
                    variables: content.variables,
                    version: resolved.metadata?.version || version,
                },
            };
        }
        return {
            content: String(content),
            metadata: { name, version },
        };
    }
    /**
     * Render a prompt with variables (Handlebars)
     *
     * Uses Handlebars templating to replace variables in the prompt.
     *
     * @param nameOrRef - Prompt name with optional version
     * @param variables - Variables to inject into the template
     * @returns Rendered prompt string
     *
     * @example
     * ```typescript
     * const rendered = await ctx.prompts.render('docs-writer@v1.0.0', {
     *   page: 'getting-started',
     *   projectName: 'MyApp'
     * })
     * ```
     */
    async render(nameOrRef, variables) {
        const template = await this.get(nameOrRef);
        return renderHandlebars(template, variables);
    }
    /**
     * Check if a prompt exists
     *
     * @param nameOrRef - Prompt name with optional version
     * @returns True if prompt exists
     */
    async exists(nameOrRef) {
        try {
            await this.get(nameOrRef);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * List variables used in a prompt template
     *
     * Extracts Handlebars variable references from the template.
     *
     * @param nameOrRef - Prompt name with optional version
     * @returns Array of variable names
     *
     * @example
     * ```typescript
     * const vars = await ctx.prompts.listVariables('docs-writer')
     * // ['page', 'projectName', 'description']
     * ```
     */
    async listVariables(nameOrRef) {
        const template = await this.get(nameOrRef);
        return extractHandlebarsVariables(template);
    }
}
/**
 * Render a Handlebars template
 *
 * Lightweight implementation optimized for Workers.
 * Supports basic Handlebars features:
 * - {{variable}} - Variable substitution
 * - {{nested.path}} - Nested property access
 * - {{#if condition}}...{{/if}} - Conditionals
 * - {{#each items}}...{{/each}} - Iteration
 * - {{#unless condition}}...{{/unless}} - Negative conditionals
 * - {{@index}}, {{@key}} - Loop context
 *
 * @param template - Handlebars template string
 * @param variables - Variables to inject
 * @returns Rendered string
 */
export function renderHandlebars(template, variables) {
    // Use dynamic import to avoid circular dependencies
    // We'll implement a lightweight version for basic cases
    return renderLightweightHandlebars(template, variables);
}
/**
 * Lightweight Handlebars-like renderer
 *
 * Handles most common template patterns without heavy dependencies.
 */
function renderLightweightHandlebars(template, context) {
    let result = template;
    // Helper to get nested value
    const getValue = (path, ctx) => {
        const parts = path.split('.');
        let value = ctx;
        for (const part of parts) {
            if (value === null || value === undefined)
                return undefined;
            value = value[part];
        }
        return value;
    };
    // Process {{#each items}}...{{/each}}
    result = result.replace(/\{\{#each\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, path, content) => {
        const items = getValue(path, context);
        if (!Array.isArray(items))
            return '';
        return items
            .map((item, index) => {
            let itemContent = content;
            // Replace {{this}} with the item
            itemContent = itemContent.replace(/\{\{this\}\}/g, String(item ?? ''));
            // Replace {{@index}}
            itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));
            // Replace item properties if item is an object
            if (typeof item === 'object' && item !== null) {
                itemContent = renderLightweightHandlebars(itemContent, { ...context, ...item });
            }
            return itemContent;
        })
            .join('');
    });
    // Process {{#if condition}}...{{else}}...{{/if}}
    result = result.replace(/\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_, path, ifContent, elseContent = '') => {
        const value = getValue(path, context);
        const isTruthy = value !== false && value !== null && value !== undefined && value !== '' && value !== 0;
        return isTruthy ? renderLightweightHandlebars(ifContent, context) : renderLightweightHandlebars(elseContent, context);
    });
    // Process {{#unless condition}}...{{/unless}}
    result = result.replace(/\{\{#unless\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_, path, content) => {
        const value = getValue(path, context);
        const isTruthy = value !== false && value !== null && value !== undefined && value !== '' && value !== 0;
        return isTruthy ? '' : renderLightweightHandlebars(content, context);
    });
    // Process {{#with obj}}...{{/with}}
    result = result.replace(/\{\{#with\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/with\}\}/g, (_, path, content) => {
        const value = getValue(path, context);
        if (typeof value !== 'object' || value === null)
            return '';
        return renderLightweightHandlebars(content, { ...context, ...value });
    });
    // Replace {{variable}} and {{nested.path}}
    result = result.replace(/\{\{([^#/][^}]*)\}\}/g, (_, path) => {
        const trimmedPath = path.trim();
        const value = getValue(trimmedPath, context);
        if (value === undefined || value === null)
            return '';
        if (typeof value === 'object')
            return JSON.stringify(value);
        return String(value);
    });
    return result;
}
/**
 * Extract variable names from a Handlebars template
 *
 * @param template - Handlebars template string
 * @returns Array of unique variable names
 */
function extractHandlebarsVariables(template) {
    const variables = new Set();
    // Match {{variable}} and {{nested.path}}
    const varRegex = /\{\{([^#/][^}]*)\}\}/g;
    let match;
    while ((match = varRegex.exec(template)) !== null) {
        const path = match[1].trim();
        // Skip special variables like @index, @key
        if (!path.startsWith('@')) {
            // Get root variable name
            const rootVar = path.split('.')[0];
            variables.add(rootVar);
        }
    }
    // Match {{#each items}}
    const eachRegex = /\{\{#each\s+(\w+)/g;
    while ((match = eachRegex.exec(template)) !== null) {
        variables.add(match[1]);
    }
    // Match {{#if condition}}
    const ifRegex = /\{\{#if\s+(\w+(?:\.\w+)*)\}\}/g;
    while ((match = ifRegex.exec(template)) !== null) {
        const rootVar = match[1].split('.')[0];
        variables.add(rootVar);
    }
    // Match {{#unless condition}}
    const unlessRegex = /\{\{#unless\s+(\w+(?:\.\w+)*)\}\}/g;
    while ((match = unlessRegex.exec(template)) !== null) {
        const rootVar = match[1].split('.')[0];
        variables.add(rootVar);
    }
    // Match {{#with obj}}
    const withRegex = /\{\{#with\s+(\w+)/g;
    while ((match = withRegex.exec(template)) !== null) {
        variables.add(match[1]);
    }
    return Array.from(variables).sort();
}
