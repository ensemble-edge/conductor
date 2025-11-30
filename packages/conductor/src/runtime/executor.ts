/**
 * Core Executor - Refactored with Result Types
 *
 * Orchestrates ensemble execution with explicit error handling using Result types.
 * Makes all error cases explicit and checked at compile time.
 */

import {
  Parser,
  type EnsembleConfig,
  type FlowStep,
  type AgentConfig,
  type AgentFlowStep,
  type FlowStepType,
} from './parser.js'
import {
  GraphExecutor,
  hasControlFlowSteps,
  type AgentExecutorFn,
  type GraphExecutionContext,
} from './graph-executor.js'

/**
 * Type guard to check if a flow step is an agent step (not a control flow step)
 */
function isAgentStep(step: FlowStepType): step is AgentFlowStep {
  return 'agent' in step && typeof (step as AgentFlowStep).agent === 'string'
}
import { StateManager, type AccessReport, type AccessLogEntry } from './state-manager.js'
import type { BaseAgent, AgentExecutionContext, AgentResponse } from '../agents/base-agent.js'
import type { ConductorEnv } from '../types/env.js'
import { FunctionAgent } from '../agents/function-agent.js'
import { CodeAgent } from '../agents/code-agent.js'
import { ThinkAgent } from '../agents/think-agent.js'
import { StorageAgent } from '../agents/storage-agent.js'
import { DataAgent } from '../agents/data-agent.js'
import { APIAgent } from '../agents/api-agent.js'
import { EmailAgent } from '../agents/email/email-agent.js'
import { SmsMember } from '../agents/sms/sms-agent.js'
import { FormAgent } from '../agents/form/form-agent.js'
import { HtmlMember } from '../agents/html/html-agent.js'
import { PdfMember } from '../agents/pdf/pdf-agent.js'
import { getBuiltInRegistry } from '../agents/built-in/registry.js'
import { Result, type AsyncResult } from '../types/result.js'
import {
  Errors,
  type ConductorError,
  AgentExecutionError,
  EnsembleExecutionError,
  ConfigurationError,
} from '../errors/error-types.js'
import { Operation } from '../types/constants.js'
import {
  ScoringExecutor,
  EnsembleScorer,
  type ScoringState,
  type ScoringResult,
  type AgentScoringConfig,
  type EnsembleScoringConfig,
} from './scoring/index.js'
import { ResumptionManager, type SuspendedExecutionState } from './resumption-manager.js'
import {
  createLogger,
  type Logger,
  ObservabilityManager,
  createObservabilityManager,
  generateExecutionId,
  type MetricsRecorder,
} from '../observability/index.js'
import type { ExecutionId, RequestId } from '../types/branded.js'
import type { ObservabilityConfig } from '../config/types.js'
import { NotificationManager } from './notifications/index.js'
import { createComponentLoader, type ComponentLoader } from './component-loader.js'
import {
  hasGlobalScriptLoader,
  getGlobalScriptLoader,
  parseScriptURI,
  isScriptReference,
} from '../utils/script-loader.js'
import {
  ComponentRegistry,
  createComponentRegistry,
  createAgentRegistry,
  createEnsembleRegistry,
  type AgentRegistry,
  type EnsembleRegistry,
} from '../components/index.js'
import { resolveOutput, type EnsembleOutput, type OutputFormat } from './output-resolver.js'
import { MemoryManager } from './memory/memory-manager.js'
import type { MemoryConfig } from './memory/types.js'

import type { AuthContext } from '../auth/types.js'

/** Default timeout for agent execution (30 seconds) */
const DEFAULT_AGENT_TIMEOUT_MS = 30000

export interface ExecutorConfig {
  env: ConductorEnv
  ctx: ExecutionContext
  logger?: Logger
  /** Observability configuration from conductor.config.ts */
  observability?: ObservabilityConfig
  /** Request ID from incoming HTTP request (for tracing) - branded type for type safety */
  requestId?: RequestId
  /** Authentication context from the request */
  auth?: AuthContext
  /** Default timeout for agent execution in milliseconds (default: 30000) */
  defaultTimeout?: number
}

/**
 * Execute a promise with a timeout
 * @param promise - The promise to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param agentName - Agent name for error messages
 * @returns The promise result or throws a timeout error
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  agentName: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AgentExecutionError(agentName, `Agent execution timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    return result
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
  }
}

/**
 * Response metadata for HTTP responses
 */
export interface ResponseMetadata {
  /** HTTP status code (default: 200) */
  status: number
  /** Custom response headers */
  headers?: Record<string, string>
  /** Redirect configuration */
  redirect?: {
    url: string
    status?: 301 | 302 | 307 | 308
  }
  /** If true, output is raw string (not JSON) */
  isRawBody?: boolean
  /** Output format for Content-Type and serialization (triggers only) */
  format?: OutputFormat
}

/**
 * Successful execution output
 */
export interface ExecutionOutput {
  output: unknown
  metrics: ExecutionMetrics
  stateReport?: AccessReport
  scoring?: ScoringState
  /** Response metadata for HTTP responses (status, headers, redirect) */
  response?: ResponseMetadata
}

/**
 * Legacy execution result for backwards compatibility
 * New code should use Result<ExecutionOutput, ConductorError>
 */
export interface ExecutionResult {
  success: boolean
  output?: unknown
  error?: string
  metrics: ExecutionMetrics
  stateReport?: AccessReport
}

export interface ExecutionMetrics {
  ensemble: string
  totalDuration: number
  agents: AgentMetric[]
  cacheHits: number
  stateAccess?: AccessReport
}

export interface AgentMetric {
  name: string
  duration: number
  cached: boolean
  success: boolean
}

/**
 * Structure stored in execution context for each agent
 * Available for interpolation in output blocks as ${agentName.output} and ${agentName.success}
 */
interface AgentExecutionResult {
  output: unknown
  /** Whether the agent completed successfully (true when we reach context storage) */
  success: boolean
  [key: string]: unknown // Allow additional metadata
}

/**
 * Execution context type with proper agent result typing
 */
interface ExecutionContextMap {
  input?: unknown
  state?: unknown
  [agentName: string]: unknown | AgentExecutionResult
}

/**
 * Internal context for flow execution
 * Encapsulates shared state during ensemble execution
 */
