/**
 * Step Primitives
 *
 * Functions for creating agent execution steps programmatically.
 * These produce the same objects as YAML parsing.
 */

import type {
  AgentFlowStep,
  AgentStepConfig,
  FlowStepType,
  OperationType,
  RetryConfig,
  CacheConfig,
  ScoringConfig,
  StateAccessConfig,
  TimeoutConfig,
} from './types.js'

/**
 * Configuration options for creating a step
 */
export interface StepOptions {
  /** Operation type (think, code, http, etc.) - used when referencing inline agent */
  operation?: OperationType

  /** Script path for code operations */
  script?: string

  /** Agent-specific configuration */
  config?: Record<string, unknown>

  /** Input data mapping (supports expression syntax like ${previous.output}) */
  input?: Record<string, unknown>

  /** Conditional execution expression */
  condition?: unknown

  /** Alias for condition */
  when?: unknown

  /** Step identifier for referencing in expressions */
  id?: string

  /** Dependencies (step names that must complete first) */
  depends_on?: string[]

  /** Retry configuration */
  retry?: RetryConfig

  /** Timeout in milliseconds */
  timeout?: number

  /** Timeout behavior */
  onTimeout?: TimeoutConfig

  /** Cache configuration */
  cache?: CacheConfig

  /** Scoring configuration */
  scoring?: ScoringConfig

  /** State access configuration */
  state?: StateAccessConfig
}

/**
 * Create an agent execution step
 *
 * @param name - Agent name to execute
 * @param options - Step configuration options
 * @returns AgentFlowStep object
 *
 * @example
 * ```typescript
 * // Simple step
 * step('fetch-data')
 *
 * // Step with operation and config
 * step('analyze', {
 *   operation: 'think',
 *   config: {
 *     model: 'claude-sonnet-4',
 *     prompt: 'Analyze this data: ${input.data}'
 *   }
 * })
 *
 * // Step with input mapping
 * step('transform', {
 *   script: 'scripts/transform',
 *   input: {
 *     data: '${fetch-data.output}'
 *   }
 * })
 *
 * // Step with retry and timeout
 * step('external-api', {
 *   operation: 'http',
 *   config: { url: 'https://api.example.com' },
 *   retry: { attempts: 3, backoff: 'exponential' },
 *   timeout: 5000
 * })
 * ```
 */
export function step(name: string, options: StepOptions = {}): AgentFlowStep {
  const {
    operation,
    script,
    config,
    input,
    condition,
    when,
    id,
    depends_on,
    retry,
    timeout,
    onTimeout,
    cache,
    scoring,
    state,
  } = options

  // Build the step object
  const agentStep: AgentFlowStep = {
    agent: name,
  }

  // Add optional fields only if provided
  if (id !== undefined) agentStep.id = id
  if (input !== undefined) agentStep.input = input
  if (condition !== undefined) agentStep.condition = condition
  if (when !== undefined) agentStep.when = when
  if (depends_on !== undefined) agentStep.depends_on = depends_on
  if (retry !== undefined) agentStep.retry = retry
  if (timeout !== undefined) agentStep.timeout = timeout
  if (onTimeout !== undefined) agentStep.onTimeout = onTimeout
  if (cache !== undefined) agentStep.cache = cache
  if (scoring !== undefined) agentStep.scoring = scoring
  if (state !== undefined) agentStep.state = state

  // Handle operation/script/config - these go into the step for inline agents
  // When the step references a pre-defined agent, these are ignored
  // When the step IS the agent definition, these define it
  if (operation !== undefined || script !== undefined || config !== undefined) {
    // For inline agent definition, we store these in a way the executor understands
    // The executor will create an inline agent from these properties
    ;(agentStep as AgentFlowStep & AgentStepConfig).operation = operation
    ;(agentStep as AgentFlowStep & AgentStepConfig).script = script
    ;(agentStep as AgentFlowStep & AgentStepConfig).config = config
  }

  return agentStep
}

/**
 * Create a sequence of steps (explicit sequential execution)
 *
 * This is syntactic sugar - it simply returns the array of steps.
 * Steps in an array are executed sequentially by default.
 *
 * @param steps - Steps to execute in sequence
 * @returns Array of steps
 *
 * @example
 * ```typescript
 * sequence(
 *   step('fetch'),
 *   step('transform'),
 *   step('store')
 * )
 * ```
 */
export function sequence(...steps: FlowStepType[]): FlowStepType[] {
  return steps
}

/**
 * Create a step that executes a script
 *
 * Shorthand for step() with script config.
 *
 * @param name - Step name
 * @param scriptPath - Path to the script
 * @param options - Additional step options
 * @returns AgentFlowStep
 *
 * @example
 * ```typescript
 * scriptStep('transform', 'scripts/transform-data', {
 *   input: { data: '${fetch.output}' }
 * })
 * ```
 */
export function scriptStep(
  name: string,
  scriptPath: string,
  options: Omit<StepOptions, 'script' | 'operation'> = {}
): AgentFlowStep {
  return step(name, {
    ...options,
    operation: 'code',
    script: scriptPath,
  })
}

/**
 * Create a step that calls an HTTP endpoint
 *
 * Shorthand for step() with http operation.
 *
 * @param name - Step name
 * @param url - URL to call
 * @param options - HTTP and step options
 * @returns AgentFlowStep
 *
 * @example
 * ```typescript
 * httpStep('fetch-users', 'https://api.example.com/users', {
 *   method: 'GET',
 *   headers: { 'Authorization': 'Bearer ${env.API_KEY}' }
 * })
 * ```
 */
