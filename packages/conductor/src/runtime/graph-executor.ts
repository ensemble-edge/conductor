/**
 * Graph-based Workflow Executor
 *
 * Executes sophisticated workflows with control flow constructs:
 * - Parallel execution (run multiple steps concurrently)
 * - Conditional branching (if/else, switch/case)
 * - Iteration (foreach, while loops)
 * - Error handling (try/catch/finally)
 * - Map-reduce pattern (parallel map + reduce)
 *
 * The GraphExecutor delegates actual agent execution back to the main Executor
 * via a callback function. This maintains separation of concerns:
 * - GraphExecutor handles control flow logic
 * - Executor handles agent lifecycle, observability, scoring, etc.
 *
 * Integration pattern:
 * ```typescript
 * const graphExecutor = new GraphExecutor(agentExecutorFn)
 * const result = await graphExecutor.execute(ensemble.flow, context)
 * ```
 */

import type {
  FlowStepType,
  AgentFlowStep,
  ParallelFlowStep,
  BranchFlowStep,
  ForeachFlowStep,
  TryFlowStep,
  SwitchFlowStep,
  WhileFlowStep,
  MapReduceFlowStep,
} from '../primitives/types.js'
import {
  isAgentStep,
  isParallelStep,
  isBranchStep,
  isForeachStep,
  isTryStep,
  isSwitchStep,
  isWhileStep,
  isMapReduceStep,
} from '../primitives/types.js'
import { Parser } from './parser.js'
import { Result, type AsyncResult } from '../types/result.js'
import type { ConductorError } from '../errors/error-types.js'
import { EnsembleExecutionError } from '../errors/error-types.js'

/**
 * Callback function type for executing agents
 * The main Executor provides this callback to handle agent execution
 *
 * @param step - The agent step to execute
 * @param context - Current execution context with all previous outputs
 * @returns Promise resolving to the agent's output
 */
export type AgentExecutorFn = (
  step: AgentFlowStep,
  context: GraphExecutionContext
) => Promise<unknown>

/**
 * Execution context passed through the graph
 * Contains input, state, and all previous step outputs
 */
export interface GraphExecutionContext {
  /** Original input to the ensemble */
  input: unknown
  /** Current state (if state management enabled) */
  state?: Record<string, unknown>
  /** Outputs from all completed steps, keyed by step id or agent name */
  results: Map<string, unknown>
  /** Flattened context for expression resolution */
  [key: string]: unknown
}

/**
 * Result of graph execution
 */
export interface GraphExecutionResult {
  /** Final outputs from all steps */
  outputs: Record<string, unknown>
  /** Whether execution completed successfully */
  success: boolean
  /** Error if execution failed */
  error?: Error
}

/**
 * Execution node in the dependency graph
 */
interface ExecutionNode {
  id: string
  type: 'agent' | 'parallel' | 'branch' | 'foreach' | 'try' | 'switch' | 'while' | 'map-reduce'
  step: FlowStepType
  dependencies: string[]
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  result?: unknown
  error?: Error
  startTime?: number
  endTime?: number
}

/**
 * Type guard to check if a flow contains any control flow steps
 */
export function hasControlFlowSteps(flow: FlowStepType[]): boolean {
  return flow.some(
    (step) =>
      isParallelStep(step) ||
      isBranchStep(step) ||
      isForeachStep(step) ||
      isTryStep(step) ||
      isSwitchStep(step) ||
      isWhileStep(step) ||
      isMapReduceStep(step)
  )
}

/**
 * Graph-based workflow executor for control flow constructs
 */
export class GraphExecutor {
  private agentExecutor: AgentExecutorFn
  private ensembleName: string

  /**
   * Create a new GraphExecutor
   *
   * @param agentExecutor - Callback function to execute agent steps
   * @param ensembleName - Name of the ensemble (for error messages)
   */
  constructor(agentExecutor: AgentExecutorFn, ensembleName: string = 'unknown') {
    this.agentExecutor = agentExecutor
    this.ensembleName = ensembleName
  }

