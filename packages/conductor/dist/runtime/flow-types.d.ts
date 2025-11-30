/**
 * Flow Step Types
 *
 * This file defines the canonical flow step types used throughout Conductor.
 * These types MUST be defined explicitly (not derived via z.infer) because
 * Zod's z.lazy() creates circular references that TypeScript cannot resolve.
 *
 * This file is deliberately kept separate from parser.ts to avoid circular
 * dependencies, as it's imported by both primitives and runtime modules.
 */
/**
 * Agent flow step - calls a named agent
 */
export interface AgentFlowStep {
    agent: string;
    id?: string;
    input?: Record<string, unknown>;
    state?: {
        use?: string[];
        set?: string[];
    };
    cache?: {
        ttl?: number;
        bypass?: boolean;
    };
    scoring?: {
        evaluator: string;
        thresholds?: {
            minimum?: number;
            target?: number;
            excellent?: number;
        };
        criteria?: Record<string, string> | unknown[];
        onFailure?: 'retry' | 'continue' | 'abort';
        retryLimit?: number;
        requireImprovement?: boolean;
        minImprovement?: number;
    };
    condition?: unknown;
    when?: unknown;
    depends_on?: string[];
    retry?: {
        attempts?: number;
        backoff?: 'linear' | 'exponential' | 'fixed';
        initialDelay?: number;
        maxDelay?: number;
        retryOn?: string[];
    };
    timeout?: number;
    onTimeout?: {
        fallback?: unknown;
        error?: boolean;
    };
}
/**
 * Parallel flow step - executes multiple steps concurrently
 */
export interface ParallelFlowStep {
    type: 'parallel';
    steps: FlowStepType[];
    waitFor?: 'all' | 'any' | 'first';
}
/**
 * Branch flow step - conditional branching with then/else
 */
export interface BranchFlowStep {
    type: 'branch';
    condition: unknown;
    then: FlowStepType[];
    else?: FlowStepType[];
}
/**
 * Foreach flow step - iterate over items
 */
export interface ForeachFlowStep {
    type: 'foreach';
    items: unknown;
    maxConcurrency?: number;
    breakWhen?: unknown;
    step: FlowStepType;
}
/**
 * Try flow step - error handling with try/catch/finally
 */
export interface TryFlowStep {
    type: 'try';
    steps: FlowStepType[];
    catch?: FlowStepType[];
    finally?: FlowStepType[];
}
/**
 * Switch flow step - multi-way branching
 */
export interface SwitchFlowStep {
    type: 'switch';
    value: unknown;
    cases: Record<string, FlowStepType[]>;
    default?: FlowStepType[];
}
/**
 * While flow step - repeat while condition is true
 */
export interface WhileFlowStep {
    type: 'while';
    condition: unknown;
    maxIterations?: number;
    steps: FlowStepType[];
}
/**
 * Map-reduce flow step - parallel processing with aggregation
 */
export interface MapReduceFlowStep {
    type: 'map-reduce';
    items: unknown;
    maxConcurrency?: number;
    map: FlowStepType;
    reduce: FlowStepType;
}
/**
 * Union of all flow step types
 * Agent steps don't have a 'type' field, control flow steps do
 */
export type FlowStepType = AgentFlowStep | ParallelFlowStep | BranchFlowStep | ForeachFlowStep | TryFlowStep | SwitchFlowStep | WhileFlowStep | MapReduceFlowStep;
/**
 * Check if a step is a parallel step
 */
export declare function isParallelStep(step: FlowStepType): step is ParallelFlowStep;
/**
 * Check if a step is a branch step
 */
export declare function isBranchStep(step: FlowStepType): step is BranchFlowStep;
/**
 * Check if a step is a foreach step
 */
export declare function isForeachStep(step: FlowStepType): step is ForeachFlowStep;
/**
 * Check if a step is a try step
 */
export declare function isTryStep(step: FlowStepType): step is TryFlowStep;
/**
 * Check if a step is a switch step
 */
export declare function isSwitchStep(step: FlowStepType): step is SwitchFlowStep;
/**
 * Check if a step is a while step
 */
export declare function isWhileStep(step: FlowStepType): step is WhileFlowStep;
/**
 * Check if a step is a map-reduce step
 */
export declare function isMapReduceStep(step: FlowStepType): step is MapReduceFlowStep;
/**
 * Check if a step is an agent step (no 'type' field)
 */
export declare function isAgentStep(step: FlowStepType): step is AgentFlowStep;
/**
 * Check if a step is a control flow step (has 'type' field)
 */
export declare function isControlFlowStep(step: FlowStepType): step is Exclude<FlowStepType, AgentFlowStep>;
/**
 * Check if a step is any flow control step
 */
export declare function isFlowControlStep(step: FlowStepType): boolean;
//# sourceMappingURL=flow-types.d.ts.map