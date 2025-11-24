/**
 * SDK Agent Factory
 *
 * Helpers for creating agents with less boilerplate
 */
import type { CreateAgentOptions, MemberHandler } from './types.js';
import type { AgentConfig } from '../runtime/parser.js';
/**
 * Create an agent with simplified syntax
 *
 * @example
 * ```typescript
 * export default createAgent({
 *   name: 'greet',
 *   operation: 'Function',
 *   async handler({ input }) {
 *     return { message: `Hello, ${input.name}!` };
 *   }
 * });
 * ```
 */
export declare function createAgent(options: CreateAgentOptions): MemberHandler;
/**
 * Create a Think agent (AI reasoning)
 *
 * @example
 * ```typescript
 * export default createThinkAgent({
 *   async handler({ input, env }) {
 *     // Your AI logic here
 *     return { analysis: '...' };
 *   }
 * });
 * ```
 */
export declare function createThinkAgent(options: Omit<CreateAgentOptions, 'operation'>): MemberHandler;
export declare const createThinkMember: typeof createThinkAgent;
/**
 * Create a Function agent (JavaScript execution)
 *
 * @example
 * ```typescript
 * export default createFunctionAgent({
 *   async handler({ input }) {
 *     return { result: input.value * 2 };
 *   }
 * });
 * ```
 */
export declare function createFunctionAgent(options: Omit<CreateAgentOptions, 'operation'>): MemberHandler;
export declare const createFunctionMember: typeof createFunctionAgent;
/**
 * Create a Storage agent (KV, R2, Cache operations)
 *
 * @example
 * ```typescript
 * export default createStorageAgent({
 *   async handler({ input, env }) {
 *     const value = await env.CACHE.get(input.key);
 *     return { value, found: !!value };
 *   }
 * });
 * ```
 */
export declare function createStorageAgent(options: Omit<CreateAgentOptions, 'operation'>): MemberHandler;
export declare const createStorageMember: typeof createStorageAgent;
/**
 * Create a Data agent (database operations - D1, Hyperdrive, etc.)
 *
 * @example
 * ```typescript
 * export default createDataAgent({
 *   async handler({ input, env }) {
 *     const rows = await env.DB.prepare('SELECT * FROM users').all();
 *     return { rows };
 *   }
 * });
 * ```
 */
export declare function createDataAgent(options: Omit<CreateAgentOptions, 'operation'>): MemberHandler;
export declare const createDataMember: typeof createDataAgent;
/**
 * Create an API agent (HTTP requests)
 *
 * @example
 * ```typescript
 * export default createAPIAgent({
 *   async handler({ input }) {
 *     const response = await fetch(input.url);
 *     return { data: await response.json() };
 *   }
 * });
 * ```
 */
export declare function createAPIAgent(options: Omit<CreateAgentOptions, 'operation'>): MemberHandler;
export declare const createAPIMember: typeof createAPIAgent;
/**
 * Create an Email agent (email sending)
 *
 * @example
 * ```typescript
 * export default createEmailMember({
 *   async handler({ input, env }) {
 *     // Custom email logic
 *     return { messageId: '...', status: 'sent' };
 *   }
 * });
 * ```
 */
export declare function createEmailMember(options: Omit<CreateAgentOptions, 'operation'>): MemberHandler;
/**
 * Create an SMS agent (SMS sending)
 *
 * @example
 * ```typescript
 * export default createSMSMember({
 *   async handler({ input, env }) {
 *     // Custom SMS logic
 *     return { messageId: '...', status: 'sent' };
 *   }
 * });
 * ```
 */
export declare function createSMSMember(options: Omit<CreateAgentOptions, 'operation'>): MemberHandler;
/**
 * Generate an agent config (for programmatic agent creation)
 */
export declare function generateAgentConfig(options: CreateAgentOptions): AgentConfig;
export declare const generateMemberConfig: typeof generateAgentConfig;
//# sourceMappingURL=agent-factory.d.ts.map