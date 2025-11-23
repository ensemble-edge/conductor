/**
 * Prompt Manager
 *
 * Manages prompt templates with:
 * - YAML loading from files or strings
 * - In-memory caching for performance
 * - Variable substitution
 * - Version management
 * - Template validation
 */
import { validatePromptVariables, applyDefaultVariables } from './prompt-schema.js';
import { PromptParser } from './prompt-parser.js';
export class PromptManager {
    constructor(config = {}) {
        this.cache = new Map();
        this.config = {
            cacheEnabled: config.cacheEnabled ?? true,
            strictValidation: config.strictValidation ?? false,
            parserOptions: config.parserOptions || {},
        };
        this.parser = new PromptParser(this.config.parserOptions);
    }
    /**
     * Load prompt from YAML string
     */
    loadFromYAML(yaml) {
        // Simple YAML parser (for basic use cases)
        // In production, use a proper YAML library
        const template = this.parseSimpleYAML(yaml);
        return template;
    }
    /**
     * Load prompt from JSON string
     */
    loadFromJSON(json) {
        return JSON.parse(json);
    }
    /**
     * Register a prompt template in cache
     */
    register(template) {
        const key = this.getCacheKey(template.metadata.name, template.metadata.version);
        this.cache.set(key, template);
    }
    /**
     * Get a prompt template from cache
     */
    get(name, version) {
        const key = this.getCacheKey(name, version || 'latest');
        return this.cache.get(key) || null;
    }
    /**
     * Check if a prompt exists in cache
     */
    has(name, version) {
        const key = this.getCacheKey(name, version || 'latest');
        return this.cache.has(key);
    }
    /**
     * List all cached prompts
     */
    list() {
        return Array.from(this.cache.values()).map((template) => ({
            name: template.metadata.name,
            version: template.metadata.version,
        }));
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Render a prompt with variables
     */
    render(template, variables, options) {
        const opts = {
            validate: options?.validate ?? this.config.strictValidation,
            parserOptions: options?.parserOptions || this.config.parserOptions,
        };
        // Apply default variables
        const finalVariables = applyDefaultVariables(template, variables);
        // Validate variables
        if (opts.validate) {
            const validation = validatePromptVariables(template, finalVariables);
            if (!validation.valid) {
                const errorMessages = validation.errors.map((e) => e.message).join(', ');
                throw new Error(`Prompt validation failed: ${errorMessages}`);
            }
        }
        // Parse template
        const content = this.parser.parse(template.template, finalVariables, opts.parserOptions);
        return {
            content,
            metadata: {
                name: template.metadata.name,
                version: template.metadata.version,
                variables: finalVariables,
            },
        };
    }
    /**
     * Render a prompt by name from cache
     */
    renderByName(name, variables, version, options) {
        const template = this.get(name, version);
        if (!template) {
            throw new Error(`Prompt not found: ${name}${version ? `@${version}` : ''}`);
        }
        return this.render(template, variables, options);
    }
    /**
     * Get cache key
     */
    getCacheKey(name, version) {
        return `${name}@${version}`;
    }
    /**
     * Simple YAML parser (basic implementation)
     * For production use, replace with a proper YAML library like js-yaml
     */
    parseSimpleYAML(yaml) {
        const lines = yaml.split('\n');
        const template = {
            metadata: {},
            variables: [],
            template: '',
        };
        let currentSection = null;
        let currentVariable = null;
        let templateLines = [];
        for (let line of lines) {
            // Skip comments
            if (line.trim().startsWith('#')) {
                continue;
            }
            // Detect sections
            if (line.match(/^metadata:/)) {
                currentSection = 'metadata';
                continue;
            }
            else if (line.match(/^variables:/)) {
                currentSection = 'variables';
                continue;
            }
            else if (line.match(/^template:/)) {
                currentSection = 'template';
                continue;
            }
            // Parse metadata
            if (currentSection === 'metadata' && template.metadata) {
                const match = line.match(/^\s+(\w+):\s*(.+)$/);
                if (match) {
                    const [, key, value] = match;
                    template.metadata[key] = value.replace(/['"]/g, '');
                }
            }
            // Parse variables
            if (currentSection === 'variables' && template.variables) {
                // New variable
                if (line.match(/^\s+-\s+name:/)) {
                    if (currentVariable) {
                        template.variables.push(currentVariable);
                    }
                    currentVariable = {};
                    const match = line.match(/name:\s*(.+)$/);
                    if (match) {
                        currentVariable.name = match[1].replace(/['"]/g, '');
                    }
                }
                else if (currentVariable) {
                    const match = line.match(/^\s+(\w+):\s*(.+)$/);
                    if (match) {
                        const [, key, value] = match;
                        let parsedValue = value.replace(/['"]/g, '');
                        if (key === 'required') {
                            parsedValue = parsedValue === 'true';
                        }
                        currentVariable[key] = parsedValue;
                    }
                }
            }
            // Parse template
            if (currentSection === 'template') {
                // Collect template lines (preserve indentation)
                if (line.trim().length > 0 && !line.match(/^template:/)) {
                    // Remove leading pipe if present (YAML multiline)
                    const cleaned = line.replace(/^\s+\|?\s*/, '');
                    templateLines.push(cleaned);
                }
            }
        }
        // Add last variable
        if (currentVariable && template.variables) {
            template.variables.push(currentVariable);
        }
        // Join template lines
        template.template = templateLines.join('\n');
        return template;
    }
    /**
     * Convert template to YAML string
     */
    toYAML(template) {
        const lines = [];
        // Metadata
        lines.push('metadata:');
        lines.push(`  name: "${template.metadata.name}"`);
        lines.push(`  version: "${template.metadata.version}"`);
        if (template.metadata.description) {
            lines.push(`  description: "${template.metadata.description}"`);
        }
        if (template.metadata.author) {
            lines.push(`  author: "${template.metadata.author}"`);
        }
        // Variables
        if (template.variables && template.variables.length > 0) {
            lines.push('');
            lines.push('variables:');
            for (const variable of template.variables) {
                lines.push(`  - name: "${variable.name}"`);
                lines.push(`    type: "${variable.type}"`);
                if (variable.description) {
                    lines.push(`    description: "${variable.description}"`);
                }
                if (variable.required !== undefined) {
                    lines.push(`    required: ${variable.required}`);
                }
                if (variable.default !== undefined) {
                    lines.push(`    default: ${JSON.stringify(variable.default)}`);
                }
            }
        }
        // Template
        lines.push('');
        lines.push('template: |');
        const templateLines = template.template.split('\n');
        for (const line of templateLines) {
            lines.push(`  ${line}`);
        }
        return lines.join('\n');
    }
}
/**
 * Global prompt manager instance
 */
let globalManager = null;
/**
 * Get or create the global prompt manager
 */
export function getGlobalPromptManager(config) {
    if (!globalManager) {
        globalManager = new PromptManager(config);
    }
    return globalManager;
}
