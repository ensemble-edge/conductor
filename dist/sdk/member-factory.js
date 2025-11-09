/**
 * SDK Member Factory
 *
 * Helpers for creating members with less boilerplate
 */
import { MemberType } from '../types/constants.js';
/**
 * Create a member with simplified syntax
 *
 * @example
 * ```typescript
 * export default createMember({
 *   name: 'greet',
 *   type: 'Function',
 *   async handler({ input }) {
 *     return { message: `Hello, ${input.name}!` };
 *   }
 * });
 * ```
 */
export function createMember(options) {
    // Return the handler function
    // The config will be loaded from member.yaml by the loader
    return options.handler;
}
/**
 * Create a Think member (AI reasoning)
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
    return createMember({ ...options, type: MemberType.Think });
}
/**
 * Create a Function member (JavaScript execution)
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
    return createMember({ ...options, type: MemberType.Function });
}
/**
 * Create a Data member (storage operations)
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
    return createMember({ ...options, type: MemberType.Data });
}
/**
 * Create an API member (HTTP requests)
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
    return createMember({ ...options, type: MemberType.API });
}
/**
 * Create an Email member (email sending)
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
    return createMember({ ...options, type: MemberType.Email });
}
/**
 * Create an SMS member (SMS sending)
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
    return createMember({ ...options, type: MemberType.SMS });
}
/**
 * Generate a member config (for programmatic member creation)
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
