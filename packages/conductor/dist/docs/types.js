/**
 * Docs Definition Types
 *
 * Type definitions for the docs/ first-class component directory.
 * Docs configuration is passed via the docs-serve ensemble's flow config.
 *
 * @example In docs-serve ensemble (ensembles/system/docs/serve.yaml):
 * ```yaml
 * name: docs-serve
 * trigger:
 *   - type: http
 *     path: /docs
 *     public: true
 *
 * flow:
 *   - name: render
 *     agent: docs
 *     config:
 *       title: API Documentation
 *       ui: stoplight
 *       theme:
 *         primaryColor: '#3B82F6'
 * ```
 */
/**
 * Reserved routes in docs
 * These are auto-generated from agents, ensembles, and OpenAPI spec
 */
export const RESERVED_ROUTES = [
    'agents',
    'ensembles',
    'api',
    'openapi.json',
    'openapi.yaml',
];
/**
 * Check if a slug is a reserved route
 */
export function isReservedRoute(slug) {
    return RESERVED_ROUTES.includes(slug);
}
/**
 * Internal default values for nav config
 */
const DEFAULT_NAV = {
    order: [],
    hide: [],
    groups: undefined,
    showReserved: {
        agents: true,
        ensembles: true,
        api: true,
    },
    reservedPosition: 'bottom',
    reservedLabels: {
        agents: 'Agents',
        ensembles: 'Ensembles',
        api: 'API Reference',
    },
};
/**
 * Default docs definition values
 *
 * These defaults are used when no configuration is passed via
 * the docs-serve ensemble's flow config.
 */
export const DEFAULT_DOCS_DEFINITION = {
    name: 'docs',
    description: 'API Documentation',
    nav: DEFAULT_NAV,
    // From DocsConfig
    title: 'API Documentation',
    ui: 'stoplight',
    theme: {
        primaryColor: '#3b82f6',
        darkMode: false,
    },
    auth: {
        requirement: 'required', // SECURE BY DEFAULT
    },
    cache: {
        enabled: true,
        ttl: 300,
    },
    includeExamples: true,
    includeSecurity: true,
    format: 'yaml',
    outputDir: './docs',
    ai: {
        enabled: false,
        model: '@cf/meta/llama-3.1-8b-instruct',
        provider: 'cloudflare',
        temperature: 0.3,
    },
    include: [],
    exclude: [],
    servers: [],
};
/**
 * Merge user definition with defaults
 */
export function mergeDocsDefinition(userDef) {
    if (!userDef) {
        return { ...DEFAULT_DOCS_DEFINITION };
    }
    return {
        ...DEFAULT_DOCS_DEFINITION,
        ...userDef,
        nav: {
            ...DEFAULT_NAV,
            ...userDef.nav,
            showReserved: {
                ...DEFAULT_NAV.showReserved,
                ...userDef.nav?.showReserved,
            },
            reservedLabels: {
                ...DEFAULT_NAV.reservedLabels,
                ...userDef.nav?.reservedLabels,
            },
        },
        theme: {
            ...DEFAULT_DOCS_DEFINITION.theme,
            ...userDef.theme,
        },
        auth: {
            ...DEFAULT_DOCS_DEFINITION.auth,
            ...userDef.auth,
        },
        cache: {
            ...DEFAULT_DOCS_DEFINITION.cache,
            ...userDef.cache,
        },
        ai: {
            ...DEFAULT_DOCS_DEFINITION.ai,
            ...userDef.ai,
        },
    };
}