interface FlowExecutionContext {
  ensemble: EnsembleConfig
  executionContext: ExecutionContextMap
  metrics: ExecutionMetrics
  stateManager: StateManager | null
  scoringState: ScoringState | null
  ensembleScorer: EnsembleScorer | null
  scoringExecutor: ScoringExecutor
  startTime: number
  /** Observability manager for this execution */
  observability: ObservabilityManager
  /** Execution ID for tracing - branded type for type safety */
  executionId: ExecutionId
  /** Component registry for schemas, prompts, configs */
  componentRegistry: ComponentRegistry
  /** Agent registry for discovering available agents */
  agentRegistry: AgentRegistry
  /** Ensemble registry for discovering available ensembles */
  ensembleRegistry: EnsembleRegistry
  /** Memory manager for conversation history and persistent storage */
  memoryManager: MemoryManager | null
}

/**
 * Context passed to agent execution
 * Used internally by executeStep helper methods
 */
interface StepExecutionContext {
  step: AgentFlowStep
  flowContext: FlowExecutionContext
  stepIndex: number
  agent: BaseAgent
  resolvedInput: unknown
  agentLogger: Logger
  agentMetrics: MetricsRecorder
  agentContext: AgentExecutionContext
  getPendingUpdates: (() => { updates: Record<string, unknown>; newLog: AccessLogEntry[] }) | null
}

/**
 * Core execution engine for ensembles with Result-based error handling
 */
export class Executor {
  private env: ConductorEnv
  private ctx: ExecutionContext
  private agentRegistry: Map<string, BaseAgent>
  private logger: Logger
  private observabilityConfig?: ObservabilityConfig
  private requestId?: RequestId
  private auth?: AuthContext
  private defaultTimeout: number

  constructor(config: ExecutorConfig) {
    this.env = config.env
    this.ctx = config.ctx
    this.agentRegistry = new Map()
    this.observabilityConfig = config.observability
    this.requestId = config.requestId
    this.auth = config.auth
    this.defaultTimeout = config.defaultTimeout ?? DEFAULT_AGENT_TIMEOUT_MS
    this.logger = config.logger || createLogger({ serviceName: 'executor' }, this.env.ANALYTICS)
  }

  /**
   * Register an agent for use in ensembles
   */
  registerAgent(agent: BaseAgent): void {
    this.agentRegistry.set(agent.getName(), agent)
  }