export function httpStep(
  name: string,
  url: string,
  options: Omit<StepOptions, 'operation'> & {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    headers?: Record<string, string>
    body?: unknown
  } = {}
): AgentFlowStep {
  const { method, headers, body, ...stepOptions } = options

  const config: Record<string, unknown> = {
    url,
    method: method ?? 'GET',
  }
  if (headers) config.headers = headers
  if (body !== undefined) config.body = body

  return step(name, {
    ...stepOptions,
    operation: 'http',
    config,
  })
}

/**
 * Create a step that uses AI reasoning
 *
 * Shorthand for step() with think operation.
 *
 * @param name - Step name
 * @param prompt - Prompt for the AI
 * @param options - Think and step options
 * @returns AgentFlowStep
 *
 * @example
 * ```typescript
 * thinkStep('analyze', 'Analyze this data and extract insights: ${input.data}', {
 *   model: 'claude-sonnet-4',
 *   temperature: 0.7
 * })
 * ```
 */
export function thinkStep(
  name: string,
  prompt: string,
  options: Omit<StepOptions, 'operation'> & {
    model?: string
    provider?: string
    temperature?: number
    maxTokens?: number
    systemPrompt?: string
  } = {}
): AgentFlowStep {
  const { model, provider, temperature, maxTokens, systemPrompt, ...stepOptions } = options

  return step(name, {
    ...stepOptions,
    operation: 'think',
    config: {
      prompt,
      ...(model && { model }),
      ...(provider && { provider }),
      ...(temperature !== undefined && { temperature }),
      ...(maxTokens && { maxTokens }),
      ...(systemPrompt && { systemPrompt }),
    },
  })
}

/**
 * Create a step that stores data
 *
 * Shorthand for step() with storage operation.
 *
 * @param name - Step name
 * @param action - Storage action (get, put, delete, list)
 * @param options - Storage and step options
 * @returns AgentFlowStep
 *
 * @example
 * ```typescript
 * storageStep('cache-result', 'put', {
 *   binding: 'CACHE',
 *   key: 'result-${input.id}',
 *   value: '${transform.output}'
 * })
 * ```
 */
export function storageStep(
  name: string,
  action: 'get' | 'put' | 'delete' | 'list',
  options: Omit<StepOptions, 'operation'> & {
    binding: string
    type?: 'kv' | 'r2' | 'cache'
    key?: string
    value?: unknown
    prefix?: string
  } = {} as any
): AgentFlowStep {
  const { binding, type, key, value, prefix, ...stepOptions } = options

  return step(name, {
    ...stepOptions,
    operation: 'storage',
    config: {
      action,
      binding,
      ...(type && { type }),
      ...(key && { key }),
      ...(value !== undefined && { value }),
      ...(prefix && { prefix }),
    },
  })
}

/**
 * Create a step that queries a database
 *
 * Shorthand for step() with data operation.
 *
 * @param name - Step name
 * @param query - SQL query or action
 * @param options - Data and step options
 * @returns AgentFlowStep
 *
 * @example
 * ```typescript
 * dataStep('get-users', 'SELECT * FROM users WHERE active = ?', {
 *   binding: 'DB',
 *   params: [true]
 * })
 * ```
 */
export function dataStep(
  name: string,
  query: string,
  options: Omit<StepOptions, 'operation'> & {
    binding: string
    type?: 'd1' | 'hyperdrive' | 'vectorize'
    params?: unknown[]
  } = {} as any
): AgentFlowStep {
  const { binding, type, params, ...stepOptions } = options

  return step(name, {
    ...stepOptions,
    operation: 'data',
    config: {
      query,
      binding,
      ...(type && { type }),
      ...(params && { params }),
    },
  })
}

/**
 * Create a step that sends an email
 *
 * Shorthand for step() with email operation.
 *
 * @param name - Step name
 * @param options - Email and step options
 * @returns AgentFlowStep
 *
 * @example
 * ```typescript
 * emailStep('send-notification', {
 *   to: ['user@example.com'],
 *   subject: 'Your order is ready',
 *   body: '${transform.output.emailBody}'
 * })
 * ```
 */
export function emailStep(
  name: string,
  options: Omit<StepOptions, 'operation'> & {
    to: string[]
    subject?: string
    body?: string
    from?: string
    template?: string
  }
): AgentFlowStep {
  const { to, subject, body, from, template, ...stepOptions } = options

  return step(name, {
    ...stepOptions,
    operation: 'email',
    config: {
      to,
      ...(subject && { subject }),
      ...(body && { body }),
      ...(from && { from }),
      ...(template && { template }),
    },
  })
}

/**
 * Create a step that references an existing agent by name
 *
 * This is useful when you want to explicitly call an agent defined elsewhere.
 *
 * @param agentName - Name of the agent to reference
 * @param options - Step options (input mapping, conditions, etc.)
 * @returns AgentFlowStep
 *
 * @example
 * ```typescript
 * agentStep('my-analyzer', {
 *   input: { data: '${fetch.output}' }
 * })
 * ```
 */
export function agentStep(
  agentName: string,
  options: Omit<StepOptions, 'operation' | 'script'> = {}
): AgentFlowStep {
  return step(agentName, options)
}
