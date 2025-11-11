/**
 * Page Member
 *
 * JSX/compiled page components with:
 * - Server-side rendering (SSR)
 * - Props passing and data binding
 * - Client-side hydration (htmx, progressive, islands)
 * - SEO optimization
 * - Layout support
 */

import { BaseMember, type MemberExecutionContext } from '../base-member.js'
import type { MemberConfig } from '../../runtime/parser.js'
import type {
  PageMemberConfig,
  PageMemberInput,
  PageMemberOutput,
  PageComponent,
  PageHead,
  HydrationConfig,
  SEOData,
} from './types/index.js'
import { renderPageHead } from './utils/head-renderer.js'
import { renderHydrationScript } from './utils/hydration.js'
import { HandlebarsTemplateEngine } from '../../utils/templates/engines/handlebars.js'
import { SimpleTemplateEngine } from '../../utils/templates/engines/simple.js'
import { LiquidTemplateEngine } from '../../utils/templates/engines/liquid.js'
import type { BaseTemplateEngine } from '../../utils/templates/engines/base.js'

export class PageMember extends BaseMember {
  private pageConfig: PageMemberConfig
  private templateEngine: BaseTemplateEngine

  constructor(config: MemberConfig) {
    super(config)
    this.pageConfig = config as MemberConfig & PageMemberConfig

    // Initialize template engine based on config (default: liquid)
    const engineType = this.pageConfig.templateEngine || 'liquid'
    switch (engineType) {
      case 'simple':
        this.templateEngine = new SimpleTemplateEngine()
        break
      case 'liquid':
        this.templateEngine = new LiquidTemplateEngine()
        break
      case 'handlebars':
        this.templateEngine = new HandlebarsTemplateEngine()
        break
      default:
        this.templateEngine = new LiquidTemplateEngine()
        break
    }

    // Validate configuration
    this.validateConfig()
  }

  /**
   * Validate member configuration
   */
  private validateConfig(): void {
    // Check for component at root level OR nested in config (backward compatibility)
    const component = this.pageConfig.component || (this.pageConfig as any).config?.component
    const componentPath =
      this.pageConfig.componentPath || (this.pageConfig as any).config?.componentPath

    if (!component && !componentPath) {
      throw new Error('Page member requires either component or componentPath')
    }

    // If component/componentPath found in config wrapper, migrate to root level
    if ((this.pageConfig as any).config?.component && !this.pageConfig.component) {
      this.pageConfig.component = (this.pageConfig as any).config.component
    }
    if ((this.pageConfig as any).config?.componentPath && !this.pageConfig.componentPath) {
      this.pageConfig.componentPath = (this.pageConfig as any).config.componentPath
    }

    // Validate render mode
    if (
      this.pageConfig.renderMode &&
      !['ssr', 'static', 'hybrid'].includes(this.pageConfig.renderMode)
    ) {
      throw new Error(`Invalid render mode: ${this.pageConfig.renderMode}`)
    }

    // Validate hydration strategy
    if (
      this.pageConfig.hydration?.strategy &&
      !['none', 'htmx', 'progressive', 'islands'].includes(this.pageConfig.hydration.strategy)
    ) {
      throw new Error(`Invalid hydration strategy: ${this.pageConfig.hydration.strategy}`)
    }
  }

