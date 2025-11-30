/**
 * Function Agent Engine
 *
 * Executes user-defined JavaScript/TypeScript functions
 * The simplest agent type - just runs the provided function
 */
import { BaseAgent, type AgentExecutionContext } from './base-agent.js';
import type { AgentConfig } from '../runtime/parser.js';
export type FunctionImplementation = (context: AgentExecutionContext) => Promise<unknown> | unknown;
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
export declare class FunctionAgent extends BaseAgent {
    private implementation;
    constructor(config: AgentConfig, implementation: FunctionImplementation);
    /**
     * Execute the user-provided function
     *
     * Supports two calling conventions:
     * - Modern single-param: handler(context) where context.input contains the input
     * - Legacy two-param: handler(input, context) for backward compatibility
     *
     * Detection uses Function.length to check declared parameter count.
     */
    protected run(context: AgentExecutionContext): Promise<unknown>;
    /**
     * Get the function implementation (for testing/inspection)
     */
    getImplementation(): FunctionImplementation;
    /**
     * Create a FunctionAgent from a config with inline handler
     * Supports test-style handlers: (input, context?) => result
     */
    static fromConfig(config: AgentConfig): FunctionAgent | null;
}
//# sourceMappingURL=function-agent.d.ts.map