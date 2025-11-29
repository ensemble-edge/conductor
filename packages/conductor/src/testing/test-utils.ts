/**
 * Test Utilities
 *
 * Common test helpers and factory functions to reduce duplicate setup code.
 * Import these utilities instead of writing boilerplate in each test file.
 *
 * @example
 * ```typescript
 * import {
 *   createMockEnv,
 *   createMockContext,
 *   createTestHonoApp,
 *   MockResponse,
 *   MockRepository,
 * } from '@ensemble-edge/conductor/testing';
 *
 * const env = createMockEnv({ API_KEY: 'test-key' });
 * const ctx = createMockContext();
 * const app = createTestHonoApp();
 * ```
 */

import { Hono } from 'hono'
import type { ConductorEnv } from '../types/env.js'
import type { ConductorContext, AuthContext } from '../api/types.js'
import { Result } from '../types/result.js'
import { createSecurityConfig, type SecurityConfig } from '../config/security.js'
import {
  ConductorError,
  StorageKeyNotFoundError,
  StorageOperationError,
} from '../errors/error-types.js'
import { RequestId, type RequestId as RequestIdType } from '../types/branded.js'

// ============================================================================
// Environment & Context Mocks
// ============================================================================

/**
 * Create a mock ConductorEnv for testing
 *
 * @param overrides - Optional environment variable overrides
 * @returns A mock environment object
 *
 * @example
 * ```typescript
 * const env = createMockEnv({ API_KEY: 'test-key' });
 * const result = await agent.execute({ input: {}, env, ctx });
 * ```
 */
export function createMockEnv(overrides: Partial<ConductorEnv> = {}): ConductorEnv {
  return {
    // Default test environment values
    ENVIRONMENT: 'test',
    ...overrides,
  } as ConductorEnv
}

/**
 * Create a mock ExecutionContext for testing
 *
 * @returns A minimal mock ExecutionContext
 *
 * @example
 * ```typescript
 * const ctx = createMockContext();
 * const result = await agent.execute({ input: {}, env, ctx });
 * ```
 */
export function createMockContext(): ExecutionContext {
  return {
    waitUntil: () => {},
    passThroughOnException: () => {},
    props: {},
  } as unknown as ExecutionContext
}

/**
 * Create a complete agent execution context for testing
 *
 * @param options - Optional overrides for input, env, ctx, and state
 * @returns An object suitable for agent.execute()
 *
 * @example
 * ```typescript
 * const context = createAgentContext({ input: { url: 'https://example.com' } });
 * const result = await agent.execute(context);
 * ```
 */
export function createAgentContext(options: {
  input?: unknown
  env?: Partial<ConductorEnv>
  ctx?: Partial<ExecutionContext>
  state?: Record<string, unknown>
} = {}): {
  input: unknown
  env: ConductorEnv
  ctx: ExecutionContext
  state?: Record<string, unknown>
} {
  return {
    input: options.input ?? {},
    env: createMockEnv(options.env),
    ctx: options.ctx ? { ...createMockContext(), ...options.ctx } : createMockContext(),
    state: options.state,
  }
}

// ============================================================================
// Hono Test App Factory
// ============================================================================

/**
 * Options for creating a test Hono app
 */
export interface TestAppOptions {
  /** Environment bindings */
  env?: Record<string, unknown>
  /** Security config overrides */
  security?: Partial<SecurityConfig>
  /** Request ID to use (can be string or branded RequestId) */
  requestId?: string | RequestIdType
  /** Auth context to inject - uses AuthContext from api/types for full type safety */
  auth?: AuthContext
}

/**
 * Create a Hono test app with common middleware pre-configured
 *
 * @param options - Optional configuration
 * @returns A Hono app ready for testing
 *
 * @example
 * ```typescript
 * const app = createTestHonoApp({ env: { API_KEY: 'test' } });
 * app.route('/api', myRoutes);
 *
 * const res = await app.request('/api/endpoint', { method: 'GET' });
 * expect(res.status).toBe(200);
 * ```
 */
export function createTestHonoApp(
  options: TestAppOptions = {}
): Hono<{ Bindings: ConductorEnv; Variables: ConductorContext['var'] }> {
  // Create typed Hono app matching ConductorContext structure
  const app = new Hono<{ Bindings: ConductorEnv; Variables: ConductorContext['var'] }>()

  // Security config
  const securityConfig = createSecurityConfig(options.security)

  // Middleware to inject test context
  app.use('*', async (c, next) => {
    // Note: env binding is set via Hono's request() method in tests
    // We cannot directly assign c.env, but options.env is passed through request()

    // Inject request ID (convert string to branded type if needed)
    const reqId =
      options.requestId !== undefined
        ? typeof options.requestId === 'string'
          ? RequestId.tryCreate(options.requestId) ?? RequestId.generate()
          : options.requestId
        : RequestId.generate()
    c.set('requestId', reqId)

    // Inject security config
    c.set('securityConfig', securityConfig)

    // Inject auth context if provided
    if (options.auth) {
      c.set('auth', options.auth)
    }

    await next()
  })

  return app
}

