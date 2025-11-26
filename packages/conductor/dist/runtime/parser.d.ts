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
 */
import { z } from 'zod';
import type { ResolutionContext } from './interpolation/index.js';
import { Operation } from '../types/constants.js';
import { ensembleFromConfig, Ensemble, isEnsemble } from '../primitives/ensemble.js';
export { ensembleFromConfig, Ensemble, isEnsemble };
/**
 * TypeScript interfaces for flow steps (used for type casting)
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
export interface ParallelFlowStep {
    type: 'parallel';
    steps: FlowStepType[];
    waitFor?: 'all' | 'any' | 'first';
}
export interface BranchFlowStep {
    type: 'branch';
    condition: unknown;
    then: FlowStepType[];
    else?: FlowStepType[];
}
export interface ForeachFlowStep {
    type: 'foreach';
    items: unknown;
    maxConcurrency?: number;
    breakWhen?: unknown;
    step: FlowStepType;
}
export interface TryFlowStep {
    type: 'try';
    steps: FlowStepType[];
    catch?: FlowStepType[];
    finally?: FlowStepType[];
}
export interface SwitchFlowStep {
    type: 'switch';
    value: unknown;
    cases: Record<string, FlowStepType[]>;
    default?: FlowStepType[];
}
export interface WhileFlowStep {
    type: 'while';
    condition: unknown;
    maxIterations?: number;
    steps: FlowStepType[];
}
export interface MapReduceFlowStep {
    type: 'map-reduce';
    items: unknown;
    maxConcurrency?: number;
    map: FlowStepType;
    reduce: FlowStepType;
}
export type FlowStepType = AgentFlowStep | ParallelFlowStep | BranchFlowStep | ForeachFlowStep | TryFlowStep | SwitchFlowStep | WhileFlowStep | MapReduceFlowStep;
/**
 * Schema for validating ensemble configuration
 */
