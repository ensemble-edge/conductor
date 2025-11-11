/**
 * Page Router
 *
 * Automatic routing system for Page members:
 * - Auto-discovery of pages from /pages directory
 * - Convention-based routing (directory structure = routes)
 * - Explicit route configuration in YAML
 * - Dynamic route parameters (:id, :slug, etc.)
 * - Index page support
 * - 404 handling
 */

import type { ConductorEnv } from '../types/env.js'
import { PageMember } from '../members/page/page-member.js'
import type { MemberConfig } from '../runtime/parser.js'

export interface PageRoute {
  path: string
  methods: string[]
  page: PageMember
  params?: string[]  // Extracted parameter names from :param syntax
  aliases?: string[]
  auth?: 'none' | 'required' | 'optional'
  rateLimit?: {
    requests: number
    window: number
  }
}

export interface PageRouterConfig {
  pagesDir?: string
  autoRoute?: boolean
  basePath?: string
  indexFiles?: string[]
  notFoundPage?: string
  beforeRender?: (page: PageMember, request: Request, env: ConductorEnv) => Promise<Record<string, any>>
}

export class PageRouter {
  private routes: PageRoute[] = []
  private pages: Map<string, PageMember> = new Map()
  private config: PageRouterConfig

  constructor(config: PageRouterConfig = {}) {
    this.config = {
      pagesDir: config.pagesDir || './pages',
      autoRoute: config.autoRoute !== false,
      basePath: config.basePath || '',
      indexFiles: config.indexFiles || ['index', 'home'],
      notFoundPage: config.notFoundPage || 'error-404',
      beforeRender: config.beforeRender,
    }
  }

  /**
   * Register a page with explicit route configuration
   */
  registerPage(pageConfig: MemberConfig, pageMember: PageMember): void {
    const routeConfig = (pageConfig.config as any)?.route

    if (!routeConfig) {
      // No route config - skip for now (will be handled by auto-discovery)
      return
    }

    const path = this.normalizePath(routeConfig.path || `/${pageConfig.name}`)
    const params = this.extractParams(path)

    const route: PageRoute = {
      path,
      methods: routeConfig.methods || ['GET'],
      page: pageMember,
      params,
      aliases: routeConfig.aliases?.map((a: string) => this.normalizePath(a)),
      auth: routeConfig.auth,
      rateLimit: routeConfig.rateLimit,
    }

    this.routes.push(route)

    // Register aliases as separate routes
    if (route.aliases) {
      for (const alias of route.aliases) {
        this.routes.push({
          ...route,
          path: alias,
          aliases: undefined, // Don't duplicate aliases
        })
      }
    }
  }

  /**
   * Auto-discover pages from directory structure
   *
   * Examples:
   * - pages/index.yaml → /
   * - pages/about.yaml → /about
   * - pages/blog/index.yaml → /blog
   * - pages/blog/[slug].yaml → /blog/:slug
   */
  async discoverPages(pagesMap: Map<string, { config: MemberConfig; member: PageMember }>): Promise<void> {
    if (!this.config.autoRoute) return

    for (const [pageName, { config, member }] of pagesMap) {
      // Store page in pages map
      this.pages.set(pageName, member)

      // Skip if already registered with explicit route
      if ((config.config as any)?.route) continue

      // Convert page name to route path
      let path = this.pageNameToPath(pageName)
      path = this.normalizePath(path)

      const params = this.extractParams(path)

      this.routes.push({
        path,
        methods: ['GET'],
        page: member,
        params,
      })
    }

    // Sort routes by specificity (static routes before dynamic)
    this.routes.sort((a, b) => {
      const aStatic = !a.params || a.params.length === 0
      const bStatic = !b.params || b.params.length === 0

      if (aStatic && !bStatic) return -1
      if (!aStatic && bStatic) return 1

      // Both static or both dynamic - sort by path length (longer = more specific)
      return b.path.length - a.path.length
    })
  }

  /**
   * Handle incoming request
   */
  async handle(
    request: Request,
    env: ConductorEnv,
    ctx: ExecutionContext
  ): Promise<Response | null> {
    const url = new URL(request.url)
    const pathname = this.normalizePath(url.pathname)
    const method = request.method

    // Find matching route
    const match = this.findRoute(pathname, method)

    if (!match) {
      // Try 404 page if configured
      if (this.config.notFoundPage) {
        return this.render404(request, env, ctx)
      }
      return null // Let other handlers try
    }

    const { route, params } = match

    // Check auth if required
    if (route.auth === 'required') {
      const authResult = await this.checkAuth(request, env)
      if (!authResult.authorized) {
        return new Response('Unauthorized', { status: 401 })
      }
    }

    // Check rate limit if configured
    if (route.rateLimit) {
      const rateLimitOk = await this.checkRateLimit(request, route.rateLimit, env)
      if (!rateLimitOk) {
        return new Response('Too Many Requests', { status: 429 })
      }
    }

    // Prepare input with route params
    let input: Record<string, any> = { ...params }

    // Add query params
    for (const [key, value] of url.searchParams) {
      input[key] = value
    }

    // Add custom data from beforeRender hook
    if (this.config.beforeRender) {
      const customData = await this.config.beforeRender(route.page, request, env)
      input = { ...input, ...customData }
    }

    // Render page
    try {
      const result = await route.page.execute({
        input,
        env,
        ctx,
        state: {},
        previousOutputs: {},
      })

      if (!result.success) {
        console.error('Page render error:', result.error)
        return new Response('Internal Server Error', { status: 500 })
      }

      const pageOutput = (result.output || result.data) as any;

      // Use headers from PageMember - it already includes Content-Type
      // Don't duplicate the header or it causes "Unknown character encoding" error
      return new Response(pageOutput.html, {
        status: 200,
        headers: pageOutput.headers,
      })
    } catch (error) {
      console.error('Page execution error:', error)
      return new Response('Internal Server Error', { status: 500 })
    }
  }

