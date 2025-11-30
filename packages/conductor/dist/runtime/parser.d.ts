/**
 * YAML Parser - Refactored with Interpolation System
 *
 * Uses composition-based interpolation resolvers.
 * Reduced resolveInterpolation from 42 lines to 1 line via chain of responsibility.
 *
 * The parser converts YAML to validated config objects, which can then be
 * converted to Ensemble instances using ensembleFromConfig().
 *
 * Architecture:
 * - YAML → Parser → EnsembleConfig → ensembleFromConfig() → Ensemble
 * - TypeScript → createEnsemble() → Ensemble
 * - Both paths produce identical Ensemble instances
 *
 * Type Unification:
 * - Zod schemas are the SINGLE SOURCE OF TRUTH for all type definitions
 * - TypeScript types are derived using z.infer<typeof Schema>
 * - This ensures runtime validation and TypeScript types are always in sync
 */
import { z } from 'zod';
import type { ResolutionContext } from './interpolation/index.js';
import { Operation } from '../types/constants.js';
import { ensembleFromConfig, Ensemble, isEnsemble } from '../primitives/ensemble.js';
export { ensembleFromConfig, Ensemble, isEnsemble };
/**
 * Base schema for agent flow steps (the most common type)
 */
export declare const AgentFlowStepSchema: z.ZodObject<{
    agent: z.ZodString;
    id: z.ZodOptional<z.ZodString>;
    input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    state: z.ZodOptional<z.ZodObject<{
        use: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        set: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        set?: string[] | undefined;
        use?: string[] | undefined;
    }, {
        set?: string[] | undefined;
        use?: string[] | undefined;
    }>>;
    cache: z.ZodOptional<z.ZodObject<{
        ttl: z.ZodOptional<z.ZodNumber>;
        bypass: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        ttl?: number | undefined;
        bypass?: boolean | undefined;
    }, {
        ttl?: number | undefined;
        bypass?: boolean | undefined;
    }>>;
    scoring: z.ZodOptional<z.ZodObject<{
        evaluator: z.ZodString;
        thresholds: z.ZodOptional<z.ZodObject<{
            minimum: z.ZodOptional<z.ZodNumber>;
            target: z.ZodOptional<z.ZodNumber>;
            excellent: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            minimum?: number | undefined;
            target?: number | undefined;
            excellent?: number | undefined;
        }, {
            minimum?: number | undefined;
            target?: number | undefined;
            excellent?: number | undefined;
        }>>;
        criteria: z.ZodOptional<z.ZodUnion<[z.ZodRecord<z.ZodString, z.ZodString>, z.ZodArray<z.ZodUnknown, "many">]>>;
        onFailure: z.ZodOptional<z.ZodEnum<["retry", "continue", "abort"]>>;
        retryLimit: z.ZodOptional<z.ZodNumber>;
        requireImprovement: z.ZodOptional<z.ZodBoolean>;
        minImprovement: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        evaluator: string;
        thresholds?: {
            minimum?: number | undefined;
            target?: number | undefined;
            excellent?: number | undefined;
        } | undefined;
        criteria?: unknown[] | Record<string, string> | undefined;
        onFailure?: "retry" | "continue" | "abort" | undefined;
        retryLimit?: number | undefined;
        requireImprovement?: boolean | undefined;
        minImprovement?: number | undefined;
    }, {
        evaluator: string;
        thresholds?: {
            minimum?: number | undefined;
            target?: number | undefined;
            excellent?: number | undefined;
        } | undefined;
        criteria?: unknown[] | Record<string, string> | undefined;
        onFailure?: "retry" | "continue" | "abort" | undefined;
        retryLimit?: number | undefined;
        requireImprovement?: boolean | undefined;
        minImprovement?: number | undefined;
    }>>;
    condition: z.ZodOptional<z.ZodUnknown>;
    when: z.ZodOptional<z.ZodUnknown>;
    depends_on: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    retry: z.ZodOptional<z.ZodObject<{
        attempts: z.ZodOptional<z.ZodNumber>;
        backoff: z.ZodOptional<z.ZodEnum<["linear", "exponential", "fixed"]>>;
        initialDelay: z.ZodOptional<z.ZodNumber>;
        maxDelay: z.ZodOptional<z.ZodNumber>;
        retryOn: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        attempts?: number | undefined;
        backoff?: "linear" | "exponential" | "fixed" | undefined;
        initialDelay?: number | undefined;
        maxDelay?: number | undefined;
        retryOn?: string[] | undefined;
    }, {
        attempts?: number | undefined;
        backoff?: "linear" | "exponential" | "fixed" | undefined;
        initialDelay?: number | undefined;
        maxDelay?: number | undefined;
        retryOn?: string[] | undefined;
    }>>;
    timeout: z.ZodOptional<z.ZodNumber>;
    onTimeout: z.ZodOptional<z.ZodObject<{
        fallback: z.ZodOptional<z.ZodUnknown>;
        error: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        error?: boolean | undefined;
        fallback?: unknown;
    }, {
        error?: boolean | undefined;
        fallback?: unknown;
    }>>;
}, "strip", z.ZodTypeAny, {
    agent: string;
    scoring?: {
        evaluator: string;
        thresholds?: {
            minimum?: number | undefined;
            target?: number | undefined;
            excellent?: number | undefined;
        } | undefined;
        criteria?: unknown[] | Record<string, string> | undefined;
        onFailure?: "retry" | "continue" | "abort" | undefined;
        retryLimit?: number | undefined;
        requireImprovement?: boolean | undefined;
        minImprovement?: number | undefined;
    } | undefined;
    cache?: {
        ttl?: number | undefined;
        bypass?: boolean | undefined;
    } | undefined;
    when?: unknown;
    timeout?: number | undefined;
    retry?: {
        attempts?: number | undefined;
        backoff?: "linear" | "exponential" | "fixed" | undefined;
        initialDelay?: number | undefined;
        maxDelay?: number | undefined;
        retryOn?: string[] | undefined;
    } | undefined;
    id?: string | undefined;
    input?: Record<string, unknown> | undefined;
    state?: {
        set?: string[] | undefined;
        use?: string[] | undefined;
    } | undefined;
    condition?: unknown;
    depends_on?: string[] | undefined;
    onTimeout?: {
        error?: boolean | undefined;
        fallback?: unknown;
    } | undefined;
}, {
    agent: string;
    scoring?: {
        evaluator: string;
        thresholds?: {
            minimum?: number | undefined;
            target?: number | undefined;
            excellent?: number | undefined;
        } | undefined;
        criteria?: unknown[] | Record<string, string> | undefined;
        onFailure?: "retry" | "continue" | "abort" | undefined;
        retryLimit?: number | undefined;
        requireImprovement?: boolean | undefined;
        minImprovement?: number | undefined;
    } | undefined;
    cache?: {
        ttl?: number | undefined;
        bypass?: boolean | undefined;
    } | undefined;
    when?: unknown;
    timeout?: number | undefined;
    retry?: {
        attempts?: number | undefined;
        backoff?: "linear" | "exponential" | "fixed" | undefined;
        initialDelay?: number | undefined;
        maxDelay?: number | undefined;
        retryOn?: string[] | undefined;
    } | undefined;
    id?: string | undefined;
    input?: Record<string, unknown> | undefined;
    state?: {
        set?: string[] | undefined;
        use?: string[] | undefined;
    } | undefined;
    condition?: unknown;
    depends_on?: string[] | undefined;
    onTimeout?: {
        error?: boolean | undefined;
        fallback?: unknown;
    } | undefined;
}>;
/**
 * Parallel execution step - runs multiple steps concurrently
 */
export declare const ParallelFlowStepSchema: z.ZodObject<{
    type: z.ZodLiteral<"parallel">;
    steps: z.ZodArray<z.ZodLazy<z.ZodType<FlowStepType, z.ZodTypeDef, FlowStepType>>, "many">;
    waitFor: z.ZodOptional<z.ZodEnum<["all", "any", "first"]>>;
}, "strip", z.ZodTypeAny, {
    type: "parallel";
    steps: FlowStepType[];
    waitFor?: "first" | "all" | "any" | undefined;
}, {
    type: "parallel";
    steps: FlowStepType[];
    waitFor?: "first" | "all" | "any" | undefined;
}>;
/**
 * Branch step - conditional branching with then/else
 */
