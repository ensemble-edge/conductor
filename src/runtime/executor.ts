/**
 * Core Executor - Refactored with Result Types
 *
 * Orchestrates ensemble execution with explicit error handling using Result types.
 * Makes all error cases explicit and checked at compile time.
 */

import { Parser, type EnsembleConfig, type FlowStep, type AgentConfig } from './parser.js'
import { StateManager, type AccessReport, type AccessLogEntry } from './state-manager.js'
import type { BaseAgent, AgentExecutionContext, AgentResponse } from '../agents/base-agent.js'
import type { ConductorEnv } from '../types/env.js'
import { FunctionAgent } from '../agents/function-agent.js'
import { ThinkAgent } from '../agents/think-agent.js'
import { DataAgent } from '../agents/data-agent.js'
import { APIAgent } from '../agents/api-agent.js'
import { EmailAgent } from '../agents/email/email-agent.js'
import { SmsMember } from '../agents/sms/sms-agent.js'
import { FormAgent } from '../agents/form/form-agent.js'
import { PageAgent } from '../agents/page/page-agent.js'
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
import { createLogger, type Logger } from '../observability/index.js'

export interface ExecutorConfig {
  env: ConductorEnv
  ctx: ExecutionContext
  logger?: Logger
}

/**
 * Successful execution output
 */
export interface ExecutionOutput {
  output: unknown
  metrics: ExecutionMetrics
  stateReport?: AccessReport
  scoring?: ScoringState
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
 */
interface AgentExecutionResult {
  output: unknown
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
}

/**
 * Core execution engine for ensembles with Result-based error handling
 */
export class Executor {
  private env: ConductorEnv
  private ctx: ExecutionContext
  private agentRegistry: Map<string, BaseAgent>
  private logger: Logger

