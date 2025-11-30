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
import { BaseAgent, type AgentExecutionContext } from './base-agent.js';
import type { AgentConfig } from '../runtime/parser.js';
/**
 * Function implementation type - supports two calling conventions:
 * 1. Modern (1 param): handler(context: AgentExecutionContext)
 * 2. Legacy (2 params): handler(input: unknown, context: AgentExecutionContext)
 *
 * The CodeAgent detects which convention to use via Function.length
 */
export type FunctionImplementation = ((context: AgentExecutionContext) => Promise<unknown> | unknown) | ((input: unknown, context: AgentExecutionContext) => Promise<unknown> | unknown);
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
export declare class CodeAgent extends BaseAgent {
    private codeConfig;
    private compiledFunction?;
    constructor(config: AgentConfig);
    /**
     * Execute the code
     */
    protected run(context: AgentExecutionContext): Promise<unknown>;
    /**
     * Load script from bundled scripts
     *
     * Uses the global ScriptLoader which contains pre-bundled scripts
     * discovered at build time by vite-plugin-script-discovery.
     *
     * This approach works in Cloudflare Workers because it doesn't
     * use new Function() or eval() - scripts are statically imported.
     */
    private loadScript;
    /**
     * Create a CodeAgent from a config with script URI or handler
     */
    static fromConfig(config: AgentConfig): CodeAgent | null;
}
//# sourceMappingURL=code-agent.d.ts.map