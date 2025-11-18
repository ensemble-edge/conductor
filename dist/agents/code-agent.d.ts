/**
 * Code Agent
 *
 * Executes JavaScript/TypeScript code from KV storage or inline
 * Supports loading scripts via script:// URIs with versioning
 */
import { BaseAgent, type AgentExecutionContext } from './base-agent.js';
import type { AgentConfig } from '../runtime/parser.js';
export type FunctionImplementation = (context: AgentExecutionContext) => Promise<unknown> | unknown;
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
export declare class CodeAgent extends BaseAgent {
    private codeConfig;
    private compiledFunction?;
    constructor(config: AgentConfig);
    /**
     * Execute the code
     */
    protected run(context: AgentExecutionContext): Promise<unknown>;
    /**
     * Load and compile script from KV
     */
    private loadScript;
    /**
     * Create a CodeAgent from a config with inline handler
     * Supports test-style handlers: (input, context?) => result
     */
    static fromConfig(config: AgentConfig): CodeAgent | null;
}
//# sourceMappingURL=code-agent.d.ts.map