  constructor(config: ExecutorConfig) {
    this.env = config.env
    this.ctx = config.ctx
    this.agentRegistry = new Map()
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
          const agent = builtInRegistry.create(name, config, this.env)
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
        return Result.ok(new DataAgent(config))

      case Operation.http:
        return Result.ok(new APIAgent(config))

      case Operation.email:
        return Result.ok(new EmailAgent(config))

      case Operation.sms:
        return Result.ok(new SmsMember(config))

      case Operation.form:
        return Result.ok(new FormAgent(config))

      case Operation.page:
        return Result.ok(new PageAgent(config))

      case Operation.html:
        return Result.ok(new HtmlMember(config))

      case Operation.pdf:
        return Result.ok(new PdfMember(config))

      case Operation.code:
        return Result.err(
          Errors.agentConfig(
            config.name,
            'Function agents require code implementation and must be registered manually'
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
   * Execute a single flow step with all associated logic
   * @private
   */
  private async executeStep(
    step: FlowStep,
    flowContext: FlowExecutionContext,
    stepIndex: number
  ): AsyncResult<void, ConductorError> {
    const {
      ensemble,
      executionContext,
      metrics,
      stateManager,
      scoringState,
      ensembleScorer,
      scoringExecutor,
    } = flowContext
    const agentStartTime = Date.now()

    // Resolve input interpolations
    let resolvedInput: unknown
    if (step.input) {
      // User specified explicit input mapping
      resolvedInput = Parser.resolveInterpolation(step.input, executionContext)
    } else if (stepIndex > 0) {
      // Default to previous agent's output for chaining
      const previousAgentName = ensemble.flow[stepIndex - 1].agent
      const previousResult = executionContext[previousAgentName] as AgentExecutionResult | undefined
      resolvedInput = previousResult?.output || {}
    } else {
      // First step with no input - use original ensemble input
      resolvedInput = executionContext.input || {}
    }

    // Resolve agent - error handling is explicit
    const agentResult = await this.resolveAgent(step.agent)
    if (!agentResult.success) {
      return Result.err(new EnsembleExecutionError(ensemble.name, step.agent, agentResult.error))
    }
    const agent = agentResult.value

    // Create agent execution context
    const agentContext: AgentExecutionContext = {
      input: resolvedInput as Record<string, any>,
      env: this.env,
      ctx: this.ctx,
      previousOutputs: executionContext,
    }

    // Add state context if available and track updates
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

    // Execute agent (with scoring if configured)
    let response: AgentResponse
    let scoringResult: ScoringResult | undefined

    if (step.scoring && scoringState && ensembleScorer) {
      // Execute with scoring and retry logic
      const scoringConfig = step.scoring as AgentScoringConfig
      const scoredResult = await scoringExecutor.executeWithScoring(
        // Agent execution function
        async () => {
          const resp = await agent.execute(agentContext)
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

      // Extract response and scoring result
      response = scoredResult.output
      scoringResult = scoredResult.score

      // Update scoring state
      scoringState.scoreHistory.push({
        agent: step.agent,
        score: scoringResult.score,
        passed: scoringResult.passed,
        feedback: scoringResult.feedback,
        breakdown: scoringResult.breakdown,
        timestamp: Date.now(),
        attempt: scoredResult.attempts,
      })

      // Track retry count
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
    } else {
      // Normal execution without scoring
      response = await agent.execute(agentContext)

      // Apply pending state updates
      if (stateManager && getPendingUpdates) {
        const { updates, newLog } = getPendingUpdates()
        flowContext.stateManager = stateManager.applyPendingUpdates(updates, newLog)
      }
    }

    // Track metrics
    const agentDuration = Date.now() - agentStartTime
    metrics.agents.push({
      name: step.agent,
      duration: agentDuration,
      cached: response.cached,
      success: response.success,
    })

    if (response.cached) {
      metrics.cacheHits++
    }

    // Handle agent execution errors explicitly
    if (!response.success) {
      return Result.err(
        new AgentExecutionError(step.agent, response.error || 'Unknown error', undefined)
      )
    }

    // Store agent output in context for future interpolations
    executionContext[step.agent] = {
      output: response.data,
    }

    // Update state context with new state from immutable StateManager
    if (flowContext.stateManager) {
      executionContext.state = flowContext.stateManager.getState()
    }

    // Update scoring context for interpolations
    if (scoringState) {
      executionContext.scoring = scoringState
    }

    return Result.ok(undefined)
  }

  /**
   * Execute ensemble flow from a given step
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
    for (let i = startStep; i < ensemble.flow.length; i++) {
      const step = ensemble.flow[i]
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

    // Resolve final output
    let finalOutput: unknown
    if (ensemble.output) {
      // User specified output interpolation
      finalOutput = Parser.resolveInterpolation(ensemble.output, executionContext)
    } else if (ensemble.flow.length > 0) {
      // Default to last agent's output
      const lastMemberName = ensemble.flow[ensemble.flow.length - 1].agent
      const lastResult = executionContext[lastMemberName] as AgentExecutionResult | undefined
      finalOutput = lastResult?.output
    } else {
      // No flow steps - return empty
      finalOutput = {}
    }

    // Calculate total duration
    metrics.totalDuration = Date.now() - startTime

    // Get state report if available
    const stateReport = flowContext.stateManager?.getAccessReport()

    // Build execution output with scoring data
    const executionOutput: ExecutionOutput = {
      output: finalOutput,
      metrics,
      stateReport,
    }

    // Add scoring data if available
    if (scoringState) {
      executionOutput.scoring = scoringState
    }

    return Result.ok(executionOutput)
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
    const metrics: ExecutionMetrics = {
      ensemble: ensemble.name,
      totalDuration: 0,
      agents: [],
      cacheHits: 0,
    }

    // Initialize state manager if configured
    const stateManager = ensemble.state ? new StateManager(ensemble.state) : null

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
    const executionContext: ExecutionContextMap = {
      input,
      state: stateManager ? stateManager.getState() : {},
      scoring: scoringState || {},
    }

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
    }

    // Execute flow from the beginning
    return await this.executeFlow(flowContext, 0)
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
    }

    // Resume from the specified step
    const resumeFromStep = suspendedState.resumeFromStep

    // Execute flow from the resume point
    return await this.executeFlow(flowContext, resumeFromStep)
  }
}
