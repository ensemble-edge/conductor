/**
 * Email Template Loader
 *
 * Loads and renders email templates from local files or KV storage
 * Supports Handlebars templating and Edgit versioning
 */
/**
 * Email Template Loader
 */
export class TemplateLoader {
    constructor(config = {}) {
        this.kv = config.kv;
        this.localDir = config.localDir || 'templates';
        this.defaultVersion = config.defaultVersion || 'latest';
        this.cache = new Map();
    }
    /**
     * Load and render template
     */
    async render(template, data = {}) {
        // Parse template reference
        const ref = this.parseTemplateRef(template);
        // Load template content
        const content = await this.loadTemplate(ref);
        // Render template
        return this.renderTemplate(content, data);
    }
    /**
     * Parse template reference
     */
    parseTemplateRef(template) {
        // KV reference: kv://templates/email/welcome@v1.0.0
        if (template.startsWith('kv://')) {
            const path = template.slice(5);
            const [pathPart, version] = path.split('@');
            return {
                type: 'kv',
                path: pathPart,
                version: version || this.defaultVersion,
            };
        }
        // Local file reference: templates/email/welcome.html
        if (template.includes('/') || template.endsWith('.html') || template.endsWith('.mjml')) {
            return {
                type: 'local',
                path: template,
            };
        }
        // Inline HTML
        return {
            type: 'inline',
            path: template,
        };
    }
    /**
     * Load template from storage
     */
    async loadTemplate(ref) {
        // Check cache first
        const cacheKey = `${ref.type}:${ref.path}${ref.version ? `@${ref.version}` : ''}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        let content;
        switch (ref.type) {
            case 'kv':
                content = await this.loadFromKv(ref.path, ref.version);
                break;
            case 'local':
                content = await this.loadFromLocal(ref.path);
                break;
            case 'inline':
                content = ref.path;
                break;
        }
        // Cache template
        this.cache.set(cacheKey, content);
        return content;
    }
    /**
     * Load template from KV
     */
    async loadFromKv(path, version) {
        if (!this.kv) {
            throw new Error('KV namespace not configured for template loading');
        }
        // Build KV key: templates/email/welcome@v1.0.0
        const key = version ? `${path}@${version}` : path;
        const content = await this.kv.get(key, 'text');
        if (!content) {
            throw new Error(`Template not found in KV: ${key}`);
        }
        return content;
    }
    /**
     * Load template from local file system
     */
    async loadFromLocal(path) {
        // In Cloudflare Workers, we can't access the file system directly
        // Templates must be bundled with the Worker or loaded from KV
        throw new Error('Local file system access not available in Cloudflare Workers. ' +
            'Use KV storage (kv://...) or inline templates instead.');
    }
    /**
     * Render template with Handlebars
     */
    renderTemplate(content, data) {
        // Simple Handlebars-style variable replacement
        // For more complex templates, use the handlebars library
        let rendered = content;
        // Replace {{variable}} with data values
        rendered = rendered.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const trimmedKey = key.trim();
            // Handle nested properties: {{user.name}}
            const value = this.getNestedValue(data, trimmedKey);
            // Return value or empty string if undefined
            return value !== undefined ? String(value) : '';
        });
        // Handle {{#if condition}} blocks (simple implementation)
        rendered = rendered.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
            const value = this.getNestedValue(data, condition.trim());
            return value ? content : '';
        });
        // Handle {{#each array}} blocks (simple implementation)
        rendered = rendered.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayKey, template) => {
            const array = this.getNestedValue(data, arrayKey.trim());
            if (!Array.isArray(array))
                return '';
            return array
                .map((item) => {
                // Render template for each item
                return this.renderTemplate(template, { ...data, this: item });
            })
                .join('');
        });
        return rendered;
    }
    /**
     * Get nested value from object
     */
    getNestedValue(obj, path) {
        if (path === 'this')
            return obj;
        const keys = path.split('.');
        let value = obj;
        for (const key of keys) {
            if (value === undefined || value === null)
                return undefined;
            value = value[key];
        }
        return value;
    }
    /**
     * Clear template cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Preload template into cache
     */
    async preload(template) {
        const ref = this.parseTemplateRef(template);
        await this.loadTemplate(ref);
    }
}
/**
 * Create template loader instance
 */
export function createTemplateLoader(config) {
    return new TemplateLoader(config);
}