  /**
   * Execute a graph-based flow
   *
   * @param flow - Array of flow steps to execute
   * @param initialContext - Initial execution context (input, state)
   * @returns Result containing all step outputs or an error
   */
  async execute(
    flow: FlowStepType[],
    initialContext: { input: unknown; state?: Record<string, unknown> }
  ): AsyncResult<Record<string, unknown>, ConductorError> {
    const context: GraphExecutionContext = {
      input: initialContext.input,
      state: initialContext.state,
      results: new Map(),
    }

    // Add input and state to context for expression resolution
    ;(context as Record<string, unknown>).input = initialContext.input
    if (initialContext.state) {
      ;(context as Record<string, unknown>).state = initialContext.state
    }

    try {
      // Execute steps sequentially, but handle control flow internally
      for (let i = 0; i < flow.length; i++) {
        const step = flow[i]
        const result = await this.executeStep(step, context)

        // Store result with appropriate key
        const stepKey = this.getStepKey(step, i)
        context.results.set(stepKey, result)

        // Also add to flat context for expression resolution
        ;(context as Record<string, unknown>)[stepKey] = { output: result }
      }

      return Result.ok(Object.fromEntries(context.results))
    } catch (error) {
      return Result.err(
        new EnsembleExecutionError(
          this.ensembleName,
          'graph-execution',
          error instanceof Error ? error : new Error(String(error))
        )
      )
    }
  }

  /**
   * Execute a single step (dispatches to appropriate handler based on type)
   */
  private async executeStep(step: FlowStepType, context: GraphExecutionContext): Promise<unknown> {
    // Agent step - delegate to executor callback
    if (isAgentStep(step)) {
      return this.executeAgentStep(step, context)
    }

    // Control flow steps
    if (isParallelStep(step)) {
      return this.executeParallel(step, context)
    }

    if (isBranchStep(step)) {
      return this.executeBranch(step, context)
    }

    if (isForeachStep(step)) {
      return this.executeForeach(step, context)
    }

    if (isTryStep(step)) {
      return this.executeTry(step, context)
    }

    if (isSwitchStep(step)) {
      return this.executeSwitch(step, context)
    }

    if (isWhileStep(step)) {
      return this.executeWhile(step, context)
    }

    if (isMapReduceStep(step)) {
      return this.executeMapReduce(step, context)
    }

    throw new Error(`Unknown step type: ${JSON.stringify(step)}`)
  }

  /**
   * Execute an agent step by delegating to the executor callback
   */
  private async executeAgentStep(
    step: AgentFlowStep,
    context: GraphExecutionContext
  ): Promise<unknown> {
    // Check conditional execution (when/condition)
    if (step.when !== undefined || step.condition !== undefined) {
      const condition = step.when ?? step.condition
      const shouldExecute = this.evaluateCondition(condition, context)
      if (!shouldExecute) {
        return { skipped: true, reason: 'condition evaluated to false' }
      }
    }

    // Resolve input interpolations
    const resolvedInput = step.input
      ? Parser.resolveInterpolation(step.input, this.buildResolutionContext(context))
      : undefined

    // Create step with resolved input
    const resolvedStep: AgentFlowStep = {
      ...step,
      input: resolvedInput as Record<string, unknown> | undefined,
    }

    // Delegate to executor callback for actual agent execution
    return this.agentExecutor(resolvedStep, context)
  }

  /**
   * Execute parallel steps concurrently
   */
  private async executeParallel(
    step: ParallelFlowStep,
    context: GraphExecutionContext
  ): Promise<unknown[]> {
    const executions = step.steps.map((subStep) => this.executeStep(subStep, context))

    switch (step.waitFor) {
      case 'any':
        // Return first completed result
        return [await Promise.race(executions)]

      case 'first':
        // Return first successful result (ignores failures)
        return [
          await Promise.any(executions).catch(() => {
            throw new Error('All parallel steps failed')
          }),
        ]

      case 'all':
      default:
        // Wait for all to complete
        return Promise.all(executions)
    }
  }

  /**
   * Execute conditional branch
   */
  private async executeBranch(
    step: BranchFlowStep,
    context: GraphExecutionContext
  ): Promise<unknown> {
    const conditionResult = this.evaluateCondition(step.condition, context)

    // Select branch based on condition
    const branchSteps = conditionResult ? step.then : step.else || []

    // Execute selected branch sequentially
    const branchResults: unknown[] = []
    for (const subStep of branchSteps) {
      const result = await this.executeStep(subStep, context)
      branchResults.push(result)
    }

    return branchResults
  }

