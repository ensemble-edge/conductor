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

import type { DocsConfig, DocsUIFramework } from '../config/types.js'
import type { RouteAuthConfig } from '../routing/config.js'

/**
 * Route configuration for docs (same pattern as agents)
 */
export interface DocsRouteConfig {
  /** Route path (default: /docs) */
  path?: string
  /** HTTP methods (default: [GET]) */
  methods?: string[]
  /** Auth configuration */
  auth?: Partial<RouteAuthConfig>
  /** Priority (default: 50) */
  priority?: number
}

/**
 * Navigation group for organizing docs into sections
 */
export interface DocsNavGroup {
  /** Group title displayed in sidebar */
  title: string
  /** Icon for the group (emoji or icon name) */
  icon?: string
  /** Pages in this group (slugs or glob patterns) */
  items: string[]
  /** Whether group is collapsed by default */
  collapsed?: boolean
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
  order?: string[]

  /** Pages to hide from navigation (slugs or globs) */
  hide?: string[]

  /**
   * Navigation groups for organizing into sections
   * If provided, takes precedence over flat `order`
   */
  groups?: DocsNavGroup[]

  /** Show reserved sections (agents, ensembles, api) */
  showReserved?: {
    agents?: boolean
    ensembles?: boolean
    api?: boolean
  }

  /** Position of reserved sections: 'top' | 'bottom' (default: 'bottom') */
  reservedPosition?: 'top' | 'bottom'

  /** Custom labels for reserved sections */
  reservedLabels?: {
    agents?: string
    ensembles?: string
    api?: string
  }
}

/**
 * Frontmatter metadata for markdown docs
 */
export interface DocsFrontmatter {
  /** Page title (used in nav and header) */
  title?: string
  /** Page description (for SEO/preview) */
  description?: string
  /** Navigation order (lower = first) */
  order?: number
  /** Hide from navigation */
  hidden?: boolean
  /** Icon for navigation (emoji or icon name) */
  icon?: string
  /** Category/group for organization */
  category?: string
  /** Custom metadata */
  [key: string]: unknown
}

/**
 * Parsed markdown document
 */
export interface DocsPage {
  /** Page slug (file name without extension) */
  slug: string
  /** File path relative to docs/ */
  path: string
  /** Raw markdown content */
  content: string
  /** Parsed frontmatter */
  frontmatter: DocsFrontmatter
  /** Computed title (from frontmatter or first heading) */
  title: string
  /** Navigation order */
  order: number
}

/**
 * Navigation item for docs
 */
export interface DocsNavItem {
  /** Item slug */
  slug: string
  /** Display title */
  title: string
  /** Icon (emoji or icon name) */
  icon?: string
  /** URL path */
  path: string
  /** Whether this is the active page */
  active?: boolean
  /** Whether this is a reserved section (agents, ensembles, api) */
  reserved?: boolean
  /** Child items for nested navigation */
  children?: DocsNavItem[]
}

/**
 * Docs definition - configuration for the docs/ directory
 *
 * This is the root configuration file (docs/docs.yaml or docs/docs.ts)
 * that controls how the docs system works.
 */
export interface DocsDefinition extends DocsConfig {
  /** Definition name (default: 'docs') */
  name?: string

  /** Description of the documentation */
  description?: string

  /**
   * Route configuration (same pattern as agents)
   * Allows customizing path, auth, priority
   */
  route?: DocsRouteConfig

  /**
   * Navigation configuration
   */
  nav?: DocsNavConfig
}

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
] as const
export type ReservedRoute = (typeof RESERVED_ROUTES)[number]

/**
 * Check if a slug is a reserved route
 */
export function isReservedRoute(slug: string): slug is ReservedRoute {
  return RESERVED_ROUTES.includes(slug as ReservedRoute)
}

/**
 * Internal default values for route config
 */
const DEFAULT_ROUTE: Required<DocsRouteConfig> = {
  path: '/docs',
  methods: ['GET'],
  auth: {
    requirement: 'public',
  },
  priority: 50,
}

/**
 * Internal default values for nav config
 */
const DEFAULT_NAV: DocsNavConfig = {
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
}

/**
 * Default docs definition values
 */
export const DEFAULT_DOCS_DEFINITION: DocsDefinition = {
  name: 'docs',
  description: 'API Documentation',
  route: DEFAULT_ROUTE,
  nav: DEFAULT_NAV,
  // From DocsConfig
  title: 'API Documentation',
  ui: 'stoplight',
  theme: {
    primaryColor: '#3b82f6',
    darkMode: false,
  },
  auth: {
    requirement: 'public',
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
}

/**
 * Merge user definition with defaults
 */
export function mergeDocsDefinition(userDef: Partial<DocsDefinition> | undefined): DocsDefinition {
  if (!userDef) {
    return { ...DEFAULT_DOCS_DEFINITION }
  }

  return {
    ...DEFAULT_DOCS_DEFINITION,
    ...userDef,
    route: {
      ...DEFAULT_ROUTE,
      ...userDef.route,
      auth: {
        ...DEFAULT_ROUTE.auth,
        ...userDef.route?.auth,
      },
    },
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
  }
}
