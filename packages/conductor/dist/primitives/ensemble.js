/**
 * Ensemble Primitive
 *
 * The core primitive for creating ensembles programmatically.
 * Produces the same structure as YAML parsing.
 */
/**
 * Ensemble class - runtime representation of an ensemble
 *
 * This class is the canonical runtime object for both YAML and TS ensembles.
 */
export class Ensemble {
    constructor(options) {
        this.name = options.name;
        this.version = options.version;
        this.description = options.description;
        this.agents = options.agents;
        this.state = options.state;
        this.scoring = options.scoring;
        this.trigger = options.trigger;
        this.notifications = options.notifications;
        this.inputs = options.inputs;
        this.output = options.output;
        this.apiExecutable = options.apiExecutable;
        // Determine if steps are static or dynamic
        if (typeof options.steps === 'function') {
            this.isDynamic = true;
            this.hooks = {
                dynamicSteps: options.steps,
                beforeExecute: options.beforeExecute,
                afterExecute: options.afterExecute,
                onError: options.onError,
            };
        }
        else {
            this.isDynamic = false;
            this.staticSteps = options.steps;
            this.hooks = {
                beforeExecute: options.beforeExecute,
                afterExecute: options.afterExecute,
                onError: options.onError,
            };
        }
    }
    /**
     * Resolve steps for execution
     *
     * For static ensembles, returns the static steps.
     * For dynamic ensembles, calls the step generator function.
     */
    async resolveSteps(context) {
        if (this.isDynamic && this.hooks?.dynamicSteps) {
            return await this.hooks.dynamicSteps(context);
        }
        return this.staticSteps ?? [];
    }
    /**
     * Get the flow steps (for backward compatibility)
     *
     * Note: For dynamic ensembles, this returns an empty array.
     * Use resolveSteps() for runtime step resolution.
     */
    get flow() {
        return this.staticSteps ?? [];
    }
    /**
     * Convert to plain config object (for serialization/YAML export)
     */
    toConfig() {
        return {
            name: this.name,
            description: this.description,
            state: this.state,
            scoring: this.scoring,
            trigger: this.trigger,
            notifications: this.notifications,
            agents: this.agents,
            flow: this.staticSteps,
            inputs: this.inputs,
            output: this.output,
        };
    }
}
/**
 * Create an ensemble programmatically
 *
 * @param options - Ensemble configuration
 * @returns Ensemble instance
 *
 * @example
 * ```typescript
 * // Simple static ensemble
 * const pipeline = createEnsemble({
 *   name: 'data-pipeline',
 *   steps: [
 *     step('fetch', { operation: 'http', config: { url: '...' } }),
 *     step('transform', { script: 'scripts/transform' }),
 *     step('store', { operation: 'storage', config: { ... } })
 *   ]
 * });
 *
 * // Dynamic ensemble with runtime step generation
 * const adaptive = createEnsemble({
 *   name: 'adaptive-pipeline',
 *   steps: (context) => {
 *     const sources = context.input.sources as string[];
 *     return [
 *       parallel(sources.map(url =>
 *         step(`fetch-${url}`, { operation: 'http', config: { url } })
 *       )),
 *       step('merge', { script: 'scripts/merge' })
 *     ];
 *   }
 * });
 *
 * // Ensemble with triggers and hooks
 * const service = createEnsemble({
 *   name: 'user-service',
 *   steps: [
 *     step('validate'),
 *     step('process'),
 *     step('respond')
 *   ],
 *   trigger: [{
 *     type: 'http',
 *     path: '/users',
 *     methods: ['POST'],
 *     public: false,
 *     auth: { type: 'bearer', secret: '${env.API_SECRET}' }
 *   }],
 *   beforeExecute: async (ctx) => {
 *     console.log('Request received');
 *   },
 *   afterExecute: async (result, ctx) => {
 *     console.log('Request completed');
 *   }
 * });
 * ```
 */
export function createEnsemble(options) {
    // Validate required fields
    if (!options.name || typeof options.name !== 'string') {
        throw new Error('Ensemble name is required and must be a string');
    }
    if (!options.steps) {
        throw new Error('Ensemble steps are required');
    }
    return new Ensemble(options);
}
/**
 * Check if a value is an Ensemble instance
 */
export function isEnsemble(value) {
    return value instanceof Ensemble;
}
/**
 * Create an ensemble from a plain config object (for YAML parsing)
 *
 * This is used internally by the parser to convert parsed YAML to an Ensemble.
 */
export function ensembleFromConfig(config) {
    return new Ensemble({
        name: config.name,
        description: config.description,
        steps: config.flow ?? [],
        agents: config.agents,
        state: config.state,
        scoring: config.scoring,
        trigger: config.trigger,
        notifications: config.notifications,
        inputs: config.inputs,
        output: config.output,
    });
}
