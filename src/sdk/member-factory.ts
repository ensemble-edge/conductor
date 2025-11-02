/**
 * SDK Member Factory
 *
 * Helpers for creating members with less boilerplate
 */

import type { CreateMemberOptions, MemberHandler } from './types';
import type { MemberConfig } from '../runtime/parser';
import { MemberType } from '../types/constants';

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
export function createMember(options: CreateMemberOptions): MemberHandler {
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
export function createThinkMember(options: Omit<CreateMemberOptions, 'type'>): MemberHandler {
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
export function createFunctionMember(options: Omit<CreateMemberOptions, 'type'>): MemberHandler {
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
export function createDataMember(options: Omit<CreateMemberOptions, 'type'>): MemberHandler {
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
export function createAPIMember(options: Omit<CreateMemberOptions, 'type'>): MemberHandler {
	return createMember({ ...options, type: MemberType.API });
}

/**
 * Generate a member config (for programmatic member creation)
 */
export function generateMemberConfig(options: CreateMemberOptions): MemberConfig {
	return {
		name: options.name,
		type: options.type,
		description: options.description,
		config: options.config,
		schema: options.schema
	};
}
