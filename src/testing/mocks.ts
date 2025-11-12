/**
 * Mock Utilities for Testing
 */

import type { VectorSearchResult } from './types.js'
import type {
  AIProvider,
  AIProviderRequest,
  AIProviderResponse,
  AIProviderConfig,
} from '../agents/think-providers/index.js'
import type { ConductorEnv } from '../types/env.js'
import type { ProviderId } from '../types/branded.js'

/**
 * Mock AI provider for testing
 * Implements the AIProvider interface to integrate with ThinkAgent
 */
export class MockAIProvider implements AIProvider {
  readonly id: ProviderId
  readonly name: string

  private responses: Map<string, unknown | Error>
  private defaultResponse: AIProviderResponse = {
    content: 'Mock AI response',
    model: 'mock-model',
    provider: 'mock',
    tokensUsed: 0,
    metadata: {},
  }
  private onExecute?: (call: {
    agentName?: string
    request: any
    response: any
    timestamp: number
  }) => void

  constructor(
    responses: Record<string, unknown | Error> = {},
    id: string = 'mock',
    sharedResponsesMap?: Map<string, unknown | Error>,
    onExecute?: (call: any) => void
  ) {
    this.id = id as ProviderId
    this.name = `Mock ${id}`
    this.onExecute = onExecute

    // Use shared responses map if provided, otherwise create new one
    if (sharedResponsesMap) {
      this.responses = sharedResponsesMap
    } else {
      this.responses = new Map()
      for (const [key, value] of Object.entries(responses)) {
        this.responses.set(key, value)
      }
    }
  }

  async execute(request: AIProviderRequest): Promise<AIProviderResponse> {
    const timestamp = Date.now()
    let aiResponse: AIProviderResponse

    // Try to match response by context (this is called during agent execution)
    // We'll match by the first available mocked response
    for (const [, response] of this.responses.entries()) {
      if (response instanceof Error) {
        // Track the error call
        if (this.onExecute) {
          this.onExecute({
            request,
            response: { error: response.message },
            timestamp,
          })
        }
        throw response
      }

      // Convert the mocked response to AIProviderResponse format
      if (typeof response === 'object' && response !== null) {
        // If it's already in AIProviderResponse format, use it
        if ('content' in response && typeof response.content === 'string') {
          aiResponse = response as AIProviderResponse
        } else {
          // For test mocks, the response object IS the expected agent output
          // Return it as JSON in content, and ThinkAgent will use it as-is
          // Since ThinkAgent returns AIProviderResponse as the agent data,
          // we return the response directly as the AIProviderResponse,
          // making the mocked object available in the response
          aiResponse = {
            ...response,
            content: JSON.stringify(response),
            model: request.config.model,
            provider: 'mock',
            tokensUsed: 0,
          } as AIProviderResponse
        }
      } else {
        // Fallback: convert to string
        aiResponse = {
          content: String(response),
          model: request.config.model,
          provider: 'mock',
          tokensUsed: 0,
          metadata: {},
        }
      }

      // Track the AI call
      if (this.onExecute) {
        this.onExecute({
          request,
          response: aiResponse,
          timestamp,
        })
      }

      return aiResponse
    }

    // No mocked responses, return default
    aiResponse = this.defaultResponse

    // Track the default response
    if (this.onExecute) {
      this.onExecute({
        request,
        response: aiResponse,
        timestamp,
      })
    }

    return aiResponse
  }

  validateConfig(config: AIProviderConfig, env: ConductorEnv): boolean {
    return this.getConfigError(config, env) === null
  }

  getConfigError(config: AIProviderConfig, env: ConductorEnv): string | null {
    // Mock provider doesn't require API keys
    return null
  }

  setResponse(agentName: string, response: unknown | Error): void {
    this.responses.set(agentName, response)
  }

  getResponse(agentName: string): unknown | Error | undefined {
    return this.responses.get(agentName)
  }

  clear(): void {
    this.responses.clear()
  }

  getResponsesMap(): Map<string, unknown | Error> {
    return this.responses
  }
}

/**
 * Mock database for testing
 */
export class MockDatabase {
  constructor(private tables: Record<string, unknown[]> = {}) {}

  query(table: string): unknown[] {
    return this.tables[table] || []
  }

  insert(table: string, record: unknown): void {
    if (!this.tables[table]) {
      this.tables[table] = []
    }
    this.tables[table].push(record)
  }

  update(table: string, predicate: (record: unknown) => boolean, updates: unknown): void {
    if (!this.tables[table]) return

    this.tables[table] = this.tables[table].map((record) => {
      if (predicate(record)) {
        return { ...(record as object), ...(updates as object) }
      }
      return record
    })
  }

  delete(table: string, predicate: (record: unknown) => boolean): void {
    if (!this.tables[table]) return
    this.tables[table] = this.tables[table].filter((record) => !predicate(record))
  }

  clear(table?: string): void {
    if (table) {
      this.tables[table] = []
    } else {
      this.tables = {}
    }
  }
}

/**
 * Mock HTTP client for testing
 */
export class MockHTTPClient {
  constructor(private routes: Record<string, unknown> = {}) {}

  async fetch(url: string): Promise<unknown> {
    const response = this.routes[url]
    if (!response) {
      throw new Error(`No mock response for URL: ${url}`)
    }
    if (response instanceof Error) {
      throw response
    }
    return response
  }

  setRoute(url: string, response: unknown | Error): void {
    this.routes[url] = response
  }

  clearRoutes(): void {
    this.routes = {}
  }
}

/**
 * Mock Vectorize for testing
 */
export class MockVectorize {
  constructor(private collections: Record<string, VectorSearchResult[]> = {}) {}

  query(
    query: number[] | string,
    options: { topK?: number; namespace?: string } = {}
  ): VectorSearchResult[] {
    const namespace = options.namespace || 'default'
    const topK = options.topK || 5

    const results = this.collections[namespace] || []
    return results.slice(0, topK)
  }

  insert(
    namespace: string,
    documents: Array<{ id: string; metadata: Record<string, unknown> }>
  ): void {
    if (!this.collections[namespace]) {
      this.collections[namespace] = []
    }

    for (const doc of documents) {
      this.collections[namespace].push({
        id: doc.id,
        score: 1.0,
        metadata: doc.metadata,
      })
    }
  }

  clear(namespace?: string): void {
    if (namespace) {
      this.collections[namespace] = []
    } else {
      this.collections = {}
    }
  }
}

/**
 * Mock Durable Object for testing
 */
export class MockDurableObject<T = unknown> {
  constructor(private state: T) {}

  getState(): T {
    return this.state
  }

  setState(state: T): void {
    this.state = state
  }

  reset(initialState: T): void {
    this.state = initialState
  }
}

/**
 * Helper to create mock AI provider
 */
export function mockAIProvider(responses: Record<string, unknown>): MockAIProvider {
  return new MockAIProvider(responses)
}

/**
 * Helper to create mock database
 */
export function mockDatabase(tables: Record<string, unknown[]>): MockDatabase {
  return new MockDatabase(tables)
}

/**
 * Helper to create mock HTTP client
 */
export function mockHTTP(routes: Record<string, unknown>): MockHTTPClient {
  return new MockHTTPClient(routes)
}

/**
 * Helper to create mock Vectorize
 */
export function mockVectorize(collections: Record<string, VectorSearchResult[]>): MockVectorize {
  return new MockVectorize(collections)
}

/**
 * Helper to create mock Durable Object
 */
export function mockDurableObject<T>(initialState?: T): MockDurableObject<T> {
  return new MockDurableObject<T>(initialState as T)
}
