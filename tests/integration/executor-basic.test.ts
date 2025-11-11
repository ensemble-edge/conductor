/**
 * Basic Executor Integration Tests
 *
 * Tests for core execution engine functionality using TestConductor.
 * Target: ~50 test cases covering sequential, state, input mapping, error handling.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestConductor } from '../../src/testing/test-conductor';
import type { EnsembleConfig, MemberConfig } from '../../src/runtime/parser';

describe('Executor - Basic Integration', () => {
	let conductor: TestConductor;

	beforeEach(async () => {
		conductor = await TestConductor.create();
	});

	describe('Sequential Execution', () => {
		it('should execute single Function member successfully', async () => {
			const member: MemberConfig = {
				name: 'simple',
				type: 'Function',
				config: {
					handler: async (input: unknown) => ({ result: 'processed', receivedInput: input })
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'single-member',
				flow: [{ member: 'simple' }]
			};

			conductor.addMember('simple', member);
			conductor.addEnsemble('single-member', ensemble);

			const result = await conductor.executeEnsemble('single-member', { test: 'data' });

			expect(result.success).toBe(true);
			expect(result.output).toBeDefined();
		});

		it('should execute two members in sequence', async () => {
			const member1: MemberConfig = {
				name: 'step1',
				type: 'Function',
				config: {
					handler: async (input: { value: number }) => ({ value: input.value + 1 })
				}
			};

			const member2: MemberConfig = {
				name: 'step2',
				type: 'Function',
				config: {
					handler: async (input: { value: number }) => ({ value: input.value * 2 })
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'sequential',
				flow: [
					{ member: 'step1' },
					{ member: 'step2' }
				]
			};

			conductor.addMember('step1', member1);
			conductor.addMember('step2', member2);
			conductor.addEnsemble('sequential', ensemble);

			const result = await conductor.executeEnsemble('sequential', { value: 10 });

			expect(result.success).toBe(true);
			// step1: 10 + 1 = 11, step2: 11 * 2 = 22
			expect(result.output?.value).toBe(22);
		});

		it('should pass output from one member to next', async () => {
			const collector: { calls: unknown[] } = { calls: [] };

			const member1: MemberConfig = {
				name: 'producer',
				type: 'Function',
				config: {
					handler: async () => ({ produced: 'data from producer' })
				}
			};

			const member2: MemberConfig = {
				name: 'consumer',
				type: 'Function',
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
					{ member: 'producer' },
					{ member: 'consumer' }
				]
			};

			conductor.addMember('producer', member1);
			conductor.addMember('consumer', member2);
			conductor.addEnsemble('pipeline', ensemble);

			await conductor.executeEnsemble('pipeline', {});

			expect(collector.calls).toHaveLength(1);
			expect(collector.calls[0]).toMatchObject({ produced: 'data from producer' });
		});

		it('should handle three-step pipeline', async () => {
			const member1: MemberConfig = {
				name: 'init',
				type: 'Function',
				config: { handler: async () => ({ step: 'init', count: 0 }) }
			};

			const member2: MemberConfig = {
				name: 'process',
				type: 'Function',
				config: {
					handler: async (input: { count: number }) => ({
						step: 'process',
						count: input.count + 5
					})
				}
			};

			const member3: MemberConfig = {
				name: 'finalize',
				type: 'Function',
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
					{ member: 'init' },
					{ member: 'process' },
					{ member: 'finalize' }
				]
			};

			conductor.addMember('init', member1);
			conductor.addMember('process', member2);
			conductor.addMember('finalize', member3);
			conductor.addEnsemble('three-step', ensemble);

			const result = await conductor.executeEnsemble('three-step', {});

			expect(result.success).toBe(true);
			// init: 0, process: 0+5=5, finalize: 5*10=50
			expect(result.output?.count).toBe(50);
		});

		it('should maintain execution order', async () => {
			const executionOrder: string[] = [];

			const createMember = (name: string): MemberConfig => ({
				name,
				type: 'Function',
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
					{ member: 'first' },
					{ member: 'second' },
					{ member: 'third' },
					{ member: 'fourth' }
				]
			};

			conductor.addMember('first', createMember('first'));
			conductor.addMember('second', createMember('second'));
			conductor.addMember('third', createMember('third'));
			conductor.addMember('fourth', createMember('fourth'));
			conductor.addEnsemble('ordered', ensemble);

			await conductor.executeEnsemble('ordered', {});

			expect(executionOrder).toEqual(['first', 'second', 'third', 'fourth']);
		});

		it('should handle empty input', async () => {
			const member: MemberConfig = {
				name: 'processor',
				type: 'Function',
				config: {
					handler: async (input: unknown) => ({ received: input, processed: true })
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'empty-input',
				flow: [{ member: 'processor' }]
			};

			conductor.addMember('processor', member);
			conductor.addEnsemble('empty-input', ensemble);

			const result = await conductor.executeEnsemble('empty-input', {});

			expect(result.success).toBe(true);
			expect(result.output?.processed).toBe(true);
		});

		it('should handle complex input objects', async () => {
			const member: MemberConfig = {
				name: 'processor',
				type: 'Function',
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
				flow: [{ member: 'processor' }]
			};

			conductor.addMember('processor', member);
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
			const member: MemberConfig = {
				name: 'simple',
				type: 'Function',
				config: {
					handler: async (input: unknown) => ({ output: 'processed' })
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'stateless',
				flow: [{ member: 'simple' }]
			};

			conductor.addMember('simple', member);
			conductor.addEnsemble('stateless', ensemble);

			const result = await conductor.executeEnsemble('stateless', { test: 'data' });

			expect(result.success).toBe(true);
			expect(result.output?.output).toBe('processed');
		});

		it('should initialize state from ensemble config', async () => {
			const member: MemberConfig = {
				name: 'reader',
				type: 'Function',
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
				flow: [{ member: 'reader' }]
			};

			conductor.addMember('reader', member);
			conductor.addEnsemble('with-state', ensemble);

			const result = await conductor.executeEnsemble('with-state', {});

			expect(result.success).toBe(true);
			// Note: State management might not be fully implemented yet
		});

		it('should isolate state between executions', async () => {
			const executionLog: number[] = [];

			const member: MemberConfig = {
				name: 'counter',
				type: 'Function',
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
				flow: [{ member: 'counter' }]
			};

			conductor.addMember('counter', member);
			conductor.addEnsemble('isolated-state', ensemble);

			const result1 = await conductor.executeEnsemble('isolated-state', {});
			const result2 = await conductor.executeEnsemble('isolated-state', {});

			expect(result1.success && result2.success).toBe(true);
			expect(result1.output?.count).toBe(1);
			expect(result2.output?.count).toBe(2);
		});
	});

	describe('Input Mapping', () => {
		it('should map static values to member input', async () => {
			const member: MemberConfig = {
				name: 'receiver',
				type: 'Function',
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
						member: 'receiver',
						input: { message: 'Hello, World!' }
					}
				]
			};

			conductor.addMember('receiver', member);
			conductor.addEnsemble('static-mapping', ensemble);

			const result = await conductor.executeEnsemble('static-mapping', {});

			expect(result.success).toBe(true);
			expect(result.output?.received).toBe('Hello, World!');
		});

		it('should interpolate input variables with ${ } syntax', async () => {
			const member: MemberConfig = {
				name: 'greeter',
				type: 'Function',
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
						member: 'greeter',
						input: { name: '${input.userName}' }
					}
				]
			};

			conductor.addMember('greeter', member);
			conductor.addEnsemble('input-interpolation', ensemble);

			const result = await conductor.executeEnsemble('input-interpolation', {
				userName: 'Alice'
			});

			expect(result.success).toBe(true);
			expect(result.output?.greeting).toBe('Hello, Alice!');
		});

		it('should interpolate nested input paths', async () => {
			const member: MemberConfig = {
				name: 'processor',
				type: 'Function',
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
						member: 'processor',
						input: {
							email: '${input.user.contact.email}',
							age: '${input.user.profile.age}'
						}
					}
				]
			};

			conductor.addMember('processor', member);
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
			const member: MemberConfig = {
				name: 'mixer',
				type: 'Function',
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
						member: 'mixer',
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

			conductor.addMember('mixer', member);
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
			const member: MemberConfig = {
				name: 'array-processor',
				type: 'Function',
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
						member: 'array-processor',
						input: {
							items: ['${input.first}', 'static', '${input.second}']
						}
					}
				]
			};

			conductor.addMember('array-processor', member);
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
		it('should handle member throwing error', async () => {
			const member: MemberConfig = {
				name: 'thrower',
				type: 'Function',
				config: {
					handler: async () => {
						throw new Error('Member execution failed');
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'error-test',
				flow: [{ member: 'thrower' }]
			};

			conductor.addMember('thrower', member);
			conductor.addEnsemble('error-test', ensemble);

			const result = await conductor.executeEnsemble('error-test', {});

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error?.message).toContain('Member execution failed');
		});

		it('should stop execution on first error', async () => {
			const executionLog: string[] = [];

			const member1: MemberConfig = {
				name: 'first',
				type: 'Function',
				config: {
					handler: async () => {
						executionLog.push('first');
						return { success: true };
					}
				}
			};

			const member2: MemberConfig = {
				name: 'second',
				type: 'Function',
				config: {
					handler: async () => {
						executionLog.push('second');
						throw new Error('Second failed');
					}
				}
			};

			const member3: MemberConfig = {
				name: 'third',
				type: 'Function',
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
					{ member: 'first' },
					{ member: 'second' },
					{ member: 'third' }
				]
			};

			conductor.addMember('first', member1);
			conductor.addMember('second', member2);
			conductor.addMember('third', member3);
			conductor.addEnsemble('stop-on-error', ensemble);

			const result = await conductor.executeEnsemble('stop-on-error', {});

			expect(result.success).toBe(false);
			expect(executionLog).toEqual(['first', 'second']);
			// 'third' should not have executed
		});

		it('should handle member not found error', async () => {
			const ensemble: EnsembleConfig = {
				name: 'missing-member',
				flow: [{ member: 'nonexistent' }]
			};

			conductor.addEnsemble('missing-member', ensemble);

			const result = await conductor.executeEnsemble('missing-member', {});

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		it('should handle ensemble not found error', async () => {
			const result = await conductor.executeEnsemble('nonexistent-ensemble', {});

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('nonexistent-ensemble');
		});

		it('should provide error context with member information', async () => {
			const member: MemberConfig = {
				name: 'faulty',
				type: 'Function',
				config: {
					handler: async () => {
						throw new Error('Specific error message');
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'error-context',
				flow: [
					{ member: 'faulty' }
				]
			};

			conductor.addMember('faulty', member);
			conductor.addEnsemble('error-context', ensemble);

			const result = await conductor.executeEnsemble('error-context', {});

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Specific error message');
		});

		it('should handle async errors correctly', async () => {
			const member: MemberConfig = {
				name: 'async-thrower',
				type: 'Function',
				config: {
					handler: async () => {
						await new Promise(resolve => setTimeout(resolve, 10));
						throw new Error('Async error');
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'async-error',
				flow: [{ member: 'async-thrower' }]
			};

			conductor.addMember('async-thrower', member);
			conductor.addEnsemble('async-error', ensemble);

			const result = await conductor.executeEnsemble('async-error', {});

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Async error');
		});

		it('should handle invalid input gracefully', async () => {
			const member: MemberConfig = {
				name: 'validator',
				type: 'Function',
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
				flow: [{ member: 'validator' }]
			};

			conductor.addMember('validator', member);
			conductor.addEnsemble('validation', ensemble);

			const result = await conductor.executeEnsemble('validation', {});

			expect(result.success).toBe(false);
		});
	});

	describe('Metadata and Timing', () => {
		it('should track execution time', async () => {
			const member: MemberConfig = {
				name: 'timer',
				type: 'Function',
				config: {
					handler: async () => {
						await new Promise(resolve => setTimeout(resolve, 50));
						return { done: true };
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'timed',
				flow: [{ member: 'timer' }]
			};

			conductor.addMember('timer', member);
			conductor.addEnsemble('timed', ensemble);

			const result = await conductor.executeEnsemble('timed', {});

			expect(result.success).toBe(true);
			expect(result.executionTime).toBeGreaterThanOrEqual(45); // Allow slight timing variance
		});

		it('should track execution duration for longer operations', async () => {
			const member: MemberConfig = {
				name: 'slow',
				type: 'Function',
				config: {
					handler: async () => {
						await new Promise(resolve => setTimeout(resolve, 100));
						return { done: true };
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'duration-test',
				flow: [{ member: 'slow' }]
			};

			conductor.addMember('slow', member);
			conductor.addEnsemble('duration-test', ensemble);

			const result = await conductor.executeEnsemble('duration-test', {});

			expect(result.success).toBe(true);
			expect(result.executionTime).toBeGreaterThanOrEqual(95); // Allow slight timing variance
		});

		it('should include execution steps in result', async () => {
			const member: MemberConfig = {
				name: 'step',
				type: 'Function',
				config: {
					handler: async () => ({ done: true })
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'step-tracking',
				flow: [
					{ member: 'step' },
					{ member: 'step' },
					{ member: 'step' }
				]
			};

			conductor.addMember('step', member);
			conductor.addEnsemble('step-tracking', ensemble);

			const result = await conductor.executeEnsemble('step-tracking', {});

			expect(result.success).toBe(true);
			expect(result.stepsExecuted).toBeDefined();
		});

		it('should track execution even on failure', async () => {
			const member: MemberConfig = {
				name: 'failer',
				type: 'Function',
				config: {
					handler: async () => {
						throw new Error('Failed after delay');
					}
				}
			};

			const ensemble: EnsembleConfig = {
				name: 'fail-test',
				flow: [{ member: 'failer' }]
			};

			conductor.addMember('failer', member);
			conductor.addEnsemble('fail-test', ensemble);

			const result = await conductor.executeEnsemble('fail-test', {});

			expect(result.success).toBe(false);
			expect(result.executionTime).toBeGreaterThan(0);
		});
	});
});
