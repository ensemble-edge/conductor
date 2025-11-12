/**
 * SDK Agent Factory
 *
 * Helpers for creating agents with less boilerplate
 */
import type { CreateMemberOptions, MemberHandler } from './types.js';
import type { AgentConfig } from '../runtime/parser.js';
/**
 * Create a agent with simplified syntax
 *
 * @example
 * ```typescript
 * export default createAgent({
 *   name: 'greet',
 *   type: 'Function',
 *   async handler({ input }) {
 *     return { message: `Hello, ${input.name}!` };
 *   }
 * });
 * ```
 */
export declare function createAgent(options: CreateMemberOptions): MemberHandler;
/**
 * Create a Think agent (AI reasoning)
 *
 * @example
 * ```typescript
 * export default createThinkMember({
 *   async handler({ input, env }) {
 *     // Your AI logic here
 *     return { analysis: '...' };
 *   }
 * });
 * ```
 */
export declare function createThinkMember(options: Omit<CreateMemberOptions, 'type'>): MemberHandler;
/**
 * Create a Function agent (JavaScript execution)
 *
 * @example
 * ```typescript
 * export default createFunctionMember({
 *   async handler({ input }) {
 *     return { result: input.value * 2 };
 *   }
 * });
 * ```
 */
export declare function createFunctionMember(options: Omit<CreateMemberOptions, 'type'>): MemberHandler;
/**
 * Create a Data agent (storage operations)
 *
 * @example
 * ```typescript
 * export default createDataMember({
 *   async handler({ input, env }) {
 *     const value = await env.CACHE.get(input.key);
 *     return { value, found: !!value };
 *   }
 * });
 * ```
 */
export declare function createDataMember(options: Omit<CreateMemberOptions, 'type'>): MemberHandler;
/**
 * Create an API agent (HTTP requests)
 *
 * @example
 * ```typescript
 * export default createAPIMember({
 *   async handler({ input }) {
 *     const response = await fetch(input.url);
 *     return { data: await response.json() };
 *   }
 * });
 * ```
 */
export declare function createAPIMember(options: Omit<CreateMemberOptions, 'type'>): MemberHandler;
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
export declare function createEmailMember(options: Omit<CreateMemberOptions, 'type'>): MemberHandler;
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
export declare function createSMSMember(options: Omit<CreateMemberOptions, 'type'>): MemberHandler;
/**
 * Generate a agent config (for programmatic agent creation)
 */
export declare function generateMemberConfig(options: CreateMemberOptions): AgentConfig;
//# sourceMappingURL=member-factory.d.ts.map