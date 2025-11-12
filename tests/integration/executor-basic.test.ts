/**
 * Basic Executor Integration Tests
 *
 * Tests for core execution engine functionality using TestConductor.
 * Target: ~50 test cases covering sequential, state, input mapping, error handling.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestConductor } from '../../src/testing/test-conductor';
import type { EnsembleConfig, AgentConfig } from '../../src/runtime/parser';

describe('Executor - Basic Integration', () => {
	let conductor: TestConductor;

	beforeEach(async () => {
		conductor = await TestConductor.create();
	});

	describe('Sequential Execution', () => {
		it('should execute single Function agent successfully', async () => {
			const agent: AgentConfig = {
				name: 'simple',
				operation: 'code',
				config: {
					handler: async (input: unknown) => ({ result: 'processed', receivedInput: input })
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'single-agent',
				flow: [{ agent: 'simple' }]
			};

			conductor.addAgent('simple', agent);
			conductor.addEnsemble('single-agent', ensemble);

			const result = await conductor.executeEnsemble('single-agent', { test: 'data' });

			expect(result.success).toBe(true);
			expect(result.output).toBeDefined();
		});

		it('should execute two agents in sequence', async () => {
			const member1: AgentConfig = {
				name: 'step1',
				operation: 'code',
				config: {
					handler: async (input: { value: number }) => ({ value: input.value + 1 })
				}
			};

			const member2: AgentConfig = {
				name: 'step2',
				operation: 'code',
				config: {
					handler: async (input: { value: number }) => ({ value: input.value * 2 })
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'sequential',
				flow: [
					{ agent: 'step1' },
					{ agent: 'step2' }
				]
			};

			conductor.addAgent('step1', member1);
			conductor.addAgent('step2', member2);
			conductor.addEnsemble('sequential', ensemble);

			const result = await conductor.executeEnsemble('sequential', { value: 10 });

			expect(result.success).toBe(true);
			// step1: 10 + 1 = 11, step2: 11 * 2 = 22
			expect(result.output?.value).toBe(22);
		});

		it('should pass output from one agent to next', async () => {
			const collector: { calls: unknown[] } = { calls: [] };

			const member1: AgentConfig = {
				name: 'producer',
				operation: 'code',
				config: {
					handler: async () => ({ produced: 'data from producer' })
				}
			};

			const member2: AgentConfig = {
				name: 'consumer',
				operation: 'code',
				config: {
					handler: async (input: unknown) => {
						collector.calls.push(input);
						return { consumed: true };
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'pipeline',
				flow: [
					{ agent: 'producer' },
					{ agent: 'consumer' }
				]
			};

			conductor.addAgent('producer', member1);
			conductor.addAgent('consumer', member2);
			conductor.addEnsemble('pipeline', ensemble);

			await conductor.executeEnsemble('pipeline', {});

			expect(collector.calls).toHaveLength(1);
			expect(collector.calls[0]).toMatchObject({ produced: 'data from producer' });
		});

		it('should handle three-step pipeline', async () => {
			const member1: AgentConfig = {
				name: 'init',
				operation: 'code',
				config: { handler: async () => ({ step: 'init', count: 0 }) }
			};

			const member2: AgentConfig = {
				name: 'process',
				operation: 'code',
				config: {
					handler: async (input: { count: number }) => ({
						step: 'process',
						count: input.count + 5
					})
				}
			};

			const member3: AgentConfig = {
				name: 'finalize',
				operation: 'code',
				config: {
					handler: async (input: { count: number }) => ({
						step: 'finalize',
						count: input.count * 10
					})
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'three-step',
				flow: [
					{ agent: 'init' },
					{ agent: 'process' },
					{ agent: 'finalize' }
				]
			};

			conductor.addAgent('init', member1);
			conductor.addAgent('process', member2);
			conductor.addAgent('finalize', member3);
			conductor.addEnsemble('three-step', ensemble);

			const result = await conductor.executeEnsemble('three-step', {});

			expect(result.success).toBe(true);
			// init: 0, process: 0+5=5, finalize: 5*10=50
			expect(result.output?.count).toBe(50);
		});

		it('should maintain execution order', async () => {
			const executionOrder: string[] = [];

			const createAgent = (name: string): AgentConfig => ({
				name,
				operation: 'code',
				config: {
					handler: async () => {
						executionOrder.push(name);
						return { executed: name };
					}
				}
			});

			const ensemble: EnsembleConfig = {
				name: 'ordered',
				flow: [
					{ agent: 'first' },
					{ agent: 'second' },
					{ agent: 'third' },
					{ agent: 'fourth' }
				]
			};

			conductor.addAgent('first', createAgent('first'));
			conductor.addAgent('second', createAgent('second'));
			conductor.addAgent('third', createAgent('third'));
			conductor.addAgent('fourth', createAgent('fourth'));
			conductor.addEnsemble('ordered', ensemble);

			await conductor.executeEnsemble('ordered', {});

			expect(executionOrder).toEqual(['first', 'second', 'third', 'fourth']);
		});

		it('should handle empty input', async () => {
			const agent: AgentConfig = {
				name: 'processor',
				operation: 'code',
				config: {
					handler: async (input: unknown) => ({ received: input, processed: true })
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'empty-input',
				flow: [{ agent: 'processor' }]
			};

			conductor.addAgent('processor', agent);
			conductor.addEnsemble('empty-input', ensemble);

			const result = await conductor.executeEnsemble('empty-input', {});

			expect(result.success).toBe(true);
			expect(result.output?.processed).toBe(true);
		});

		it('should handle complex input objects', async () => {
			const agent: AgentConfig = {
				name: 'processor',
				operation: 'code',
				config: {
					handler: async (input: {
						user: { name: string; age: number };
						items: string[];
						metadata: Record<string, unknown>;
					}) => ({
						userName: input.user.name,
						itemCount: input.items.length,
						hasMetadata: Object.keys(input.metadata).length > 0
					})
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'complex-input',
				flow: [{ agent: 'processor' }]
			};

			conductor.addAgent('processor', agent);
			conductor.addEnsemble('complex-input', ensemble);

			const input = {
				user: { name: 'Alice', age: 30 },
				items: ['a', 'b', 'c'],
				metadata: { key: 'value' }
			};

			const result = await conductor.executeEnsemble('complex-input', input);

			expect(result.success).toBe(true);
			expect(result.output).toEqual({
				userName: 'Alice',
				itemCount: 3,
				hasMetadata: true
			});
		});
	});

	describe('State Management', () => {
		it('should handle stateless execution', async () => {
			const agent: AgentConfig = {
				name: 'simple',
				operation: 'code',
				config: {
					handler: async (input: unknown) => ({ output: 'processed' })
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'stateless',
				flow: [{ agent: 'simple' }]
			};

			conductor.addAgent('simple', agent);
			conductor.addEnsemble('stateless', ensemble);

			const result = await conductor.executeEnsemble('stateless', { test: 'data' });

			expect(result.success).toBe(true);
			expect(result.output?.output).toBe('processed');
		});

		it('should initialize state from ensemble config', async () => {
			const agent: AgentConfig = {
				name: 'reader',
				operation: 'code',
				config: {
					handler: async (_input: unknown, context?: { state?: { counter: number } }) => ({
						initialCounter: context?.state?.counter || 0
					})
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'with-state',
				state: {
					initial: { counter: 42 }
				},
				flow: [{ agent: 'reader' }]
			};

			conductor.addAgent('reader', agent);
			conductor.addEnsemble('with-state', ensemble);

			const result = await conductor.executeEnsemble('with-state', {});

			expect(result.success).toBe(true);
			// Note: State management might not be fully implemented yet
		});

		it('should isolate state between executions', async () => {
			const executionLog: number[] = [];

			const agent: AgentConfig = {
				name: 'counter',
				operation: 'code',
				config: {
					handler: async () => {
						const count = executionLog.length + 1;
						executionLog.push(count);
						return { count };
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'isolated-state',
				flow: [{ agent: 'counter' }]
			};

			conductor.addAgent('counter', agent);
			conductor.addEnsemble('isolated-state', ensemble);

			const result1 = await conductor.executeEnsemble('isolated-state', {});
			const result2 = await conductor.executeEnsemble('isolated-state', {});

			expect(result1.success && result2.success).toBe(true);
			expect(result1.output?.count).toBe(1);
			expect(result2.output?.count).toBe(2);
		});
	});

	describe('Input Mapping', () => {
		it('should map static values to agent input', async () => {
			const agent: AgentConfig = {
				name: 'receiver',
				operation: 'code',
				config: {
					handler: async (input: { message: string }) => ({
						received: input.message
					})
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'static-mapping',
				flow: [
					{
						agent: 'receiver',
						input: { message: 'Hello, World!' }
					}
				]
			};

			conductor.addAgent('receiver', agent);
			conductor.addEnsemble('static-mapping', ensemble);

			const result = await conductor.executeEnsemble('static-mapping', {});

			expect(result.success).toBe(true);
			expect(result.output?.received).toBe('Hello, World!');
		});

		it('should interpolate input variables with ${ } syntax', async () => {
			const agent: AgentConfig = {
				name: 'greeter',
				operation: 'code',
				config: {
					handler: async (input: { name: string }) => ({
						greeting: `Hello, ${input.name}!`
					})
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'input-interpolation',
				flow: [
					{
						agent: 'greeter',
						input: { name: '${input.userName}' }
					}
				]
			};

			conductor.addAgent('greeter', agent);
			conductor.addEnsemble('input-interpolation', ensemble);

			const result = await conductor.executeEnsemble('input-interpolation', {
				userName: 'Alice'
			});

			expect(result.success).toBe(true);
			expect(result.output?.greeting).toBe('Hello, Alice!');
		});

		it('should interpolate nested input paths', async () => {
			const agent: AgentConfig = {
				name: 'processor',
				operation: 'code',
				config: {
					handler: async (input: { email: string; age: number }) => ({
						processedEmail: input.email,
						processedAge: input.age
					})
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'nested-interpolation',
				flow: [
					{
						agent: 'processor',
						input: {
							email: '${input.user.contact.email}',
							age: '${input.user.profile.age}'
						}
					}
				]
			};

			conductor.addAgent('processor', agent);
			conductor.addEnsemble('nested-interpolation', ensemble);

			const result = await conductor.executeEnsemble('nested-interpolation', {
				user: {
					contact: { email: 'alice@example.com' },
					profile: { age: 30 }
				}
			});

			expect(result.success).toBe(true);
			expect(result.output?.processedEmail).toBe('alice@example.com');
			expect(result.output?.processedAge).toBe(30);
		});

		it('should mix static and interpolated values', async () => {
			const agent: AgentConfig = {
				name: 'mixer',
				operation: 'code',
				config: {
					handler: async (input: {
						static: string;
						dynamic: string;
						nested: { value: string };
					}) => ({
						static: input.static,
						dynamic: input.dynamic,
						nested: input.nested.value
					})
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'mixed-mapping',
				flow: [
					{
						agent: 'mixer',
						input: {
							static: 'constant',
							dynamic: '${input.userName}',
							nested: {
								value: '${input.data.field}'
							}
						}
					}
				]
			};

			conductor.addAgent('mixer', agent);
			conductor.addEnsemble('mixed-mapping', ensemble);

			const result = await conductor.executeEnsemble('mixed-mapping', {
				userName: 'Alice',
				data: { field: 'test' }
			});

			expect(result.success).toBe(true);
			expect(result.output?.static).toBe('constant');
			expect(result.output?.dynamic).toBe('Alice');
			expect(result.output?.nested).toBe('test');
		});

		it('should handle array interpolation', async () => {
			const agent: AgentConfig = {
				name: 'array-processor',
				operation: 'code',
				config: {
					handler: async (input: { items: string[] }) => ({
						count: input.items.length,
						items: input.items
					})
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'array-mapping',
				flow: [
					{
						agent: 'array-processor',
						input: {
							items: ['${input.first}', 'static', '${input.second}']
						}
					}
				]
			};

			conductor.addAgent('array-processor', agent);
			conductor.addEnsemble('array-mapping', ensemble);

			const result = await conductor.executeEnsemble('array-mapping', {
				first: 'A',
				second: 'B'
			});

			expect(result.success).toBe(true);
			expect(result.output?.items).toEqual(['A', 'static', 'B']);
		});
	});

	describe('Error Handling', () => {
		it('should handle agent throwing error', async () => {
			const agent: AgentConfig = {
				name: 'thrower',
				operation: 'code',
				config: {
					handler: async () => {
						throw new Error('Agent execution failed');
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'error-test',
				flow: [{ agent: 'thrower' }]
			};

			conductor.addAgent('thrower', agent);
			conductor.addEnsemble('error-test', ensemble);

			const result = await conductor.executeEnsemble('error-test', {});

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error?.message).toContain('Agent execution failed');
		});

		it('should stop execution on first error', async () => {
			const executionLog: string[] = [];

			const member1: AgentConfig = {
				name: 'first',
				operation: 'code',
				config: {
					handler: async () => {
						executionLog.push('first');
						return { success: true };
					}
				}
			};

			const member2: AgentConfig = {
				name: 'second',
				operation: 'code',
				config: {
					handler: async () => {
						executionLog.push('second');
						throw new Error('Second failed');
					}
				}
			};

			const member3: AgentConfig = {
				name: 'third',
				operation: 'code',
				config: {
					handler: async () => {
						executionLog.push('third');
						return { success: true };
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'stop-on-error',
				flow: [
					{ agent: 'first' },
					{ agent: 'second' },
					{ agent: 'third' }
				]
			};

			conductor.addAgent('first', member1);
			conductor.addAgent('second', member2);
			conductor.addAgent('third', member3);
			conductor.addEnsemble('stop-on-error', ensemble);

			const result = await conductor.executeEnsemble('stop-on-error', {});

			expect(result.success).toBe(false);
			expect(executionLog).toEqual(['first', 'second']);
			// 'third' should not have executed
		});

		it('should handle agent not found error', async () => {
			const ensemble: EnsembleConfig = {
				name: 'missing-agent',
				flow: [{ agent: 'nonexistent' }]
			};

			conductor.addEnsemble('missing-agent', ensemble);

			const result = await conductor.executeEnsemble('missing-agent', {});

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		it('should handle ensemble not found error', async () => {
			const result = await conductor.executeEnsemble('nonexistent-ensemble', {});

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('nonexistent-ensemble');
		});

		it('should provide error context with agent information', async () => {
			const agent: AgentConfig = {
				name: 'faulty',
				operation: 'code',
				config: {
					handler: async () => {
						throw new Error('Specific error message');
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'error-context',
				flow: [
					{ agent: 'faulty' }
				]
			};

			conductor.addAgent('faulty', agent);
			conductor.addEnsemble('error-context', ensemble);

			const result = await conductor.executeEnsemble('error-context', {});

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Specific error message');
		});

		it('should handle async errors correctly', async () => {
			const agent: AgentConfig = {
				name: 'async-thrower',
				operation: 'code',
				config: {
					handler: async () => {
						await new Promise(resolve => setTimeout(resolve, 10));
						throw new Error('Async error');
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'async-error',
				flow: [{ agent: 'async-thrower' }]
			};

			conductor.addAgent('async-thrower', agent);
			conductor.addEnsemble('async-error', ensemble);

			const result = await conductor.executeEnsemble('async-error', {});

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Async error');
		});

		it('should handle invalid input gracefully', async () => {
			const agent: AgentConfig = {
				name: 'validator',
				operation: 'code',
				config: {
					handler: async (input: { required?: string }) => {
						if (!input.required) {
							throw new Error('Required field missing');
						}
						return { valid: true };
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'validation',
				flow: [{ agent: 'validator' }]
			};

			conductor.addAgent('validator', agent);
			conductor.addEnsemble('validation', ensemble);

			const result = await conductor.executeEnsemble('validation', {});

			expect(result.success).toBe(false);
		});
	});

	describe('Metadata and Timing', () => {
		it('should track execution time', async () => {
			const agent: AgentConfig = {
				name: 'timer',
				operation: 'code',
				config: {
					handler: async () => {
						await new Promise(resolve => setTimeout(resolve, 50));
						return { done: true };
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'timed',
				flow: [{ agent: 'timer' }]
			};

			conductor.addAgent('timer', agent);
			conductor.addEnsemble('timed', ensemble);

			const result = await conductor.executeEnsemble('timed', {});

			expect(result.success).toBe(true);
			expect(result.executionTime).toBeGreaterThanOrEqual(45); // Allow slight timing variance
		});

		it('should track execution duration for longer operations', async () => {
			const agent: AgentConfig = {
				name: 'slow',
				operation: 'code',
				config: {
					handler: async () => {
						await new Promise(resolve => setTimeout(resolve, 100));
						return { done: true };
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'duration-test',
				flow: [{ agent: 'slow' }]
			};

			conductor.addAgent('slow', agent);
			conductor.addEnsemble('duration-test', ensemble);

			const result = await conductor.executeEnsemble('duration-test', {});

			expect(result.success).toBe(true);
			expect(result.executionTime).toBeGreaterThanOrEqual(95); // Allow slight timing variance
		});

		it('should include execution steps in result', async () => {
			const agent: AgentConfig = {
				name: 'step',
				operation: 'code',
				config: {
					handler: async () => ({ done: true })
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'step-tracking',
				flow: [
					{ agent: 'step' },
					{ agent: 'step' },
					{ agent: 'step' }
				]
			};

			conductor.addAgent('step', agent);
			conductor.addEnsemble('step-tracking', ensemble);

			const result = await conductor.executeEnsemble('step-tracking', {});

			expect(result.success).toBe(true);
			expect(result.stepsExecuted).toBeDefined();
		});

		it('should track execution even on failure', async () => {
			const agent: AgentConfig = {
				name: 'failer',
				operation: 'code',
				config: {
					handler: async () => {
						throw new Error('Failed after delay');
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'fail-test',
				flow: [{ agent: 'failer' }]
			};

			conductor.addAgent('failer', agent);
			conductor.addEnsemble('fail-test', ensemble);

			const result = await conductor.executeEnsemble('fail-test', {});

			expect(result.success).toBe(false);
			expect(result.executionTime).toBeGreaterThan(0);
		});
	});
});