declare const EnsembleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
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
        aggregation?: "weighted_average" | "minimum" | "geometric_mean" | undefined;
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
        aggregation?: "weighted_average" | "minimum" | "geometric_mean" | undefined;
    }>>;
    trigger: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"webhook">;
        path: z.ZodOptional<z.ZodString>;
        methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["POST", "GET", "PUT", "PATCH", "DELETE"]>, "many">>;
        auth: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["bearer", "signature", "basic"]>;
            secret: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "bearer" | "signature" | "basic";
            secret: string;
        }, {
            type: "bearer" | "signature" | "basic";
            secret: string;
        }>>;
        public: z.ZodOptional<z.ZodBoolean>;
        mode: z.ZodOptional<z.ZodEnum<["trigger", "resume"]>>;
        async: z.ZodOptional<z.ZodBoolean>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "webhook";
        path?: string | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
    }, {
        type: "webhook";
        path?: string | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"mcp">;
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
        auth?: {
            type: "bearer" | "oauth";
            secret?: string | undefined;
        } | undefined;
        public?: boolean | undefined;
    }, {
        type: "mcp";
        auth?: {
            type: "bearer" | "oauth";
            secret?: string | undefined;
        } | undefined;
        public?: boolean | undefined;
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
        auth?: {
            from: string[];
        } | undefined;
        public?: boolean | undefined;
        reply_with_output?: boolean | undefined;
    }, {
        type: "email";
        addresses: string[];
        auth?: {
            from: string[];
        } | undefined;
        public?: boolean | undefined;
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
        cron: string;
        type: "cron";
        input?: Record<string, unknown> | undefined;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        cron: string;
        type: "cron";
        input?: Record<string, unknown> | undefined;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"http">;
        path: z.ZodOptional<z.ZodString>;
        methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]>, "many">>;
        auth: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["bearer", "signature", "basic"]>;
            secret: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "bearer" | "signature" | "basic";
            secret: string;
        }, {
            type: "bearer" | "signature" | "basic";
            secret: string;
        }>>;
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
            ttl: number;
            enabled: boolean;
            vary?: string[] | undefined;
            tags?: string[] | undefined;
            keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
        }, {
            ttl: number;
            enabled: boolean;
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
            ttl: number;
            enabled: boolean;
            vary?: string[] | undefined;
            tags?: string[] | undefined;
            keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        path?: string | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
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
            ttl: number;
            enabled: boolean;
            vary?: string[] | undefined;
            tags?: string[] | undefined;
            keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        path?: string | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
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
    }>]>, "many">>, ({
        type: "webhook";
        path?: string | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
    } | {
        type: "mcp";
        auth?: {
            type: "bearer" | "oauth";
            secret?: string | undefined;
        } | undefined;
        public?: boolean | undefined;
    } | {
        type: "email";
        addresses: string[];
        auth?: {
            from: string[];
        } | undefined;
        public?: boolean | undefined;
        reply_with_output?: boolean | undefined;
    } | {
        queue: string;
        type: "queue";
        batch_size?: number | undefined;
        max_retries?: number | undefined;
        max_wait_time?: number | undefined;
    } | {
        cron: string;
        type: "cron";
        input?: Record<string, unknown> | undefined;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    } | {
        type: "http";
        cache?: {
            ttl: number;
            enabled: boolean;
            vary?: string[] | undefined;
            tags?: string[] | undefined;
            keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        path?: string | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
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
    })[] | undefined, ({
        type: "webhook";
        path?: string | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
    } | {
        type: "mcp";
        auth?: {
            type: "bearer" | "oauth";
            secret?: string | undefined;
        } | undefined;
        public?: boolean | undefined;
    } | {
        type: "email";
        addresses: string[];
        auth?: {
            from: string[];
        } | undefined;
        public?: boolean | undefined;
        reply_with_output?: boolean | undefined;
    } | {
        queue: string;
        type: "queue";
        batch_size?: number | undefined;
        max_retries?: number | undefined;
        max_wait_time?: number | undefined;
    } | {
        cron: string;
        type: "cron";
        input?: Record<string, unknown> | undefined;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    } | {
        type: "http";
        cache?: {
            ttl: number;
            enabled: boolean;
            vary?: string[] | undefined;
            tags?: string[] | undefined;
            keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        path?: string | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
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
    output: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
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
        steps?: Record<string, Record<string, unknown>> | undefined;
        level?: "error" | "debug" | "info" | "warn" | undefined;
        trace?: {
            enabled?: boolean | undefined;
            includeInputs?: boolean | undefined;
            includeOutputs?: boolean | undefined;
            redactInputs?: string[] | undefined;
            redactOutputs?: string[] | undefined;
        } | undefined;
    }, {
        steps?: Record<string, Record<string, unknown>> | undefined;
        level?: "error" | "debug" | "info" | "warn" | undefined;
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
        enabled?: boolean | undefined;
        samplingRate?: number | undefined;
    }, {
        enabled?: boolean | undefined;
        samplingRate?: number | undefined;
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
        aggregation?: "weighted_average" | "minimum" | "geometric_mean" | undefined;
    } | undefined;
    trigger?: ({
        type: "webhook";
        path?: string | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
    } | {
        type: "mcp";
        auth?: {
            type: "bearer" | "oauth";
            secret?: string | undefined;
        } | undefined;
        public?: boolean | undefined;
    } | {
        type: "email";
        addresses: string[];
        auth?: {
            from: string[];
        } | undefined;
        public?: boolean | undefined;
        reply_with_output?: boolean | undefined;
    } | {
        queue: string;
        type: "queue";
        batch_size?: number | undefined;
        max_retries?: number | undefined;
        max_wait_time?: number | undefined;
    } | {
        cron: string;
        type: "cron";
        input?: Record<string, unknown> | undefined;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    } | {
        type: "http";
        cache?: {
            ttl: number;
            enabled: boolean;
            vary?: string[] | undefined;
            tags?: string[] | undefined;
            keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        path?: string | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
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
    })[] | undefined;
    state?: {
        schema?: Record<string, unknown> | undefined;
        initial?: Record<string, unknown> | undefined;
    } | undefined;
    description?: string | undefined;
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
    output?: Record<string, unknown> | undefined;
    logging?: {
        steps?: Record<string, Record<string, unknown>> | undefined;
        level?: "error" | "debug" | "info" | "warn" | undefined;
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
    tracing?: {
        enabled?: boolean | undefined;
        samplingRate?: number | undefined;
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
        aggregation?: "weighted_average" | "minimum" | "geometric_mean" | undefined;
    } | undefined;
    trigger?: ({
        type: "webhook";
        path?: string | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
    } | {
        type: "mcp";
        auth?: {
            type: "bearer" | "oauth";
            secret?: string | undefined;
        } | undefined;
        public?: boolean | undefined;
    } | {
        type: "email";
        addresses: string[];
        auth?: {
            from: string[];
        } | undefined;
        public?: boolean | undefined;
        reply_with_output?: boolean | undefined;
    } | {
        queue: string;
        type: "queue";
        batch_size?: number | undefined;
        max_retries?: number | undefined;
        max_wait_time?: number | undefined;
    } | {
        cron: string;
        type: "cron";
        input?: Record<string, unknown> | undefined;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    } | {
        type: "http";
        cache?: {
            ttl: number;
            enabled: boolean;
            vary?: string[] | undefined;
            tags?: string[] | undefined;
            keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        path?: string | undefined;
        timeout?: number | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
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
    })[] | undefined;
    state?: {
        schema?: Record<string, unknown> | undefined;
        initial?: Record<string, unknown> | undefined;
    } | undefined;
    description?: string | undefined;
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
    output?: Record<string, unknown> | undefined;
    logging?: {
        steps?: Record<string, Record<string, unknown>> | undefined;
        level?: "error" | "debug" | "info" | "warn" | undefined;
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
    tracing?: {
        enabled?: boolean | undefined;
        samplingRate?: number | undefined;
    } | undefined;
}>;
declare const AgentSchema: z.ZodObject<{
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
        events?: {
            onStart?: boolean | undefined;
            onComplete?: boolean | undefined;
            onError?: boolean | undefined;
            onCacheHit?: boolean | undefined;
        } | undefined;
        level?: "error" | "debug" | "info" | "warn" | undefined;
        context?: string[] | undefined;
        redact?: string[] | undefined;
    }, {
        events?: {
            onStart?: boolean | undefined;
            onComplete?: boolean | undefined;
            onError?: boolean | undefined;
            onCacheHit?: boolean | undefined;
        } | undefined;
        level?: "error" | "debug" | "info" | "warn" | undefined;
        context?: string[] | undefined;
        redact?: string[] | undefined;
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
}, "strip", z.ZodTypeAny, {
    operation: Operation;
    name: string;
    config?: Record<string, unknown> | undefined;
    schema?: {
        input?: Record<string, unknown> | undefined;
        output?: Record<string, unknown> | undefined;
    } | undefined;
    description?: string | undefined;
    logging?: {
        events?: {
            onStart?: boolean | undefined;
            onComplete?: boolean | undefined;
            onError?: boolean | undefined;
            onCacheHit?: boolean | undefined;
        } | undefined;
        level?: "error" | "debug" | "info" | "warn" | undefined;
        context?: string[] | undefined;
        redact?: string[] | undefined;
    } | undefined;
    metrics?: {
        custom?: {
            value: string;
            name: string;
            type?: "counter" | "histogram" | "gauge" | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
    } | undefined;
}, {
    operation: Operation;
    name: string;
    config?: Record<string, unknown> | undefined;
    schema?: {
        input?: Record<string, unknown> | undefined;
        output?: Record<string, unknown> | undefined;
    } | undefined;
    description?: string | undefined;
    logging?: {
        events?: {
            onStart?: boolean | undefined;
            onComplete?: boolean | undefined;
            onError?: boolean | undefined;
            onCacheHit?: boolean | undefined;
        } | undefined;
        level?: "error" | "debug" | "info" | "warn" | undefined;
        context?: string[] | undefined;
        redact?: string[] | undefined;
    } | undefined;
    metrics?: {
        custom?: {
            value: string;
            name: string;
            type?: "counter" | "histogram" | "gauge" | undefined;
        }[] | undefined;
        enabled?: boolean | undefined;
    } | undefined;
}>;
export type EnsembleConfig = z.infer<typeof EnsembleSchema>;
export type AgentConfig = z.infer<typeof AgentSchema>;
export type FlowStep = FlowStepType;
export type TriggerConfig = NonNullable<EnsembleConfig['trigger']>[number];
export type NotificationConfig = NonNullable<EnsembleConfig['notifications']>[number];
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