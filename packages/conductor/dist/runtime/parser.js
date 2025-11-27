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
import * as YAML from 'yaml';
import { z } from 'zod';
import { getInterpolator } from './interpolation/index.js';
import { Operation } from '../types/constants.js';
import { EnsembleOutputSchema } from './output-types.js';
// Import ensemble factory for creating Ensemble instances from parsed config
import { ensembleFromConfig, Ensemble, isEnsemble } from '../primitives/ensemble.js';
// Re-export for convenience
export { ensembleFromConfig, Ensemble, isEnsemble };
/**
 * Base schema for agent flow steps (the most common type)
 */
const AgentFlowStepSchema = z.object({
    agent: z.string().min(1, 'Agent name is required'),
    id: z.string().optional(),
    input: z.record(z.unknown()).optional(),
    state: z
        .object({
        use: z.array(z.string()).optional(),
        set: z.array(z.string()).optional(),
    })
        .optional(),
    cache: z
        .object({
        ttl: z.number().positive().optional(),
        bypass: z.boolean().optional(),
    })
        .optional(),
    scoring: z
        .object({
        evaluator: z.string().min(1),
        thresholds: z
            .object({
            minimum: z.number().min(0).max(1).optional(),
            target: z.number().min(0).max(1).optional(),
            excellent: z.number().min(0).max(1).optional(),
        })
            .optional(),
        criteria: z.union([z.record(z.string()), z.array(z.unknown())]).optional(),
        onFailure: z.enum(['retry', 'continue', 'abort']).optional(),
        retryLimit: z.number().positive().optional(),
        requireImprovement: z.boolean().optional(),
        minImprovement: z.number().min(0).max(1).optional(),
    })
        .optional(),
    condition: z.unknown().optional(),
    when: z.unknown().optional(), // Alias for condition
    depends_on: z.array(z.string()).optional(),
    retry: z
        .object({
        attempts: z.number().positive().optional(),
        backoff: z.enum(['linear', 'exponential', 'fixed']).optional(),
        initialDelay: z.number().positive().optional(),
        maxDelay: z.number().positive().optional(),
        retryOn: z.array(z.string()).optional(),
    })
        .optional(),
    timeout: z.number().positive().optional(),
    onTimeout: z
        .object({
        fallback: z.unknown().optional(),
        error: z.boolean().optional(),
    })
        .optional(),
});
/**
 * Parallel execution step - runs multiple steps concurrently
 */
const ParallelFlowStepSchema = z.object({
    type: z.literal('parallel'),
    steps: z.array(z.lazy(() => FlowStepSchema)),
    waitFor: z.enum(['all', 'any', 'first']).optional(), // Default: 'all'
});
/**
 * Branch step - conditional branching with then/else
 */
const BranchFlowStepSchema = z.object({
    type: z.literal('branch'),
    condition: z.unknown(),
    then: z.array(z.lazy(() => FlowStepSchema)),
    else: z.array(z.lazy(() => FlowStepSchema)).optional(),
});
/**
 * Foreach step - iterate over items
 */
const ForeachFlowStepSchema = z.object({
    type: z.literal('foreach'),
    items: z.unknown(), // Expression like ${input.items}
    maxConcurrency: z.number().positive().optional(),
    breakWhen: z.unknown().optional(), // Early exit condition
    step: z.lazy(() => FlowStepSchema),
});
/**
 * Try/catch step - error handling
 */
const TryFlowStepSchema = z.object({
    type: z.literal('try'),
    steps: z.array(z.lazy(() => FlowStepSchema)),
    catch: z.array(z.lazy(() => FlowStepSchema)).optional(),
    finally: z.array(z.lazy(() => FlowStepSchema)).optional(),
});
/**
 * Switch/case step - multi-way branching
 */
const SwitchFlowStepSchema = z.object({
    type: z.literal('switch'),
    value: z.unknown(), // Expression to evaluate
    cases: z.record(z.array(z.lazy(() => FlowStepSchema))),
    default: z.array(z.lazy(() => FlowStepSchema)).optional(),
});
/**
 * While loop step - repeat while condition is true
 */
