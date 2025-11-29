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
import type { FlowStepType, AgentFlowStep } from '../primitives/types.js';
import { type AsyncResult } from '../types/result.js';
import type { ConductorError } from '../errors/error-types.js';
/**
 * Callback function type for executing agents
 * The main Executor provides this callback to handle agent execution
 *
 * @param step - The agent step to execute
 * @param context - Current execution context with all previous outputs
 * @returns Promise resolving to the agent's output
 */
export type AgentExecutorFn = (step: AgentFlowStep, context: GraphExecutionContext) => Promise<unknown>;
/**
 * Execution context passed through the graph
 * Contains input, state, and all previous step outputs
 */
export interface GraphExecutionContext {
    /** Original input to the ensemble */
    input: unknown;
    /** Current state (if state management enabled) */
    state?: Record<string, unknown>;
    /** Outputs from all completed steps, keyed by step id or agent name */
    results: Map<string, unknown>;
    /** Flattened context for expression resolution */
    [key: string]: unknown;
}
/**
 * Result of graph execution
 */
export interface GraphExecutionResult {
    /** Final outputs from all steps */
    outputs: Record<string, unknown>;
    /** Whether execution completed successfully */
    success: boolean;
    /** Error if execution failed */
    error?: Error;
}
/**
 * Type guard to check if a flow contains any control flow steps
 */
export declare function hasControlFlowSteps(flow: FlowStepType[]): boolean;
/**
 * Graph-based workflow executor for control flow constructs
 */
export declare class GraphExecutor {
    private agentExecutor;
    private ensembleName;
    /**
     * Create a new GraphExecutor
     *
     * @param agentExecutor - Callback function to execute agent steps
     * @param ensembleName - Name of the ensemble (for error messages)
     */
    constructor(agentExecutor: AgentExecutorFn, ensembleName?: string);
    /**
     * Execute a graph-based flow
     *
     * @param flow - Array of flow steps to execute
     * @param initialContext - Initial execution context (input, state)
     * @returns Result containing all step outputs or an error
     */
    execute(flow: FlowStepType[], initialContext: {
        input: unknown;
        state?: Record<string, unknown>;
    }): AsyncResult<Record<string, unknown>, ConductorError>;
    /**
     * Execute a single step (dispatches to appropriate handler based on type)
     */
    private executeStep;
    /**
     * Execute an agent step by delegating to the executor callback
     */
    private executeAgentStep;
    /**
     * Execute parallel steps concurrently
     */
    private executeParallel;
    /**
     * Execute conditional branch
     */
    private executeBranch;
    /**
     * Execute foreach loop over items
     */
    private executeForeach;
    /**
     * Execute try/catch/finally block
     */
    private executeTry;
    /**
     * Execute switch/case branching
     */
    private executeSwitch;
    /**
     * Execute while loop
     */
    private executeWhile;
    /**
     * Execute map-reduce pattern
     */
    private executeMapReduce;
    /**
     * Get a unique key for storing step results
     */
    private getStepKey;
    /**
     * Evaluate a condition expression
     * Supports both interpolation expressions and JavaScript expressions
     */
    private evaluateCondition;
    /**
     * Resolve an expression using Parser's interpolation system
     */
    private resolveExpression;
    /**
     * Build resolution context for Parser.resolveInterpolation
     */
    private buildResolutionContext;
    /**
     * Evaluate a JavaScript expression in the context
     * Used as fallback for complex condition expressions
     */
    private evaluateJsExpression;
}
//# sourceMappingURL=graph-executor.d.ts.map