/**
 * SDK Agent Factory
 *
 * Helpers for creating agents with less boilerplate
 */
import { Operation } from '../types/constants.js';
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
export function createAgent(options) {
    // Return the handler function
    // The config will be loaded from agent.yaml by the loader
    return options.handler;
}
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
export function createThinkMember(options) {
    return createAgent({ ...options, type: Operation.Think });
}
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
export function createFunctionMember(options) {
    return createAgent({ ...options, type: Operation.Function });
}
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
export function createDataMember(options) {
    return createAgent({ ...options, type: Operation.Data });
}
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
export function createAPIMember(options) {
    return createAgent({ ...options, type: Operation.API });
}
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
export function createEmailMember(options) {
    return createAgent({ ...options, type: Operation.Email });
}
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
export function createSMSMember(options) {
    return createAgent({ ...options, type: Operation.SMS });
}
/**
 * Generate a agent config (for programmatic agent creation)
 */
export function generateMemberConfig(options) {
    return {
        name: options.name,
        type: options.type,
        description: options.description,
        config: options.config,
        schema: options.schema,
    };
}