  /**
   * Execute foreach loop over items
   */
  private async executeForeach(
    step: ForeachFlowStep,
    context: GraphExecutionContext
  ): Promise<unknown[]> {
    // Resolve items expression
    const items = this.resolveExpression(step.items, context)

    if (!Array.isArray(items)) {
      throw new Error(`Foreach items must be an array, got: ${typeof items}`)
    }

    const maxConcurrency = step.maxConcurrency || items.length
    const results: unknown[] = []

    // Process items in batches based on maxConcurrency
    for (let i = 0; i < items.length; i += maxConcurrency) {
      const batch = items.slice(i, i + maxConcurrency)

      const batchResults = await Promise.all(
        batch.map((item, index) => {
          // Create context with current item and index
          const itemContext: GraphExecutionContext = {
            ...context,
            results: new Map(context.results),
          }
          ;(itemContext as Record<string, unknown>).item = item
          ;(itemContext as Record<string, unknown>).index = i + index

          return this.executeStep(step.step, itemContext)
        })
      )

      results.push(...batchResults)

      // Check break condition after each batch
      if (step.breakWhen) {
        const shouldBreak = this.evaluateCondition(step.breakWhen, {
          ...context,
          results: new Map([...context.results, ['lastBatchResults', batchResults]]),
        } as GraphExecutionContext)
        if (shouldBreak) {
          break
        }
      }
    }

    return results
  }

  /**
   * Execute try/catch/finally block
   */
  private async executeTry(step: TryFlowStep, context: GraphExecutionContext): Promise<unknown> {
    let tryResult: unknown
    let caughtError: Error | null = null

    try {
      // Execute try block
      const tryResults: unknown[] = []
      for (const subStep of step.steps) {
        const result = await this.executeStep(subStep, context)
        tryResults.push(result)
      }
      tryResult = tryResults
    } catch (error) {
      caughtError = error instanceof Error ? error : new Error(String(error))

      // Execute catch block if present
      if (step.catch && step.catch.length > 0) {
        const errorContext: GraphExecutionContext = {
          ...context,
          results: new Map(context.results),
        }
        ;(errorContext as Record<string, unknown>).error = {
          message: caughtError.message,
          name: caughtError.name,
          stack: caughtError.stack,
        }

        const catchResults: unknown[] = []
        for (const subStep of step.catch) {
          const result = await this.executeStep(subStep, errorContext)
          catchResults.push(result)
        }
        tryResult = catchResults
      } else {
        // No catch block - rethrow
        throw caughtError
      }
    } finally {
      // Execute finally block if present
      if (step.finally && step.finally.length > 0) {
        for (const subStep of step.finally) {
          await this.executeStep(subStep, context)
        }
      }
    }

    return tryResult
  }

  /**
   * Execute switch/case branching
   */
  private async executeSwitch(
    step: SwitchFlowStep,
    context: GraphExecutionContext
  ): Promise<unknown> {
    // Resolve the switch value
    const value = this.resolveExpression(step.value, context)
    const valueStr = String(value)

    // Find matching case
    let caseSteps = step.cases[valueStr]
    if (!caseSteps && step.default) {
      caseSteps = step.default
    }

    if (!caseSteps) {
      return null // No matching case and no default
    }

    // Execute case steps sequentially
    const caseResults: unknown[] = []
    for (const subStep of caseSteps) {
      const result = await this.executeStep(subStep, context)
      caseResults.push(result)
    }

    return caseResults
  }

  /**
   * Execute while loop
   */
  private async executeWhile(
    step: WhileFlowStep,
    context: GraphExecutionContext
  ): Promise<unknown[]> {
    const maxIterations = step.maxIterations || 1000 // Safety limit
    const results: unknown[] = []
    let iterations = 0

    // Create mutable context for loop
    const loopContext: GraphExecutionContext = {
      ...context,
      results: new Map(context.results),
    }

    while (iterations < maxIterations) {
      // Check condition before each iteration
      const shouldContinue = this.evaluateCondition(step.condition, loopContext)
      if (!shouldContinue) {
        break
      }

      // Execute loop body
      const iterationResults: unknown[] = []
      for (const subStep of step.steps) {
        const result = await this.executeStep(subStep, loopContext)
        iterationResults.push(result)
      }

      results.push(iterationResults)
      ;(loopContext as Record<string, unknown>).iteration = iterations
      ;(loopContext as Record<string, unknown>).lastIterationResults = iterationResults

      iterations++
    }

    if (iterations >= maxIterations) {
      throw new Error(`While loop exceeded maximum iterations (${maxIterations})`)
    }

    return results
  }