export declare const BranchFlowStepSchema: z.ZodObject<{
    type: z.ZodLiteral<"branch">;
    condition: z.ZodUnknown;
    then: z.ZodArray<z.ZodLazy<z.ZodType<FlowStepType, z.ZodTypeDef, FlowStepType>>, "many">;
    else: z.ZodOptional<z.ZodArray<z.ZodLazy<z.ZodType<FlowStepType, z.ZodTypeDef, FlowStepType>>, "many">>;
}, "strip", z.ZodTypeAny, {
    then: FlowStepType[];
    type: "branch";
    condition?: unknown;
    else?: FlowStepType[] | undefined;
}, {
    then: FlowStepType[];
    type: "branch";
    condition?: unknown;
    else?: FlowStepType[] | undefined;
}>;
/**
 * Foreach step - iterate over items
 */
export declare const ForeachFlowStepSchema: z.ZodObject<{
    type: z.ZodLiteral<"foreach">;
    items: z.ZodUnknown;
    maxConcurrency: z.ZodOptional<z.ZodNumber>;
    breakWhen: z.ZodOptional<z.ZodUnknown>;
    step: z.ZodLazy<z.ZodType<FlowStepType, z.ZodTypeDef, FlowStepType>>;
}, "strip", z.ZodTypeAny, {
    type: "foreach";
    step: FlowStepType;
    items?: unknown;
    maxConcurrency?: number | undefined;
    breakWhen?: unknown;
}, {
    type: "foreach";
    step: FlowStepType;
    items?: unknown;
    maxConcurrency?: number | undefined;
    breakWhen?: unknown;
}>;
/**
 * Try/catch step - error handling
 */
export declare const TryFlowStepSchema: z.ZodObject<{
    type: z.ZodLiteral<"try">;
    steps: z.ZodArray<z.ZodLazy<z.ZodType<FlowStepType, z.ZodTypeDef, FlowStepType>>, "many">;
    catch: z.ZodOptional<z.ZodArray<z.ZodLazy<z.ZodType<FlowStepType, z.ZodTypeDef, FlowStepType>>, "many">>;
    finally: z.ZodOptional<z.ZodArray<z.ZodLazy<z.ZodType<FlowStepType, z.ZodTypeDef, FlowStepType>>, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "try";
    steps: FlowStepType[];
    catch?: FlowStepType[] | undefined;
    finally?: FlowStepType[] | undefined;
}, {
    type: "try";
    steps: FlowStepType[];
    catch?: FlowStepType[] | undefined;
    finally?: FlowStepType[] | undefined;
}>;
/**
 * Switch/case step - multi-way branching
 */
export declare const SwitchFlowStepSchema: z.ZodObject<{
    type: z.ZodLiteral<"switch">;
    value: z.ZodUnknown;
    cases: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodLazy<z.ZodType<FlowStepType, z.ZodTypeDef, FlowStepType>>, "many">>;
    default: z.ZodOptional<z.ZodArray<z.ZodLazy<z.ZodType<FlowStepType, z.ZodTypeDef, FlowStepType>>, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "switch";
    cases: Record<string, FlowStepType[]>;
    default?: FlowStepType[] | undefined;
    value?: unknown;
}, {
    type: "switch";
    cases: Record<string, FlowStepType[]>;
    default?: FlowStepType[] | undefined;
    value?: unknown;
}>;
/**
 * While loop step - repeat while condition is true
 */
export declare const WhileFlowStepSchema: z.ZodObject<{
    type: z.ZodLiteral<"while">;
    condition: z.ZodUnknown;
    maxIterations: z.ZodOptional<z.ZodNumber>;
    steps: z.ZodArray<z.ZodLazy<z.ZodType<FlowStepType, z.ZodTypeDef, FlowStepType>>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "while";
    steps: FlowStepType[];
    condition?: unknown;
    maxIterations?: number | undefined;
}, {
    type: "while";
    steps: FlowStepType[];
    condition?: unknown;
    maxIterations?: number | undefined;
}>;
/**
 * Map-reduce step - parallel processing with aggregation
 */
export declare const MapReduceFlowStepSchema: z.ZodObject<{
    type: z.ZodLiteral<"map-reduce">;
    items: z.ZodUnknown;
    maxConcurrency: z.ZodOptional<z.ZodNumber>;
    map: z.ZodLazy<z.ZodType<FlowStepType, z.ZodTypeDef, FlowStepType>>;
    reduce: z.ZodLazy<z.ZodType<FlowStepType, z.ZodTypeDef, FlowStepType>>;
}, "strip", z.ZodTypeAny, {
    map: FlowStepType;
    reduce: FlowStepType;
    type: "map-reduce";
    items?: unknown;
    maxConcurrency?: number | undefined;
}, {
    map: FlowStepType;
    reduce: FlowStepType;
    type: "map-reduce";
    items?: unknown;
    maxConcurrency?: number | undefined;
}>;
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
 * Union schema for all flow step types
 * Used for runtime validation of both YAML and TypeScript ensembles
 */
export declare const FlowStepSchema: z.ZodType<FlowStepType>;
/**
 * Schema for validating ensemble configuration
 */