const WhileFlowStepSchema = z.object({
    type: z.literal('while'),
    condition: z.unknown(),
    maxIterations: z.number().positive().optional(), // Safety limit
    steps: z.array(z.lazy(() => FlowStepSchema)),
});
/**
 * Map-reduce step - parallel processing with aggregation
 */
const MapReduceFlowStepSchema = z.object({
    type: z.literal('map-reduce'),
    items: z.unknown(),
    maxConcurrency: z.number().positive().optional(),
    map: z.lazy(() => FlowStepSchema),
    reduce: z.lazy(() => FlowStepSchema),
});
/**
 * Union of all flow step types
 * Agent steps don't have a 'type' field, control flow steps do
 */
const FlowStepSchema = z.union([
    // Control flow steps (identified by 'type' field)
    ParallelFlowStepSchema,
    BranchFlowStepSchema,
    ForeachFlowStepSchema,
    TryFlowStepSchema,
    SwitchFlowStepSchema,
    WhileFlowStepSchema,
    MapReduceFlowStepSchema,
    // Agent steps (no 'type' field, has 'agent' field)
    AgentFlowStepSchema,
]);
/**
 * Schema for validating ensemble configuration
 */
const EnsembleSchema = z.object({
    name: z.string().min(1, 'Ensemble name is required'),
    description: z.string().optional(),
    state: z
        .object({
        schema: z.record(z.unknown()).optional(),
        initial: z.record(z.unknown()).optional(),
    })
        .optional(),
    scoring: z
        .object({
        enabled: z.boolean(),
        defaultThresholds: z.object({
            minimum: z.number().min(0).max(1),
            target: z.number().min(0).max(1).optional(),
            excellent: z.number().min(0).max(1).optional(),
        }),
        maxRetries: z.number().positive().optional(),
        backoffStrategy: z.enum(['linear', 'exponential', 'fixed']).optional(),
        initialBackoff: z.number().positive().optional(),
        trackInState: z.boolean().optional(),
        criteria: z.union([z.record(z.string()), z.array(z.unknown())]).optional(),
        aggregation: z.enum(['weighted_average', 'minimum', 'geometric_mean']).optional(),
    })
        .optional(),
    trigger: z
        .array(z.discriminatedUnion('type', [
        // Webhook endpoint (inbound HTTP triggers)
        z.object({
            type: z.literal('webhook'),
            path: z.string().min(1).optional(), // Defaults to /{ensemble-name}
            methods: z.array(z.enum(['POST', 'GET', 'PUT', 'PATCH', 'DELETE'])).optional(),
            auth: z
                .object({
                type: z.enum(['bearer', 'signature', 'basic']),
                secret: z.string(),
            })
                .optional(),
            public: z.boolean().optional(), // If true, no auth required
            mode: z.enum(['trigger', 'resume']).optional(),
            async: z.boolean().optional(),
            timeout: z.number().positive().optional(),
        }),
        // MCP tool endpoint (expose ensemble as MCP tool)
        z.object({
            type: z.literal('mcp'),
            auth: z
                .object({
                type: z.enum(['bearer', 'oauth']),
                secret: z.string().optional(),
            })
                .optional(),
            public: z.boolean().optional(),
        }),
        // Email invocation (trigger via email)
        z.object({
            type: z.literal('email'),
            addresses: z.array(z.string().email()).min(1),
            auth: z
                .object({
                from: z.array(z.string()).min(1), // Whitelist of sender patterns
            })
                .optional(),
            public: z.boolean().optional(),
            reply_with_output: z.boolean().optional(), // Send results back via email
        }),
        // Queue message trigger
        z.object({
            type: z.literal('queue'),
            queue: z.string().min(1), // Queue binding name
            batch_size: z.number().positive().optional(),
            max_retries: z.number().nonnegative().optional(),
            max_wait_time: z.number().positive().optional(), // Max seconds to wait for batch
        }),
        // Cron schedule trigger
        z.object({
            type: z.literal('cron'),
            cron: z.string().min(1, 'Cron expression is required'),
            timezone: z.string().optional(),
            enabled: z.boolean().optional(),
            input: z.record(z.unknown()).optional(),
            metadata: z.record(z.unknown()).optional(),
        }),
        // HTTP trigger (full web routing with Hono features)
        z.object({
            type: z.literal('http'),
            // Core HTTP config - single path (like webhook)
            path: z.string().min(1).optional(), // Defaults to /{ensemble-name}
            methods: z
                .array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']))
                .optional(),
            // Multi-path support - array of path/methods combinations
            paths: z
                .array(z.object({
                path: z.string().min(1),
                methods: z
                    .array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']))
                    .optional(),
            }))
                .optional(),
            auth: z
                .object({
                type: z.enum(['bearer', 'signature', 'basic']),
                secret: z.string(),
            })
                .optional(),
            public: z.boolean().optional(),
            mode: z.enum(['trigger', 'resume']).optional(),
            async: z.boolean().optional(),
            timeout: z.number().positive().optional(),
            // Hono-specific features
            rateLimit: z
                .object({
                requests: z.number().positive(),
                window: z.number().positive(), // seconds
                key: z.union([z.enum(['ip', 'user']), z.function()]).optional(),
            })
                .optional(),
            cors: z
                .object({
                origin: z.union([z.string(), z.array(z.string())]).optional(),
                methods: z.array(z.string()).optional(),
                allowHeaders: z.array(z.string()).optional(),
                exposeHeaders: z.array(z.string()).optional(),
                credentials: z.boolean().optional(),
            })
                .optional(),
            cache: z
                .object({
                enabled: z.boolean(),
                ttl: z.number().positive(),
                vary: z.array(z.string()).optional(),
                tags: z.array(z.string()).optional(),
                keyGenerator: z.function().optional(),
            })
                .optional(),
            middleware: z.array(z.union([z.string(), z.function()])).optional(), // Middleware names or functions
            responses: z
                .object({
                html: z.object({ enabled: z.boolean() }).optional(),
                json: z
                    .object({
                    enabled: z.boolean(),
                    transform: z.function().optional(),
                })
                    .optional(),
                stream: z
                    .object({
                    enabled: z.boolean(),
                    chunkSize: z.number().optional(),
                })
                    .optional(),
            })
                .optional(),
            templateEngine: z.enum(['handlebars', 'liquid', 'simple']).optional(),
        }),
        // Build trigger - run at build/deploy time
        z.object({
            type: z.literal('build'),
            enabled: z.boolean().optional(),
            output: z.string().optional(), // Output directory (e.g., './dist/docs')
            input: z.record(z.unknown()).optional(), // Static input for build
            metadata: z.record(z.unknown()).optional(),
        }),
        // CLI trigger - run from command line
        z.object({
            type: z.literal('cli'),
            command: z.string().min(1), // Command name (e.g., 'docs-generate')
            description: z.string().optional(), // Description for help text
            options: z
                .array(z.object({
                name: z.string().min(1),
                type: z.enum(['string', 'number', 'boolean']).optional(),
                default: z.union([z.string(), z.number(), z.boolean()]).optional(),
                description: z.string().optional(),
                required: z.boolean().optional(),
            }))
                .optional(),
            enabled: z.boolean().optional(),
        }),
    ]))
        .optional()
        .refine((trigger) => {
        // Validate that all trigger entries have either auth or public: true
        // (except queue, cron, build, cli which are internally triggered)
        if (!trigger)
            return true;
        return trigger.every((t) => {
            if (t.type === 'queue' || t.type === 'cron' || t.type === 'build' || t.type === 'cli')
                return true;
            return t.auth || t.public === true;
        });
    }, {
        message: 'All webhook, MCP, email, and HTTP triggers must have auth configuration or explicit public: true',
    }),
    notifications: z
        .array(z.discriminatedUnion('type', [
        // Outbound webhook notifications
        z.object({
            type: z.literal('webhook'),
            url: z.string().url(),
            events: z
                .array(z.enum([
                'execution.started',
                'execution.completed',
                'execution.failed',
                'execution.timeout',
                'agent.completed',
                'state.updated',
            ]))
                .min(1),
            secret: z.string().optional(),
            retries: z.number().positive().optional(),
            timeout: z.number().positive().optional(),
        }),
        // Outbound email notifications
        z.object({
            type: z.literal('email'),
            // Allow either valid email or env variable placeholder (${env.VAR})
            to: z
                .array(z
                .string()
                .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || /^\$\{env\.[^}]+\}$/.test(val), { message: 'Must be a valid email or environment variable (${env.VAR})' }))
                .min(1),
            events: z
                .array(z.enum([
                'execution.started',
                'execution.completed',
                'execution.failed',
                'execution.timeout',
                'agent.completed',
                'state.updated',
            ]))
                .min(1),
            subject: z.string().optional(),
            // Allow either valid email or env variable placeholder
            from: z
                .string()
                .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || /^\$\{env\.[^}]+\}$/.test(val), { message: 'Must be a valid email or environment variable (${env.VAR})' })
                .optional(),
        }),
    ]))
        .optional(),
    agents: z.array(z.record(z.unknown())).optional(), // Inline agent definitions (legacy/optional)
    flow: z.array(z.lazy(() => FlowStepSchema)).optional(),
    inputs: z.record(z.unknown()).optional(), // Input schema definition
    output: EnsembleOutputSchema.optional(), // Conditional outputs with status, headers, redirect, rawBody
    /** Ensemble-level logging configuration */
    logging: z
        .object({
        /** Override log level for this ensemble */
        level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
        /** Execution trace logging */
        trace: z
            .object({
            enabled: z.boolean().optional(),
            includeInputs: z.boolean().optional(),
            includeOutputs: z.boolean().optional(),
            redactInputs: z.array(z.string()).optional(),
            redactOutputs: z.array(z.string()).optional(),
        })
            .optional(),
        /** Per-step logging overrides (keyed by step agent name or ID) */
        steps: z.record(z.record(z.unknown())).optional(),
    })
        .optional(),
    /** Ensemble-level metrics configuration */
    metrics: z
        .object({
        enabled: z.boolean().optional(),
        /** Custom business metrics to track */
        custom: z
            .array(z.object({
            name: z.string(),
            condition: z.string().optional(), // e.g., 'success' or expression
            value: z.string().optional(), // Expression like '_executionTime'
            type: z.enum(['counter', 'histogram', 'gauge']).optional(),
        }))
            .optional(),
    })
        .optional(),
    /** Ensemble-level tracing configuration */
    tracing: z
        .object({
        enabled: z.boolean().optional(),
        samplingRate: z.number().min(0).max(1).optional(),
    })
        .optional(),
});
/**
 * Agent-level logging configuration schema
 * Can override global logging settings for specific agents
 */
