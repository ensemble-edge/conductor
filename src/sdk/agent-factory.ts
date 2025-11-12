/**
 * SDK Agent Factory
 *
 * Helpers for creating agents with less boilerplate
 */

import type { CreateAgentOptions, MemberHandler } from './types.js'
import type { AgentConfig } from '../runtime/parser.js'
import { Operation } from '../types/constants.js'

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
export function createAgent(options: CreateAgentOptions): MemberHandler {
  // Return the handler function
  // The config will be loaded from agent.yaml by the loader
  return options.handler
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
export function createThinkMember(options: Omit<CreateAgentOptions, 'operation'>): MemberHandler {
  return createAgent({ ...options, operation: Operation.think })
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
export function createFunctionMember(options: Omit<CreateAgentOptions, 'operation'>): MemberHandler {
  return createAgent({ ...options, operation: Operation.code })
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
export function createDataMember(options: Omit<CreateAgentOptions, 'operation'>): MemberHandler {
  return createAgent({ ...options, operation: Operation.storage })
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
export function createAPIMember(options: Omit<CreateAgentOptions, 'operation'>): MemberHandler {
  return createAgent({ ...options, operation: Operation.http })
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
export function createEmailMember(options: Omit<CreateAgentOptions, 'operation'>): MemberHandler {
  return createAgent({ ...options, operation: Operation.email })
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
export function createSMSMember(options: Omit<CreateAgentOptions, 'operation'>): MemberHandler {
  return createAgent({ ...options, operation: Operation.sms })
}

/**
 * Generate an agent config (for programmatic agent creation)
 */
export function generateMemberConfig(options: CreateAgentOptions): AgentConfig {
  return {
    name: options.name,
    operation: options.operation,
    description: options.description,
    config: options.config,
    schema: options.schema,
  }
}