export declare const EnsembleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    /**
     * Controls whether this ensemble can be executed via the Execute API
     * (/api/v1/execute/ensemble/:name)
     *
     * When api.execution.ensembles.requireExplicit is false (default):
     *   - Ensembles are executable unless apiExecutable: false
     * When api.execution.ensembles.requireExplicit is true:
     *   - Ensembles need apiExecutable: true to be executable
     */
    apiExecutable: z.ZodOptional<z.ZodBoolean>;
    state: z.ZodOptional<z.ZodObject<{
        schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        initial: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        schema?: Record<string, unknown> | undefined;
        initial?: Record<string, unknown> | undefined;
    }, {
        schema?: Record<string, unknown> | undefined;
        initial?: Record<string, unknown> | undefined;
    }>>;
    scoring: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        defaultThresholds: z.ZodObject<{
            minimum: z.ZodNumber;
            target: z.ZodOptional<z.ZodNumber>;
            excellent: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            minimum: number;
            target?: number | undefined;
            excellent?: number | undefined;
        }, {
            minimum: number;
            target?: number | undefined;
            excellent?: number | undefined;
        }>;
        maxRetries: z.ZodOptional<z.ZodNumber>;
        backoffStrategy: z.ZodOptional<z.ZodEnum<["linear", "exponential", "fixed"]>>;
        initialBackoff: z.ZodOptional<z.ZodNumber>;
        trackInState: z.ZodOptional<z.ZodBoolean>;
        criteria: z.ZodOptional<z.ZodUnion<[z.ZodRecord<z.ZodString, z.ZodString>, z.ZodArray<z.ZodUnknown, "many">]>>;
        aggregation: z.ZodOptional<z.ZodEnum<["weighted_average", "minimum", "geometric_mean"]>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        defaultThresholds: {
            minimum: number;
            target?: number | undefined;
            excellent?: number | undefined;
        };
        criteria?: unknown[] | Record<string, string> | undefined;
        maxRetries?: number | undefined;
        backoffStrategy?: "linear" | "exponential" | "fixed" | undefined;
        initialBackoff?: number | undefined;
        trackInState?: boolean | undefined;
        aggregation?: "minimum" | "weighted_average" | "geometric_mean" | undefined;
    }, {
        enabled: boolean;
        defaultThresholds: {
            minimum: number;
            target?: number | undefined;
            excellent?: number | undefined;
        };
        criteria?: unknown[] | Record<string, string> | undefined;
        maxRetries?: number | undefined;
        backoffStrategy?: "linear" | "exponential" | "fixed" | undefined;
        initialBackoff?: number | undefined;
        trackInState?: boolean | undefined;
        aggregation?: "minimum" | "weighted_average" | "geometric_mean" | undefined;
    }>>;
    trigger: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"webhook">;
        path: z.ZodOptional<z.ZodString>;
        methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["POST", "GET", "PUT", "PATCH", "DELETE"]>, "many">>;
        auth: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
            type: z.ZodEnum<["bearer", "signature", "basic"]>;
            secret: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "bearer" | "signature" | "basic";
            secret: string;
        }, {
            type: "bearer" | "signature" | "basic";
            secret: string;
        }>, z.ZodObject<{
            requirement: z.ZodEnum<["public", "optional", "required"]>;
            methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
            customValidator: z.ZodOptional<z.ZodString>;
            roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        }, {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        }>]>>;
        public: z.ZodOptional<z.ZodBoolean>;
        mode: z.ZodOptional<z.ZodEnum<["trigger", "resume"]>>;
        async: z.ZodOptional<z.ZodBoolean>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "webhook";
        path?: string | undefined;
        public?: boolean | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
    }, {
        type: "webhook";
        path?: string | undefined;
        public?: boolean | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"mcp">;
        toolName: z.ZodOptional<z.ZodString>;
        auth: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["bearer", "oauth"]>;
            secret: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "bearer" | "oauth";
            secret?: string | undefined;
        }, {
            type: "bearer" | "oauth";
            secret?: string | undefined;
        }>>;
        public: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: "mcp";
        public?: boolean | undefined;
        auth?: {
            type: "bearer" | "oauth";
            secret?: string | undefined;
        } | undefined;
        toolName?: string | undefined;
    }, {
        type: "mcp";
        public?: boolean | undefined;
        auth?: {
            type: "bearer" | "oauth";
            secret?: string | undefined;
        } | undefined;
        toolName?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"email">;
        addresses: z.ZodArray<z.ZodString, "many">;
        auth: z.ZodOptional<z.ZodObject<{
            from: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            from: string[];
        }, {
            from: string[];
        }>>;
        public: z.ZodOptional<z.ZodBoolean>;
        reply_with_output: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: "email";
        addresses: string[];
        public?: boolean | undefined;
        auth?: {
            from: string[];
        } | undefined;
        reply_with_output?: boolean | undefined;
    }, {
        type: "email";
        addresses: string[];
        public?: boolean | undefined;
        auth?: {
            from: string[];
        } | undefined;
        reply_with_output?: boolean | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"queue">;
        queue: z.ZodString;
        batch_size: z.ZodOptional<z.ZodNumber>;
        max_retries: z.ZodOptional<z.ZodNumber>;
        max_wait_time: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        queue: string;
        type: "queue";
        batch_size?: number | undefined;
        max_retries?: number | undefined;
        max_wait_time?: number | undefined;
    }, {
        queue: string;
        type: "queue";
        batch_size?: number | undefined;
        max_retries?: number | undefined;
        max_wait_time?: number | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"cron">;
        cron: z.ZodString;
        timezone: z.ZodOptional<z.ZodString>;
        enabled: z.ZodOptional<z.ZodBoolean>;
        input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        type: "cron";
        cron: string;
        enabled?: boolean | undefined;
        input?: Record<string, unknown> | undefined;
        timezone?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        type: "cron";
        cron: string;
        enabled?: boolean | undefined;
        input?: Record<string, unknown> | undefined;
        timezone?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"http">;
        path: z.ZodOptional<z.ZodString>;
        methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]>, "many">>;
        paths: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
            methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]>, "many">>;
        }, "strip", z.ZodTypeAny, {
            path: string;
            methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        }, {
            path: string;
            methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        }>, "many">>;
        auth: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
            type: z.ZodEnum<["bearer", "signature", "basic"]>;
            secret: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "bearer" | "signature" | "basic";
            secret: string;
        }, {
            type: "bearer" | "signature" | "basic";
            secret: string;
        }>, z.ZodObject<{
            requirement: z.ZodEnum<["public", "optional", "required"]>;
            methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
            customValidator: z.ZodOptional<z.ZodString>;
            roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        }, {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        }>]>>;
        public: z.ZodOptional<z.ZodBoolean>;
        mode: z.ZodOptional<z.ZodEnum<["trigger", "resume"]>>;
        async: z.ZodOptional<z.ZodBoolean>;
        timeout: z.ZodOptional<z.ZodNumber>;
        rateLimit: z.ZodOptional<z.ZodObject<{
            requests: z.ZodNumber;
            window: z.ZodNumber;
            key: z.ZodOptional<z.ZodUnion<[z.ZodEnum<["ip", "user"]>, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>]>>;
        }, "strip", z.ZodTypeAny, {
            requests: number;
            window: number;
            key?: "ip" | "user" | ((...args: unknown[]) => unknown) | undefined;
        }, {
            requests: number;
            window: number;
            key?: "ip" | "user" | ((...args: unknown[]) => unknown) | undefined;
        }>>;
        cors: z.ZodOptional<z.ZodObject<{
            origin: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
            methods: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            allowHeaders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            exposeHeaders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            credentials: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            methods?: string[] | undefined;
            origin?: string | string[] | undefined;
            allowHeaders?: string[] | undefined;
            exposeHeaders?: string[] | undefined;
            credentials?: boolean | undefined;
        }, {
            methods?: string[] | undefined;
            origin?: string | string[] | undefined;
            allowHeaders?: string[] | undefined;
            exposeHeaders?: string[] | undefined;
            credentials?: boolean | undefined;
        }>>;
        cache: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodBoolean;
            ttl: z.ZodNumber;
            vary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            keyGenerator: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            ttl: number;
            vary?: string[] | undefined;
            tags?: string[] | undefined;
            keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
        }, {
            enabled: boolean;
            ttl: number;
            vary?: string[] | undefined;
            tags?: string[] | undefined;
            keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
        }>>;
        middleware: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>]>, "many">>;
        responses: z.ZodOptional<z.ZodObject<{
            html: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
            }, {
                enabled: boolean;
            }>>;
            json: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodBoolean;
                transform: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                transform?: ((...args: unknown[]) => unknown) | undefined;
            }, {
                enabled: boolean;
                transform?: ((...args: unknown[]) => unknown) | undefined;
            }>>;
            stream: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodBoolean;
                chunkSize: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                chunkSize?: number | undefined;
            }, {
                enabled: boolean;
                chunkSize?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            json?: {
                enabled: boolean;
                transform?: ((...args: unknown[]) => unknown) | undefined;
            } | undefined;
            html?: {
                enabled: boolean;
            } | undefined;
            stream?: {
                enabled: boolean;
                chunkSize?: number | undefined;
            } | undefined;
        }, {
            json?: {
                enabled: boolean;
                transform?: ((...args: unknown[]) => unknown) | undefined;
            } | undefined;
            html?: {
                enabled: boolean;
            } | undefined;
            stream?: {
                enabled: boolean;
                chunkSize?: number | undefined;
            } | undefined;
        }>>;
        templateEngine: z.ZodOptional<z.ZodEnum<["handlebars", "liquid", "simple"]>>;
    }, "strip", z.ZodTypeAny, {
        type: "http";
        cache?: {
            enabled: boolean;
            ttl: number;
            vary?: string[] | undefined;
            tags?: string[] | undefined;
            keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        path?: string | undefined;
        public?: boolean | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        paths?: {
            path: string;
            methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        }[] | undefined;
        rateLimit?: {
            requests: number;
            window: number;
            key?: "ip" | "user" | ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        cors?: {
            methods?: string[] | undefined;
            origin?: string | string[] | undefined;
            allowHeaders?: string[] | undefined;
            exposeHeaders?: string[] | undefined;
            credentials?: boolean | undefined;
        } | undefined;
        middleware?: (string | ((...args: unknown[]) => unknown))[] | undefined;
        responses?: {
            json?: {
                enabled: boolean;
                transform?: ((...args: unknown[]) => unknown) | undefined;
            } | undefined;
            html?: {
                enabled: boolean;
            } | undefined;
            stream?: {
                enabled: boolean;
                chunkSize?: number | undefined;
            } | undefined;
        } | undefined;
        templateEngine?: "handlebars" | "liquid" | "simple" | undefined;
    }, {
        type: "http";
        cache?: {
            enabled: boolean;
            ttl: number;
            vary?: string[] | undefined;
            tags?: string[] | undefined;
            keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        path?: string | undefined;
        public?: boolean | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        paths?: {
            path: string;
            methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        }[] | undefined;
        rateLimit?: {
            requests: number;
            window: number;
            key?: "ip" | "user" | ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        cors?: {
            methods?: string[] | undefined;
            origin?: string | string[] | undefined;
            allowHeaders?: string[] | undefined;
            exposeHeaders?: string[] | undefined;
            credentials?: boolean | undefined;
        } | undefined;
        middleware?: (string | ((...args: unknown[]) => unknown))[] | undefined;
        responses?: {
            json?: {
                enabled: boolean;
                transform?: ((...args: unknown[]) => unknown) | undefined;
            } | undefined;
            html?: {
                enabled: boolean;
            } | undefined;
            stream?: {
                enabled: boolean;
                chunkSize?: number | undefined;
            } | undefined;
        } | undefined;
        templateEngine?: "handlebars" | "liquid" | "simple" | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"build">;
        enabled: z.ZodOptional<z.ZodBoolean>;
        output: z.ZodOptional<z.ZodString>;
        input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        type: "build";
        enabled?: boolean | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
        output?: string | undefined;
    }, {
        type: "build";
        enabled?: boolean | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
        output?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"cli">;
        command: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodOptional<z.ZodEnum<["string", "number", "boolean"]>>;
            default: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>;
            description: z.ZodOptional<z.ZodString>;
            required: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            default?: string | number | boolean | undefined;
            type?: "string" | "number" | "boolean" | undefined;
            required?: boolean | undefined;
            description?: string | undefined;
        }, {
            name: string;
            default?: string | number | boolean | undefined;
            type?: "string" | "number" | "boolean" | undefined;
            required?: boolean | undefined;
            description?: string | undefined;
        }>, "many">>;
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: "cli";
        command: string;
        options?: {
            name: string;
            default?: string | number | boolean | undefined;
            type?: "string" | "number" | "boolean" | undefined;
            required?: boolean | undefined;
            description?: string | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
        description?: string | undefined;
    }, {
        type: "cli";
        command: string;
        options?: {
            name: string;
            default?: string | number | boolean | undefined;
            type?: "string" | "number" | "boolean" | undefined;
            required?: boolean | undefined;
            description?: string | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
        description?: string | undefined;
    }>]>, "many">>, ({
        type: "webhook";
        path?: string | undefined;
        public?: boolean | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
    } | {
        type: "mcp";
        public?: boolean | undefined;
        auth?: {
            type: "bearer" | "oauth";
            secret?: string | undefined;
        } | undefined;
        toolName?: string | undefined;
    } | {
        type: "email";
        addresses: string[];
        public?: boolean | undefined;
        auth?: {
            from: string[];
        } | undefined;
        reply_with_output?: boolean | undefined;
    } | {
        queue: string;
        type: "queue";
        batch_size?: number | undefined;
        max_retries?: number | undefined;
        max_wait_time?: number | undefined;
    } | {
        type: "cron";
        cron: string;
        enabled?: boolean | undefined;
        input?: Record<string, unknown> | undefined;
        timezone?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    } | {
        type: "http";
        cache?: {
            enabled: boolean;
            ttl: number;
            vary?: string[] | undefined;
            tags?: string[] | undefined;
            keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        path?: string | undefined;
        public?: boolean | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        paths?: {
            path: string;
            methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        }[] | undefined;
        rateLimit?: {
            requests: number;
            window: number;
            key?: "ip" | "user" | ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        cors?: {
            methods?: string[] | undefined;
            origin?: string | string[] | undefined;
            allowHeaders?: string[] | undefined;
            exposeHeaders?: string[] | undefined;
            credentials?: boolean | undefined;
        } | undefined;
        middleware?: (string | ((...args: unknown[]) => unknown))[] | undefined;
        responses?: {
            json?: {
                enabled: boolean;
                transform?: ((...args: unknown[]) => unknown) | undefined;
            } | undefined;
            html?: {
                enabled: boolean;
            } | undefined;
            stream?: {
                enabled: boolean;
                chunkSize?: number | undefined;
            } | undefined;
        } | undefined;
        templateEngine?: "handlebars" | "liquid" | "simple" | undefined;
    } | {
        type: "build";
        enabled?: boolean | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
        output?: string | undefined;
    } | {
        type: "cli";
        command: string;
        options?: {
            name: string;
            default?: string | number | boolean | undefined;
            type?: "string" | "number" | "boolean" | undefined;
            required?: boolean | undefined;
            description?: string | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
        description?: string | undefined;
    })[] | undefined, ({
        type: "webhook";
        path?: string | undefined;
        public?: boolean | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
    } | {
        type: "mcp";
        public?: boolean | undefined;
        auth?: {
            type: "bearer" | "oauth";
            secret?: string | undefined;
        } | undefined;
        toolName?: string | undefined;
    } | {
        type: "email";
        addresses: string[];
        public?: boolean | undefined;
        auth?: {
            from: string[];
        } | undefined;
        reply_with_output?: boolean | undefined;
    } | {
        queue: string;
        type: "queue";
        batch_size?: number | undefined;
        max_retries?: number | undefined;
        max_wait_time?: number | undefined;
    } | {
        type: "cron";
        cron: string;
        enabled?: boolean | undefined;
        input?: Record<string, unknown> | undefined;
        timezone?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    } | {
        type: "http";
        cache?: {
            enabled: boolean;
            ttl: number;
            vary?: string[] | undefined;
            tags?: string[] | undefined;
            keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        path?: string | undefined;
        public?: boolean | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        paths?: {
            path: string;
            methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        }[] | undefined;
        rateLimit?: {
            requests: number;
            window: number;
            key?: "ip" | "user" | ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        cors?: {
            methods?: string[] | undefined;
            origin?: string | string[] | undefined;
            allowHeaders?: string[] | undefined;
            exposeHeaders?: string[] | undefined;
            credentials?: boolean | undefined;
        } | undefined;
        middleware?: (string | ((...args: unknown[]) => unknown))[] | undefined;
        responses?: {
            json?: {
                enabled: boolean;
                transform?: ((...args: unknown[]) => unknown) | undefined;
            } | undefined;
            html?: {
                enabled: boolean;
            } | undefined;
            stream?: {
                enabled: boolean;
                chunkSize?: number | undefined;
            } | undefined;
        } | undefined;
        templateEngine?: "handlebars" | "liquid" | "simple" | undefined;
    } | {
        type: "build";
        enabled?: boolean | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
        output?: string | undefined;
    } | {
        type: "cli";
        command: string;
        options?: {
            name: string;
            default?: string | number | boolean | undefined;
            type?: "string" | "number" | "boolean" | undefined;
            required?: boolean | undefined;
            description?: string | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
        description?: string | undefined;
    })[] | undefined>;
    notifications: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"webhook">;
        url: z.ZodString;
        events: z.ZodArray<z.ZodEnum<["execution.started", "execution.completed", "execution.failed", "execution.timeout", "agent.completed", "state.updated"]>, "many">;
        secret: z.ZodOptional<z.ZodString>;
        retries: z.ZodOptional<z.ZodNumber>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "webhook";
        url: string;
        events: ("execution.started" | "execution.completed" | "execution.failed" | "execution.timeout" | "agent.completed" | "state.updated")[];
        timeout?: number | undefined;
        secret?: string | undefined;
        retries?: number | undefined;
    }, {
        type: "webhook";
        url: string;
        events: ("execution.started" | "execution.completed" | "execution.failed" | "execution.timeout" | "agent.completed" | "state.updated")[];
        timeout?: number | undefined;
        secret?: string | undefined;
        retries?: number | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"email">;
        to: z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">;
        events: z.ZodArray<z.ZodEnum<["execution.started", "execution.completed", "execution.failed", "execution.timeout", "agent.completed", "state.updated"]>, "many">;
        subject: z.ZodOptional<z.ZodString>;
        from: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    }, "strip", z.ZodTypeAny, {
        type: "email";
        events: ("execution.started" | "execution.completed" | "execution.failed" | "execution.timeout" | "agent.completed" | "state.updated")[];
        to: string[];
        from?: string | undefined;
        subject?: string | undefined;
    }, {
        type: "email";
        events: ("execution.started" | "execution.completed" | "execution.failed" | "execution.timeout" | "agent.completed" | "state.updated")[];
        to: string[];
        from?: string | undefined;
        subject?: string | undefined;
    }>]>, "many">>;
    agents: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">>;
    flow: z.ZodOptional<z.ZodArray<z.ZodLazy<z.ZodType<FlowStepType, z.ZodTypeDef, FlowStepType>>, "many">>;
    inputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    output: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodObject<{
        when: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodNumber>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodUnknown>;
        rawBody: z.ZodOptional<z.ZodString>;
        redirect: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            status: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<301>, z.ZodLiteral<302>, z.ZodLiteral<307>, z.ZodLiteral<308>, z.ZodString]>>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            status?: string | 301 | 302 | 307 | 308 | undefined;
        }, {
            url: string;
            status?: string | 301 | 302 | 307 | 308 | undefined;
        }>>;
        format: z.ZodOptional<z.ZodUnion<[z.ZodEnum<["json", "text", "html", "xml", "csv", "markdown", "yaml", "ics", "rss", "atom"]>, z.ZodObject<{
            type: z.ZodEnum<["json", "text", "html", "xml", "csv", "markdown", "yaml", "ics", "rss", "atom"]>;
            extract: z.ZodOptional<z.ZodString>;
            contentType: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
            contentType?: string | undefined;
            extract?: string | undefined;
        }, {
            type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
            contentType?: string | undefined;
            extract?: string | undefined;
        }>]>>;
    }, "strip", z.ZodTypeAny, {
        status?: number | undefined;
        when?: string | undefined;
        headers?: Record<string, string> | undefined;
        body?: unknown;
        rawBody?: string | undefined;
        redirect?: {
            url: string;
            status?: string | 301 | 302 | 307 | 308 | undefined;
        } | undefined;
        format?: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom" | {
            type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
            contentType?: string | undefined;
            extract?: string | undefined;
        } | undefined;
    }, {
        status?: number | undefined;
        when?: string | undefined;
        headers?: Record<string, string> | undefined;
        body?: unknown;
        rawBody?: string | undefined;
        redirect?: {
            url: string;
            status?: string | 301 | 302 | 307 | 308 | undefined;
        } | undefined;
        format?: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom" | {
            type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
            contentType?: string | undefined;
            extract?: string | undefined;
        } | undefined;
    }>, "many">, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
    /** Memory configuration for persistent conversation and context */
    memory: z.ZodOptional<z.ZodObject<{
        /** Enable memory system (default: true if memory block is present) */
        enabled: z.ZodOptional<z.ZodBoolean>;
        /** Session memory configuration (KV-based conversation history) */
        session: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            /** Time-to-live in seconds (default: 3600 = 1 hour) */
            ttl: z.ZodOptional<z.ZodNumber>;
            /** Maximum messages to keep (default: 50) */
            maxMessages: z.ZodOptional<z.ZodNumber>;
            /** Maximum age of individual messages in hours (default: 24) */
            messageMaxAgeHours: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean | undefined;
            ttl?: number | undefined;
            maxMessages?: number | undefined;
            messageMaxAgeHours?: number | undefined;
        }, {
            enabled?: boolean | undefined;
            ttl?: number | undefined;
            maxMessages?: number | undefined;
            messageMaxAgeHours?: number | undefined;
        }>>;
        /** Long-term memory configuration (D1-based persistent storage) */
        longTerm: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            /** User ID expression for scoping long-term memory (e.g., {{ auth.userId }}) */
            userId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            userId?: string | undefined;
            enabled?: boolean | undefined;
        }, {
            userId?: string | undefined;
            enabled?: boolean | undefined;
        }>>;
        /** Semantic memory configuration (Vectorize-based RAG) */
        semantic: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            /** Embedding model (default: @cf/baai/bge-base-en-v1.5) */
            model: z.ZodOptional<z.ZodString>;
            /** Number of results to return from search (default: 5) */
            topK: z.ZodOptional<z.ZodNumber>;
            /** Minimum similarity score (0-1) */
            minScore: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean | undefined;
            model?: string | undefined;
            topK?: number | undefined;
            minScore?: number | undefined;
        }, {
            enabled?: boolean | undefined;
            model?: string | undefined;
            topK?: number | undefined;
            minScore?: number | undefined;
        }>>;
        /** Analytical memory configuration (Hyperdrive SQL databases) */
        analytical: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            /** Default database alias */
            defaultDatabase: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean | undefined;
            defaultDatabase?: string | undefined;
        }, {
            enabled?: boolean | undefined;
            defaultDatabase?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        semantic?: {
            enabled?: boolean | undefined;
            model?: string | undefined;
            topK?: number | undefined;
            minScore?: number | undefined;
        } | undefined;
        session?: {
            enabled?: boolean | undefined;
            ttl?: number | undefined;
            maxMessages?: number | undefined;
            messageMaxAgeHours?: number | undefined;
        } | undefined;
        longTerm?: {
            userId?: string | undefined;
            enabled?: boolean | undefined;
        } | undefined;
        analytical?: {
            enabled?: boolean | undefined;
            defaultDatabase?: string | undefined;
        } | undefined;
    }, {
        enabled?: boolean | undefined;
        semantic?: {
            enabled?: boolean | undefined;
            model?: string | undefined;
            topK?: number | undefined;
            minScore?: number | undefined;
        } | undefined;
        session?: {
            enabled?: boolean | undefined;
            ttl?: number | undefined;
            maxMessages?: number | undefined;
            messageMaxAgeHours?: number | undefined;
        } | undefined;
        longTerm?: {
            userId?: string | undefined;
            enabled?: boolean | undefined;
        } | undefined;
        analytical?: {
            enabled?: boolean | undefined;
            defaultDatabase?: string | undefined;
        } | undefined;
    }>>;
    /** Ensemble-level logging configuration */
    logging: z.ZodOptional<z.ZodObject<{
        /** Override log level for this ensemble */
        level: z.ZodOptional<z.ZodEnum<["debug", "info", "warn", "error"]>>;
        /** Execution trace logging */
        trace: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            includeInputs: z.ZodOptional<z.ZodBoolean>;
            includeOutputs: z.ZodOptional<z.ZodBoolean>;
            redactInputs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            redactOutputs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean | undefined;
            includeInputs?: boolean | undefined;
            includeOutputs?: boolean | undefined;
            redactInputs?: string[] | undefined;
            redactOutputs?: string[] | undefined;
        }, {
            enabled?: boolean | undefined;
            includeInputs?: boolean | undefined;
            includeOutputs?: boolean | undefined;
            redactInputs?: string[] | undefined;
            redactOutputs?: string[] | undefined;
        }>>;
        /** Per-step logging overrides (keyed by step agent name or ID) */
        steps: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    }, "strip", z.ZodTypeAny, {
        level?: "debug" | "info" | "warn" | "error" | undefined;
        steps?: Record<string, Record<string, unknown>> | undefined;
        trace?: {
            enabled?: boolean | undefined;
            includeInputs?: boolean | undefined;
            includeOutputs?: boolean | undefined;
            redactInputs?: string[] | undefined;
            redactOutputs?: string[] | undefined;
        } | undefined;
    }, {
        level?: "debug" | "info" | "warn" | "error" | undefined;
        steps?: Record<string, Record<string, unknown>> | undefined;
        trace?: {
            enabled?: boolean | undefined;
            includeInputs?: boolean | undefined;
            includeOutputs?: boolean | undefined;
            redactInputs?: string[] | undefined;
            redactOutputs?: string[] | undefined;
        } | undefined;
    }>>;
    /** Ensemble-level metrics configuration */
    metrics: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        /** Custom business metrics to track */
        custom: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            condition: z.ZodOptional<z.ZodString>;
            value: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodEnum<["counter", "histogram", "gauge"]>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            value?: string | undefined;
            type?: "counter" | "histogram" | "gauge" | undefined;
            condition?: string | undefined;
        }, {
            name: string;
            value?: string | undefined;
            type?: "counter" | "histogram" | "gauge" | undefined;
            condition?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        custom?: {
            name: string;
            value?: string | undefined;
            type?: "counter" | "histogram" | "gauge" | undefined;
            condition?: string | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
    }, {
        custom?: {
            name: string;
            value?: string | undefined;
            type?: "counter" | "histogram" | "gauge" | undefined;
            condition?: string | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
    }>>;
    /** Ensemble-level tracing configuration */
    tracing: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        samplingRate: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        samplingRate?: number | undefined;
        enabled?: boolean | undefined;
    }, {
        samplingRate?: number | undefined;
        enabled?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    scoring?: {
        enabled: boolean;
        defaultThresholds: {
            minimum: number;
            target?: number | undefined;
            excellent?: number | undefined;
        };
        criteria?: unknown[] | Record<string, string> | undefined;
        maxRetries?: number | undefined;
        backoffStrategy?: "linear" | "exponential" | "fixed" | undefined;
        initialBackoff?: number | undefined;
        trackInState?: boolean | undefined;
        aggregation?: "minimum" | "weighted_average" | "geometric_mean" | undefined;
    } | undefined;
    logging?: {
        level?: "debug" | "info" | "warn" | "error" | undefined;
        steps?: Record<string, Record<string, unknown>> | undefined;
        trace?: {
            enabled?: boolean | undefined;
            includeInputs?: boolean | undefined;
            includeOutputs?: boolean | undefined;
            redactInputs?: string[] | undefined;
            redactOutputs?: string[] | undefined;
        } | undefined;
    } | undefined;
    metrics?: {
        custom?: {
            name: string;
            value?: string | undefined;
            type?: "counter" | "histogram" | "gauge" | undefined;
            condition?: string | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
    } | undefined;
    trigger?: ({
        type: "webhook";
        path?: string | undefined;
        public?: boolean | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
    } | {
        type: "mcp";
        public?: boolean | undefined;
        auth?: {
            type: "bearer" | "oauth";
            secret?: string | undefined;
        } | undefined;
        toolName?: string | undefined;
    } | {
        type: "email";
        addresses: string[];
        public?: boolean | undefined;
        auth?: {
            from: string[];
        } | undefined;
        reply_with_output?: boolean | undefined;
    } | {
        queue: string;
        type: "queue";
        batch_size?: number | undefined;
        max_retries?: number | undefined;
        max_wait_time?: number | undefined;
    } | {
        type: "cron";
        cron: string;
        enabled?: boolean | undefined;
        input?: Record<string, unknown> | undefined;
        timezone?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    } | {
        type: "http";
        cache?: {
            enabled: boolean;
            ttl: number;
            vary?: string[] | undefined;
            tags?: string[] | undefined;
            keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        path?: string | undefined;
        public?: boolean | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        paths?: {
            path: string;
            methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        }[] | undefined;
        rateLimit?: {
            requests: number;
            window: number;
            key?: "ip" | "user" | ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        cors?: {
            methods?: string[] | undefined;
            origin?: string | string[] | undefined;
            allowHeaders?: string[] | undefined;
            exposeHeaders?: string[] | undefined;
            credentials?: boolean | undefined;
        } | undefined;
        middleware?: (string | ((...args: unknown[]) => unknown))[] | undefined;
        responses?: {
            json?: {
                enabled: boolean;
                transform?: ((...args: unknown[]) => unknown) | undefined;
            } | undefined;
            html?: {
                enabled: boolean;
            } | undefined;
            stream?: {
                enabled: boolean;
                chunkSize?: number | undefined;
            } | undefined;
        } | undefined;
        templateEngine?: "handlebars" | "liquid" | "simple" | undefined;
    } | {
        type: "build";
        enabled?: boolean | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
        output?: string | undefined;
    } | {
        type: "cli";
        command: string;
        options?: {
            name: string;
            default?: string | number | boolean | undefined;
            type?: "string" | "number" | "boolean" | undefined;
            required?: boolean | undefined;
            description?: string | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
        description?: string | undefined;
    })[] | undefined;
    state?: {
        schema?: Record<string, unknown> | undefined;
        initial?: Record<string, unknown> | undefined;
    } | undefined;
    description?: string | undefined;
    apiExecutable?: boolean | undefined;
    output?: Record<string, unknown> | {
        status?: number | undefined;
        when?: string | undefined;
        headers?: Record<string, string> | undefined;
        body?: unknown;
        rawBody?: string | undefined;
        redirect?: {
            url: string;
            status?: string | 301 | 302 | 307 | 308 | undefined;
        } | undefined;
        format?: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom" | {
            type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
            contentType?: string | undefined;
            extract?: string | undefined;
        } | undefined;
    }[] | undefined;
    notifications?: ({
        type: "webhook";
        url: string;
        events: ("execution.started" | "execution.completed" | "execution.failed" | "execution.timeout" | "agent.completed" | "state.updated")[];
        timeout?: number | undefined;
        secret?: string | undefined;
        retries?: number | undefined;
    } | {
        type: "email";
        events: ("execution.started" | "execution.completed" | "execution.failed" | "execution.timeout" | "agent.completed" | "state.updated")[];
        to: string[];
        from?: string | undefined;
        subject?: string | undefined;
    })[] | undefined;
    agents?: Record<string, unknown>[] | undefined;
    flow?: FlowStepType[] | undefined;
    inputs?: Record<string, unknown> | undefined;
    memory?: {
        enabled?: boolean | undefined;
        semantic?: {
            enabled?: boolean | undefined;
            model?: string | undefined;
            topK?: number | undefined;
            minScore?: number | undefined;
        } | undefined;
        session?: {
            enabled?: boolean | undefined;
            ttl?: number | undefined;
            maxMessages?: number | undefined;
            messageMaxAgeHours?: number | undefined;
        } | undefined;
        longTerm?: {
            userId?: string | undefined;
            enabled?: boolean | undefined;
        } | undefined;
        analytical?: {
            enabled?: boolean | undefined;
            defaultDatabase?: string | undefined;
        } | undefined;
    } | undefined;
    tracing?: {
        samplingRate?: number | undefined;
        enabled?: boolean | undefined;
    } | undefined;
}, {
    name: string;
    scoring?: {
        enabled: boolean;
        defaultThresholds: {
            minimum: number;
            target?: number | undefined;
            excellent?: number | undefined;
        };
        criteria?: unknown[] | Record<string, string> | undefined;
        maxRetries?: number | undefined;
        backoffStrategy?: "linear" | "exponential" | "fixed" | undefined;
        initialBackoff?: number | undefined;
        trackInState?: boolean | undefined;
        aggregation?: "minimum" | "weighted_average" | "geometric_mean" | undefined;
    } | undefined;
    logging?: {
        level?: "debug" | "info" | "warn" | "error" | undefined;
        steps?: Record<string, Record<string, unknown>> | undefined;
        trace?: {
            enabled?: boolean | undefined;
            includeInputs?: boolean | undefined;
            includeOutputs?: boolean | undefined;
            redactInputs?: string[] | undefined;
            redactOutputs?: string[] | undefined;
        } | undefined;
    } | undefined;
    metrics?: {
        custom?: {
            name: string;
            value?: string | undefined;
            type?: "counter" | "histogram" | "gauge" | undefined;
            condition?: string | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
    } | undefined;
    trigger?: ({
        type: "webhook";
        path?: string | undefined;
        public?: boolean | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
    } | {
        type: "mcp";
        public?: boolean | undefined;
        auth?: {
            type: "bearer" | "oauth";
            secret?: string | undefined;
        } | undefined;
        toolName?: string | undefined;
    } | {
        type: "email";
        addresses: string[];
        public?: boolean | undefined;
        auth?: {
            from: string[];
        } | undefined;
        reply_with_output?: boolean | undefined;
    } | {
        queue: string;
        type: "queue";
        batch_size?: number | undefined;
        max_retries?: number | undefined;
        max_wait_time?: number | undefined;
    } | {
        type: "cron";
        cron: string;
        enabled?: boolean | undefined;
        input?: Record<string, unknown> | undefined;
        timezone?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    } | {
        type: "http";
        cache?: {
            enabled: boolean;
            ttl: number;
            vary?: string[] | undefined;
            tags?: string[] | undefined;
            keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        path?: string | undefined;
        public?: boolean | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | {
            requirement: "public" | "optional" | "required";
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        paths?: {
            path: string;
            methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        }[] | undefined;
        rateLimit?: {
            requests: number;
            window: number;
            key?: "ip" | "user" | ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        cors?: {
            methods?: string[] | undefined;
            origin?: string | string[] | undefined;
            allowHeaders?: string[] | undefined;
            exposeHeaders?: string[] | undefined;
            credentials?: boolean | undefined;
        } | undefined;
        middleware?: (string | ((...args: unknown[]) => unknown))[] | undefined;
        responses?: {
            json?: {
                enabled: boolean;
                transform?: ((...args: unknown[]) => unknown) | undefined;
            } | undefined;
            html?: {
                enabled: boolean;
            } | undefined;
            stream?: {
                enabled: boolean;
                chunkSize?: number | undefined;
            } | undefined;
        } | undefined;
        templateEngine?: "handlebars" | "liquid" | "simple" | undefined;
    } | {
        type: "build";
        enabled?: boolean | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
        output?: string | undefined;
    } | {
        type: "cli";
        command: string;
        options?: {
            name: string;
            default?: string | number | boolean | undefined;
            type?: "string" | "number" | "boolean" | undefined;
            required?: boolean | undefined;
            description?: string | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
        description?: string | undefined;
    })[] | undefined;
    state?: {
        schema?: Record<string, unknown> | undefined;
        initial?: Record<string, unknown> | undefined;
    } | undefined;
    description?: string | undefined;
    apiExecutable?: boolean | undefined;
    output?: Record<string, unknown> | {
        status?: number | undefined;
        when?: string | undefined;
        headers?: Record<string, string> | undefined;
        body?: unknown;
        rawBody?: string | undefined;
        redirect?: {
            url: string;
            status?: string | 301 | 302 | 307 | 308 | undefined;
        } | undefined;
        format?: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom" | {
            type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
            contentType?: string | undefined;
            extract?: string | undefined;
        } | undefined;
    }[] | undefined;
    notifications?: ({
        type: "webhook";
        url: string;
        events: ("execution.started" | "execution.completed" | "execution.failed" | "execution.timeout" | "agent.completed" | "state.updated")[];
        timeout?: number | undefined;
        secret?: string | undefined;
        retries?: number | undefined;
    } | {
        type: "email";
        events: ("execution.started" | "execution.completed" | "execution.failed" | "execution.timeout" | "agent.completed" | "state.updated")[];
        to: string[];
        from?: string | undefined;
        subject?: string | undefined;
    })[] | undefined;
    agents?: Record<string, unknown>[] | undefined;
    flow?: FlowStepType[] | undefined;
    inputs?: Record<string, unknown> | undefined;
    memory?: {
        enabled?: boolean | undefined;
        semantic?: {
            enabled?: boolean | undefined;
            model?: string | undefined;
            topK?: number | undefined;
            minScore?: number | undefined;
        } | undefined;
        session?: {
            enabled?: boolean | undefined;
            ttl?: number | undefined;
            maxMessages?: number | undefined;
            messageMaxAgeHours?: number | undefined;
        } | undefined;
        longTerm?: {
            userId?: string | undefined;
            enabled?: boolean | undefined;
        } | undefined;
        analytical?: {
            enabled?: boolean | undefined;
            defaultDatabase?: string | undefined;
        } | undefined;
    } | undefined;
    tracing?: {
        samplingRate?: number | undefined;
        enabled?: boolean | undefined;
    } | undefined;
}>;
/**
 * Agent-level logging configuration schema
 * Can override global logging settings for specific agents
 */
export declare const AgentLoggingSchema: z.ZodOptional<z.ZodObject<{
    /** Override log level for this agent */
    level: z.ZodOptional<z.ZodEnum<["debug", "info", "warn", "error"]>>;
    /** Additional context fields to include in logs */
    context: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    /** Fields to redact from logs (merged with global) */
    redact: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    /** Events to log for this agent */
    events: z.ZodOptional<z.ZodObject<{
        onStart: z.ZodOptional<z.ZodBoolean>;
        onComplete: z.ZodOptional<z.ZodBoolean>;
        onError: z.ZodOptional<z.ZodBoolean>;
        onCacheHit: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        onStart?: boolean | undefined;
        onComplete?: boolean | undefined;
        onError?: boolean | undefined;
        onCacheHit?: boolean | undefined;
    }, {
        onStart?: boolean | undefined;
        onComplete?: boolean | undefined;
        onError?: boolean | undefined;
        onCacheHit?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    level?: "debug" | "info" | "warn" | "error" | undefined;
    context?: string[] | undefined;
    redact?: string[] | undefined;
    events?: {
        onStart?: boolean | undefined;
        onComplete?: boolean | undefined;
        onError?: boolean | undefined;
        onCacheHit?: boolean | undefined;
    } | undefined;
}, {
    level?: "debug" | "info" | "warn" | "error" | undefined;
    context?: string[] | undefined;
    redact?: string[] | undefined;
    events?: {
        onStart?: boolean | undefined;
        onComplete?: boolean | undefined;
        onError?: boolean | undefined;
        onCacheHit?: boolean | undefined;
    } | undefined;
}>>;
/**
 * Agent-level metrics configuration schema
 */
export declare const AgentMetricsSchema: z.ZodOptional<z.ZodObject<{
    /** Enable/disable metrics for this agent */
    enabled: z.ZodOptional<z.ZodBoolean>;
    /** Custom metrics to record */
    custom: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodString;
        type: z.ZodOptional<z.ZodEnum<["counter", "histogram", "gauge"]>>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        name: string;
        type?: "counter" | "histogram" | "gauge" | undefined;
    }, {
        value: string;
        name: string;
        type?: "counter" | "histogram" | "gauge" | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    custom?: {
        value: string;
        name: string;
        type?: "counter" | "histogram" | "gauge" | undefined;
    }[] | undefined;
    enabled?: boolean | undefined;
}, {
    custom?: {
        value: string;
        name: string;
        type?: "counter" | "histogram" | "gauge" | undefined;
    }[] | undefined;
    enabled?: boolean | undefined;
}>>;
/**
 * Security settings for agents
 * Controls automatic security features like SSRF protection
 */
export declare const AgentSecuritySchema: z.ZodOptional<z.ZodObject<{
    /**
     * Enable SSRF protection for fetch requests
     * When true (default), requests to private IPs, localhost, and metadata services are blocked
     * @default true
     */
    ssrf: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    ssrf?: boolean | undefined;
}, {
    ssrf?: boolean | undefined;
}>>;
export declare const AgentSchema: z.ZodObject<{
    name: z.ZodString;
    operation: z.ZodEnum<[Operation.think, Operation.code, Operation.storage, Operation.data, Operation.http, Operation.tools, Operation.scoring, Operation.email, Operation.sms, Operation.form, Operation.html, Operation.pdf, Operation.queue, Operation.autorag]>;
    description: z.ZodOptional<z.ZodString>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    schema: z.ZodOptional<z.ZodObject<{
        input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        output: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        input?: Record<string, unknown> | undefined;
        output?: Record<string, unknown> | undefined;
    }, {
        input?: Record<string, unknown> | undefined;
        output?: Record<string, unknown> | undefined;
    }>>;
    /**
     * Controls whether this agent can be executed via the Execute API
     * (/api/v1/execute/agent/:name)
     *
     * When api.execution.agents.requireExplicit is false (default):
     *   - Agents are executable unless apiExecutable: false
     * When api.execution.agents.requireExplicit is true:
     *   - Agents need apiExecutable: true to be executable
     */
    apiExecutable: z.ZodOptional<z.ZodBoolean>;
    /** Agent-level logging configuration */
    logging: z.ZodOptional<z.ZodObject<{
        /** Override log level for this agent */
        level: z.ZodOptional<z.ZodEnum<["debug", "info", "warn", "error"]>>;
        /** Additional context fields to include in logs */
        context: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        /** Fields to redact from logs (merged with global) */
        redact: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        /** Events to log for this agent */
        events: z.ZodOptional<z.ZodObject<{
            onStart: z.ZodOptional<z.ZodBoolean>;
            onComplete: z.ZodOptional<z.ZodBoolean>;
            onError: z.ZodOptional<z.ZodBoolean>;
            onCacheHit: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            onStart?: boolean | undefined;
            onComplete?: boolean | undefined;
            onError?: boolean | undefined;
            onCacheHit?: boolean | undefined;
        }, {
            onStart?: boolean | undefined;
            onComplete?: boolean | undefined;
            onError?: boolean | undefined;
            onCacheHit?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        level?: "debug" | "info" | "warn" | "error" | undefined;
        context?: string[] | undefined;
        redact?: string[] | undefined;
        events?: {
            onStart?: boolean | undefined;
            onComplete?: boolean | undefined;
            onError?: boolean | undefined;
            onCacheHit?: boolean | undefined;
        } | undefined;
    }, {
        level?: "debug" | "info" | "warn" | "error" | undefined;
        context?: string[] | undefined;
        redact?: string[] | undefined;
        events?: {
            onStart?: boolean | undefined;
            onComplete?: boolean | undefined;
            onError?: boolean | undefined;
            onCacheHit?: boolean | undefined;
        } | undefined;
    }>>;
    /** Agent-level metrics configuration */
    metrics: z.ZodOptional<z.ZodObject<{
        /** Enable/disable metrics for this agent */
        enabled: z.ZodOptional<z.ZodBoolean>;
        /** Custom metrics to record */
        custom: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodString;
            type: z.ZodOptional<z.ZodEnum<["counter", "histogram", "gauge"]>>;
        }, "strip", z.ZodTypeAny, {
            value: string;
            name: string;
            type?: "counter" | "histogram" | "gauge" | undefined;
        }, {
            value: string;
            name: string;
            type?: "counter" | "histogram" | "gauge" | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        custom?: {
            value: string;
            name: string;
            type?: "counter" | "histogram" | "gauge" | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
    }, {
        custom?: {
            value: string;
            name: string;
            type?: "counter" | "histogram" | "gauge" | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
    }>>;
    /** Security settings for the agent */
    security: z.ZodOptional<z.ZodObject<{
        /**
         * Enable SSRF protection for fetch requests
         * When true (default), requests to private IPs, localhost, and metadata services are blocked
         * @default true
         */
        ssrf: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        ssrf?: boolean | undefined;
    }, {
        ssrf?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    operation: Operation;
    logging?: {
        level?: "debug" | "info" | "warn" | "error" | undefined;
        context?: string[] | undefined;
        redact?: string[] | undefined;
        events?: {
            onStart?: boolean | undefined;
            onComplete?: boolean | undefined;
            onError?: boolean | undefined;
            onCacheHit?: boolean | undefined;
        } | undefined;
    } | undefined;
    metrics?: {
        custom?: {
            value: string;
            name: string;
            type?: "counter" | "histogram" | "gauge" | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
    } | undefined;
    config?: Record<string, unknown> | undefined;
    schema?: {
        input?: Record<string, unknown> | undefined;
        output?: Record<string, unknown> | undefined;
    } | undefined;
    description?: string | undefined;
    apiExecutable?: boolean | undefined;
    security?: {
        ssrf?: boolean | undefined;
    } | undefined;
}, {
    name: string;
    operation: Operation;
    logging?: {
        level?: "debug" | "info" | "warn" | "error" | undefined;
        context?: string[] | undefined;
        redact?: string[] | undefined;
        events?: {
            onStart?: boolean | undefined;
            onComplete?: boolean | undefined;
            onError?: boolean | undefined;
            onCacheHit?: boolean | undefined;
        } | undefined;
    } | undefined;
    metrics?: {
        custom?: {
            value: string;
            name: string;
            type?: "counter" | "histogram" | "gauge" | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
    } | undefined;
    config?: Record<string, unknown> | undefined;
    schema?: {
        input?: Record<string, unknown> | undefined;
        output?: Record<string, unknown> | undefined;
    } | undefined;
    description?: string | undefined;
    apiExecutable?: boolean | undefined;
    security?: {
        ssrf?: boolean | undefined;
    } | undefined;
}>;
export type EnsembleConfig = z.infer<typeof EnsembleSchema>;
export type AgentConfig = z.infer<typeof AgentSchema>;
export type FlowStep = FlowStepType;
export type TriggerConfig = NonNullable<EnsembleConfig['trigger']>[number];
export type NotificationConfig = NonNullable<EnsembleConfig['notifications']>[number];
export type MemoryConfigParsed = NonNullable<EnsembleConfig['memory']>;
export type ExposeConfig = TriggerConfig;
export type ScheduleConfig = Extract<TriggerConfig, {
    type: 'cron';
}>;
export type HTTPTriggerConfig = Extract<TriggerConfig, {
    type: 'http';
}>;
export type WebhookTriggerConfig = Extract<TriggerConfig, {
    type: 'webhook';
}>;
export type MCPTriggerConfig = Extract<TriggerConfig, {
    type: 'mcp';
}>;
export type EmailTriggerConfig = Extract<TriggerConfig, {
    type: 'email';
}>;
export type QueueTriggerConfig = Extract<TriggerConfig, {
    type: 'queue';
}>;
export type CronTriggerConfig = Extract<TriggerConfig, {
    type: 'cron';
}>;
export type BuildTriggerConfig = Extract<TriggerConfig, {
    type: 'build';
}>;
export type CLITriggerConfig = Extract<TriggerConfig, {
    type: 'cli';
}>;
export declare class Parser {
    private static interpolator;
    /**
     * Parse and validate an ensemble YAML file
     */
    static parseEnsemble(yamlContent: string): EnsembleConfig;
    /**
     * Parse YAML and return an Ensemble instance
     *
     * This is the preferred method for loading ensembles, as it returns
     * the canonical Ensemble primitive used by both YAML and TypeScript authoring.
     *
     * @param yamlContent - Raw YAML string
     * @returns Ensemble instance
     *
     * @example
     * ```typescript
     * const yaml = fs.readFileSync('ensemble.yaml', 'utf-8');
     * const ensemble = Parser.parseEnsembleToInstance(yaml);
     *
     * // Ensemble is now identical to one created via createEnsemble()
     * const steps = await ensemble.resolveSteps(context);
     * ```
     */
    static parseEnsembleToInstance(yamlContent: string): Ensemble;
    /**
     * Parse and validate an agent YAML file
     */
    static parseAgent(yamlContent: string): AgentConfig;
    /**
     * Resolve input interpolations using composition-based resolver chain
     *
     * Supports: ${input.x}, ${state.y}, ${agent.output.z}
     *
     * Reduced from 42 lines of nested if/else to 1 line via chain of responsibility
     */
    static resolveInterpolation(template: unknown, context: ResolutionContext): unknown;
    /**
     * Parse an agent reference that may include version
     * Supports formats:
     * - "agent-name" (no version)
     * - "agent-name@v1.0.0" (semver version)
     * - "agent-name@production" (deployment tag)
     * - "agent-name@latest" (latest tag)
     */
    static parseAgentReference(agentRef: string): {
        name: string;
        version?: string;
    };
    /**
     * Validate that all required agents exist
     */
    static validateAgentReferences(ensemble: EnsembleConfig, availableAgents: Set<string>): void;
}
//# sourceMappingURL=parser.d.ts.map