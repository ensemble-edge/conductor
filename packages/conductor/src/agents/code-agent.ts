/**
 * Code Agent
 *
 * Executes JavaScript/TypeScript code from KV storage or inline
 * Supports loading scripts via script:// URIs with versioning
 */

import { BaseAgent, type AgentExecutionContext } from './base-agent.js'
import type { AgentConfig } from '../runtime/parser.js'
import { createComponentLoader } from '../runtime/component-loader.js'

export type FunctionImplementation = (context: AgentExecutionContext) => Promise<unknown> | unknown

interface CodeAgentConfig {
  script?: string // script:// URI to load from KV
  handler?: FunctionImplementation // Inline function
  cache?: {
    ttl?: number
    bypass?: boolean
  }
}

/**
 * Code Agent executes JavaScript/TypeScript from KV or inline
 *
 * @example With script URI:
 * ```yaml
 * agents:
 *   - name: transform
 *     operation: code
 *     config:
 *       script: "script://transform-data@v1.0.0"
 * ```
 *
 * @example With inline handler (testing):
 * ```yaml
 * agents:
 *   - name: transform
 *     operation: code
 *     config:
 *       handler: |
 *         async function({ input }) {
 *           return { result: input.value * 2 }
 *         }
 * ```
 */
export class CodeAgent extends BaseAgent {
  private codeConfig: CodeAgentConfig
  private compiledFunction?: FunctionImplementation

  constructor(config: AgentConfig) {
    super(config)
    this.codeConfig = (config.config || {}) as CodeAgentConfig

    // Validate config
    if (!this.codeConfig.script && !this.codeConfig.handler) {
      throw new Error(`Code agent "${config.name}" requires either a script URI or inline handler`)
    }

    // If inline handler, store it
    if (this.codeConfig.handler) {
      this.compiledFunction = this.codeConfig.handler
    }
  }

  /**
   * Execute the code
   */
  protected async run(context: AgentExecutionContext): Promise<unknown> {
    try {
      // Load script from KV if needed
      if (!this.compiledFunction && this.codeConfig.script) {
        this.compiledFunction = await this.loadScript(context)
      }

      if (!this.compiledFunction) {
        throw new Error('No code implementation available')
      }

      // Execute the function with full context
      const result = await this.compiledFunction(context)

      return result
    } catch (error) {
      throw new Error(
        `Code agent "${this.name}" execution failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Load and compile script from KV
   */
  private async loadScript(context: AgentExecutionContext): Promise<FunctionImplementation> {
    const scriptUri = this.codeConfig.script
    if (!scriptUri) {
      throw new Error('No script URI provided')
    }

    // Create component loader
    if (!context.env.COMPONENTS) {
      throw new Error('COMPONENTS KV namespace not configured')
    }

    const componentLoader = createComponentLoader({
      kv: context.env.COMPONENTS,
      logger: context.logger,
    })

    // Load script content
    context.logger?.debug('Loading script from KV', { uri: scriptUri })
    const scriptContent = await componentLoader.load(scriptUri, {
      cache: this.codeConfig.cache,
    })

    // Compile the script
    // Scripts should export a default function or return a function
    try {
      // Try as ES module export
      const module = new Function(
        'exports',
        'context',
        `
        ${scriptContent}
        if (typeof exports.default === 'function') {
          return exports.default;
        }
        throw new Error('Script must export a default function');
      `
      )

      const exports: any = {}
      const fn = module(exports, context)

      if (typeof fn !== 'function') {
        throw new Error('Script must export a default function')
      }

      return fn as FunctionImplementation
    } catch (error) {
      context.logger?.error('Script compilation failed', error as Error, { uri: scriptUri })
      throw new Error(
        `Failed to compile script: ${scriptUri}\n` +
          `Error: ${error instanceof Error ? error.message : String(error)}\n` +
          `Make sure your script exports a default function:\n` +
          `  export default async function(context) { ... }`
      )
    }
  }

  /**
   * Create a CodeAgent from a config with inline handler
   * Supports test-style handlers: (input, context?) => result
   */
  static fromConfig(config: AgentConfig): CodeAgent | null {
    const codeConfig = config.config as CodeAgentConfig

    // Check if has script URI or handler
    if (codeConfig?.script || codeConfig?.handler) {
      return new CodeAgent(config)
    }

    return null
  }
}