  /**
   * Execute map-reduce pattern
   */
  private async executeMapReduce(
    step: MapReduceFlowStep,
    context: GraphExecutionContext
  ): Promise<unknown> {
    // Resolve items expression
    const items = this.resolveExpression(step.items, context)

    if (!Array.isArray(items)) {
      throw new Error(`Map-reduce items must be an array, got: ${typeof items}`)
    }

    const maxConcurrency = step.maxConcurrency || items.length
    const mapResults: unknown[] = []

    // Map phase: process items with concurrency control
    for (let i = 0; i < items.length; i += maxConcurrency) {
      const batch = items.slice(i, i + maxConcurrency)

      const batchResults = await Promise.all(
        batch.map((item, index) => {
          const itemContext: GraphExecutionContext = {
            ...context,
            results: new Map(context.results),
          }
          ;(itemContext as Record<string, unknown>).item = item
          ;(itemContext as Record<string, unknown>).index = i + index

          return this.executeStep(step.map, itemContext)
        })
      )

      mapResults.push(...batchResults)
    }

    // Reduce phase: aggregate results
    const reduceContext: GraphExecutionContext = {
      ...context,
      results: new Map(context.results),
    }
    ;(reduceContext as Record<string, unknown>).mapResults = mapResults
    ;(reduceContext as Record<string, unknown>).results = mapResults // Alias

    return this.executeStep(step.reduce, reduceContext)
  }

  /**
   * Get a unique key for storing step results
   */
  private getStepKey(step: FlowStepType, index: number): string {
    if (isAgentStep(step)) {
      return step.id || step.agent
    }

    // For control flow steps, use type and index
    if ('type' in step) {
      return `${step.type}_${index}`
    }

    return `step_${index}`
  }

  /**
   * Evaluate a condition expression
   * Supports both interpolation expressions and JavaScript expressions
   */
  private evaluateCondition(condition: unknown, context: GraphExecutionContext): boolean {
    if (typeof condition === 'boolean') {
      return condition
    }

    if (typeof condition === 'string') {
      // First try to resolve interpolation (${...} or {{...}})
      const resolved = this.resolveExpression(condition, context)

      if (typeof resolved === 'boolean') {
        return resolved
      }

      // If still a string, try to evaluate as expression
      if (typeof resolved === 'string') {
        return this.evaluateJsExpression(resolved, context)
      }

      // Truthy check
      return Boolean(resolved)
    }

    // For objects/arrays, check truthiness
    return Boolean(condition)
  }

  /**
   * Resolve an expression using Parser's interpolation system
   */
  private resolveExpression(expression: unknown, context: GraphExecutionContext): unknown {
    if (expression === null || expression === undefined) {
      return expression
    }

    return Parser.resolveInterpolation(expression, this.buildResolutionContext(context))
  }

  /**
   * Build resolution context for Parser.resolveInterpolation
   */
  private buildResolutionContext(context: GraphExecutionContext): Record<string, unknown> {
    const resolutionContext: Record<string, unknown> = {
      input: context.input,
      state: context.state || {},
    }

    // Add all step results to context
    for (const [key, value] of context.results) {
      resolutionContext[key] = { output: value }
    }

    // Add any additional context properties
    for (const [key, value] of Object.entries(context)) {
      if (key !== 'input' && key !== 'state' && key !== 'results') {
        resolutionContext[key] = value
      }
    }

    return resolutionContext
  }

  /**
   * Evaluate a JavaScript expression in the context
   * Used as fallback for complex condition expressions
   */
  private evaluateJsExpression(expression: string, context: GraphExecutionContext): boolean {
    try {
      // Build evaluation context
      const evalContext = this.buildResolutionContext(context)

      // Create function with context variables
      const func = new Function('context', 'input', 'state', 'results', `return ${expression}`)

      return Boolean(
        func(evalContext, context.input, context.state || {}, Object.fromEntries(context.results))
      )
    } catch (error) {
      // If evaluation fails, return false (safe default)
      console.warn(`Failed to evaluate condition "${expression}":`, error)
      return false
    }
  }
}
