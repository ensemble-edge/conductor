/**
 * Cookies Agent
 *
 * Cookie management operation with:
 * - Read cookies from request (get, getAll)
 * - Set cookies on response (set)
 * - Delete cookies (delete)
 * - Consent integration with location context
 * - Graceful handling of non-HTTP triggers
 */

import { BaseAgent, type AgentExecutionContext } from '../base-agent.js'
import type { AgentConfig } from '../../runtime/parser.js'
import type {
  CookiesConfig,
  CookiesOutput,
  CookieGetOutput,
  CookieGetAllOutput,
  CookieSetOutput,
  CookieDeleteOutput,
  SameSite,
} from './types/index.js'
import { parseCookies, serializeCookie, createDeleteCookie } from '../html/utils/cookies.js'
import type { CookieOptions } from '../html/types/index.js'
import { createLogger } from '../../observability/index.js'

const logger = createLogger({ serviceName: 'cookies-agent' })

/**
 * HTTP-based trigger types that support cookies
 */
const HTTP_TRIGGERS = ['http', 'webhook', 'mcp']

export class CookiesAgent extends BaseAgent {
  private cookiesConfig: CookiesConfig

  constructor(config: AgentConfig) {
    super(config)
    this.cookiesConfig = (config.config || {}) as unknown as CookiesConfig
    this.validateConfig()
  }

  /**
   * Validate agent configuration
   */
  private validateConfig(): void {
    const { action } = this.cookiesConfig

    if (!action) {
      throw new Error('Cookies agent requires an action (get, set, delete, getAll)')
    }

    const validActions = ['get', 'set', 'delete', 'getAll']
    if (!validActions.includes(action)) {
      throw new Error(
        `Invalid cookies action: ${action}. Must be one of: ${validActions.join(', ')}`
      )
    }

    // Validate name is provided for actions that need it
    if (['get', 'set', 'delete'].includes(action) && !this.cookiesConfig.name) {
      throw new Error(`Cookies action "${action}" requires a name`)
    }

    // Validate value is provided for set action
    if (action === 'set' && this.cookiesConfig.value === undefined) {
      throw new Error('Cookies action "set" requires a value')
    }
  }

  /**
   * Execute cookie operation
   */
  protected async run(context: AgentExecutionContext): Promise<CookiesOutput> {
    const { action } = this.cookiesConfig

    // Merge runtime config with static config
    const config: CookiesConfig = {
      ...this.cookiesConfig,
      ...(context.config as Partial<CookiesConfig>),
    }

    switch (action) {
      case 'get':
        return this.handleGet(config, context)
      case 'getAll':
        return this.handleGetAll(context)
      case 'set':
        return this.handleSet(config, context)
      case 'delete':
        return this.handleDelete(config, context)
      default:
        throw new Error(`Unknown cookies action: ${action}`)
    }
  }

  /**
   * Get a single cookie value
   */
  private handleGet(config: CookiesConfig, context: AgentExecutionContext): CookieGetOutput {
    const { name } = config

    // Try to get cookies from input (parsed by trigger) or from request header
    const cookies = this.getCookiesFromContext(context)
    const value = cookies[name!] ?? null

    return {
      value,
      found: value !== null,
    }
  }

  /**
   * Get all cookies
   */
  private handleGetAll(context: AgentExecutionContext): CookieGetAllOutput {
    const cookies = this.getCookiesFromContext(context)

    return {
      cookies,
      count: Object.keys(cookies).length,
    }
  }

  /**
   * Set a cookie
   */
  private handleSet(config: CookiesConfig, context: AgentExecutionContext): CookieSetOutput {
    const { name, value, purpose } = config

    // Check for HTTP context
    const hasHttpContext = this.hasHttpContext(context)
    if (!hasHttpContext) {
      const triggerType = this.getTriggerType(context)
      logger.warn(`cookies operation skipped: no HTTP context (trigger type: ${triggerType})`)
      return {
        success: false,
        header: '',
        skipped: true,
        reason: 'no_http_context',
      }
    }

    // Consent check (integrates with location context)
    if (purpose && purpose !== 'essential') {
      const requiresConsent = context.location?.requiresConsent(purpose) ?? false
      const hasConsent = (context.input as any)?.consents?.[purpose] === true

      if (requiresConsent && !hasConsent) {
        logger.debug(`cookies operation skipped: consent required for purpose "${purpose}"`)
        return {
          success: false,
          header: '',
          skipped: true,
          reason: 'consent_required',
          purpose,
        }
      }
    }

    // Build cookie options
    const options: CookieOptions = {
      path: config.path ?? '/',
      secure: config.secure ?? true,
      httpOnly: config.httpOnly ?? true,
      sameSite: config.sameSite ?? 'lax',
    }

    if (config.maxAge !== undefined) {
      options.maxAge = config.maxAge
    }

    if (config.expires !== undefined) {
      options.expires =
        typeof config.expires === 'string' ? new Date(config.expires) : new Date(config.expires)
    }

    if (config.domain) {
      options.domain = config.domain
    }

    // Build the Set-Cookie header
    const header = serializeCookie(name!, value!, options)

    // Store in context for response building
    this.addSetCookieHeader(context, header)

    return {
      success: true,
      header,
    }
  }

  /**
   * Delete a cookie
   */
  private handleDelete(config: CookiesConfig, context: AgentExecutionContext): CookieDeleteOutput {
    const { name, path } = config

    // Check for HTTP context
    const hasHttpContext = this.hasHttpContext(context)
    if (!hasHttpContext) {
      const triggerType = this.getTriggerType(context)
      logger.warn(`cookies operation skipped: no HTTP context (trigger type: ${triggerType})`)
      return {
        success: false,
        header: '',
        skipped: true,
        reason: 'no_http_context',
      }
    }

    // Build delete cookie header
    const header = createDeleteCookie(name!, { path: path ?? '/' })

    // Store in context for response building
    this.addSetCookieHeader(context, header)

    return {
      success: true,
      header,
    }
  }

  /**
   * Get parsed cookies from context
   * First checks input.cookies (set by trigger), then falls back to parsing request header
   */
  private getCookiesFromContext(context: AgentExecutionContext): Record<string, string> {
    // Check if cookies were already parsed by the trigger
    const input = context.input as any
    if (input?.cookies && typeof input.cookies === 'object') {
      return input.cookies
    }

    // Fall back to parsing from headers
    const cookieHeader = input?.headers?.cookie ?? ''
    if (cookieHeader) {
      return parseCookies(cookieHeader)
    }

    return {}
  }

  /**
   * Check if context has HTTP capabilities
   */
  private hasHttpContext(context: AgentExecutionContext): boolean {
    const input = context.input as any

    // Check for explicit trigger type
    const triggerType = input?._triggerType || input?.triggerType
    if (triggerType && HTTP_TRIGGERS.includes(triggerType)) {
      return true
    }

    // Check for HTTP-like properties (body, method, headers)
    if (input?.method && input?.headers) {
      return true
    }

    // Check for _setCookies array (indicates response capability)
    if (Array.isArray(input?._setCookies)) {
      return true
    }

    return false
  }

  /**
   * Get trigger type from context
   */
  private getTriggerType(context: AgentExecutionContext): string {
    const input = context.input as any
    return input?._triggerType || input?.triggerType || 'unknown'
  }

  /**
   * Add Set-Cookie header to context for response building
   */
  private addSetCookieHeader(context: AgentExecutionContext, header: string): void {
    const input = context.input as any

    // Initialize _setCookies array if not present
    if (!Array.isArray(input._setCookies)) {
      input._setCookies = []
    }

    // Add the header
    input._setCookies.push(header)
  }
}
