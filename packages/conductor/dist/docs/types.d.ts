/**
 * Docs Definition Types
 *
 * Type definitions for the docs/ first-class component directory.
 * Docs definitions use route config (like agents) for consistency.
 *
 * @example YAML format (docs/docs.yaml):
 * ```yaml
 * name: docs
 * description: API Documentation for MyApp
 *
 * route:
 *   path: /docs           # Change to /help, /reference, etc.
 *   methods: [GET]
 *   auth:
 *     requirement: public
 *   priority: 50
 *
 * title: My API Documentation
 * ui: scalar
 * theme:
 *   primaryColor: '#3B82F6'
 *   darkMode: true
 * ```
 */
import type { DocsConfig } from '../config/types.js';
import type { RouteAuthConfig } from '../routing/config.js';
/**
 * Route configuration for docs (same pattern as agents)
 */
export interface DocsRouteConfig {
    /** Route path (default: /docs) */
    path?: string;
    /** HTTP methods (default: [GET]) */
    methods?: string[];
    /** Auth configuration */
    auth?: Partial<RouteAuthConfig>;
    /** Priority (default: 50) */
    priority?: number;
}
/**
 * Navigation group for organizing docs into sections
 */
export interface DocsNavGroup {
    /** Group title displayed in sidebar */
    title: string;
    /** Icon for the group (emoji or icon name) */
    icon?: string;
    /** Pages in this group (slugs or glob patterns) */
    items: string[];
    /** Whether group is collapsed by default */
    collapsed?: boolean;
}
/**
 * Navigation configuration
 *
 * @example Basic ordering:
 * ```yaml
 * nav:
 *   order:
 *     - getting-started
 *     - authentication
 *     - guides/*
 *   hide:
 *     - internal-notes
 * ```
 *
 * @example With groups:
 * ```yaml
 * nav:
 *   groups:
 *     - title: Getting Started
 *       icon: 🚀
 *       items: [overview, quickstart, installation]
 *     - title: Guides
 *       icon: 📖
 *       items: [guides/*]
 *     - title: API Reference
 *       icon: 📚
 *       items: [api/*]
 *       collapsed: true
 * ```
 */
export interface DocsNavConfig {
    /**
     * Ordered list of page slugs or glob patterns
     * Supports: 'page-name', 'folder/*', 'folder/**'
     */
    order?: string[];
    /** Pages to hide from navigation (slugs or globs) */
    hide?: string[];
    /**
     * Navigation groups for organizing into sections
     * If provided, takes precedence over flat `order`
     */
    groups?: DocsNavGroup[];
    /** Show reserved sections (agents, ensembles, api) */
    showReserved?: {
        agents?: boolean;
        ensembles?: boolean;
        api?: boolean;
    };
    /** Position of reserved sections: 'top' | 'bottom' (default: 'bottom') */
    reservedPosition?: 'top' | 'bottom';
    /** Custom labels for reserved sections */
    reservedLabels?: {
        agents?: string;
        ensembles?: string;
        api?: string;
    };
}
/**
 * Frontmatter metadata for markdown docs
 */
export interface DocsFrontmatter {
    /** Page title (used in nav and header) */
    title?: string;
    /** Page description (for SEO/preview) */
    description?: string;
    /** Navigation order (lower = first) */
    order?: number;
    /** Hide from navigation */
    hidden?: boolean;
    /** Icon for navigation (emoji or icon name) */
    icon?: string;
    /** Category/group for organization */
    category?: string;
    /** Custom metadata */
    [key: string]: unknown;
}
/**
 * Parsed markdown document
 */
export interface DocsPage {
    /** Page slug (file name without extension) */
    slug: string;
    /** File path relative to docs/ */
    path: string;
    /** Raw markdown content */
    content: string;
    /** Parsed frontmatter */
    frontmatter: DocsFrontmatter;
    /** Computed title (from frontmatter or first heading) */
    title: string;
    /** Navigation order */
    order: number;
}
/**
 * Navigation item for docs
 */
export interface DocsNavItem {
    /** Item slug */
    slug: string;
    /** Display title */
    title: string;
    /** Icon (emoji or icon name) */
    icon?: string;
    /** URL path */
    path: string;
    /** Whether this is the active page */
    active?: boolean;
    /** Whether this is a reserved section (agents, ensembles, api) */
    reserved?: boolean;
    /** Child items for nested navigation */
    children?: DocsNavItem[];
}
/**
 * Docs definition - configuration for the docs/ directory
 *
 * This is the root configuration file (docs/docs.yaml or docs/docs.ts)
 * that controls how the docs system works.
 */
export interface DocsDefinition extends DocsConfig {
    /** Definition name (default: 'docs') */
    name?: string;
    /** Description of the documentation */
    description?: string;
    /**
     * Route configuration (same pattern as agents)
     * Allows customizing path, auth, priority
     */
    route?: DocsRouteConfig;
    /**
     * Navigation configuration
     */
    nav?: DocsNavConfig;
}
/**
 * Reserved routes in docs
 * These are auto-generated from agents, ensembles, and OpenAPI spec
 */
export declare const RESERVED_ROUTES: readonly ["agents", "ensembles", "api", "openapi.json", "openapi.yaml"];
export type ReservedRoute = (typeof RESERVED_ROUTES)[number];
/**
 * Check if a slug is a reserved route
 */
export declare function isReservedRoute(slug: string): slug is ReservedRoute;
/**
 * Default docs definition values
 */
export declare const DEFAULT_DOCS_DEFINITION: DocsDefinition;
/**
 * Merge user definition with defaults
 */
export declare function mergeDocsDefinition(userDef: Partial<DocsDefinition> | undefined): DocsDefinition;
//# sourceMappingURL=types.d.ts.map