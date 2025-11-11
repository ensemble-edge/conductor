/**
 * Email Template Loader
 *
 * Loads and renders email templates from local files or KV storage
 * Supports Handlebars templating and Edgit versioning
 */
import { resolveValue } from '../../utils/component-resolver.js';
/**
 * Email Template Loader
 */
export class TemplateLoader {
    constructor(config) {
        this.engine = config.engine;
        this.kv = config.kv;
        this.localDir = config.localDir || 'templates';
        this.defaultVersion = config.defaultVersion || 'latest';
        this.cache = new Map();
    }
    /**
     * Load and render template
     */
    async render(template, data = {}, env) {
        // Use component resolver for unified handling
        const context = {
            env,
            baseDir: process.cwd(),
        };
        // Resolve template content (supports inline, file paths, and component references)
        const resolved = await resolveValue(template, context);
        const content = typeof resolved.content === 'string'
            ? resolved.content
            : JSON.stringify(resolved.content);
        // Render template with template engine
        return await this.engine.render(content, data);
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
        // Must end with file extension and not contain HTML tags
        const isFilePath = (template.endsWith('.html') || template.endsWith('.mjml')) && !template.includes('<');
        if (isFilePath) {
            return {
                type: 'local',
                path: template,
            };
        }
        // Inline HTML (everything else)
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
