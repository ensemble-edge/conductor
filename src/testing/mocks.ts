/**
 * Mock Utilities for Testing
 */

import type { VectorSearchResult } from './types'

/**
 * Mock AI provider responses
 */
export class MockAIProvider {
  constructor(private responses: Record<string, unknown | Error>) {}

  getResponse(memberName: string): unknown | Error {
    return this.responses[memberName] || { message: 'Mock AI response' }
  }

  setResponse(memberName: string, response: unknown | Error): void {
    this.responses[memberName] = response
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
