/**
 * HTML Member
 *
 * Renders HTML templates with support for:
 * - Multiple template engines (Simple, Handlebars, Liquid, MJML)
 * - Template loading from KV, R2, or inline
 * - Cookie management (set, read, delete, signed cookies)
 * - CSS inlining for email compatibility
 * - HTML minification
 */
import { BaseMember } from '../base-member.js';
import { loadTemplate, normalizeTemplateSource } from './utils/template-loader.js';
import { createTemplateEngine } from './engines/index.js';
import { SimpleTemplateEngine } from './engines/simple.js';
import { createComponentLoader } from '../../runtime/component-loader.js';
import { createSetCookieHeader, createDeleteCookie, parseSignedCookies, isValidCookieName, mergeCookieOptions } from './utils/cookies.js';
export class HtmlMember extends BaseMember {
    constructor(config) {
        super(config);
        this.htmlConfig = config;
        // Validate configuration
        this.validateConfig();
    }
    /**
     * Validate member configuration
     */
    validateConfig() {
        if (!this.htmlConfig.template) {
            throw new Error('HTML member requires a template configuration');
        }
    }
    /**
     * Execute HTML rendering
     */
    async run(context) {
        const startTime = Date.now();
        const input = context.input;
        // Load template
        const templateSource = input.template
            ? normalizeTemplateSource(input.template)
            : this.htmlConfig.template;
        const templateResult = await loadTemplate(templateSource, context.env);
        // Parse request cookies if provided
        const requestCookies = input.cookies || {};
        let readCookies = {};
        if (Object.keys(requestCookies).length > 0) {
            if (this.htmlConfig.cookieSecret) {
                // Parse and verify signed cookies
                const parsed = await parseSignedCookies(requestCookies, this.htmlConfig.cookieSecret);
                readCookies = Object.entries(parsed).reduce((acc, [name, cookie]) => {
                    acc[name] = cookie.value;
                    return acc;
                }, {});
            }
            else {
                readCookies = requestCookies;
            }
        }
        // Render template
        const engine = createTemplateEngine(templateResult.engine);
        // Set up ComponentLoader for component/partial support
        if (context.env.COMPONENTS && engine instanceof SimpleTemplateEngine) {
            // Create cache instance if CACHE binding exists
            let cache;
            if (context.env.CACHE) {
                const { KVRepository } = await import('../../storage/index.js');
                const { RepositoryCache } = await import('../../cache/cache.js');
                const repository = new KVRepository(context.env.CACHE);
                cache = new RepositoryCache(repository, {
                    keyPrefix: 'conductor:cache:',
                    defaultTTL: 3600
                });
            }
            const componentLoader = createComponentLoader({
                kv: context.env.COMPONENTS,
                cache,
                logger: context.logger
            });
            engine.setComponentLoader(componentLoader);
        }
        const templateContext = {
            data: {
                ...input.data,
                // Add cookies to template data
                cookies: readCookies
            },
            helpers: this.getDefaultHelpers(),
            partials: {}
        };
        let html = await engine.render(templateResult.content, templateContext);
        // Apply layout if specified
        if (input.layout && engine instanceof SimpleTemplateEngine) {
            const layoutContent = await this.loadLayoutContent(input.layout, context, engine);
            if (layoutContent) {
                // Render layout with content inserted
                html = await engine.render(layoutContent, {
                    data: {
                        ...templateContext.data,
                        content: html // Make rendered HTML available as {{content}}
                    },
                    helpers: templateContext.helpers,
                    partials: templateContext.partials
                });
            }
        }
        // Apply render options
        const renderOptions = { ...this.htmlConfig.renderOptions, ...input.renderOptions };
        if (renderOptions?.inlineCss) {
            html = await this.inlineCss(html);
        }
        if (renderOptions?.minify) {
            html = this.minifyHtml(html);
        }
        // Process cookies to set
        const setCookieHeaders = [];
        if (input.setCookies && input.setCookies.length > 0) {
            for (const cookie of input.setCookies) {
                if (!isValidCookieName(cookie.name)) {
                    throw new Error(`Invalid cookie name: ${cookie.name}`);
                }
                const options = mergeCookieOptions(cookie.options, this.htmlConfig.defaultCookieOptions);
                const header = await createSetCookieHeader({ ...cookie, options }, this.htmlConfig.cookieSecret);
                setCookieHeaders.push(header);
            }
        }
        // Process cookies to delete
        if (input.deleteCookies && input.deleteCookies.length > 0) {
            for (const cookieName of input.deleteCookies) {
                const deleteHeader = createDeleteCookie(cookieName, this.htmlConfig.defaultCookieOptions);
                setCookieHeaders.push(deleteHeader);
            }
        }
        const renderTime = Date.now() - startTime;
        return {
            html,
            cookies: setCookieHeaders.length > 0 ? setCookieHeaders : undefined,
            readCookies: Object.keys(readCookies).length > 0 ? readCookies : undefined,
            engine: templateResult.engine,
            metadata: {
                renderTime,
                templateSize: templateResult.content.length,
                outputSize: html.length,
                cssInlined: renderOptions?.inlineCss || false,
                minified: renderOptions?.minify || false
            }
        };
    }
    /**
     * Load layout content from ComponentLoader or registered partial
     */
    async loadLayoutContent(layout, context, engine) {
        // Check if it's a URI (contains ://)
        if (layout.includes('://')) {
            // Load from ComponentLoader
            if (context.env.COMPONENTS) {
                // Create cache instance if CACHE binding exists
                let cache;
                if (context.env.CACHE) {
                    const { KVRepository } = await import('../../storage/index.js');
                    const { RepositoryCache } = await import('../../cache/cache.js');
                    const repository = new KVRepository(context.env.CACHE);
                    cache = new RepositoryCache(repository, {
                        keyPrefix: 'conductor:cache:',
                        defaultTTL: 3600
                    });
                }
                const componentLoader = createComponentLoader({
                    kv: context.env.COMPONENTS,
                    cache,
                    logger: context.logger
                });
                try {
                    return await componentLoader.load(layout);
                }
                catch (error) {
                    context.logger?.warn('Failed to load layout', { layout, error });
                    return null;
                }
            }
        }
        // If not a URI, it might be a registered partial name
        // For now, return null and let the caller handle
        return null;
    }
    /**
     * Get default template helpers
     */
    getDefaultHelpers() {
        return {
            // Date formatting
            formatDate: (date, format) => {
                const d = typeof date === 'string' ? new Date(date) : date;
                return d.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            },
            // String helpers
            uppercase: (str) => str.toUpperCase(),
            lowercase: (str) => str.toLowerCase(),
            capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),
            // Number formatting
            currency: (amount, currency = 'USD') => {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency
                }).format(amount);
            },
            // Conditional helpers
            eq: (a, b) => a === b,
            ne: (a, b) => a !== b,
            lt: (a, b) => a < b,
            gt: (a, b) => a > b,
            and: (...args) => args.every(Boolean),
            or: (...args) => args.some(Boolean)
        };
    }
    /**
     * Inline CSS for email compatibility
     * Simple implementation - for production use a library like juice
     */
    async inlineCss(html) {
        // Extract <style> tags
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        const styles = [];
        let match;
        while ((match = styleRegex.exec(html)) !== null) {
            styles.push(match[1]);
        }
        if (styles.length === 0) {
            return html;
        }
        // Simple CSS inlining (basic implementation)
        // In production, use a library like juice for proper CSS parsing
        let result = html;
        for (const style of styles) {
            // Parse simple CSS rules (class and id selectors only)
            const rules = style.match(/([.#][\w-]+)\s*\{([^}]+)\}/g);
            if (rules) {
                for (const rule of rules) {
                    const [, selector, properties] = rule.match(/([.#][\w-]+)\s*\{([^}]+)\}/) || [];
                    if (selector && properties) {
                        const trimmedProps = properties.trim();
                        // Apply to elements with matching class or id
                        if (selector.startsWith('.')) {
                            const className = selector.slice(1);
                            const classRegex = new RegExp(`(<[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*)(>)`, 'g');
                            result = result.replace(classRegex, `$1 style="${trimmedProps}"$2`);
                        }
                        else if (selector.startsWith('#')) {
                            const idName = selector.slice(1);
                            const idRegex = new RegExp(`(<[^>]*id=["']${idName}["'][^>]*)(>)`, 'g');
                            result = result.replace(idRegex, `$1 style="${trimmedProps}"$2`);
                        }
                    }
                }
            }
        }
        // Remove <style> tags after inlining
        result = result.replace(styleRegex, '');
        return result;
    }
    /**
     * Minify HTML (basic implementation)
     */
    minifyHtml(html) {
        return html
            // Remove comments
            .replace(/<!--[\s\S]*?-->/g, '')
            // Remove whitespace between tags
            .replace(/>\s+</g, '><')
            // Remove leading/trailing whitespace
            .trim();
    }
}