// ============================================================================
// Mock Response (for fetch mocking)
// ============================================================================

/**
 * Mock Response class for testing HTTP agents
 *
 * @example
 * ```typescript
 * global.fetch = vi.fn().mockResolvedValue(
 *   new MockResponse({ data: 'test' }, { status: 200 })
 * );
 * ```
 */
export class MockResponse {
  constructor(
    private body: unknown,
    private init: ResponseInit = {}
  ) {}

  get ok(): boolean {
    const status = this.init.status ?? 200
    return status >= 200 && status < 300
  }

  get status(): number {
    return this.init.status ?? 200
  }

  get statusText(): string {
    return this.init.statusText ?? 'OK'
  }

  get headers(): {
    get: (key: string) => string | null
    entries: () => IterableIterator<[string, string]>
  } {
    const headersObj = (this.init.headers ?? {}) as Record<string, string>
    const headers = new Map(Object.entries(headersObj))
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json')
    }
    return {
      get: (key: string) => headers.get(key.toLowerCase()) ?? null,
      entries: () => headers.entries(),
    }
  }

  async json(): Promise<unknown> {
    return this.body
  }

  async text(): Promise<string> {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
  }

  async blob(): Promise<Blob> {
    const text = await this.text()
    return new Blob([text])
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const text = await this.text()
    return new TextEncoder().encode(text).buffer as ArrayBuffer
  }

  clone(): MockResponse {
    return new MockResponse(this.body, this.init)
  }
}

// ============================================================================
// Mock Repository (for storage testing)
// ============================================================================

/**
 * Mock Repository implementation for testing data agents
 *
 * This is a simple key-value store that can simulate errors.
 * It uses ConductorError for compatibility with the Repository interface.
 *
 * @example
 * ```typescript
 * const repo = new MockRepository();
 * await repo.put('key', { data: 'value' });
 * const result = await repo.get('key');
 * ```
 */
export class MockRepository<T = unknown> {
  private store = new Map<string, T>()
  private getError: string | null = null
  private putError: string | null = null
  private deleteError: string | null = null

  /**
   * Set an error to be returned on next get() call
   */
  setGetError(error: string | null): void {
    this.getError = error
  }

  /**
   * Set an error to be returned on next put() call
   */
  setPutError(error: string | null): void {
    this.putError = error
  }

  /**
   * Set an error to be returned on next delete() call
   */
  setDeleteError(error: string | null): void {
    this.deleteError = error
  }

  async get(key: string): Promise<Result<T, ConductorError>> {
    if (this.getError) {
      const error = this.getError
      this.getError = null // Clear after use
      return Result.err(new StorageOperationError('get', key, new Error(error)))
    }

    const value = this.store.get(key)
    if (value === undefined) {
      return Result.err(new StorageKeyNotFoundError(key, 'mock'))
    }

    return Result.ok(value)
  }

  async put(key: string, value: T, _options?: { ttl?: number }): Promise<Result<void, ConductorError>> {
    if (this.putError) {
      const error = this.putError
      this.putError = null // Clear after use
      return Result.err(new StorageOperationError('put', key, new Error(error)))
    }

    this.store.set(key, value)
    return Result.ok(undefined)
  }

  async delete(key: string): Promise<Result<void, ConductorError>> {
    if (this.deleteError) {
      const error = this.deleteError
      this.deleteError = null // Clear after use
      return Result.err(new StorageOperationError('delete', key, new Error(error)))
    }

    this.store.delete(key)
    return Result.ok(undefined)
  }

  async list(options?: {
    prefix?: string
    limit?: number
    cursor?: string
  }): Promise<Result<{ keys: string[]; cursor?: string }, ConductorError>> {
    const keys = Array.from(this.store.keys())
    const filtered = options?.prefix ? keys.filter((k) => k.startsWith(options.prefix!)) : keys

    const limited = options?.limit ? filtered.slice(0, options.limit) : filtered

    return Result.ok({ keys: limited })
  }

