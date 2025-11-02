/**
 * Greet Member Implementation
 *
 * A simple function that greets the user by name
 */

import type { MemberExecutionContext } from '@ensemble-edge/conductor';

export default async function greet({ input }: MemberExecutionContext) {
	const name = input.name || 'World';

	return {
		message: `Hello, ${name}! Welcome to Conductor.`
	};
}
