/**
 * Function Agent Engine
 *
 * Executes user-defined JavaScript/TypeScript functions
 * The simplest agent type - just runs the provided function
 */
import { BaseAgent } from './base-agent.js';
/**
 * Function Agent executes user-provided JavaScript functions
 *
 * @example User's agent definition:
 * ```yaml
 * # agents/greet/agent.yaml
 * name: greet
 * type: Function
 * description: Greet a user
 * schema:
 *   input:
 *     name: string
 *   output:
 *     message: string
 * ```
 *
 * ```typescript
 * // agents/greet/index.ts
 * export default async function greet({ input }) {
 *   return {
 *     message: `Hello, ${input.name}! Welcome to Conductor.`
 *   };
 * }
 * ```
 */
export class FunctionAgent extends BaseAgent {
    constructor(config, implementation) {
        super(config);
        if (typeof implementation !== 'function') {
            throw new Error(`Function agent "${config.name}" requires a function implementation`);
        }
        this.implementation = implementation;
    }
    /**
     * Execute the user-provided function
     */
    async run(context) {
        try {
            // Execute the user's function with full context
            const result = await this.implementation(context);
            return result;
        }
        catch (error) {
            // Wrap errors with context
            throw new Error(`Function agent "${this.name}" execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get the function implementation (for testing/inspection)
     */
    getImplementation() {
        return this.implementation;
    }
    /**
     * Create a FunctionAgent from a config with inline handler
     * Supports test-style handlers: (input, context?) => result
     */
    static fromConfig(config) {
        // Check if config has an inline handler function
        const handler = config.config?.handler;
        if (typeof handler === 'function') {
            // Wrap the handler to match FunctionImplementation signature
            const implementation = async (context) => {
                return await handler(context.input, context);
            };
            return new FunctionAgent(config, implementation);
        }
        return null;
    }
}