const AgentLoggingSchema = z
    .object({
    /** Override log level for this agent */
    level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
    /** Additional context fields to include in logs */
    context: z.array(z.string()).optional(),
    /** Fields to redact from logs (merged with global) */
    redact: z.array(z.string()).optional(),
    /** Events to log for this agent */
    events: z
        .object({
        onStart: z.boolean().optional(),
        onComplete: z.boolean().optional(),
        onError: z.boolean().optional(),
        onCacheHit: z.boolean().optional(),
    })
        .optional(),
})
    .optional();
/**
 * Agent-level metrics configuration schema
 */
const AgentMetricsSchema = z
    .object({
    /** Enable/disable metrics for this agent */
    enabled: z.boolean().optional(),
    /** Custom metrics to record */
    custom: z
        .array(z.object({
        name: z.string(),
        value: z.string(), // Expression to extract value (e.g., 'output.count')
        type: z.enum(['counter', 'histogram', 'gauge']).optional(),
    }))
        .optional(),
})
    .optional();
const AgentSchema = z.object({
    name: z.string().min(1, 'Agent name is required'),
    operation: z.enum([
        Operation.think,
        Operation.code,
        Operation.storage,
        Operation.data,
        Operation.http,
        Operation.tools,
        Operation.scoring,
        Operation.email,
        Operation.sms,
        Operation.form,
        Operation.html,
        Operation.pdf,
        Operation.queue,
        Operation.autorag,
    ]),
    description: z.string().optional(),
    config: z.record(z.unknown()).optional(),
    schema: z
        .object({
        input: z.record(z.unknown()).optional(),
        output: z.record(z.unknown()).optional(),
    })
        .optional(),
    /** Agent-level logging configuration */
    logging: AgentLoggingSchema,
    /** Agent-level metrics configuration */
    metrics: AgentMetricsSchema,
});
export class Parser {
    /**
     * Parse and validate an ensemble YAML file
     */
    static parseEnsemble(yamlContent) {
        try {
            // Use customTags to handle Handlebars-style templates without warnings
            const parsed = YAML.parse(yamlContent, { mapAsMap: false, logLevel: 'silent' });
            if (!parsed) {
                throw new Error('Empty or invalid YAML content');
            }
            const validated = EnsembleSchema.parse(parsed);
            // Auto-generate flow if missing but agents are present
            if (!validated.flow && validated.agents && validated.agents.length > 0) {
                validated.flow = validated.agents
                    .map((agent) => {
                    // Extract agent name from the agent definition
                    const name = typeof agent === 'object' && agent !== null && 'name' in agent
                        ? String(agent.name)
                        : undefined;
                    if (!name) {
                        console.warn(`[Parser] Skipping agent without name in ensemble "${validated.name}"`);
                        return null;
                    }
                    return { agent: name };
                })
                    .filter((step) => step !== null);
                console.log(`[Parser] Auto-generated sequential flow for ensemble "${validated.name}" with ${validated.flow.length} agent(s)`);
            }
            return validated;
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                // Provide helpful error messages for common mistakes
                const enhancedErrors = error.errors.map((e) => {
                    const path = e.path.join('.');
                    const baseMessage = `${path}: ${e.message}`;
                    // Common mistake: output: $agent-name instead of output: { field: ${agent.output.field} }
                    if (path === 'output' && e.code === 'invalid_type' && e.expected === 'object') {
                        return `${baseMessage}\n    ↳ Hint: Use object syntax with field mappings:\n      output:\n        result: \${agent-name.output.fieldName}`;
                    }
                    // Common mistake: using 'agents' with 'name' key instead of 'flow' with 'agent' key
                    if (path.startsWith('flow') && e.message.includes('agent')) {
                        return `${baseMessage}\n    ↳ Hint: Flow steps should use 'agent' key:\n      flow:\n        - agent: my-agent\n          input:\n            field: \${input.value}`;
                    }
                    return baseMessage;
                });
                throw new Error(`Ensemble validation failed:\n  ${enhancedErrors.join('\n  ')}`);
            }
            throw new Error(`Failed to parse ensemble YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
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
    static parseEnsembleToInstance(yamlContent) {
        const config = this.parseEnsemble(yamlContent);
        // Cast to primitive EnsembleConfig - Zod schema is source of truth for runtime validation
        // The primitive type is simpler (doesn't include function types like rateLimit.key function)
        return ensembleFromConfig(config);
    }
    /**
     * Parse and validate an agent YAML file
     */
    static parseAgent(yamlContent) {
        try {
            // Use mapAsMap: false to avoid warnings about complex YAML keys
            const parsed = YAML.parse(yamlContent, { mapAsMap: false, logLevel: 'silent' });
            if (!parsed) {
                throw new Error('Empty or invalid YAML content');
            }
            const validated = AgentSchema.parse(parsed);
            return validated;
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(`Agent validation failed: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
            }
            throw new Error(`Failed to parse agent YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Resolve input interpolations using composition-based resolver chain
     *
     * Supports: ${input.x}, ${state.y}, ${agent.output.z}
     *
     * Reduced from 42 lines of nested if/else to 1 line via chain of responsibility
     */
    static resolveInterpolation(template, context) {
        return this.interpolator.resolve(template, context);
    }
    /**
     * Parse an agent reference that may include version
     * Supports formats:
     * - "agent-name" (no version)
     * - "agent-name@v1.0.0" (semver version)
     * - "agent-name@production" (deployment tag)
     * - "agent-name@latest" (latest tag)
     */
    static parseAgentReference(agentRef) {
        const parts = agentRef.split('@');
        if (parts.length === 1) {
            return { name: parts[0] };
        }
        if (parts.length === 2) {
            return {
                name: parts[0],
                version: parts[1],
            };
        }
        throw new Error(`Invalid agent reference format: ${agentRef}. Expected "name" or "name@version"`);
    }
    /**
     * Validate that all required agents exist
     */
    static validateAgentReferences(ensemble, availableAgents) {
        // Skip validation if no flow is defined
        if (!ensemble.flow || ensemble.flow.length === 0) {
            return;
        }
        const missingAgents = [];
        // Recursively collect agent references from flow steps
        const collectAgentRefs = (steps) => {
            for (const step of steps) {
                if (typeof step !== 'object' || step === null)
                    continue;
                const stepObj = step;
                // Agent step - has 'agent' field
                if ('agent' in stepObj && typeof stepObj.agent === 'string') {
                    const { name } = this.parseAgentReference(stepObj.agent);
                    if (!availableAgents.has(name)) {
                        missingAgents.push(stepObj.agent);
                    }
                }
                // Control flow steps - recursively check nested steps
                if ('type' in stepObj) {
                    // Parallel: check steps array
                    if (stepObj.type === 'parallel' && Array.isArray(stepObj.steps)) {
                        collectAgentRefs(stepObj.steps);
                    }
                    // Branch: check then/else arrays
                    if (stepObj.type === 'branch') {
                        if (Array.isArray(stepObj.then))
                            collectAgentRefs(stepObj.then);
                        if (Array.isArray(stepObj.else))
                            collectAgentRefs(stepObj.else);
                    }
                    // Foreach: check step
                    if (stepObj.type === 'foreach' && stepObj.step) {
                        collectAgentRefs([stepObj.step]);
                    }
                    // Try: check steps/catch/finally
                    if (stepObj.type === 'try') {
                        if (Array.isArray(stepObj.steps))
                            collectAgentRefs(stepObj.steps);
                        if (Array.isArray(stepObj.catch))
                            collectAgentRefs(stepObj.catch);
                        if (Array.isArray(stepObj.finally))
                            collectAgentRefs(stepObj.finally);
                    }
                    // Switch: check cases and default
                    if (stepObj.type === 'switch') {
                        if (typeof stepObj.cases === 'object' && stepObj.cases !== null) {
                            for (const caseSteps of Object.values(stepObj.cases)) {
                                if (Array.isArray(caseSteps))
                                    collectAgentRefs(caseSteps);
                            }
                        }
                        if (Array.isArray(stepObj.default))
                            collectAgentRefs(stepObj.default);
                    }
                    // While: check steps
                    if (stepObj.type === 'while' && Array.isArray(stepObj.steps)) {
                        collectAgentRefs(stepObj.steps);
                    }
                    // Map-reduce: check map and reduce steps
                    if (stepObj.type === 'map-reduce') {
                        if (stepObj.map)
                            collectAgentRefs([stepObj.map]);
                        if (stepObj.reduce)
                            collectAgentRefs([stepObj.reduce]);
                    }
                }
            }
        };
        collectAgentRefs(ensemble.flow);
        if (missingAgents.length > 0) {
            throw new Error(`Ensemble "${ensemble.name}" references missing agents: ${missingAgents.join(', ')}`);
        }
    }
}
Parser.interpolator = getInterpolator();
