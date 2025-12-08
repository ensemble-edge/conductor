/**
 * Error Handling Tests
 *
 * This file demonstrates how to test error scenarios in your agents and ensembles.
 * Proper error handling is critical for production applications.
 *
 * Key patterns shown:
 * - Testing agent error responses
 * - Testing ensemble error handling
 * - Validating error messages and structures
 * - Testing graceful degradation
 */

import { describe, it, expect } from 'vitest';
import { Executor, MemberLoader } from '@ensemble-edge/conductor';
import type { AgentConfig, AgentExecutionContext } from '@ensemble-edge/conductor';

/**
 * Helper to create test environment and context
 */
function createTestEnv() {
	const env = {} as Env;
	const ctx = {
		waitUntil: (promise: Promise<unknown>) => promise,
		passThroughOnException: () => {},
	} as ExecutionContext;
	return { env, ctx };
}

/**
 * A mock agent that always fails - useful for testing error handling
 */
async function failingAgent(_context: AgentExecutionContext): Promise<never> {
	throw new Error('Intentional test failure');
}

/**
 * A mock agent that fails based on input
 */
async function conditionalAgent(context: AgentExecutionContext): Promise<{ result: string }> {
	const { input } = context;

	if (input.shouldFail) {
		throw new Error(`Failed as requested: ${input.reason || 'no reason given'}`);
	}

	return { result: 'success' };
}

/**
 * A mock agent that returns an error in output (soft failure)
 */
async function softFailAgent(context: AgentExecutionContext): Promise<{ success: boolean; error?: string; data?: string }> {
	const { input } = context;

	if (input.shouldFail) {
		return {
			success: false,
			error: input.errorMessage || 'Something went wrong',
		};
	}

	return {
		success: true,
		data: 'Operation completed',
	};
}

describe('Error Handling Tests', () => {
	describe('Agent Error Handling', () => {
		it('should handle agent that throws an error', async () => {
			const { env, ctx } = createTestEnv();
			const executor = new Executor({ env, ctx });
			const loader = new MemberLoader({ env, ctx });

			// Register a failing agent
			const failingConfig: AgentConfig = {
				name: 'failing-agent',
				operation: 'code',
				schema: {
					input: {},
					output: { result: 'string' },
				},
			};
			const failingMember = loader.registerAgent(failingConfig, failingAgent);
			executor.registerAgent(failingMember);

			const ensemble = `
name: test-failing
flow:
  - agent: failing-agent
output:
  result: \${failing-agent.output.result}
`;

			const result = await executor.executeFromYAML(ensemble, {});

			// Execution should fail gracefully
			expect(result.success).toBe(false);
			if (result.success) return;

			expect(result.error).toBeDefined();
		});

		it('should handle conditional failures', async () => {
			const { env, ctx } = createTestEnv();
			const executor = new Executor({ env, ctx });
			const loader = new MemberLoader({ env, ctx });

			const conditionalConfig: AgentConfig = {
				name: 'conditional-agent',
				operation: 'code',
				schema: {
					input: { shouldFail: 'boolean?', reason: 'string?' },
					output: { result: 'string' },
				},
			};
			const conditionalMember = loader.registerAgent(conditionalConfig, conditionalAgent);
			executor.registerAgent(conditionalMember);

			const ensemble = `
name: test-conditional
flow:
  - agent: conditional-agent
    input:
      shouldFail: \${input.fail}
      reason: \${input.reason}
output:
  result: \${conditional-agent.output.result}
`;

			// Test success case
			const successResult = await executor.executeFromYAML(ensemble, {
				fail: false,
			});
			expect(successResult.success).toBe(true);

			// Test failure case
			const failResult = await executor.executeFromYAML(ensemble, {
				fail: true,
				reason: 'Testing error path',
			});
			expect(failResult.success).toBe(false);
		});
	});

	describe('Soft Failure Patterns', () => {
		it('should handle agents that return error objects instead of throwing', async () => {
			const { env, ctx } = createTestEnv();
			const executor = new Executor({ env, ctx });
			const loader = new MemberLoader({ env, ctx });

			const softFailConfig: AgentConfig = {
				name: 'soft-fail-agent',
				operation: 'code',
				schema: {
					input: { shouldFail: 'boolean?', errorMessage: 'string?' },
					output: { success: 'boolean', error: 'string?', data: 'string?' },
				},
			};
			const softFailMember = loader.registerAgent(softFailConfig, softFailAgent);
			executor.registerAgent(softFailMember);

			// Test soft failure - agent returns error in output, not throwing
			const ensemble = `
name: test-soft-fail
flow:
  - agent: soft-fail-agent
    input:
      shouldFail: \${input.shouldFail}
      errorMessage: \${input.errorMessage}
output:
  success: \${soft-fail-agent.output.success}
  error: \${soft-fail-agent.output.error}
  data: \${soft-fail-agent.output.data}
`;

			// Success case
			const successResult = await executor.executeFromYAML(ensemble, {
				shouldFail: false,
			});
			expect(successResult.success).toBe(true);
			if (!successResult.success) return;

			const successOutput = successResult.value.output as { success: boolean; data: string };
			expect(successOutput.success).toBe(true);
			expect(successOutput.data).toBe('Operation completed');

			// Soft failure case - ensemble succeeds but output indicates failure
			const failResult = await executor.executeFromYAML(ensemble, {
				shouldFail: true,
				errorMessage: 'Custom error message',
			});
			expect(failResult.success).toBe(true); // Ensemble succeeded
			if (!failResult.success) return;

			const failOutput = failResult.value.output as { success: boolean; error: string };
			expect(failOutput.success).toBe(false); // But agent indicates failure
			expect(failOutput.error).toBe('Custom error message');
		});
	});

	describe('Missing Agent Handling', () => {
		it('should fail gracefully when referencing unknown agent', async () => {
			const { env, ctx } = createTestEnv();
			const executor = new Executor({ env, ctx });

			// Ensemble references an agent that doesn't exist
			const ensemble = `
name: test-missing-agent
flow:
  - agent: non-existent-agent
    input:
      name: test
output:
  result: \${non-existent-agent.output.result}
`;

			const result = await executor.executeFromYAML(ensemble, {});

			expect(result.success).toBe(false);
			if (result.success) return;

			expect(result.error).toBeDefined();
		});
	});

	describe('Input Validation', () => {
		it('should handle missing required inputs gracefully', async () => {
			const { env, ctx } = createTestEnv();
			const executor = new Executor({ env, ctx });
			const loader = new MemberLoader({ env, ctx });

			// Agent that expects specific input
			const strictAgent = async (context: AgentExecutionContext) => {
				const { input } = context;
				if (!input.requiredField) {
					throw new Error('requiredField is required');
				}
				return { result: `Got: ${input.requiredField}` };
			};

			const strictConfig: AgentConfig = {
				name: 'strict-agent',
				operation: 'code',
				schema: {
					input: { requiredField: 'string' },
					output: { result: 'string' },
				},
			};
			const strictMember = loader.registerAgent(strictConfig, strictAgent);
			executor.registerAgent(strictMember);

			const ensemble = `
name: test-strict
flow:
  - agent: strict-agent
    input:
      requiredField: \${input.value}
output:
  result: \${strict-agent.output.result}
`;

			// Missing input should cause failure
			const result = await executor.executeFromYAML(ensemble, {});
			expect(result.success).toBe(false);

			// With input should succeed
			const successResult = await executor.executeFromYAML(ensemble, {
				value: 'provided',
			});
			expect(successResult.success).toBe(true);
		});
	});
});
