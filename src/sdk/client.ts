/**
 * Conductor SDK Client
 *
 * Type-safe client for the Conductor API.
 */

export interface ClientConfig {
  baseUrl: string
  apiKey?: string
  timeout?: number
  headers?: Record<string, string>
}

export interface ExecuteOptions {
  agent: string
  input: unknown
  config?: unknown
  userId?: string
  sessionId?: string
  metadata?: Record<string, unknown>
}

export interface ExecuteResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  metadata: {
    executionId: string
    duration: number
    timestamp: number
  }
}

export interface Agent {
  name: string
  type: string
  version?: string
  description?: string
  builtIn: boolean
}

export interface MemberDetail extends Agent {
  config?: {
    schema?: Record<string, unknown>
    defaults?: Record<string, unknown>
  }
  input?: {
    schema?: Record<string, unknown>
    examples?: unknown[]
  }
  output?: {
    schema?: Record<string, unknown>
  }
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  version: string
  checks: {
    database?: boolean
    cache?: boolean
    queue?: boolean
  }
}

export class ConductorError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
    public requestId?: string
  ) {
    super(message)
    this.name = 'ConductorError'
  }
}

/**
 * Conductor API Client
 */
export class ConductorClient {
  private baseUrl: string
  private apiKey?: string
  private timeout: number
  private headers: Record<string, string>

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
    this.timeout = config.timeout || 30000
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    }

    if (this.apiKey) {
      this.headers['X-API-Key'] = this.apiKey
    }
  }

  async execute<T = unknown>(options: ExecuteOptions): Promise<ExecuteResult<T>> {
    const response = await this.request<ExecuteResult<T>>('POST', '/api/v1/execute', options)
    return response
  }

  async listMembers(): Promise<Agent[]> {
    const response = await this.request<{ agents: Agent[]; count: number }>(
      'GET',
      '/api/v1/agents'
    )
    return response.agents
  }

  async getAgent(name: string): Promise<MemberDetail> {
    const response = await this.request<MemberDetail>('GET', `/api/v1/agents/${name}`)
    return response
  }

  async health(): Promise<HealthStatus> {
    const response = await this.request<HealthStatus>('GET', '/health')
    return response
  }

  async ready(): Promise<boolean> {
    const response = await this.request<{ ready: boolean }>('GET', '/health/ready')
    return response.ready
  }

  async alive(): Promise<boolean> {
    const response = await this.request<{ alive: boolean }>('GET', '/health/live')
    return response.alive
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = (await response.json()) as {
        error?: string
        message?: string
        details?: unknown
        requestId?: string
      }

      if (!response.ok) {
        throw new ConductorError(
          data.error || 'UnknownError',
          data.message || 'An error occurred',
          data.details,
          data.requestId
        )
      }

      return data as T
    } catch (error) {
      clearTimeout(timeoutId)

      if ((error as Error).name === 'AbortError') {
        throw new ConductorError('TimeoutError', `Request timeout after ${this.timeout}ms`)
      }

      if (error instanceof ConductorError) {
        throw error
      }

      throw new ConductorError('NetworkError', (error as Error).message || 'Network error occurred')
    }
  }
}

export function createClient(config: ClientConfig): ConductorClient {
  return new ConductorClient(config)
}