  /**
   * Execute page rendering
   */
  protected async run(context: MemberExecutionContext): Promise<PageMemberOutput> {
    const input = context.input as PageMemberInput
    const startTime = Date.now()

    try {
      // Check cache if enabled
      if (this.pageConfig.cache?.enabled) {
        const cached = await this.checkCache(input, context)
        if (cached) {
          return {
            ...cached,
            cacheStatus: 'hit',
          }
        }
      }

      // Call handler function if provided
      let handlerData: Record<string, any> = {}
      if (this.pageConfig.handler) {
        try {
          const handlerContext = {
            request: (input as any).request || input.request,
            env: context.env,
            ctx: context.ctx,
            params: (input as any).params || {},
            query: (input as any).query || {},
            headers: (input as any).headers || {},
          }
          handlerData = await this.pageConfig.handler(handlerContext)
        } catch (error) {
          console.error('Handler error:', error)
          // Continue rendering with empty handler data
        }
      }

      // Get page component
      const component = await this.loadComponent(context)

      // Merge props - include default input from page config, handler data, then runtime data
      const props = {
        ...(this.pageConfig.input || {}), // Default input from YAML
        ...handlerData, // Handler data
        ...input.data, // Runtime data
        ...input.props, // Runtime props
      }

      // Only add params, query, headers if they exist (for dynamic pages)
      if ((input as any).params) {
        props.params = (input as any).params
      }
      if ((input as any).query) {
        props.query = (input as any).query
      }
      if ((input as any).headers) {
        props.headers = (input as any).headers
      }
      if (input.request) {
        props.request = input.request
      }

      // Render component
      const renderMode = this.pageConfig.renderMode || 'ssr'
      let bodyHtml: string

      switch (renderMode) {
        case 'ssr':
          bodyHtml = await this.renderSSR(component, props, context)
          break
        case 'static':
          bodyHtml = await this.renderStatic(component, props, context)
          break
        case 'hybrid':
          bodyHtml = await this.renderHybrid(component, props, context)
          break
        default:
          bodyHtml = await this.renderSSR(component, props, context)
      }

      // Apply layout if configured
      if (this.pageConfig.layout) {
        bodyHtml = await this.applyLayout(bodyHtml, props, context)
      }

      // Merge head configuration
      const head = this.mergeHeadConfig(input.head)

      // Build page head HTML
      const headHtml = renderPageHead(head, this.pageConfig.seo)

      // Build hydration script if needed
      const hydrationConfig = this.mergeHydrationConfig(input.hydration)
      const hydrationHtml = this.buildHydrationHtml(hydrationConfig, props)

      // Combine into full HTML document
      const fullHtml = this.buildFullPage(headHtml, bodyHtml, hydrationHtml)

      // Prepare output
      const output: PageMemberOutput = {
        html: fullHtml,
        status: 200,
        headers: this.buildHeaders(hydrationConfig),
        props,
        renderTime: Date.now() - startTime,
        cacheStatus: 'miss',
        seo: this.buildSEOData(head),
      }

      // Cache if enabled
      if (this.pageConfig.cache?.enabled) {
        await this.cacheOutput(input, output, context)
      }

      return output
    } catch (error) {
      // Render error page if configured
      if (this.pageConfig.errorComponent) {
        return this.renderErrorPage(error as Error, context)
      }

      throw error
    }
  }

  /**
   * Load page component
   */
  private async loadComponent(context: MemberExecutionContext): Promise<PageComponent> {
    // If component is provided inline, evaluate it
    if (this.pageConfig.component) {
      // Return a function that renders the Handlebars template with props
      return async (props) => {
        const template = this.pageConfig.component || ''
        // Render the template with Handlebars
        return await this.templateEngine.render(template, props)
      }
    }

    // Load from componentPath
    if (this.pageConfig.componentPath) {
      // In production, this would load and compile the component file
      // For now, return a placeholder
      throw new Error('Component loading from path not yet implemented')
    }

    throw new Error('No component available')
  }

  /**
   * Render component with SSR
   */
  private async renderSSR(
    component: PageComponent,
    props: Record<string, unknown>,
    context: MemberExecutionContext
  ): Promise<string> {
    // Call component function with props
    const html = await component(props)
    return html
  }

  /**
   * Render static component
   */
  private async renderStatic(
    component: PageComponent,
    props: Record<string, unknown>,
    context: MemberExecutionContext
  ): Promise<string> {
    // Static rendering is same as SSR but with no hydration
    return this.renderSSR(component, props, context)
  }

  /**
   * Render hybrid component (SSR + client hydration)
   */
  private async renderHybrid(
    component: PageComponent,
    props: Record<string, unknown>,
    context: MemberExecutionContext
  ): Promise<string> {
    // Hybrid rendering includes data attributes for hydration
    const html = await this.renderSSR(component, props, context)

    // Add data attributes for hydration
    return this.addHydrationMarkers(html, props)
  }

  /**
   * Add hydration markers to HTML
   */
  private addHydrationMarkers(html: string, props: Record<string, unknown>): string {
    // Add data-props attribute to root element for client-side hydration
    const propsJson = JSON.stringify(props)
    const encoded = Buffer.from(propsJson).toString('base64')

    // Wrap in div with hydration data
    return `<div data-hydrate="true" data-props="${encoded}">${html}</div>`
  }

  /**
   * Apply layout to page content
   */
  private async applyLayout(
    content: string,
    props: Record<string, unknown>,
    context: MemberExecutionContext
  ): Promise<string> {
    if (!this.pageConfig.layout) {
      return content
    }

    // Load layout component
    // For now, simple slot replacement
    const layoutProps = {
      ...this.pageConfig.layout.props,
      children: content,
    }

    // Simple layout template
    return `<div class="layout">${content}</div>`
  }