  /**
   * Resolve an agent by reference with explicit error handling
   * Supports both simple names and versioned references (name@version)
   *
   * Loading priority:
   * 1. Check built-in agents (scrape, validate, rag, hitl, fetch)
   * 2. Check user-defined agents (registered via registerAgent)
   * 3. Error if not found
   *
   * @param agentRef - Agent reference (e.g., "greet" or "analyze-company@production")
   * @returns Result containing the agent or an error
   */
  private async resolveAgent(agentRef: string): AsyncResult<BaseAgent, ConductorError> {
    const { name, version } = Parser.parseAgentReference(agentRef)

    // If no version specified, check both built-in and user registries
    if (!version) {
      // 1. Check if it's a built-in agent first
      const builtInRegistry = getBuiltInRegistry()
      if (builtInRegistry.isBuiltIn(name)) {
        try {
          // Create a minimal AgentConfig for built-in agents
          const config: AgentConfig = {
            name: name,
            operation: builtInRegistry.getMetadata(name)?.operation || Operation.code,
            config: {},
          }
          const agent = await builtInRegistry.create(name, config, this.env)
          return Result.ok(agent)
        } catch (error) {
          return Result.err(
            Errors.agentConfig(
              name,
              `Failed to load built-in agent: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          )
        }
      }

      // 2. Check user-defined agent registry
      const agent = this.agentRegistry.get(name)
      if (!agent) {
        return Result.err(Errors.agentNotFound(name))
      }
      return Result.ok(agent)
    }

    // Version specified - check cache first
    const versionedKey = `${name}@${version}`
    if (this.agentRegistry.has(versionedKey)) {
      const agent = this.agentRegistry.get(versionedKey)!
      return Result.ok(agent)
    }

    // Try to load from local registry (Edgit not yet integrated)
    const localAgent = this.agentRegistry.get(name)
    if (localAgent) {
      // Cache it under versioned key
      this.agentRegistry.set(versionedKey, localAgent)
      return Result.ok(localAgent)
    }

    // Not found
    return Result.err(
      Errors.agentConfig(
        agentRef,
        'Versioned agent loading requires Edgit integration. ' +
          'Register agents manually using executor.registerAgent()'
      )
    )
  }

  /**
   * Create an agent instance from config
   * Used for dynamically loading agents from Edgit
   */
  private createAgentFromConfig(config: AgentConfig): Result<BaseAgent, ConductorError> {
    switch (config.operation) {
      case Operation.think:
        return Result.ok(new ThinkAgent(config))

      case Operation.storage:
        return Result.ok(new StorageAgent(config))

      case Operation.data:
        return Result.ok(new DataAgent(config))

      case Operation.http:
        return Result.ok(new APIAgent(config))

      case Operation.email:
        return Result.ok(new EmailAgent(config))

      case Operation.sms:
        return Result.ok(new SmsMember(config))

      case Operation.form:
        return Result.ok(new FormAgent(config))

      case Operation.html:
        return Result.ok(new HtmlMember(config))

      case Operation.pdf:
        return Result.ok(new PdfMember(config))

      case Operation.code:
        // Try to create CodeAgent (supports both inline and script:// URIs)
        const codeAgent = CodeAgent.fromConfig(config)
        if (codeAgent) {
          return Result.ok(codeAgent)
        }

        // Fallback to FunctionAgent for backwards compatibility
        const inlineAgent = FunctionAgent.fromConfig(config)
        if (inlineAgent) {
          return Result.ok(inlineAgent)
        }

        return Result.err(
          Errors.agentConfig(
            config.name,
            'Code agents require either a script:// URI or an inline handler function'
          )
        )

      case Operation.tools:
        return Result.err(Errors.agentConfig(config.name, 'MCP agent type not yet implemented'))

      case Operation.scoring:
        return Result.err(Errors.agentConfig(config.name, 'Scoring agent type not yet implemented'))

      default:
        return Result.err(
          Errors.agentConfig(config.name, `Unknown agent operation: ${config.operation}`)
        )
    }
  }

  /**
   * Resolve input for a step based on explicit mapping, previous output, or ensemble input
   * @private
   */
  private resolveStepInput(
    step: AgentFlowStep,
    flowContext: FlowExecutionContext,
    stepIndex: number
  ): unknown {
    const { ensemble, executionContext } = flowContext

    if (step.input) {
      // User specified explicit input mapping
      return Parser.resolveInterpolation(step.input, executionContext)
    } else if (stepIndex > 0 && ensemble.flow) {
      // Default to previous agent's output for chaining
      const previousStep = ensemble.flow[stepIndex - 1]
      const previousAgentName = isAgentStep(previousStep) ? previousStep.agent : undefined
      if (previousAgentName) {
        const previousResult = executionContext[previousAgentName] as
          | AgentExecutionResult
          | undefined
        return previousResult?.output || {}
      }
    }
    // First step with no input - use original ensemble input
    return executionContext.input || {}
  }

  /**
   * Build the agent execution context with all necessary dependencies
   * @private
   */
  private buildAgentContext(
    resolvedInput: unknown,
    flowContext: FlowExecutionContext,
    agentLogger: Logger,
    agentMetrics: MetricsRecorder,
    agentConfig: Record<string, any> | undefined
  ): AgentExecutionContext {
    return {
      input: resolvedInput as Record<string, any>,
      env: this.env,
      ctx: this.ctx,
      previousOutputs: flowContext.executionContext,
      logger: agentLogger,
      metrics: agentMetrics,
      executionId: flowContext.executionId,
      requestId: this.requestId,
      auth: this.auth,
      // Component registries for TypeScript handlers
      schemas: flowContext.componentRegistry.schemas,
      prompts: flowContext.componentRegistry.prompts,
      configs: flowContext.componentRegistry.configs,
      queries: flowContext.componentRegistry.queries,
      scripts: flowContext.componentRegistry.scripts,
      templates: flowContext.componentRegistry.templates,
      // Discovery registries for agents and ensembles
      agentRegistry: flowContext.agentRegistry,
      ensembleRegistry: flowContext.ensembleRegistry,
      // Agent-specific config from ensemble definition
      config: agentConfig,
      // Memory manager for conversation history and persistent storage
      memory: flowContext.memoryManager ?? undefined,
    }
  }

  /**
   * Execute agent with scoring/retry logic
   * @private
   */
  private async executeAgentWithScoring(
    stepContext: StepExecutionContext
  ): Promise<{ response: AgentResponse; scoringResult?: ScoringResult }> {
    const { step, flowContext, agent, agentContext, getPendingUpdates } = stepContext
    const {
      ensemble,
      executionContext,
      scoringState,
      ensembleScorer,
      scoringExecutor,
      stateManager,
    } = flowContext

    const agentTimeout = step.timeout ?? this.defaultTimeout
    const scoringConfig = step.scoring as AgentScoringConfig

    const scoredResult = await scoringExecutor.executeWithScoring(
      // Agent execution function (with timeout)
      async () => {
        const resp = await withTimeout(agent.execute(agentContext), agentTimeout, step.agent)
        // Apply state updates after each attempt
        if (stateManager && getPendingUpdates) {
          const { updates, newLog } = getPendingUpdates()
          flowContext.stateManager = stateManager.applyPendingUpdates(updates, newLog)
        }
        return resp
      },
      // Evaluator function
      async (output, attempt, previousScore) => {
        // Resolve the evaluator agent
        const evaluatorResult = await this.resolveAgent(scoringConfig.evaluator)
        if (!evaluatorResult.success) {
          throw new Error(`Failed to resolve evaluator agent: ${evaluatorResult.error.message}`)
        }

        const evaluator = evaluatorResult.value

        // Create evaluation context with the output to score
        const evalContext: AgentExecutionContext = {
          input: {
            output: output.success ? output.data : null,
            attempt,
            previousScore,
            criteria: scoringConfig.criteria || ensemble.scoring?.criteria,
          },
          env: this.env,
          ctx: this.ctx,
          previousOutputs: executionContext,
        }

        // Execute evaluator
        const evalResponse = await evaluator.execute(evalContext)

        if (!evalResponse.success) {
          throw new Error(`Evaluator failed: ${evalResponse.error || 'Unknown error'}`)
        }

        // Parse evaluator output as ScoringResult
        const evalData = evalResponse.data as Record<string, unknown> | number
        const score =
          typeof evalData === 'number'
            ? evalData
            : typeof evalData === 'object' && evalData !== null && 'score' in evalData
              ? (evalData.score as number)
              : typeof evalData === 'object' && evalData !== null && 'value' in evalData
                ? (evalData.value as number)
                : 0

        const threshold =
          scoringConfig.thresholds?.minimum || ensemble.scoring?.defaultThresholds?.minimum || 0.7

        return {
          score,
          passed: score >= threshold,
          feedback:
            typeof evalData === 'object' && evalData !== null && 'feedback' in evalData
              ? String(evalData.feedback)
              : typeof evalData === 'object' && evalData !== null && 'message' in evalData
                ? String(evalData.message)
                : '',
          breakdown:
            typeof evalData === 'object' && evalData !== null && 'breakdown' in evalData
              ? (evalData.breakdown as Record<string, number>)
              : {},
          metadata: {
            attempt,
            evaluator: scoringConfig.evaluator,
            timestamp: Date.now(),
          },
        }
      },
      scoringConfig
    )

    // Update scoring state
    const scoringResult = scoredResult.score
    if (scoringState && ensembleScorer) {
      scoringState.scoreHistory.push({
        agent: step.agent,
        score: scoringResult.score,
        passed: scoringResult.passed,
        feedback: scoringResult.feedback,
        breakdown: scoringResult.breakdown,
        timestamp: Date.now(),
        attempt: scoredResult.attempts,
      })
      scoringState.retryCount[step.agent] = scoredResult.attempts - 1

      // Handle scoring status
      if (scoredResult.status === 'max_retries_exceeded') {
        this.logger.warn('Agent exceeded max retries', {
          agentName: step.agent,
          score: scoringResult.score,
          attempts: scoredResult.attempts,
          ensembleName: ensemble.name,
        })
      }
    }

    return { response: scoredResult.output, scoringResult }
  }

  /**
   * Execute agent without scoring (normal path)
   * @private
   */
  private async executeAgentDirect(stepContext: StepExecutionContext): Promise<AgentResponse> {
    const { step, flowContext, agent, agentContext, getPendingUpdates } = stepContext
    const { stateManager } = flowContext

    const agentTimeout = step.timeout ?? this.defaultTimeout

    const response = await withTimeout(agent.execute(agentContext), agentTimeout, step.agent)

    // Apply pending state updates
    if (stateManager && getPendingUpdates) {
      const { updates, newLog } = getPendingUpdates()
      flowContext.stateManager = stateManager.applyPendingUpdates(updates, newLog)
    }

    return response
  }

  /**
   * Record agent execution metrics
   * @private
   */
  private recordAgentMetrics(
    stepContext: StepExecutionContext,
    response: AgentResponse,
    agentStartTime: number
  ): void {
    const { step, flowContext, agentMetrics } = stepContext
    const agentDuration = Date.now() - agentStartTime

    flowContext.metrics.agents.push({
      name: step.agent,
      duration: agentDuration,
      cached: response.cached,
      success: response.success,
    })

    if (response.cached) {
      flowContext.metrics.cacheHits++
      if (flowContext.observability.shouldLogEvent('cache:hit')) {
        stepContext.agentLogger.debug('Cache hit', { agentName: step.agent })
      }
      agentMetrics.recordCachePerformance(true, step.agent)
    } else {
      agentMetrics.recordCachePerformance(false, step.agent)
    }

    agentMetrics.recordAgentExecution(step.agent, agentDuration, response.success, response.cached)
  }

  /**
   * Execute a single flow step with all associated logic
   * Only handles AgentFlowStep - control flow steps should use GraphExecutor
   * @private
   */
  private async executeStep(
    step: AgentFlowStep,
    flowContext: FlowExecutionContext,
    stepIndex: number
  ): AsyncResult<void, ConductorError> {
    const { ensemble, executionContext, stateManager, scoringState, ensembleScorer } = flowContext
    const agentStartTime = Date.now()

    // 1. Resolve input for this step
    const resolvedInput = this.resolveStepInput(step, flowContext, stepIndex)

    // 2. Resolve agent - error handling is explicit
    const agentResult = await this.resolveAgent(step.agent)
    if (!agentResult.success) {
      return Result.err(new EnsembleExecutionError(ensemble.name, step.agent, agentResult.error))
    }
    const agent = agentResult.value

    // 3. Create scoped observability for this agent
    const agentObservability = flowContext.observability.forAgent(step.agent, stepIndex)
    const agentLogger = agentObservability.getLogger()
    const agentMetrics = agentObservability.getMetrics()

    // Log agent start if configured
    if (flowContext.observability.shouldLogEvent('agent:start')) {
      agentLogger.info('Agent execution started', {
        agentName: step.agent,
        stepIndex,
        ensembleName: ensemble.name,
      })
    }

    // 4. Find agent config from ensemble definition (if any)
    const agentDef = ensemble.agents?.find(
      (a) => (a as Record<string, unknown>).name === step.agent
    ) as Record<string, unknown> | undefined
    const agentConfig = (agentDef?.config as Record<string, any>) || undefined

    // 5. Build agent execution context using helper
    const agentContext = this.buildAgentContext(
      resolvedInput,
      flowContext,
      agentLogger,
      agentMetrics,
      agentConfig
    )

    // 6. Add state context if available and track updates
    let getPendingUpdates:
      | (() => { updates: Record<string, unknown>; newLog: AccessLogEntry[] })
      | null = null
    if (stateManager && step.state) {
      const { context, getPendingUpdates: getUpdates } = stateManager.getStateForAgent(
        step.agent,
        step.state
      )
      agentContext.state = context.state
      agentContext.setState = context.setState
      getPendingUpdates = getUpdates
    }

    // 7. Build step context for helper methods
    const stepContext: StepExecutionContext = {
      step,
      flowContext,
      stepIndex,
      agent,
      resolvedInput,
      agentLogger,
      agentMetrics,
      agentContext,
      getPendingUpdates,
    }

    // 8. Execute agent (with scoring if configured, or direct)
    let response: AgentResponse
    if (step.scoring && scoringState && ensembleScorer) {
      const result = await this.executeAgentWithScoring(stepContext)
      response = result.response
    } else {
      response = await this.executeAgentDirect(stepContext)
    }

    // 9. Record metrics
    this.recordAgentMetrics(stepContext, response, agentStartTime)

    // 10. Handle agent execution errors explicitly
    if (!response.success) {
      const agentDuration = Date.now() - agentStartTime
      if (flowContext.observability.shouldLogEvent('agent:error')) {
        agentLogger.error('Agent execution failed', new Error(response.error || 'Unknown error'), {
          agentName: step.agent,
          durationMs: agentDuration,
          stepIndex,
        })
      }
      agentMetrics.recordError('AgentExecutionError', step.agent)

      return Result.err(
        new AgentExecutionError(step.agent, response.error || 'Unknown error', undefined)
      )
    }

    // 11. Log agent completion if configured
    if (flowContext.observability.shouldLogEvent('agent:complete')) {
      const agentDuration = Date.now() - agentStartTime
      agentLogger.info('Agent execution completed', {
        agentName: step.agent,
        durationMs: agentDuration,
        stepIndex,
        cached: response.cached,
      })
    }

    // 12. Store agent output in context for future interpolations
    const contextKey = step.id || step.agent
    executionContext[contextKey] = {
      output: response.data,
      success: true,
    }

    // 13. Update state context with new state from immutable StateManager
    if (flowContext.stateManager) {
      executionContext.state = flowContext.stateManager.getState()
    }

    // 14. Update scoring context for interpolations
    if (scoringState) {
      executionContext.scoring = scoringState
    }

    return Result.ok(undefined)
  }

  /**
   * Execute ensemble flow from a given step
   * Automatically uses GraphExecutor for flows with control flow steps (parallel, branch, etc.)
   * @private
   */
  private async executeFlow(
    flowContext: FlowExecutionContext,
    startStep: number = 0
  ): AsyncResult<ExecutionOutput, ConductorError> {
    const {
      ensemble,
      executionContext,
      metrics,
      stateManager,
      scoringState,
      ensembleScorer,
      startTime,
    } = flowContext

    // Execute flow steps sequentially from startStep
    if (!ensemble.flow || ensemble.flow.length === 0) {
      return Result.err(
        new EnsembleExecutionError(
          ensemble.name,
          'validation',
          new Error('Ensemble has no flow steps defined')
        )
      )
    }

    // Check if flow contains control flow steps
    // If so, delegate to GraphExecutor for DAG-based execution
    const flowSteps = ensemble.flow.slice(startStep) as FlowStepType[]
    if (hasControlFlowSteps(flowSteps)) {
      return this.executeFlowWithGraph(flowContext, startStep)
    }

    // Simple agent-only flow - execute sequentially
    for (let i = startStep; i < ensemble.flow.length; i++) {
      const step = ensemble.flow[i]

      // Double-check this is an agent step (should always be true here)
      if (!isAgentStep(step)) {
        return Result.err(
          new EnsembleExecutionError(
            ensemble.name,
            'flow',
            new Error(`Unexpected control flow step at index ${i}`)
          )
        )
      }

      const stepResult = await this.executeStep(step, flowContext, i)

      if (!stepResult.success) {
        return Result.err(stepResult.error)
      }
    }

    // Calculate final ensemble score if scoring was enabled
    if (scoringState && ensembleScorer && scoringState.scoreHistory.length > 0) {
      scoringState.finalScore = ensembleScorer.calculateEnsembleScore(scoringState.scoreHistory)
      scoringState.qualityMetrics = ensembleScorer.calculateQualityMetrics(
        scoringState.scoreHistory
      )
    }

    // Resolve final output using the output resolver
    // Supports conditional outputs, status codes, headers, redirects, and raw body
    let finalOutput: unknown
    let responseMetadata: ResponseMetadata | undefined

    if (ensemble.output) {
      // Use the new output resolver for conditional outputs
      const resolved = resolveOutput(ensemble.output as EnsembleOutput, executionContext)

      // Extract the body/rawBody as the output
      if (resolved.redirect) {
        // For redirects, output is empty but we set response metadata
        finalOutput = {}
        responseMetadata = {
          status: resolved.status,
          headers: resolved.headers,
          redirect: resolved.redirect,
        }
      } else if (resolved.rawBody !== undefined) {
        // Raw body - output is the string, mark as raw
        finalOutput = resolved.rawBody
        responseMetadata = {
          status: resolved.status,
          headers: resolved.headers,
          isRawBody: true,
        }
      } else {
        // JSON body (or formatted body for triggers)
        finalOutput = resolved.body ?? {}
        responseMetadata = {
          status: resolved.status,
          headers: resolved.headers,
          format: resolved.format,
        }
      }
    } else if (ensemble.flow && ensemble.flow.length > 0) {
      // Default to last agent's output
      const lastStep = ensemble.flow[ensemble.flow.length - 1]
      const lastMemberName = isAgentStep(lastStep) ? lastStep.agent : undefined
      if (lastMemberName) {
        const lastResult = executionContext[lastMemberName] as AgentExecutionResult | undefined
        finalOutput = lastResult?.output
      } else {
        finalOutput = {}
      }
    } else {
      // No flow steps - return empty
      finalOutput = {}
    }

    // Calculate total duration
    metrics.totalDuration = Date.now() - startTime

    // Get state report if available
    const stateReport = flowContext.stateManager?.getAccessReport()

    // Build execution output with scoring data and response metadata
    const executionOutput: ExecutionOutput = {
      output: finalOutput,
      metrics,
      stateReport,
      response: responseMetadata,
    }

    // Add scoring data if available
    if (scoringState) {
      executionOutput.scoring = scoringState
    }

    return Result.ok(executionOutput)
  }

  /**
   * Execute flow using GraphExecutor for control flow constructs
   * Handles parallel, branch, foreach, try/catch, switch, while, and map-reduce steps
   * @private
   */
  private async executeFlowWithGraph(
    flowContext: FlowExecutionContext,
    startStep: number = 0
  ): AsyncResult<ExecutionOutput, ConductorError> {
    const {
      ensemble,
      executionContext,
      metrics,
      stateManager,
      scoringState,
      ensembleScorer,
      startTime,
    } = flowContext

    // Create agent executor callback that delegates to this.executeStep
    // This allows GraphExecutor to call back into Executor for agent execution
    const agentExecutorFn: AgentExecutorFn = async (
      step: AgentFlowStep,
      graphContext: GraphExecutionContext
    ): Promise<unknown> => {
      // Merge graph context into flow context's execution context
      // This ensures previous step outputs are available
      for (const [key, value] of graphContext.results) {
        executionContext[key] = { output: value, success: true }
      }

      // Execute the agent step using existing logic
      const stepIndex = ensemble.flow
        ? ensemble.flow.findIndex(
            (s) => isAgentStep(s) && (s.id === step.id || s.agent === step.agent)
          )
        : -1

      const result = await this.executeStep(step, flowContext, stepIndex >= 0 ? stepIndex : 0)

      if (!result.success) {
        throw result.error
      }

      // Get the output from execution context
      const contextKey = step.id || step.agent
      const agentResult = executionContext[contextKey] as AgentExecutionResult | undefined
      return agentResult?.output
    }

    // Create GraphExecutor with our callback
    const graphExecutor = new GraphExecutor(agentExecutorFn, ensemble.name)

    // Execute the flow
    const flowSteps = (ensemble.flow?.slice(startStep) || []) as FlowStepType[]
    const graphResult = await graphExecutor.execute(flowSteps, {
      input: executionContext.input,
      state: stateManager ? stateManager.getState() : undefined,
    })

    if (!graphResult.success) {
      return Result.err(graphResult.error)
    }

    // Merge graph results into execution context
    for (const [key, value] of Object.entries(graphResult.value)) {
      executionContext[key] = { output: value, success: true }
    }

    // Calculate final ensemble score if scoring was enabled
    if (scoringState && ensembleScorer && scoringState.scoreHistory.length > 0) {
      scoringState.finalScore = ensembleScorer.calculateEnsembleScore(scoringState.scoreHistory)
      scoringState.qualityMetrics = ensembleScorer.calculateQualityMetrics(
        scoringState.scoreHistory
      )
    }

    // Resolve final output using the output resolver
    let finalOutput: unknown
    let responseMetadata: ResponseMetadata | undefined

    if (ensemble.output) {
      // Use the new output resolver for conditional outputs
      const resolved = resolveOutput(ensemble.output as EnsembleOutput, executionContext)

      // Extract the body/rawBody as the output
      if (resolved.redirect) {
        finalOutput = {}
        responseMetadata = {
          status: resolved.status,
          headers: resolved.headers,
          redirect: resolved.redirect,
        }
      } else if (resolved.rawBody !== undefined) {
        finalOutput = resolved.rawBody
        responseMetadata = {
          status: resolved.status,
          headers: resolved.headers,
          isRawBody: true,
        }
      } else {
        // JSON body (or formatted body for triggers)
        finalOutput = resolved.body ?? {}
        responseMetadata = {
          status: resolved.status,
          headers: resolved.headers,
          format: resolved.format,
        }
      }
    } else if (ensemble.flow && ensemble.flow.length > 0) {
      // Default to last step's output
      const lastStep = ensemble.flow[ensemble.flow.length - 1]
      const lastKey = isAgentStep(lastStep)
        ? lastStep.id || lastStep.agent
        : `step_${ensemble.flow.length - 1}`

      if (graphResult.value[lastKey]) {
        finalOutput = graphResult.value[lastKey]
      } else {
        // For control flow steps, get the last result
        const keys = Object.keys(graphResult.value)
        if (keys.length > 0) {
          finalOutput = graphResult.value[keys[keys.length - 1]]
        } else {
          finalOutput = {}
        }
      }
    } else {
      finalOutput = {}
    }

    // Calculate total duration
    metrics.totalDuration = Date.now() - startTime

    // Get state report if available
    const stateReport = flowContext.stateManager?.getAccessReport()

    // Build execution output
    const executionOutput: ExecutionOutput = {
      output: finalOutput,
      metrics,
      stateReport,
      response: responseMetadata,
    }

    // Add scoring data if available
    if (scoringState) {
      executionOutput.scoring = scoringState
    }

    return Result.ok(executionOutput)
  }

  /**
   * Register inline agents defined in an ensemble's agents array
   *
   * Supports:
   * 1. script:// URIs - Resolved from bundled scripts (Works in Workers!)
   * 2. Pre-compiled handlers - Function objects passed in config.handler
   * 3. Inline code strings - DEPRECATED, only works in test environments
   *
   * @private
   */
  private registerInlineAgents(ensemble: EnsembleConfig): void {
    if (!ensemble.agents || ensemble.agents.length === 0) {
      return
    }

    for (const agentDef of ensemble.agents) {
      // Skip if not a valid agent definition object
      if (typeof agentDef !== 'object' || agentDef === null) {
        continue
      }

      const name = (agentDef as Record<string, unknown>).name as string | undefined
      const operation = (agentDef as Record<string, unknown>).operation as string | undefined
      const config = (agentDef as Record<string, unknown>).config as
        | Record<string, unknown>
        | undefined

      if (!name || !operation) {
        this.logger.warn('Skipping inline agent without name or operation', { agentDef })
        continue
      }

      // Skip if already registered
      if (this.agentRegistry.has(name)) {
        this.logger.debug('Inline agent already registered', { name })
        continue
      }

      // Build AgentConfig from the inline definition
      const agentConfig: AgentConfig = {
        name,
        operation: operation as AgentConfig['operation'],
        config: config || {},
      }

      // Handle code/function operations
      if (operation === Operation.code || operation === 'function') {
        const scriptRef = config?.script as string | undefined
        const inlineCode = config?.code || config?.function
        const precompiledHandler = config?.handler

        // Priority 1: Script reference - resolve from bundled scripts
        // Supports both formats: "script://path" and "scripts/path"
        if (isScriptReference(scriptRef)) {
          try {
            const handler = this.resolveScriptHandler(scriptRef, name)
            agentConfig.config = { ...config, handler }
          } catch (error) {
            this.logger.error(
              'Failed to resolve script',
              error instanceof Error ? error : undefined,
              { name, scriptRef }
            )
            continue
          }
        }
        // Priority 2: Pre-compiled handler function (already a function object)
        else if (typeof precompiledHandler === 'function') {
          // Handler is already compiled, nothing to do
          this.logger.debug('Using pre-compiled handler', { name })
        }
        // Priority 3: Inline code string - NOT SUPPORTED
        // Inline code uses new Function() which is blocked in Cloudflare Workers
        else if (typeof inlineCode === 'string') {
          this.logger.error(
            'Inline code is not supported',
            new Error(
              `Agent "${name}" uses inline code (config.code) which is not supported.\n` +
                `Cloudflare Workers block new Function() and eval() for security.\n\n` +
                `To fix this, migrate to bundled scripts:\n` +
                `1. Create a file: scripts/${name}.ts\n` +
                `2. Export your function: export default async function(context) { ... }\n` +
                `3. Update your ensemble to use: config.script: "scripts/${name}"\n\n` +
                `See: https://docs.ensemble.ai/conductor/guides/migrate-inline-code`
            ),
            { name }
          )
          continue
        }
      }

      // Create and register the agent
      const agentResult = this.createAgentFromConfig(agentConfig)
      if (agentResult.success) {
        this.agentRegistry.set(name, agentResult.value)
        this.logger.debug('Registered inline agent', { name, operation })
      } else {
        this.logger.warn('Failed to create inline agent', {
          name,
          error: agentResult.error.message,
        })
      }
    }
  }

