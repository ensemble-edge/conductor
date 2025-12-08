/**
 * Ensemble Integration Tests
 *
 * This file demonstrates how to test ensemble workflows.
 * Unlike agent tests (which test functions directly), ensemble tests
 * verify the orchestration of multiple agents working together.
 *
 * Key patterns shown:
 * - Setting up Executor and MemberLoader
 * - Registering agents for testing
 * - Executing ensembles with different inputs
 * - Validating flow execution and outputs
 */

import { describe, it, expect } from 'vitest';
import { Executor, MemberLoader } from '@ensemble-edge/conductor';
import type { AgentConfig } from '@ensemble-edge/conductor';
import { stringify as stringifyYAML } from 'yaml';

// Import the hello agent and its config
import helloConfig from '../../agents/examples/hello/agent.yaml';
import helloFunction from '../../agents/examples/hello';

// Import the hello-world ensemble
import helloWorldYAML from '../../ensembles/hello-world.yaml';

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
 * Helper to set up executor with the hello agent registered
 */
function createExecutorWithHello() {
	const { env, ctx } = createTestEnv();
	const executor = new Executor({ env, ctx });
	const loader = new MemberLoader({ env, ctx });

	// Register the hello agent
	const helloMember = loader.registerAgent(helloConfig as AgentConfig, helloFunction);
	executor.registerAgent(helloMember);

	return { executor, loader, env, ctx };
}

describe('Ensemble Integration Tests', () => {
	describe('Hello World Ensemble', () => {
		it('should execute successfully with valid input', async () => {
			const { executor } = createExecutorWithHello();

			const result = await executor.executeFromYAML(stringifyYAML(helloWorldYAML), {
				name: 'World',
			});

			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.value.output).toBeDefined();
			expect((result.value.output as { greeting: string }).greeting).toContain('Hello');
		});

		it('should pass input variables to agents', async () => {
			const { executor } = createExecutorWithHello();

			const result = await executor.executeFromYAML(stringifyYAML(helloWorldYAML), {
				name: 'CustomName',
				style: 'formal',
			});

			expect(result.success).toBe(true);
			if (!result.success) return;

			// The greeting should include the custom name
			const output = result.value.output as { greeting: string };
			expect(output.greeting).toContain('CustomName');
		});

		it('should track agent execution metrics', async () => {
			const { executor } = createExecutorWithHello();

			const result = await executor.executeFromYAML(stringifyYAML(helloWorldYAML), {
				name: 'MetricsTest',
			});

			expect(result.success).toBe(true);
			if (!result.success) return;

			// Check execution metrics
			expect(result.value.metrics).toBeDefined();
			expect(result.value.metrics.agents).toHaveLength(1);
			expect(result.value.metrics.agents[0].name).toBe('hello');
			expect(result.value.metrics.agents[0].success).toBe(true);
		});
	});

	describe('Custom Ensemble from YAML String', () => {
		it('should execute an inline ensemble definition', async () => {
			const { executor } = createExecutorWithHello();

			// Define a simple ensemble inline for testing
			const customEnsemble = `
name: custom-test
flow:
  - agent: hello
    input:
      name: InlineTest
      style: casual
output:
  greeting: \${hello.output.message}
`;

			const result = await executor.executeFromYAML(customEnsemble, {});

			expect(result.success).toBe(true);
			if (!result.success) return;

			const output = result.value.output as { greeting: string };
			expect(output.greeting).toContain('InlineTest');
			expect(output.greeting).toContain('Hey'); // casual style
		});

		it('should support variable interpolation in output', async () => {
			const { executor } = createExecutorWithHello();

			const ensembleWithMetadata = `
name: metadata-test
flow:
  - agent: hello
    input:
      name: \${input.userName}
output:
  greeting: \${hello.output.message}
  requestedBy: \${input.userName}
  timestamp: "2024-01-01"
`;

			const result = await executor.executeFromYAML(ensembleWithMetadata, {
				userName: 'Alice',
			});

			expect(result.success).toBe(true);
			if (!result.success) return;

			const output = result.value.output as {
				greeting: string;
				requestedBy: string;
				timestamp: string;
			};
			expect(output.greeting).toContain('Alice');
			expect(output.requestedBy).toBe('Alice');
			expect(output.timestamp).toBe('2024-01-01');
		});
	});

	describe('Testing Patterns', () => {
		it('should complete within reasonable time', async () => {
			const { executor } = createExecutorWithHello();

			const startTime = Date.now();
			const result = await executor.executeFromYAML(stringifyYAML(helloWorldYAML), {
				name: 'PerformanceTest',
			});
			const duration = Date.now() - startTime;

			expect(result.success).toBe(true);
			expect(duration).toBeLessThan(1000); // Should complete in under 1 second
		});

		it('should handle multiple sequential executions', async () => {
			const { executor } = createExecutorWithHello();

			// Execute same ensemble multiple times
			const results = await Promise.all([
				executor.executeFromYAML(stringifyYAML(helloWorldYAML), { name: 'First' }),
				executor.executeFromYAML(stringifyYAML(helloWorldYAML), { name: 'Second' }),
				executor.executeFromYAML(stringifyYAML(helloWorldYAML), { name: 'Third' }),
			]);

			// All should succeed
			expect(results.every((r) => r.success)).toBe(true);

			// Each should have different output
			const outputs = results.map((r) => r.success && (r.value.output as { greeting: string }).greeting);
			expect(outputs[0]).toContain('First');
			expect(outputs[1]).toContain('Second');
			expect(outputs[2]).toContain('Third');
		});
	});
});