  /**
   * Merge head configuration
   */
  private mergeHeadConfig(inputHead?: Partial<PageHead>): PageHead {
    return {
      ...this.pageConfig.head,
      ...inputHead,
      meta: [...(this.pageConfig.head?.meta || []), ...(inputHead?.meta || [])],
      links: [...(this.pageConfig.head?.links || []), ...(inputHead?.links || [])],
      scripts: [...(this.pageConfig.head?.scripts || []), ...(inputHead?.scripts || [])],
    }
  }

  /**
   * Merge hydration configuration
   */
  private mergeHydrationConfig(inputHydration?: Partial<HydrationConfig>): HydrationConfig {
    const defaultConfig: HydrationConfig = {
      strategy: this.pageConfig.hydration?.strategy || 'none',
    }

    return {
      ...defaultConfig,
      ...this.pageConfig.hydration,
      ...inputHydration,
    }
  }

  /**
   * Build hydration HTML
   */
  private buildHydrationHtml(
    hydrationConfig: HydrationConfig,
    props: Record<string, unknown>
  ): string {
    if (hydrationConfig.strategy === 'none') {
      return ''
    }

    return renderHydrationScript(hydrationConfig, props)
  }

  /**
   * Build full HTML page
   */
  private buildFullPage(head: string, body: string, hydration: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
	${head}
</head>
<body>
	${body}
	${hydration}
</body>
</html>`
  }

  /**
   * Build response headers
   */
  private buildHeaders(hydrationConfig: HydrationConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'text/html; charset=utf-8',
    }

    // Add cache headers if configured
    if (this.pageConfig.cache?.enabled) {
      const ttl = this.pageConfig.cache.ttl || 3600
      headers['Cache-Control'] = `public, max-age=${ttl}`

      // Add stale-while-revalidate support
      if (this.pageConfig.cache.staleWhileRevalidate) {
        headers['Cache-Control'] +=
          `, stale-while-revalidate=${this.pageConfig.cache.staleWhileRevalidate}`
      }

      // Add Vary headers for cache key variation
      if (this.pageConfig.cache.vary) {
        headers['Vary'] = this.pageConfig.cache.vary.join(', ')
      }

      // Add cache tags for smart invalidation
      if (this.pageConfig.cache.tags?.length) {
        headers['Cache-Tag'] = this.pageConfig.cache.tags.join(',')
      }
    }

    return headers
  }

  /**
   * Build SEO data
   */
  private buildSEOData(head: PageHead): SEOData {
    const titleMeta = head.meta?.find((m) => m.name === 'title' || m.property === 'og:title')
    const descMeta = head.meta?.find(
      (m) => m.name === 'description' || m.property === 'og:description'
    )

    return {
      title: head.title || titleMeta?.content || '',
      description: descMeta?.content,
      canonical: this.pageConfig.seo?.canonical,
      og: head.og,
      twitter: head.twitter,
      jsonLd: this.pageConfig.seo?.jsonLd,
    }
  }

  /**
   * Check cache for existing render
   */
  private async checkCache(
    input: PageMemberInput,
    context: MemberExecutionContext
  ): Promise<PageMemberOutput | null> {
    if (!this.pageConfig.cache?.enabled) {
      return null
    }

    const cacheKey = this.generatePageCacheKey(input)
    const cached = await context.env.PAGE_CACHE?.get(cacheKey, 'json')

    if (cached) {
      return cached as PageMemberOutput
    }

    return null
  }

  /**
   * Cache rendered output
   */
  private async cacheOutput(
    input: PageMemberInput,
    output: PageMemberOutput,
    context: MemberExecutionContext
  ): Promise<void> {
    if (!this.pageConfig.cache?.enabled) {
      return
    }

    const cacheKey = this.generatePageCacheKey(input)
    const ttl = this.pageConfig.cache.ttl || 3600

    await context.env.PAGE_CACHE?.put(cacheKey, JSON.stringify(output), { expirationTtl: ttl })
  }

  /**
   * Generate cache key
   * Note: This is a different signature than BaseMember.generateCacheKey
   */
  private generatePageCacheKey(input: PageMemberInput): string {
    if (this.pageConfig.cache?.keyGenerator) {
      // Use custom key generator function
      // For now, use simple hash
    }

    // Default: hash of URL + props
    const url = input.request?.url || ''
    const propsHash = JSON.stringify(input.props || {})
    return `page:${this.name}:${url}:${propsHash}`
  }

  /**
   * Render error page
   */
  private async renderErrorPage(
    error: Error,
    context: MemberExecutionContext
  ): Promise<PageMemberOutput> {
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
</html>`

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
    }
  }
}