  /**
   * Resolve a script:// URI to a handler function from bundled scripts
   * @private
   */
  private resolveScriptHandler(
    scriptUri: string,
    agentName: string
  ): (context: AgentExecutionContext) => Promise<unknown> {
    if (!hasGlobalScriptLoader()) {
      const scriptPath = parseScriptURI(scriptUri)
      throw new Error(
        `Cannot resolve script "${scriptUri}" for agent "${agentName}".\n\n` +
          `Script loader not initialized. For Cloudflare Workers:\n` +
          `1. Ensure scripts/${scriptPath}.ts exists with a default export\n` +
          `2. Initialize the script loader in your worker entry:\n\n` +
          `   import { scriptsMap } from 'virtual:conductor-scripts'\n` +
          `   import { setGlobalScriptLoader, createScriptLoader } from '@ensemble-edge/conductor'\n` +
          `   setGlobalScriptLoader(createScriptLoader(scriptsMap))`
      )
    }

    const scriptLoader = getGlobalScriptLoader()
    const handler = scriptLoader.resolve(scriptUri)

    // Wrap to match expected signature (handler receives full context)
    return async (context: AgentExecutionContext): Promise<unknown> => {
      return handler(context)
    }
  }

  /**
   * Create memory manager from ensemble config
   * Extracts userId/sessionId from input and auth context
   * @private
   */
  private createMemoryManager(
    ensemble: EnsembleConfig,
    input: Record<string, any>
  ): MemoryManager | null {
    // Check if memory is configured
    if (!ensemble.memory || ensemble.memory.enabled === false) {
      return null
    }

    const memoryParsed = ensemble.memory

    // Convert parsed config to MemoryConfig format
    const memoryConfig: MemoryConfig = {
      enabled: memoryParsed.enabled !== false,
      layers: {
        working: true, // Always enabled
        session: memoryParsed.session?.enabled !== false && !!memoryParsed.session,
        longTerm: memoryParsed.longTerm?.enabled !== false && !!memoryParsed.longTerm,
        semantic: memoryParsed.semantic?.enabled !== false && !!memoryParsed.semantic,
        analytical: memoryParsed.analytical?.enabled !== false && !!memoryParsed.analytical,
      },
      sessionTTL: memoryParsed.session?.ttl ?? 3600, // Default 1 hour
      semanticModel: memoryParsed.semantic?.model,
    }

    // Extract userId - try multiple sources
    let userId: string | undefined
    if (memoryParsed.longTerm?.userId) {
      // Resolve template expression like {{ auth.userId }} or {{ input.userId }}
      const userIdTemplate = memoryParsed.longTerm.userId
      if (userIdTemplate.includes('{{') || userIdTemplate.includes('${')) {
        // Template expression - resolve it
        userId = Parser.resolveInterpolation(userIdTemplate, {
          input,
          auth: this.auth,
        }) as string | undefined
      } else {
        // Direct value
        userId = userIdTemplate
      }
    }
    // Fallback to auth context
    if (!userId && this.auth?.user?.id) {
      userId = String(this.auth.user.id)
    }

    // Extract sessionId from input (commonly passed as conversationId or sessionId)
    const sessionId =
      (input.sessionId as string) ||
      (input.conversationId as string) ||
      (input.conversation_id as string) ||
      undefined

    // Log memory initialization
    this.logger.debug('Initializing memory manager', {
      ensembleName: ensemble.name,
      layers: memoryConfig.layers,
      hasUserId: !!userId,
      hasSessionId: !!sessionId,
    })

    return new MemoryManager(this.env, memoryConfig, userId, sessionId)
  }

