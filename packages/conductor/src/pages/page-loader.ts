/**
 * PageLoader
 *
 * Auto-discovers pages and registers them with Hono via HonoConductorBridge
 */

import type { Hono } from 'hono'
import { HonoConductorBridge } from './hono-bridge.js'
import type { PageAgent } from '../agents/page/page-agent.js'
import type { AgentConfig } from '../runtime/parser.js'
import type { PageRouteConfig } from './hono-bridge.js'
import { OperationRegistry } from '../runtime/operation-registry.js'

export interface PageLoaderConfig {
  pagesDir?: string
  indexFiles?: string[]
  notFoundPage?: string
  errorPage?: string
}

export class PageLoader {
  private bridge: HonoConductorBridge
  private config: PageLoaderConfig
  private operationRegistry: OperationRegistry

  constructor(app: Hono, config: PageLoaderConfig = {}) {
    // Get GLOBAL operation registry
    this.operationRegistry = OperationRegistry.getInstance()

    // Pass registry to bridge
    this.bridge = new HonoConductorBridge(app, this.operationRegistry)

    this.config = {
      pagesDir: config.pagesDir || './pages',
      indexFiles: config.indexFiles || ['index', 'home'],
      notFoundPage: config.notFoundPage || 'error-404',
      errorPage: config.errorPage || 'error-500',
    }
  }

  /**
   * Auto-discover pages and register with Hono
   */
  async discoverPages(
    pagesMap: Map<string, { config: AgentConfig; agent: PageAgent }>
  ): Promise<void> {
    const registeredRoutes: string[] = []

    for (const [pageName, { config, agent }] of pagesMap) {
      try {
        // Check if page has route configuration
        let pageConfig = config as any

        // Auto-generate route if not provided
        if (!pageConfig.route) {
          const path = this.pageNameToPath(pageName)
          pageConfig = {
            ...config,
            route: {
              path,
              methods: ['GET'],
            },
          }
        }

        // Register with Hono via bridge
        this.bridge.registerPage(pageConfig as PageRouteConfig, agent)

        registeredRoutes.push(
          `${pageConfig.route.methods?.join('|') || 'GET'} ${pageConfig.route.path}`
        )

        console.log(`[PageLoader] Registered page: ${pageName} → ${pageConfig.route.path}`)
      } catch (error) {
        console.error(`[PageLoader] Failed to register page: ${pageName}`, error)
      }
    }

    console.log(`[PageLoader] Registered ${registeredRoutes.length} routes`)
  }

  /**
   * Register layout
   */
  registerLayout(name: string, agent: PageAgent): void {
    this.bridge.registerLayout(name, agent)
  }

  /**
   * Convert page name to route path using conventions
   */
  private pageNameToPath(name: string): string {
    // Handle index files
    if (this.config.indexFiles?.includes(name)) {
      return '/'
    }

    // Convert name to path
    let path = name
      .replace(/\./g, '/') // dots become slashes
      .replace(/\[([^\]]+)\]/g, ':$1') // [param] → :param

    // Handle directory index files
    // blog-index → /blog
    // blog/index → /blog
    for (const indexFile of this.config.indexFiles || []) {
      if (path.endsWith(`/${indexFile}`) || path.endsWith(`-${indexFile}`)) {
        path = path.replace(new RegExp(`[/-]${indexFile}$`), '')
        break
      }
    }

    return `/${path}` || '/'
  }
}
