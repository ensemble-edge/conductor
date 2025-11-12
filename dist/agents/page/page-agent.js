/**
 * Page Agent
 *
 * JSX/compiled page components with:
 * - Server-side rendering (SSR)
 * - Props passing and data binding
 * - Client-side hydration (htmx, progressive, islands)
 * - SEO optimization
 * - Layout support
 */
import { BaseAgent } from '../base-agent.js';
import { renderPageHead } from './utils/head-renderer.js';
import { renderHydrationScript } from './utils/hydration.js';
import { HandlebarsTemplateEngine } from '../../utils/templates/engines/handlebars.js';
import { SimpleTemplateEngine } from '../../utils/templates/engines/simple.js';
import { LiquidTemplateEngine } from '../../utils/templates/engines/liquid.js';
export class PageAgent extends BaseAgent {
    constructor(config) {
        super(config);
        this.pageConfig = config;
        // Initialize template engine based on config (default: liquid)
        const engineType = this.pageConfig.templateEngine || 'liquid';
        switch (engineType) {
            case 'simple':
                this.templateEngine = new SimpleTemplateEngine();
                break;
            case 'liquid':
                this.templateEngine = new LiquidTemplateEngine();
                break;
            case 'handlebars':
                this.templateEngine = new HandlebarsTemplateEngine();
                break;
            default:
                this.templateEngine = new LiquidTemplateEngine();
                break;
        }
        // Validate configuration
        this.validateConfig();
    }
    /**
     * Validate agent configuration
     */
    validateConfig() {
        // Check for component at root level OR nested in config (backward compatibility)
        const component = this.pageConfig.component || this.pageConfig.config?.component;
        const componentPath = this.pageConfig.componentPath || this.pageConfig.config?.componentPath;
        if (!component && !componentPath) {
            throw new Error('Page agent requires either component or componentPath');
        }
        // If component/componentPath found in config wrapper, migrate to root level
        if (this.pageConfig.config?.component && !this.pageConfig.component) {
            this.pageConfig.component = this.pageConfig.config.component;
        }
        if (this.pageConfig.config?.componentPath && !this.pageConfig.componentPath) {
            this.pageConfig.componentPath = this.pageConfig.config.componentPath;
        }
        // Validate render mode
        if (this.pageConfig.renderMode &&
            !['ssr', 'static', 'hybrid'].includes(this.pageConfig.renderMode)) {
            throw new Error(`Invalid render mode: ${this.pageConfig.renderMode}`);
        }
        // Validate hydration strategy
        if (this.pageConfig.hydration?.strategy &&
            !['none', 'htmx', 'progressive', 'islands'].includes(this.pageConfig.hydration.strategy)) {
            throw new Error(`Invalid hydration strategy: ${this.pageConfig.hydration.strategy}`);
        }
    }
    /**
     * Execute page rendering
     */
    async run(context) {
        const input = context.input;
        const startTime = Date.now();
        try {
            // Check cache if enabled
            if (this.pageConfig.cache?.enabled) {
                const cached = await this.checkCache(input, context);
                if (cached) {
                    return {
                        ...cached,
                        cacheStatus: 'hit',
                    };
                }
            }
            // Call handler function if provided
            let handlerData = {};
            if (this.pageConfig.handler) {
                try {
                    const handlerContext = {
                        request: input.request || input.request,
                        env: context.env,
                        ctx: context.ctx,
                        params: input.params || {},
                        query: input.query || {},
                        headers: input.headers || {},
                    };
                    handlerData = await this.pageConfig.handler(handlerContext);
                }
                catch (error) {
                    console.error('Handler error:', error);
                    // Continue rendering with empty handler data
                }
            }
            // Get page component
            const component = await this.loadComponent(context);
            // Merge props - include default input from page config, handler data, then runtime data
            const props = {
                ...(this.pageConfig.input || {}), // Default input from YAML
                ...handlerData, // Handler data
                ...input.data, // Runtime data
                ...input.props, // Runtime props
            };
            // Only add params, query, headers if they exist (for dynamic pages)
            if (input.params) {
                props.params = input.params;
            }
            if (input.query) {
                props.query = input.query;
            }
            if (input.headers) {
                props.headers = input.headers;
            }
            if (input.request) {
                props.request = input.request;
            }
            // Render component
            const renderMode = this.pageConfig.renderMode || 'ssr';
            let bodyHtml;
            switch (renderMode) {
                case 'ssr':
                    bodyHtml = await this.renderSSR(component, props, context);
                    break;
                case 'static':
                    bodyHtml = await this.renderStatic(component, props, context);
                    break;
                case 'hybrid':
                    bodyHtml = await this.renderHybrid(component, props, context);
                    break;
                default:
                    bodyHtml = await this.renderSSR(component, props, context);
            }
            // Apply layout if configured
            if (this.pageConfig.layout) {
                bodyHtml = await this.applyLayout(bodyHtml, props, context);
            }
            // Merge head configuration
            const head = this.mergeHeadConfig(input.head);
            // Build page head HTML
            const headHtml = renderPageHead(head, this.pageConfig.seo);
            // Build hydration script if needed
            const hydrationConfig = this.mergeHydrationConfig(input.hydration);
            const hydrationHtml = this.buildHydrationHtml(hydrationConfig, props);
            // Combine into full HTML document
            const fullHtml = this.buildFullPage(headHtml, bodyHtml, hydrationHtml);
            // Prepare output
            const output = {
                html: fullHtml,
                status: 200,
                headers: this.buildHeaders(hydrationConfig),
                props,
                renderTime: Date.now() - startTime,
                cacheStatus: 'miss',
                seo: this.buildSEOData(head),
            };
            // Cache if enabled
            if (this.pageConfig.cache?.enabled) {
                await this.cacheOutput(input, output, context);
            }
            return output;
        }
        catch (error) {
            // Render error page if configured
            if (this.pageConfig.errorComponent) {
                return this.renderErrorPage(error, context);
            }
            throw error;
        }
    }
    /**
     * Load page component
     */
    async loadComponent(context) {
        // If component is provided inline, evaluate it
        if (this.pageConfig.component) {
            // Return a function that renders the Handlebars template with props
            return async (props) => {
                const template = this.pageConfig.component || '';
                // Render the template with Handlebars
                return await this.templateEngine.render(template, props);
            };
        }
        // Load from componentPath
        if (this.pageConfig.componentPath) {
            // In production, this would load and compile the component file
            // For now, return a placeholder
            throw new Error('Component loading from path not yet implemented');
        }
        throw new Error('No component available');
    }
    /**
     * Render component with SSR
     */
    async renderSSR(component, props, context) {
        // Call component function with props
        const html = await component(props);
        return html;
    }
    /**
     * Render static component
     */
    async renderStatic(component, props, context) {
        // Static rendering is same as SSR but with no hydration
        return this.renderSSR(component, props, context);
    }
    /**
     * Render hybrid component (SSR + client hydration)
     */
    async renderHybrid(component, props, context) {
        // Hybrid rendering includes data attributes for hydration
        const html = await this.renderSSR(component, props, context);
        // Add data attributes for hydration
        return this.addHydrationMarkers(html, props);
    }
    /**
     * Add hydration markers to HTML
     */
    addHydrationMarkers(html, props) {
        // Add data-props attribute to root element for client-side hydration
        const propsJson = JSON.stringify(props);
        const encoded = Buffer.from(propsJson).toString('base64');
        // Wrap in div with hydration data
        return `<div data-hydrate="true" data-props="${encoded}">${html}</div>`;
    }
    /**
     * Apply layout to page content
     */
    async applyLayout(content, props, context) {
        if (!this.pageConfig.layout) {
            return content;
        }
        // Load layout component
        // For now, simple slot replacement
        const layoutProps = {
            ...this.pageConfig.layout.props,
            children: content,
        };
        // Simple layout template
        return `<div class="layout">${content}</div>`;
    }
    /**
     * Merge head configuration
     */
    mergeHeadConfig(inputHead) {
        return {
            ...this.pageConfig.head,
            ...inputHead,
            meta: [...(this.pageConfig.head?.meta || []), ...(inputHead?.meta || [])],
            links: [...(this.pageConfig.head?.links || []), ...(inputHead?.links || [])],
            scripts: [...(this.pageConfig.head?.scripts || []), ...(inputHead?.scripts || [])],
        };
    }
    /**
     * Merge hydration configuration
     */
    mergeHydrationConfig(inputHydration) {
        const defaultConfig = {
            strategy: this.pageConfig.hydration?.strategy || 'none',
        };
        return {
            ...defaultConfig,
            ...this.pageConfig.hydration,
            ...inputHydration,
        };
    }
    /**
     * Build hydration HTML
     */
    buildHydrationHtml(hydrationConfig, props) {
        if (hydrationConfig.strategy === 'none') {
            return '';
        }
        return renderHydrationScript(hydrationConfig, props);
    }
    /**
     * Build full HTML page
     */
    buildFullPage(head, body, hydration) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
	${head}
</head>
<body>
	${body}
	${hydration}
</body>
</html>`;
    }
    /**
     * Build response headers
     */
    buildHeaders(hydrationConfig) {
        const headers = {
            'Content-Type': 'text/html; charset=utf-8',
        };
        // Add cache headers if configured
        if (this.pageConfig.cache?.enabled) {
            const ttl = this.pageConfig.cache.ttl || 3600;
            headers['Cache-Control'] = `public, max-age=${ttl}`;
            // Add stale-while-revalidate support
            if (this.pageConfig.cache.staleWhileRevalidate) {
                headers['Cache-Control'] +=
                    `, stale-while-revalidate=${this.pageConfig.cache.staleWhileRevalidate}`;
            }
            // Add Vary headers for cache key variation
            if (this.pageConfig.cache.vary) {
                headers['Vary'] = this.pageConfig.cache.vary.join(', ');
            }
            // Add cache tags for smart invalidation
            if (this.pageConfig.cache.tags?.length) {
                headers['Cache-Tag'] = this.pageConfig.cache.tags.join(',');
            }
        }
        return headers;
    }
    /**
     * Build SEO data
     */
    buildSEOData(head) {
        const titleMeta = head.meta?.find((m) => m.name === 'title' || m.property === 'og:title');
        const descMeta = head.meta?.find((m) => m.name === 'description' || m.property === 'og:description');
        return {
            title: head.title || titleMeta?.content || '',
            description: descMeta?.content,
            canonical: this.pageConfig.seo?.canonical,
            og: head.og,
            twitter: head.twitter,
            jsonLd: this.pageConfig.seo?.jsonLd,
        };
    }
    /**
     * Check cache for existing render
     */
    async checkCache(input, context) {
        if (!this.pageConfig.cache?.enabled) {
            return null;
        }
        const cacheKey = this.generatePageCacheKey(input);
        const cached = await context.env.PAGE_CACHE?.get(cacheKey, 'json');
        if (cached) {
            return cached;
        }
        return null;
    }
    /**
     * Cache rendered output
     */
    async cacheOutput(input, output, context) {
        if (!this.pageConfig.cache?.enabled) {
            return;
        }
        const cacheKey = this.generatePageCacheKey(input);
        const ttl = this.pageConfig.cache.ttl || 3600;
        await context.env.PAGE_CACHE?.put(cacheKey, JSON.stringify(output), { expirationTtl: ttl });
    }
    /**
     * Generate cache key
     * Note: This is a different signature than BaseAgent.generateCacheKey
     */
    generatePageCacheKey(input) {
        if (this.pageConfig.cache?.keyGenerator) {
            // Use custom key generator function
            // For now, use simple hash
        }
        // Default: hash of URL + props
        const url = input.request?.url || '';
        const propsHash = JSON.stringify(input.props || {});
        return `page:${this.name}:${url}:${propsHash}`;
    }
    /**
     * Render error page
     */
    async renderErrorPage(error, context) {
        const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Error</title>
	<style>
		body {
			font-family: system-ui, -apple-system, sans-serif;
			max-width: 600px;
			margin: 100px auto;
			padding: 20px;
			text-align: center;
		}
		h1 { color: #e53e3e; }
		pre {
			background: #f7fafc;
			padding: 15px;
			border-radius: 5px;
			text-align: left;
			overflow-x: auto;
		}
	</style>
</head>
<body>
	<h1>Page Render Error</h1>
	<p>${error.message}</p>
	${this.pageConfig.dev ? `<pre>${error.stack}</pre>` : ''}
</body>
</html>`;
        return {
            html: errorHtml,
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            renderTime: 0,
            cacheStatus: 'bypass',
            seo: {
                title: 'Error',
                description: 'An error occurred while rendering the page',
            },
        };
    }
}