  /**
   * Execute an ensemble with Result-based error handling
   * @param ensemble - Parsed ensemble configuration
   * @param input - Input data for the ensemble
   * @returns Result containing execution output or error
   */
  async executeEnsemble(
    ensemble: EnsembleConfig,
    input: Record<string, any>
  ): AsyncResult<ExecutionOutput, ConductorError> {
    const startTime = Date.now()
    const executionId = generateExecutionId()

    // Initialize observability for this execution
    const observability = createObservabilityManager(
      this.observabilityConfig,
      {
        requestId: this.requestId,
        executionId,
        ensembleName: ensemble.name,
        environment: this.env.ENVIRONMENT,
      },
      this.env.ANALYTICS
    )

    const ensembleLogger = observability.getLogger()
    const ensembleMetrics = observability.getMetrics()

    // Log ensemble start if configured
    if (observability.shouldLogEvent('ensemble:start')) {
      ensembleLogger.info('Ensemble execution started', {
        ensembleName: ensemble.name,
        executionId,
      })
    }

    const metrics: ExecutionMetrics = {
      ensemble: ensemble.name,
      totalDuration: 0,
      agents: [],
      cacheHits: 0,
    }

    // Register inline agents from the ensemble's agents array
    // This enables ensembles to define agents with inline code that work without
    // separate agent files (e.g., operation: code with config.code)
    this.registerInlineAgents(ensemble)

    // Send execution.started notification (fire and forget)
    this.ctx.waitUntil(
      NotificationManager.emitExecutionStarted(ensemble, executionId, input, this.env as Env)
    )

    // Initialize state manager if configured
    const stateManager = ensemble.state ? new StateManager(ensemble.state) : null

    // Initialize memory manager if configured
    const memoryManager = this.createMemoryManager(ensemble, input)

    // Initialize scoring if enabled
    let scoringState: ScoringState | null = null
    let ensembleScorer: EnsembleScorer | null = null
    const scoringExecutor = new ScoringExecutor()

    if (ensemble.scoring?.enabled) {
      ensembleScorer = new EnsembleScorer(ensemble.scoring as EnsembleScoringConfig)
      scoringState = {
        scoreHistory: [],
        retryCount: {},
        qualityMetrics: undefined,
        finalScore: undefined,
      }
    }

    // Context for resolving interpolations
    // Both 'input' and 'trigger' reference the same data for backwards compatibility
    // - 'input' is the original key (for agent step inputs)
    // - 'trigger' is an alias for HTTP request context (method, path, query, headers, body)
    const executionContext: ExecutionContextMap = {
      input,
      trigger: input, // Alias for semantic clarity in YAML templates
      state: stateManager ? stateManager.getState() : {},
      scoring: scoringState || {},
    }

    // Create component registry for this execution
    const componentRegistry = createComponentRegistry(this.env)

    // Create discovery registries for agents and ensembles
    const agentDiscoveryRegistry = createAgentRegistry(this.agentRegistry)
    // Create an empty ensemble registry (ensembles loaded via EnsembleLoader at API level)
    const ensembleDiscoveryRegistry = createEnsembleRegistry(new Map())

    // Create flow execution context with observability
    const flowContext: FlowExecutionContext = {
      ensemble,
      executionContext,
      metrics,
      stateManager,
      scoringState,
      ensembleScorer,
      scoringExecutor,
      startTime,
      observability,
      executionId,
      componentRegistry,
      agentRegistry: agentDiscoveryRegistry,
      ensembleRegistry: ensembleDiscoveryRegistry,
      memoryManager,
    }

    // Execute flow from the beginning
    const result = await this.executeFlow(flowContext, 0)

    // Record ensemble execution metric
    const totalDuration = Date.now() - startTime
    ensembleMetrics.recordEnsembleExecution(ensemble.name, totalDuration, result.success)

    // Log ensemble completion/error
    if (result.success) {
      if (observability.shouldLogEvent('ensemble:complete')) {
        ensembleLogger.info('Ensemble execution completed', {
          ensembleName: ensemble.name,
          executionId,
          durationMs: totalDuration,
          agentCount: metrics.agents.length,
          cacheHits: metrics.cacheHits,
        })
      }
    } else {
      if (observability.shouldLogEvent('ensemble:error')) {
        ensembleLogger.error('Ensemble execution failed', result.error, {
          ensembleName: ensemble.name,
          executionId,
          durationMs: totalDuration,
        })
      }
      ensembleMetrics.recordError('EnsembleExecutionError', result.error.code)
    }

    // Send notifications based on result
    if (result.success) {
      // execution.completed
      this.ctx.waitUntil(
        NotificationManager.emitExecutionCompleted(
          ensemble,
          executionId,
          result.value.output,
          result.value.metrics.totalDuration,
          this.env as Env
        )
      )
    } else {
      // execution.failed
      const error = new Error(result.error.message)
      error.stack = result.error.stack
      this.ctx.waitUntil(
        NotificationManager.emitExecutionFailed(
          ensemble,
          executionId,
          error,
          Date.now() - startTime,
          this.env as Env
        )
      )
    }

    return result
  }

