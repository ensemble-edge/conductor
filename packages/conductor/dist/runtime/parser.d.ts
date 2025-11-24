/**
 * YAML Parser - Refactored with Interpolation System
 *
 * Uses composition-based interpolation resolvers.
 * Reduced resolveInterpolation from 42 lines to 1 line via chain of responsibility.
 */
import { z } from 'zod';
import type { ResolutionContext } from './interpolation/index.js';
import { Operation } from '../types/constants.js';
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
        maxRetries?: number | undefined;
        backoffStrategy?: "linear" | "exponential" | "fixed" | undefined;
        initialBackoff?: number | undefined;
        trackInState?: boolean | undefined;
        criteria?: unknown[] | Record<string, string> | undefined;
        aggregation?: "minimum" | "weighted_average" | "geometric_mean" | undefined;
    }, {
        enabled: boolean;
        defaultThresholds: {
            minimum: number;
            target?: number | undefined;
            excellent?: number | undefined;
        };
        maxRetries?: number | undefined;
        backoffStrategy?: "linear" | "exponential" | "fixed" | undefined;
        initialBackoff?: number | undefined;
        trackInState?: boolean | undefined;
        criteria?: unknown[] | Record<string, string> | undefined;
        aggregation?: "minimum" | "weighted_average" | "geometric_mean" | undefined;
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
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        timeout?: number | undefined;
    }, {
        type: "webhook";
        path?: string | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        timeout?: number | undefined;
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
        type: "cron";
        cron: string;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        type: "cron";
        cron: string;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>]>, "many">>, ({
        type: "webhook";
        path?: string | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        timeout?: number | undefined;
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
        type: "cron";
        cron: string;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
    })[] | undefined, ({
        type: "webhook";
        path?: string | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        timeout?: number | undefined;
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
        type: "cron";
        cron: string;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
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
        secret?: string | undefined;
        timeout?: number | undefined;
        retries?: number | undefined;
    }, {
        type: "webhook";
        url: string;
        events: ("execution.started" | "execution.completed" | "execution.failed" | "execution.timeout" | "agent.completed" | "state.updated")[];
        secret?: string | undefined;
        timeout?: number | undefined;
        retries?: number | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"email">;
        to: z.ZodArray<z.ZodString, "many">;
        events: z.ZodArray<z.ZodEnum<["execution.started", "execution.completed", "execution.failed", "execution.timeout", "agent.completed", "state.updated"]>, "many">;
        subject: z.ZodOptional<z.ZodString>;
        from: z.ZodOptional<z.ZodString>;
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
    flow: z.ZodArray<z.ZodObject<{
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
            criteria?: unknown[] | Record<string, string> | undefined;
            thresholds?: {
                minimum?: number | undefined;
                target?: number | undefined;
                excellent?: number | undefined;
            } | undefined;
            onFailure?: "retry" | "continue" | "abort" | undefined;
            retryLimit?: number | undefined;
            requireImprovement?: boolean | undefined;
            minImprovement?: number | undefined;
        }, {
            evaluator: string;
            criteria?: unknown[] | Record<string, string> | undefined;
            thresholds?: {
                minimum?: number | undefined;
                target?: number | undefined;
                excellent?: number | undefined;
            } | undefined;
            onFailure?: "retry" | "continue" | "abort" | undefined;
            retryLimit?: number | undefined;
            requireImprovement?: boolean | undefined;
            minImprovement?: number | undefined;
        }>>;
        condition: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        agent: string;
        scoring?: {
            evaluator: string;
            criteria?: unknown[] | Record<string, string> | undefined;
            thresholds?: {
                minimum?: number | undefined;
                target?: number | undefined;
                excellent?: number | undefined;
            } | undefined;
            onFailure?: "retry" | "continue" | "abort" | undefined;
            retryLimit?: number | undefined;
            requireImprovement?: boolean | undefined;
            minImprovement?: number | undefined;
        } | undefined;
        cache?: {
            ttl?: number | undefined;
            bypass?: boolean | undefined;
        } | undefined;
        state?: {
            set?: string[] | undefined;
            use?: string[] | undefined;
        } | undefined;
        input?: Record<string, unknown> | undefined;
        id?: string | undefined;
        condition?: unknown;
    }, {
        agent: string;
        scoring?: {
            evaluator: string;
            criteria?: unknown[] | Record<string, string> | undefined;
            thresholds?: {
                minimum?: number | undefined;
                target?: number | undefined;
                excellent?: number | undefined;
            } | undefined;
            onFailure?: "retry" | "continue" | "abort" | undefined;
            retryLimit?: number | undefined;
            requireImprovement?: boolean | undefined;
            minImprovement?: number | undefined;
        } | undefined;
        cache?: {
            ttl?: number | undefined;
            bypass?: boolean | undefined;
        } | undefined;
        state?: {
            set?: string[] | undefined;
            use?: string[] | undefined;
        } | undefined;
        input?: Record<string, unknown> | undefined;
        id?: string | undefined;
        condition?: unknown;
    }>, "many">;
    output: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    flow: {
        agent: string;
        scoring?: {
            evaluator: string;
            criteria?: unknown[] | Record<string, string> | undefined;
            thresholds?: {
                minimum?: number | undefined;
                target?: number | undefined;
                excellent?: number | undefined;
            } | undefined;
            onFailure?: "retry" | "continue" | "abort" | undefined;
            retryLimit?: number | undefined;
            requireImprovement?: boolean | undefined;
            minImprovement?: number | undefined;
        } | undefined;
        cache?: {
            ttl?: number | undefined;
            bypass?: boolean | undefined;
        } | undefined;
        state?: {
            set?: string[] | undefined;
            use?: string[] | undefined;
        } | undefined;
        input?: Record<string, unknown> | undefined;
        id?: string | undefined;
        condition?: unknown;
    }[];
    scoring?: {
        enabled: boolean;
        defaultThresholds: {
            minimum: number;
            target?: number | undefined;
            excellent?: number | undefined;
        };
        maxRetries?: number | undefined;
        backoffStrategy?: "linear" | "exponential" | "fixed" | undefined;
        initialBackoff?: number | undefined;
        trackInState?: boolean | undefined;
        criteria?: unknown[] | Record<string, string> | undefined;
        aggregation?: "minimum" | "weighted_average" | "geometric_mean" | undefined;
    } | undefined;
    description?: string | undefined;
    state?: {
        schema?: Record<string, unknown> | undefined;
        initial?: Record<string, unknown> | undefined;
    } | undefined;
    trigger?: ({
        type: "webhook";
        path?: string | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        timeout?: number | undefined;
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
        type: "cron";
        cron: string;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
    })[] | undefined;
    notifications?: ({
        type: "webhook";
        url: string;
        events: ("execution.started" | "execution.completed" | "execution.failed" | "execution.timeout" | "agent.completed" | "state.updated")[];
        secret?: string | undefined;
        timeout?: number | undefined;
        retries?: number | undefined;
    } | {
        type: "email";
        events: ("execution.started" | "execution.completed" | "execution.failed" | "execution.timeout" | "agent.completed" | "state.updated")[];
        to: string[];
        from?: string | undefined;
        subject?: string | undefined;
    })[] | undefined;
    output?: Record<string, unknown> | undefined;
}, {
    name: string;
    flow: {
        agent: string;
        scoring?: {
            evaluator: string;
            criteria?: unknown[] | Record<string, string> | undefined;
            thresholds?: {
                minimum?: number | undefined;
                target?: number | undefined;
                excellent?: number | undefined;
            } | undefined;
            onFailure?: "retry" | "continue" | "abort" | undefined;
            retryLimit?: number | undefined;
            requireImprovement?: boolean | undefined;
            minImprovement?: number | undefined;
        } | undefined;
        cache?: {
            ttl?: number | undefined;
            bypass?: boolean | undefined;
        } | undefined;
        state?: {
            set?: string[] | undefined;
            use?: string[] | undefined;
        } | undefined;
        input?: Record<string, unknown> | undefined;
        id?: string | undefined;
        condition?: unknown;
    }[];
    scoring?: {
        enabled: boolean;
        defaultThresholds: {
            minimum: number;
            target?: number | undefined;
            excellent?: number | undefined;
        };
        maxRetries?: number | undefined;
        backoffStrategy?: "linear" | "exponential" | "fixed" | undefined;
        initialBackoff?: number | undefined;
        trackInState?: boolean | undefined;
        criteria?: unknown[] | Record<string, string> | undefined;
        aggregation?: "minimum" | "weighted_average" | "geometric_mean" | undefined;
    } | undefined;
    description?: string | undefined;
    state?: {
        schema?: Record<string, unknown> | undefined;
        initial?: Record<string, unknown> | undefined;
    } | undefined;
    trigger?: ({
        type: "webhook";
        path?: string | undefined;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE")[] | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        public?: boolean | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        timeout?: number | undefined;
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
        type: "cron";
        cron: string;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
    })[] | undefined;
    notifications?: ({
        type: "webhook";
        url: string;
        events: ("execution.started" | "execution.completed" | "execution.failed" | "execution.timeout" | "agent.completed" | "state.updated")[];
        secret?: string | undefined;
        timeout?: number | undefined;
        retries?: number | undefined;
    } | {
        type: "email";
        events: ("execution.started" | "execution.completed" | "execution.failed" | "execution.timeout" | "agent.completed" | "state.updated")[];
        to: string[];
        from?: string | undefined;
        subject?: string | undefined;
    })[] | undefined;
    output?: Record<string, unknown> | undefined;
}>;
declare const AgentSchema: z.ZodObject<{
    name: z.ZodString;
    operation: z.ZodEnum<[Operation.think, Operation.code, Operation.storage, Operation.data, Operation.http, Operation.tools, Operation.scoring, Operation.email, Operation.sms, Operation.form, Operation.page, Operation.html, Operation.pdf, Operation.queue, Operation.docs]>;
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
}, "strip", z.ZodTypeAny, {
    name: string;
    operation: Operation;
    description?: string | undefined;
    schema?: {
        input?: Record<string, unknown> | undefined;
        output?: Record<string, unknown> | undefined;
    } | undefined;
    config?: Record<string, unknown> | undefined;
}, {
    name: string;
    operation: Operation;
    description?: string | undefined;
    schema?: {
        input?: Record<string, unknown> | undefined;
        output?: Record<string, unknown> | undefined;
    } | undefined;
    config?: Record<string, unknown> | undefined;
}>;
export type EnsembleConfig = z.infer<typeof EnsembleSchema>;
export type AgentConfig = z.infer<typeof AgentSchema>;
export type FlowStep = EnsembleConfig['flow'][number];
export type TriggerConfig = NonNullable<EnsembleConfig['trigger']>[number];
export type NotificationConfig = NonNullable<EnsembleConfig['notifications']>[number];
export type ExposeConfig = TriggerConfig;
export type ScheduleConfig = Extract<TriggerConfig, {
    type: 'cron';
}>;
export declare class Parser {
    private static interpolator;
    /**
     * Parse and validate an ensemble YAML file
     */
    static parseEnsemble(yamlContent: string): EnsembleConfig;
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
export {};
//# sourceMappingURL=parser.d.ts.map