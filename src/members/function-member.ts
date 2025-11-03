/**
 * Function Member Engine
 *
 * Executes user-defined JavaScript/TypeScript functions
 * The simplest member type - just runs the provided function
 */

import { BaseMember, type MemberExecutionContext } from './base-member';
import type { MemberConfig } from '../runtime/parser';

export type FunctionImplementation = (context: MemberExecutionContext) => Promise<unknown> | unknown;

/**
 * Function Member executes user-provided JavaScript functions
 *
 * @example User's member definition:
 * ```yaml
 * # members/greet/member.yaml
 * name: greet
 * type: Function
 * description: Greet a user
 * schema:
 *   input:
 *     name: string
 *   output:
 *     message: string
 * ```
 *
 * ```typescript
 * // members/greet/index.ts
 * export default async function greet({ input }) {
 *   return {
 *     message: `Hello, ${input.name}! Welcome to Conductor.`
 *   };
 * }
 * ```
 */
export class FunctionMember extends BaseMember {
	private implementation: FunctionImplementation;

	constructor(config: MemberConfig, implementation: FunctionImplementation) {
		super(config);

		if (typeof implementation !== 'function') {
			throw new Error(`Function member "${config.name}" requires a function implementation`);
		}

		this.implementation = implementation;
	}

	/**
	 * Execute the user-provided function
	 */
	protected async run(context: MemberExecutionContext): Promise<unknown> {
		try {
			// Execute the user's function with full context
			const result = await this.implementation(context);

			return result;
		} catch (error) {
			// Wrap errors with context
			throw new Error(
				`Function member "${this.name}" execution failed: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			);
		}
	}

	/**
	 * Get the function implementation (for testing/inspection)
	 */
	getImplementation(): FunctionImplementation {
		return this.implementation;
	}

	/**
	 * Create a FunctionMember from a config with inline handler
	 * Supports test-style handlers: (input, context?) => result
	 */
	static fromConfig(config: MemberConfig): FunctionMember | null {
		// Check if config has an inline handler function
		const handler = (config.config as any)?.handler;

		if (typeof handler === 'function') {
			// Wrap the handler to match FunctionImplementation signature
			const implementation: FunctionImplementation = async (context: MemberExecutionContext) => {
				return await handler(context.input, context);
			};

			return new FunctionMember(config, implementation);
		}

		return null;
	}
}