  /**
   * Load and execute an ensemble from YAML with Result-based error handling
   */
  async executeFromYAML(
    yamlContent: string,
    input: Record<string, any>
  ): AsyncResult<ExecutionOutput, ConductorError> {
    // Parse YAML
    const parseResult = Result.fromThrowable(() => Parser.parseEnsemble(yamlContent))
    if (!parseResult.success) {
      return Result.err(Errors.ensembleParse('unknown', parseResult.error.message))
    }
    const ensemble = parseResult.value

    // Validate agent references
    const availableMembers = new Set(this.agentRegistry.keys())
    const validationResult = Result.fromThrowable(() =>
      Parser.validateAgentReferences(ensemble, availableMembers)
    )
    if (!validationResult.success) {
      return Result.err(Errors.ensembleParse(ensemble.name, validationResult.error.message))
    }

    // Execute the ensemble
    return await this.executeEnsemble(ensemble, input)
  }

  /**
   * Get all registered agent names (both built-in and user-defined)
   */
  getRegisteredMembers(): string[] {
    const builtInRegistry = getBuiltInRegistry()
    const builtInNames = builtInRegistry.getAvailableNames()
    const userDefinedNames = Array.from(this.agentRegistry.keys())

    // Combine both, user-defined agents take precedence (can override built-in)
    const allNames = new Set([...builtInNames, ...userDefinedNames])
    return Array.from(allNames)
  }

