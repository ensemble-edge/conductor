/**
 * PageLoader
 *
 * Auto-discovers pages and registers them with Hono via HonoConductorBridge
 */
import { HonoConductorBridge } from './hono-bridge.js';
import { OperationRegistry } from '../runtime/operation-registry.js';
export class PageLoader {
    constructor(app, config = {}) {
        // Get GLOBAL operation registry
        this.operationRegistry = OperationRegistry.getInstance();
        // Pass registry to bridge
        this.bridge = new HonoConductorBridge(app, this.operationRegistry);
        this.config = {
            pagesDir: config.pagesDir || './pages',
            indexFiles: config.indexFiles || ['index', 'home'],
            notFoundPage: config.notFoundPage || 'error-404',
            errorPage: config.errorPage || 'error-500',
        };
    }
    /**
     * Auto-discover pages and register with Hono
     */
    async discoverPages(pagesMap) {
        const registeredRoutes = [];
        for (const [pageName, { config, agent }] of pagesMap) {
            try {
                // Check if page has route configuration
                let pageConfig = config;
                // Auto-generate route if not provided
                if (!pageConfig.route) {
                    const path = this.pageNameToPath(pageName);
                    pageConfig = {
                        ...config,
                        route: {
                            path,
                            methods: ['GET'],
                        },
                    };
                }
                // Register with Hono via bridge
                this.bridge.registerPage(pageConfig, agent);
                registeredRoutes.push(`${pageConfig.route.methods?.join('|') || 'GET'} ${pageConfig.route.path}`);
                console.log(`[PageLoader] Registered page: ${pageName} → ${pageConfig.route.path}`);
            }
            catch (error) {
                console.error(`[PageLoader] Failed to register page: ${pageName}`, error);
            }
        }
        console.log(`[PageLoader] Registered ${registeredRoutes.length} routes`);
    }
    /**
     * Register layout
     */
    registerLayout(name, agent) {
        this.bridge.registerLayout(name, agent);
    }
    /**
     * Convert page name to route path using conventions
     */
    pageNameToPath(name) {
        // Handle index files
        if (this.config.indexFiles?.includes(name)) {
            return '/';
        }
        // Convert name to path
        let path = name
            .replace(/\./g, '/') // dots become slashes
            .replace(/\[([^\]]+)\]/g, ':$1'); // [param] → :param
        // Handle directory index files
        // blog-index → /blog
        // blog/index → /blog
        for (const indexFile of this.config.indexFiles || []) {
            if (path.endsWith(`/${indexFile}`) || path.endsWith(`-${indexFile}`)) {
                path = path.replace(new RegExp(`[/-]${indexFile}$`), '');
                break;
            }
        }
        return `/${path}` || '/';
    }
}
