/**
 * YAML Parser - Refactored with Interpolation System
 *
 * Uses composition-based interpolation resolvers.
 * Reduced resolveInterpolation from 42 lines to 1 line via chain of responsibility.
 */
import { z } from 'zod';
import type { ResolutionContext } from './interpolation/index.js';
import { MemberType } from '../types/constants.js';
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
    webhooks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        method: z.ZodOptional<z.ZodEnum<["POST", "GET"]>>;
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
        mode: z.ZodOptional<z.ZodEnum<["trigger", "resume"]>>;
        async: z.ZodOptional<z.ZodBoolean>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        method?: "POST" | "GET" | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        timeout?: number | undefined;
    }, {
        path: string;
        method?: "POST" | "GET" | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        timeout?: number | undefined;
    }>, "many">>;
    schedules: z.ZodOptional<z.ZodArray<z.ZodObject<{
        cron: z.ZodString;
        timezone: z.ZodOptional<z.ZodString>;
        enabled: z.ZodOptional<z.ZodBoolean>;
        input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        cron: string;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        cron: string;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">>;
    flow: z.ZodArray<z.ZodObject<{
        member: z.ZodString;
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
        member: string;
        state?: {
            set?: string[] | undefined;
            use?: string[] | undefined;
        } | undefined;
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
        input?: Record<string, unknown> | undefined;
        cache?: {
            ttl?: number | undefined;
            bypass?: boolean | undefined;
        } | undefined;
        condition?: unknown;
    }, {
        member: string;
        state?: {
            set?: string[] | undefined;
            use?: string[] | undefined;
        } | undefined;
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
        input?: Record<string, unknown> | undefined;
        cache?: {
            ttl?: number | undefined;
            bypass?: boolean | undefined;
        } | undefined;
        condition?: unknown;
    }>, "many">;
    output: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    flow: {
        member: string;
        state?: {
            set?: string[] | undefined;
            use?: string[] | undefined;
        } | undefined;
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
        input?: Record<string, unknown> | undefined;
        cache?: {
            ttl?: number | undefined;
            bypass?: boolean | undefined;
        } | undefined;
        condition?: unknown;
    }[];
    description?: string | undefined;
    state?: {
        schema?: Record<string, unknown> | undefined;
        initial?: Record<string, unknown> | undefined;
    } | undefined;
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
    webhooks?: {
        path: string;
        method?: "POST" | "GET" | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        timeout?: number | undefined;
    }[] | undefined;
    schedules?: {
        cron: string;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
    }[] | undefined;
    output?: Record<string, unknown> | undefined;
}, {
    name: string;
    flow: {
        member: string;
        state?: {
            set?: string[] | undefined;
            use?: string[] | undefined;
        } | undefined;
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
        input?: Record<string, unknown> | undefined;
        cache?: {
            ttl?: number | undefined;
            bypass?: boolean | undefined;
        } | undefined;
        condition?: unknown;
    }[];
    description?: string | undefined;
    state?: {
        schema?: Record<string, unknown> | undefined;
        initial?: Record<string, unknown> | undefined;
    } | undefined;
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
    webhooks?: {
        path: string;
        method?: "POST" | "GET" | undefined;
        auth?: {
            type: "bearer" | "signature" | "basic";
            secret: string;
        } | undefined;
        mode?: "trigger" | "resume" | undefined;
        async?: boolean | undefined;
        timeout?: number | undefined;
    }[] | undefined;
    schedules?: {
        cron: string;
        enabled?: boolean | undefined;
        timezone?: string | undefined;
        input?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
    }[] | undefined;
    output?: Record<string, unknown> | undefined;
}>;
declare const MemberSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<[MemberType.Think, MemberType.Function, MemberType.Data, MemberType.API, MemberType.MCP, MemberType.Scoring]>;
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
    type: MemberType.Think | MemberType.Function | MemberType.Data | MemberType.API | MemberType.MCP | MemberType.Scoring;
    description?: string | undefined;
    schema?: {
        input?: Record<string, unknown> | undefined;
        output?: Record<string, unknown> | undefined;
    } | undefined;
    config?: Record<string, unknown> | undefined;
}, {
    name: string;
    type: MemberType.Think | MemberType.Function | MemberType.Data | MemberType.API | MemberType.MCP | MemberType.Scoring;
    description?: string | undefined;
    schema?: {
        input?: Record<string, unknown> | undefined;
        output?: Record<string, unknown> | undefined;
    } | undefined;
    config?: Record<string, unknown> | undefined;
}>;
export type EnsembleConfig = z.infer<typeof EnsembleSchema>;
export type MemberConfig = z.infer<typeof MemberSchema>;
export type FlowStep = EnsembleConfig['flow'][number];
export type WebhookConfig = NonNullable<EnsembleConfig['webhooks']>[number];
export type ScheduleConfig = NonNullable<EnsembleConfig['schedules']>[number];
export declare class Parser {
    private static interpolator;
    /**
     * Parse and validate an ensemble YAML file
     */
    static parseEnsemble(yamlContent: string): EnsembleConfig;
    /**
     * Parse and validate a member YAML file
     */
    static parseMember(yamlContent: string): MemberConfig;
    /**
     * Resolve input interpolations using composition-based resolver chain
     *
     * Supports: ${input.x}, ${state.y}, ${member.output.z}
     *
     * Reduced from 42 lines of nested if/else to 1 line via chain of responsibility
     */
    static resolveInterpolation(template: unknown, context: ResolutionContext): unknown;
    /**
     * Parse a member reference that may include version
     * Supports formats:
     * - "member-name" (no version)
     * - "member-name@v1.0.0" (semver version)
     * - "member-name@production" (deployment tag)
     * - "member-name@latest" (latest tag)
     */
    static parseMemberReference(memberRef: string): {
        name: string;
        version?: string;
    };
    /**
     * Validate that all required members exist
     */
    static validateMemberReferences(ensemble: EnsembleConfig, availableMembers: Set<string>): void;
}
export {};
//# sourceMappingURL=parser.d.ts.map