  /**
   * Check if a agent is registered (checks both built-in and user-defined)
   */
  hasMember(agentName: string): boolean {
    const builtInRegistry = getBuiltInRegistry()
    return builtInRegistry.isBuiltIn(agentName) || this.agentRegistry.has(agentName)
  }

  /**
   * Get all built-in agent metadata
   */
  getBuiltInMembers() {
    const builtInRegistry = getBuiltInRegistry()
    return builtInRegistry.list()
  }

  /**
   * Resume execution from suspended state
   * Used for HITL approval workflows and webhook resumption
   */
  async resumeExecution(
    suspendedState: SuspendedExecutionState,
    resumeInput?: Record<string, any>
  ): AsyncResult<ExecutionOutput, ConductorError> {
    const ensemble = suspendedState.ensemble
    const executionContext = suspendedState.executionContext

    // Merge resume input if provided (e.g., HITL approval data)
    if (resumeInput) {
      executionContext.resumeInput = resumeInput
    }

    // Restore state manager if it existed
    let stateManager: StateManager | null = null
    if (suspendedState.stateSnapshot) {
      // Create state manager from snapshot
      if (ensemble.state) {
        stateManager = new StateManager(ensemble.state)
        // TODO: Restore state from snapshot
        // This requires StateManager to support state restoration
      }
    }

    // Restore scoring state if it existed
    let scoringState: ScoringState | null = null
    let ensembleScorer: EnsembleScorer | null = null
    const scoringExecutor = new ScoringExecutor()

    if (suspendedState.scoringSnapshot) {
      scoringState = suspendedState.scoringSnapshot as ScoringState
      if (ensemble.scoring?.enabled) {
        ensembleScorer = new EnsembleScorer(ensemble.scoring as EnsembleScoringConfig)
      }
    }

    // Restore metrics
    const metrics: ExecutionMetrics = {
      ensemble: ensemble.name,
      totalDuration: 0,
      agents: suspendedState.metrics.agents || [],
      cacheHits: suspendedState.metrics.cacheHits || 0,
    }

    const startTime = suspendedState.metrics.startTime || Date.now()

    // Update execution context with restored state
    if (stateManager) {
      executionContext.state = stateManager.getState()
    }
    if (scoringState) {
      executionContext.scoring = scoringState
    }

    // Restore or generate execution ID
    const executionId = suspendedState.executionId || generateExecutionId()

    // Initialize observability for resumed execution
    const observability = createObservabilityManager(
      this.observabilityConfig,
      {
        requestId: this.requestId,
        executionId,
        ensembleName: ensemble.name,
        environment: this.env.ENVIRONMENT,
      },
      this.env.ANALYTICS
    )

    // Create component registry for resumed execution
    const componentRegistry = createComponentRegistry(this.env)

    // Create discovery registries for agents and ensembles
    const agentDiscoveryRegistry = createAgentRegistry(this.agentRegistry)
    const ensembleDiscoveryRegistry = createEnsembleRegistry(new Map())

    // Re-create memory manager for resumed execution
    // Use original input from suspended state plus any resumeInput
    const originalInput = (executionContext.input as Record<string, any>) ?? {}
    const memoryManager = this.createMemoryManager(ensemble, {
      ...originalInput,
      ...resumeInput,
    })

    // Create flow execution context
    const flowContext: FlowExecutionContext = {
      ensemble,
      executionContext,
      metrics,
      stateManager,
      scoringState,
      ensembleScorer,
      scoringExecutor,
      startTime,
      observability,
      executionId,
      componentRegistry,
      agentRegistry: agentDiscoveryRegistry,
      ensembleRegistry: ensembleDiscoveryRegistry,
      memoryManager,
    }

    // Resume from the specified step
    const resumeFromStep = suspendedState.resumeFromStep

    // Execute flow from the resume point
    return await this.executeFlow(flowContext, resumeFromStep)
  }
}