  /**
   * Get all stored data (for test assertions)
   */
  getAll(): Map<string, T> {
    return new Map(this.store)
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Seed the repository with initial data
   */
  seed(data: Record<string, T>): void {
    for (const [key, value] of Object.entries(data)) {
      this.store.set(key, value)
    }
  }
}

// ============================================================================
// Mock Email Provider
// ============================================================================

/**
 * Email result type for mock provider
 */
export interface MockEmailResult {
  messageId: string
  status: 'sent' | 'failed' | 'queued'
  provider: string
  error?: string
}

/**
 * Mock Email Provider for testing email agents
 *
 * @example
 * ```typescript
 * const provider = new MockEmailProvider();
 * provider.setResponse({ messageId: 'msg-123', status: 'sent', provider: 'mock' });
 *
 * const agent = new EmailAgent(config);
 * (agent as any).provider = provider;
 * ```
 */
export class MockEmailProvider {
  name = 'mock'
  private sendResponse: MockEmailResult = {
    messageId: 'mock-msg-id',
    status: 'sent',
    provider: 'mock',
  }
  private validateResponse = { valid: true, errors: [] as string[] }
  private sentEmails: Array<{ to: string; subject: string; html?: string; text?: string }> = []

  /**
   * Set the response to return from send()
   */
  setResponse(response: MockEmailResult): void {
    this.sendResponse = response
  }

  /**
   * Set the validation response
   */
  setValidationResponse(response: { valid: boolean; errors?: string[] }): void {
    this.validateResponse = { valid: response.valid, errors: response.errors ?? [] }
  }

  async send(message: {
    to: string
    subject: string
    html?: string
    text?: string
  }): Promise<MockEmailResult> {
    this.sentEmails.push(message)
    return this.sendResponse
  }

  async validateConfig(): Promise<{ valid: boolean; errors?: string[] }> {
    return this.validateResponse
  }

  /**
   * Get all emails that were "sent"
   */
  getSentEmails(): Array<{ to: string; subject: string; html?: string; text?: string }> {
    return this.sentEmails
  }

  /**
   * Clear sent email history
   */
  clear(): void {
    this.sentEmails = []
  }
}

// ============================================================================
// Test Assertion Helpers
// ============================================================================

/**
 * Assert that a Result is successful and return its value
 *
 * @example
 * ```typescript
 * const result = await agent.execute(context);
 * const value = assertSuccess(result);
 * expect(value.data).toBe('expected');
 * ```
 */
export function assertSuccess<T, E>(result: Result<T, E>): T {
  if (!result.success) {
    throw new Error(`Expected success but got error: ${result.error}`)
  }
  return result.value
}

/**
 * Assert that a Result is an error and return the error
 *
 * @example
 * ```typescript
 * const result = await agent.execute(context);
 * const error = assertError(result);
 * expect(error.message).toContain('expected error');
 * ```
 */
export function assertError<T, E>(result: Result<T, E>): E {
  if (result.success) {
    throw new Error(`Expected error but got success: ${JSON.stringify(result.value)}`)
  }
  return result.error
}

// ============================================================================
// Fetch Mock Helpers
// ============================================================================

/**
 * Create a mock fetch function that returns predefined responses
 *
 * @param routes - Map of URL patterns to responses
 * @returns A mock fetch function
 *
 * @example
 * ```typescript
 * const mockFetch = createMockFetch({
 *   'https://api.example.com/users': { data: [{ id: 1 }] },
 *   'https://api.example.com/error': new Error('Network error'),
 * });
 *
 * global.fetch = mockFetch;
 * ```
 */
export function createMockFetch(
  routes: Record<string, unknown | Error | ((url: string, init?: RequestInit) => unknown | Error)>
): (input: RequestInfo | URL, init?: RequestInit) => Promise<MockResponse> {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()

    // Find matching route
    for (const [pattern, response] of Object.entries(routes)) {
      if (url.includes(pattern) || url === pattern) {
        // Handle function responses
        const resolvedResponse = typeof response === 'function' ? response(url, init) : response

        // Handle error responses
        if (resolvedResponse instanceof Error) {
          throw resolvedResponse
        }

        // Return mock response
        return new MockResponse(resolvedResponse)
      }
    }

    // No matching route
    throw new Error(`No mock response for URL: ${url}`)
  }
}

// ============================================================================
// Wait Helpers
// ============================================================================

/**
 * Wait for a condition to become true
 *
 * @param condition - Function that returns true when condition is met
 * @param options - Timeout and interval options
 * @returns Promise that resolves when condition is true
 *
 * @example
 * ```typescript
 * await waitFor(() => document.querySelector('.loaded') !== null);
 * ```
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`)
}

/**
 * Wait for a specified number of milliseconds
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
