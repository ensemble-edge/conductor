/**
 * API Agent Engine
 *
 * Makes HTTP requests to external APIs
 * Handles method, headers, body, timeouts, and response parsing
 */

import { BaseAgent, type AgentExecutionContext } from './base-agent.js'
import type { AgentConfig } from '../runtime/parser.js'
import type { RouteAuthConfig } from '../routing/config.js'

export interface APIConfig {
  /** Route configuration for UnifiedRouter integration */
  route?: {
    /** Route path (e.g., "/api/v1/users") */
    path?: string
    /** HTTP methods (defaults to ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']) */
    methods?: string[]
    /** Auth configuration */
    auth?: Partial<RouteAuthConfig>
    /** Priority (defaults to 50 for APIs) */
    priority?: number
    /** Response headers to add/override */
    headers?: Record<string, string>
    /** CORS configuration */
    cors?: {
      origins?: string[] | '*'
      methods?: string[]
      allowedHeaders?: string[]
      exposedHeaders?: string[]
      credentials?: boolean
      maxAge?: number
    }
  }
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  timeout?: number
  retries?: number
}

/**
 * API Agent makes HTTP requests to external services
 *
 * @example User's agent definition:
 * ```yaml
 * # agents/fetch-company/agent.yaml
 * name: fetch-company
 * type: API
 * description: Fetch company data from external API
 * config:
 *   url: https://api.example.com/company
 *   method: GET
 *   headers:
 *     Authorization: Bearer ${env.API_KEY}
 *   timeout: 5000
 * schema:
 *   input:
 *     domain: string
 *   output:
 *     data: object
 * ```
 */
export class APIAgent extends BaseAgent {
  private apiConfig: APIConfig

  constructor(config: AgentConfig) {
    super(config)

    // Extract API-specific config
    const cfg = config.config as APIConfig | undefined
    this.apiConfig = {
      url: cfg?.url,
      method: cfg?.method || 'GET',
      headers: cfg?.headers || {},
      timeout: cfg?.timeout || 30000,
      retries: cfg?.retries || 0,
    }
  }

  /**
   * Execute the API request
   */
  protected async run(
    context: AgentExecutionContext
  ): Promise<{ status: number; headers: Record<string, string>; data: unknown }> {
    const { input } = context

    // Resolve URL (may contain interpolations)
    const url = this.apiConfig.url || input.url
    if (!url) {
      throw new Error(`API agent "${this.name}" requires a URL (in config or input)`)
    }

    // Build request options
    const requestInit: RequestInit = {
      method: this.apiConfig.method,
      headers: this.resolveHeaders(this.apiConfig.headers || {}, context),
    }

    // Add body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(this.apiConfig.method!)) {
      if (input.body) {
        requestInit.body = typeof input.body === 'string' ? input.body : JSON.stringify(input.body)

        // Set content-type if not already set
        const headers = requestInit.headers as Record<string, string>
        if (!headers['content-type'] && !headers['Content-Type']) {
          headers['content-type'] = 'application/json'
        }
      }
    }

    // Execute with timeout and retries
    return await this.executeWithRetries(url, requestInit)
  }

  /**
   * Resolve headers (may contain env var references)
   */
  private resolveHeaders(
    headers: Record<string, string>,
    context: AgentExecutionContext
  ): Record<string, string> {
    const resolved: Record<string, string> = {}

    for (const [key, value] of Object.entries(headers)) {
      // Replace ${env.VAR_NAME} with actual env var
      resolved[key] = value.replace(/\$\{env\.(\w+)\}/g, (_, varName) => {
        return ((context.env as unknown as Record<string, unknown>)[varName] as string) || ''
      })
    }

    return resolved
  }

  /**
   * Execute request with timeout and retry logic
   */
  private async executeWithRetries(
    url: string,
    init: RequestInit,
    attempt: number = 0
  ): Promise<{ status: number; headers: Record<string, string>; data: unknown }> {
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.apiConfig.timeout)

      try {
        // Make the request
        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Parse response
        const contentType = response.headers.get('content-type')
        let data: unknown

        if (contentType?.includes('application/json')) {
          data = await response.json()
        } else {
          data = await response.text()
        }

        // Check if response was successful
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          data,
        }
      } finally {
        clearTimeout(timeoutId)
      }
    } catch (error) {
      // Retry logic
      if (attempt < (this.apiConfig.retries || 0)) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
        await new Promise((resolve) => setTimeout(resolve, delay))

        return this.executeWithRetries(url, init, attempt + 1)
      }

      // Final error
      throw new Error(
        `API request to ${url} failed after ${attempt + 1} attempts: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Get API configuration
   */
  getAPIConfig(): APIConfig {
    return { ...this.apiConfig }
  }
}
