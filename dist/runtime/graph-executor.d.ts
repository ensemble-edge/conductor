/**
 * Graph-based Workflow Executor
 *
 * Executes sophisticated workflows with parallel execution,
 * branching, and complex dependencies.
 */
import type { FlowElement } from './graph-types';
import { Result } from '../types/result';
import type { ConductorError } from '../errors/error-types';
export declare class GraphExecutor {
    /**
     * Execute a graph-based flow
     */
    execute(flow: FlowElement[], context: Record<string, unknown>): Promise<Result<Record<string, unknown>, ConductorError>>;
    /**
     * Build execution graph from flow elements
     */
    private buildGraph;
    /**
     * Add node to graph
     */
    private addNode;
    /**
     * Get element type
     */
    private getElementType;
    /**
     * Get dependencies from element
     */
    private getDependencies;
    /**
     * Execute the graph
     */
    private executeGraph;
    /**
     * Execute a single node
     */
    private executeNode;
    /**
     * Execute a single step
     */
    private executeStep;
    /**
     * Execute step with retry, timeout, and conditional execution
     */
    private executeStepWithFeatures;
    /**
     * Execute step with retry logic
     */
    private executeWithRetry;
    /**
     * Execute step with timeout
     */
    private executeWithTimeout;
    /**
     * Execute parallel block
     */
    private executeParallel;
    /**
     * Execute conditional branch
     */
    private executeBranch;
    /**
     * Execute foreach loop
     */
    private executeForEach;
    /**
     * Execute any flow element
     */
    private executeElement;
    /**
     * Execute try/catch/finally block
     */
    private executeTry;
    /**
     * Execute switch/case block
     */
    private executeSwitch;
    /**
     * Execute while loop
     */
    private executeWhile;
    /**
     * Execute map/reduce pattern
     */
    private executeMapReduce;
    /**
     * Evaluate condition expression
     */
    private evaluateCondition;
    /**
     * Resolve expression to value
     */
    private resolveExpression;
}
//# sourceMappingURL=graph-executor.d.ts.map