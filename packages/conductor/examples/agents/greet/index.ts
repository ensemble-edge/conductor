/**
 * Greet Agent Implementation
 *
 * A simple function that greets the user by name
 */

import type { AgentExecutionContext } from '@ensemble-edge/conductor';

export default async function greet({ input }: AgentExecutionContext) {
	const name = input.name || 'World';

	return {
		message: `Hello, ${name}! Welcome to Conductor.`
	};
}