  /**
   * Find matching route for path and method
   */
  private findRoute(
    pathname: string,
    method: string
  ): { route: PageRoute; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (!route.methods.includes(method)) continue

      const match = this.matchPath(pathname, route.path)
      if (match) {
        return { route, params: match }
      }
    }

    return null
  }

  /**
   * Match pathname against route pattern
   * Returns params if match, null if no match
   */
  private matchPath(pathname: string, pattern: string): Record<string, string> | null {
    const pathParts = pathname.split('/').filter(Boolean)
    const patternParts = pattern.split('/').filter(Boolean)

    if (pathParts.length !== patternParts.length) {
      return null
    }

    const params: Record<string, string> = {}

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i]
      const pathPart = pathParts[i]

      if (patternPart.startsWith(':')) {
        // Dynamic parameter
        const paramName = patternPart.slice(1)
        params[paramName] = decodeURIComponent(pathPart)
      } else if (patternPart !== pathPart) {
        // Static part doesn't match
        return null
      }
    }

    return params
  }

  /**
   * Extract parameter names from path pattern
   * Example: /blog/:slug/comments/:id → ['slug', 'id']
   */
  private extractParams(path: string): string[] {
    const params: string[] = []
    const parts = path.split('/').filter(Boolean)

    for (const part of parts) {
      if (part.startsWith(':')) {
        params.push(part.slice(1))
      }
    }

    return params
  }

  /**
   * Convert page name to route path using conventions
   *
   * Examples:
   * - index → /
   * - about → /about
   * - blog-post → /blog-post
   * - blog/index → /blog
   * - blog/[slug] → /blog/:slug
   * - users/[id]/posts → /users/:id/posts
   */
  private pageNameToPath(name: string): string {
    // Handle index files
    if (this.config.indexFiles?.includes(name)) {
      return '/'
    }

    // Convert name to path
    let path = name
      .replace(/\./g, '/')  // dots become slashes
      .replace(/\[([^\]]+)\]/g, ':$1')  // [param] → :param

    // Handle directory index files
    // blog-index → /blog
    // blog/index → /blog
    for (const indexFile of this.config.indexFiles || []) {
      if (path.endsWith(`/${indexFile}`) || path.endsWith(`-${indexFile}`)) {
        path = path.replace(new RegExp(`[/-]${indexFile}$`), '')
        break
      }
    }

    return path || '/'
  }

  /**
   * Normalize path (ensure leading slash, remove trailing slash)
   */
  private normalizePath(path: string): string {
    const basePath = this.config.basePath || ''
    path = path.startsWith('/') ? path : `/${path}`
    path = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path
    return basePath ? `${basePath}${path}` : path
  }

  /**
   * Check authentication
   */
  private async checkAuth(
    request: Request,
    env: ConductorEnv
  ): Promise<{ authorized: boolean; user?: any }> {
    // TODO: Implement actual auth checking
    // For now, just check for Authorization header
    const authHeader = request.headers.get('Authorization')
    return { authorized: !!authHeader }
  }

  /**
   * Check rate limit
   */
  private async checkRateLimit(
    request: Request,
    limit: { requests: number; window: number },
    env: ConductorEnv
  ): Promise<boolean> {
    // TODO: Implement actual rate limiting using Durable Objects or KV
    // For now, always allow
    return true
  }

  /**
   * Render 404 page
   */
  private async render404(
    request: Request,
    env: ConductorEnv,
    ctx: ExecutionContext
  ): Promise<Response> {
    const notFoundPageName = this.config.notFoundPage

    if (!notFoundPageName) {
      return new Response('Not Found', { status: 404 })
    }

    const notFoundPage = this.pages.get(notFoundPageName)

    if (!notFoundPage) {
      console.warn(`404 page "${notFoundPageName}" not found in pages map`)
      return new Response('Not Found', { status: 404 })
    }

    try {
      const result = await notFoundPage.execute({
        input: {
          message: null, // Can be customized
          searchEnabled: false,
          helpfulLinks: []
        },
        env,
        ctx,
        state: {},
        previousOutputs: {},
      })

      if (!result.success) {
        console.error('404 page render error:', result.error)
        return new Response('Not Found', { status: 404 })
      }

      const pageOutput = (result.output || result.data) as any;

      // Use headers from PageMember - it already includes Content-Type
      // Don't duplicate the header or it causes "Unknown character encoding" error
      return new Response(pageOutput.html, {
        status: 404,
        headers: pageOutput.headers,
      })
    } catch (error) {
      console.error('404 page execution error:', error)
      return new Response('Not Found', { status: 404 })
    }
  }

  /**
   * Get all registered routes (for debugging/inspection)
   */
  getRoutes(): PageRoute[] {
    return [...this.routes]
  }
}
