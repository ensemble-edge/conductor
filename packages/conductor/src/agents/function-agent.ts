/**
 * Function Agent Engine
 *
 * Executes user-defined JavaScript/TypeScript functions
 * The simplest agent type - just runs the provided function
 */

import { BaseAgent, type AgentExecutionContext } from './base-agent.js'
import type { AgentConfig } from '../runtime/parser.js'

export type FunctionImplementation = (context: AgentExecutionContext) => Promise<unknown> | unknown

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
  private implementation: FunctionImplementation

  constructor(config: AgentConfig, implementation: FunctionImplementation) {
    super(config)

    if (typeof implementation !== 'function') {
      throw new Error(`Function agent "${config.name}" requires a function implementation`)
    }

    this.implementation = implementation
  }

  /**
   * Execute the user-provided function
   *
   * Handlers receive the full AgentExecutionContext and access input via context.input
   */
  protected async run(context: AgentExecutionContext): Promise<unknown> {
    try {
      const result = await this.implementation(context)
      return result
    } catch (error) {
      // Wrap errors with context
      throw new Error(
        `Function agent "${this.name}" execution failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Get the function implementation (for testing/inspection)
   */
  getImplementation(): FunctionImplementation {
    return this.implementation
  }

  /**
   * Create a FunctionAgent from a config with inline handler
   */
  static fromConfig(config: AgentConfig): FunctionAgent | null {
    const agentConfig = config.config as { handler?: FunctionImplementation } | undefined
    const handler = agentConfig?.handler

    if (typeof handler === 'function') {
      return new FunctionAgent(config, handler)
    }

    return null
  }
}
