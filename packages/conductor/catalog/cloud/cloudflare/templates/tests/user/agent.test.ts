/**
 * Agent Unit Tests
 *
 * This file demonstrates how to unit test your custom agents.
 * Agent handlers are just async functions - test them directly!
 *
 * Key patterns shown:
 * - Testing agent handler functions in isolation
 * - Mocking the AgentExecutionContext
 * - Testing different input variations
 * - Validating output shapes
 */

import { describe, it, expect } from 'vitest';
import greet from '../../agents/examples/hello';
import type { AgentExecutionContext } from '@ensemble-edge/conductor';

/**
 * Helper to create a minimal AgentExecutionContext for testing.
 * In real tests, you can add more context fields as needed.
 */
function createTestContext(input: Record<string, unknown>): AgentExecutionContext {
	return {
		input,
		env: {} as Env,
		ctx: {
			waitUntil: () => {},
			passThroughOnException: () => {},
		} as ExecutionContext,
		config: {},
		agentName: 'test-agent',
		ensembleName: 'test-ensemble',
		executionId: 'test-execution-id',
	};
}

describe('Agent Unit Tests', () => {
	describe('Hello Agent', () => {
		it('should return a greeting message', async () => {
			const context = createTestContext({ name: 'Alice' });
			const result = await greet(context);

			expect(result).toBeDefined();
			expect(result.message).toBeDefined();
			expect(typeof result.message).toBe('string');
			expect(result.message).toContain('Alice');
		});

		it('should handle missing name with default', async () => {
			const context = createTestContext({});
			const result = await greet(context);

			expect(result.message).toContain('World');
		});

		it('should support formal style', async () => {
			const context = createTestContext({ name: 'Bob', style: 'formal' });
			const result = await greet(context);

			expect(result.message).toContain('Good day');
			expect(result.message).toContain('Bob');
		});

		it('should support casual style', async () => {
			const context = createTestContext({ name: 'Charlie', style: 'casual' });
			const result = await greet(context);

			expect(result.message).toContain('Hey');
			expect(result.message).toContain('Charlie');
		});

		it('should use friendly style by default', async () => {
			const context = createTestContext({ name: 'Dana' });
			const result = await greet(context);

			expect(result.message).toContain('Hello');
			expect(result.message).toContain('Dana');
		});
	});

	describe('Testing Patterns', () => {
		it('should validate output shape matches schema', async () => {
			// When testing your agents, verify the output matches your agent.yaml schema
			const context = createTestContext({ name: 'Test' });
			const result = await greet(context);

			// The hello agent schema defines: output: { message: string }
			expect(result).toHaveProperty('message');
			expect(typeof result.message).toBe('string');
		});

		it('should handle edge cases gracefully', async () => {
			// Test with empty string
			const emptyContext = createTestContext({ name: '' });
			const emptyResult = await greet(emptyContext);
			expect(emptyResult.message).toBeDefined();

			// Test with special characters (sanitization)
			const specialContext = createTestContext({ name: '<script>alert("xss")</script>' });
			const specialResult = await greet(specialContext);
			expect(specialResult.message).not.toContain('<script>');
		});
	});
});
