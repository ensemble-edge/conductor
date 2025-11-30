/**
 * Code Agent
 *
 * Executes JavaScript/TypeScript code from bundled scripts or inline handlers.
 *
 * Script Resolution Priority:
 * 1. Pre-bundled scripts (via script:// URI and global ScriptLoader) - Works in Workers!
 * 2. Inline handler function (passed in config.handler)
 * 3. KV-based dynamic loading (DEPRECATED - uses new Function(), blocked in Workers)
 *
 * For Cloudflare Workers compatibility, always use bundled scripts:
 * - Create script files in scripts/ directory
 * - Reference via script:// URI in ensembles
 * - Vite plugin bundles them at build time
 */

import { BaseAgent, type AgentExecutionContext } from './base-agent.js'
import type { AgentConfig } from '../runtime/parser.js'
import { hasGlobalScriptLoader, getGlobalScriptLoader } from '../utils/script-loader.js'

/**
 * Function implementation type - supports two calling conventions:
 * 1. Modern (1 param): handler(context: AgentExecutionContext)
 * 2. Legacy (2 params): handler(input: unknown, context: AgentExecutionContext)
 *
 * The CodeAgent detects which convention to use via Function.length
 */
export type FunctionImplementation =
  | ((context: AgentExecutionContext) => Promise<unknown> | unknown)
  | ((input: unknown, context: AgentExecutionContext) => Promise<unknown> | unknown)

interface CodeAgentConfig {
  script?: string // script:// URI to load from bundled scripts
  handler?: FunctionImplementation // Pre-compiled handler function
  cache?: {
    ttl?: number
    bypass?: boolean
  }
}

/**
 * Code Agent executes JavaScript/TypeScript from bundled scripts or handlers
 *
 * @example With script URI (RECOMMENDED for Workers):
 * ```yaml
 * agents:
 *   - name: transform
 *     operation: code
 *     config:
 *       script: "script://transforms/csv"
 * ```
 *
 * @example With pre-compiled handler (from agent index.ts):
 * ```typescript
 * // agents/my-agent/index.ts
 * export default async function(context) {
 *   return { result: context.input.value * 2 }
 * }
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

    // If inline handler provided, use it directly
    if (this.codeConfig.handler) {
      this.compiledFunction = this.codeConfig.handler
    }
  }

  /**
   * Execute the code
   */
  protected async run(context: AgentExecutionContext): Promise<unknown> {
    try {
      // Resolve script from bundle if needed
      if (!this.compiledFunction && this.codeConfig.script) {
        this.compiledFunction = this.loadScript(context)
      }

      if (!this.compiledFunction) {
        throw new Error('No code implementation available')
      }

      // Execute the function - detect calling convention by parameter count
      // Function.length returns the number of declared parameters
      // - length === 1: Modern style handler(context)
      // - length >= 2: Legacy style handler(input, context)
      let result: unknown
      if (this.compiledFunction.length >= 2) {
        // Legacy two-parameter style: handler(input, context)
        result = await (this.compiledFunction as (input: unknown, ctx: AgentExecutionContext) => Promise<unknown>)(
          context.input,
          context
        )
      } else {
        // Modern single-parameter style: handler(context)
        result = await (this.compiledFunction as (ctx: AgentExecutionContext) => Promise<unknown>)(context)
      }

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
   * Load script from bundled scripts
   *
   * Uses the global ScriptLoader which contains pre-bundled scripts
   * discovered at build time by vite-plugin-script-discovery.
   *
   * This approach works in Cloudflare Workers because it doesn't
   * use new Function() or eval() - scripts are statically imported.
   */
  private loadScript(context: AgentExecutionContext): FunctionImplementation {
    const scriptUri = this.codeConfig.script
    if (!scriptUri) {
      throw new Error('No script URI provided')
    }

    // Check if global script loader is available
    if (!hasGlobalScriptLoader()) {
      throw new Error(
        `Cannot load script "${scriptUri}": Script loader not initialized.\n\n` +
          `For Cloudflare Workers, scripts must be bundled at build time:\n` +
          `1. Create your script in scripts/${scriptUri.replace('script://', '')}.ts\n` +
          `2. Export a default function: export default async function(context) { ... }\n` +
          `3. Initialize the script loader in your worker entry point:\n\n` +
          `   import { scriptsMap } from 'virtual:conductor-scripts'\n` +
          `   import { setGlobalScriptLoader, createScriptLoader } from '@ensemble-edge/conductor'\n` +
          `   setGlobalScriptLoader(createScriptLoader(scriptsMap))\n\n` +
          `Note: Dynamic script loading via KV is not supported in Workers due to\n` +
          `security restrictions (new Function() is blocked).`
      )
    }

    const scriptLoader = getGlobalScriptLoader()
    context.logger?.debug('Loading script from bundle', { uri: scriptUri })

    try {
      return scriptLoader.resolve(scriptUri)
    } catch (error) {
      context.logger?.error('Script resolution failed', error as Error, { uri: scriptUri })
      throw error
    }
  }

  /**
   * Create a CodeAgent from a config with script URI or handler
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
