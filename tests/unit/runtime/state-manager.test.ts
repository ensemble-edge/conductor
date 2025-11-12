/**
 * StateManager Tests
 *
 * Tests immutable state management with access tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '../../../src/runtime/state-manager';
import type { StateConfig, MemberStateConfig } from '../../../src/runtime/state-manager';

describe('StateManager', () => {
	describe('Constructor and Initialization', () => {
		it('should initialize with empty state', () => {
			const config: StateConfig = {};
			const manager = new StateManager(config);

			const state = manager.getState();
			expect(state).toEqual({});
		});

		it('should initialize with initial state', () => {
			const config: StateConfig = {
				initial: {
					counter: 0,
					name: 'test',
					items: [],
				},
			};

			const manager = new StateManager(config);
			const state = manager.getState();

			expect(state.counter).toBe(0);
			expect(state.name).toBe('test');
			expect(state.items).toEqual([]);
		});

		it('should freeze initial state (immutability)', () => {
			const config: StateConfig = {
				initial: { count: 0 },
			};

			const manager = new StateManager(config);
			const state = manager.getState();

			expect(Object.isFrozen(state)).toBe(true);
		});

		it('should accept schema', () => {
			const config: StateConfig = {
				schema: {
					counter: 'number',
					name: 'string',
				},
				initial: {
					counter: 0,
					name: 'test',
				},
			};

			const manager = new StateManager(config);
			expect(manager).toBeDefined();
		});
	});

	describe('Agent State Access', () => {
		it('should provide read access to declared keys', () => {
			const config: StateConfig = {
				initial: {
					counter: 10,
					name: 'Alice',
					secret: 'hidden',
				},
			};

			const manager = new StateManager(config);
			const agentConfig: MemberStateConfig = {
				use: ['counter', 'name'],
			};

			const { context } = manager.getStateForAgent('test-agent', agentConfig);

			expect(context.state.counter).toBe(10);
			expect(context.state.name).toBe('Alice');
			expect(context.state.secret).toBeUndefined(); // Not in 'use' array
		});

		it('should handle empty use array', () => {
			const config: StateConfig = {
				initial: { value: 42 },
			};

			const manager = new StateManager(config);
			const { context } = manager.getStateForAgent('test-agent', {});

			expect(context.state).toEqual({});
		});

		it('should freeze agent state view', () => {
			const config: StateConfig = {
				initial: { counter: 0 },
			};

			const manager = new StateManager(config);
			const { context } = manager.getStateForAgent('test-agent', {
				use: ['counter'],
			});

			expect(Object.isFrozen(context.state)).toBe(true);
		});
	});

	describe('State Updates with getPendingUpdates', () => {
		it('should accumulate pending updates', () => {
			const config: StateConfig = {
				initial: { counter: 0, name: 'test' },
			};

			const manager = new StateManager(config);
			const { context, getPendingUpdates } = manager.getStateForAgent('test-agent', {
				set: ['counter'],
			});

			context.setState({ counter: 5 });
			const { updates } = getPendingUpdates();

			expect(updates.counter).toBe(5);
		});

		it('should apply pending updates and return new manager', () => {
			const config: StateConfig = {
				initial: { counter: 0 },
			};

			const manager1 = new StateManager(config);
			const { context, getPendingUpdates } = manager1.getStateForAgent('test-agent', {
				set: ['counter'],
			});

			context.setState({ counter: 10 });
			const { updates, newLog } = getPendingUpdates();

			const manager2 = manager1.applyPendingUpdates(updates, newLog);

			expect(manager1.getState().counter).toBe(0); // Original unchanged
			expect(manager2.getState().counter).toBe(10); // New manager has update
		});

		it('should accumulate multiple updates', () => {
			const config: StateConfig = {
				initial: { a: 1, b: 2, c: 3 },
			};

			const manager = new StateManager(config);
			const { context, getPendingUpdates } = manager.getStateForAgent('test-agent', {
				set: ['a', 'b', 'c'],
			});

			context.setState({ a: 10 });
			context.setState({ b: 20 });
			context.setState({ c: 30 });

			const { updates } = getPendingUpdates();

			expect(updates).toEqual({ a: 10, b: 20, c: 30 });
		});

		it('should only update declared keys', () => {
			const config: StateConfig = {
				initial: { allowed: 0, blocked: 0 },
			};

			const manager = new StateManager(config);
			const { context, getPendingUpdates } = manager.getStateForAgent('test-agent', {
				set: ['allowed'],
			});

			context.setState({ allowed: 10, blocked: 20 });
			const { updates } = getPendingUpdates();

			expect(updates.allowed).toBe(10);
			expect(updates.blocked).toBeUndefined();
		});
	});

	describe('State Updates with setStateFromMember', () => {
		it('should update state and return new manager', () => {
			const config: StateConfig = {
				initial: { counter: 0 },
			};

			const manager1 = new StateManager(config);
			const manager2 = manager1.setStateFromMember(
				'test-agent',
				{ counter: 5 },
				{ set: ['counter'] }
			);

			expect(manager1.getState().counter).toBe(0); // Original unchanged
			expect(manager2.getState().counter).toBe(5); // New manager has update
		});

		it('should only update declared keys', () => {
			const config: StateConfig = {
				initial: { allowed: 0, blocked: 0 },
			};

			const manager1 = new StateManager(config);
			const manager2 = manager1.setStateFromMember(
				'test-agent',
				{ allowed: 10, blocked: 20 },
				{ set: ['allowed'] }
			);

			expect(manager2.getState().allowed).toBe(10);
			expect(manager2.getState().blocked).toBe(0); // Unchanged
		});

		it('should maintain immutability across updates', () => {
			const config: StateConfig = {
				initial: { value: 1 },
			};

			const m1 = new StateManager(config);
			const m2 = m1.setStateFromMember('member1', { value: 2 }, { set: ['value'] });
			const m3 = m2.setStateFromMember('member2', { value: 3 }, { set: ['value'] });

			expect(m1.getState().value).toBe(1);
			expect(m2.getState().value).toBe(2);
			expect(m3.getState().value).toBe(3);
		});
	});

	describe('Access Tracking', () => {
		it('should track read access', () => {
			const config: StateConfig = {
				initial: { counter: 10 },
			};

			const manager = new StateManager(config);
			const { getPendingUpdates } = manager.getStateForAgent('member1', { use: ['counter'] });

			// Apply pending updates to capture the access log
			const { newLog } = getPendingUpdates();
			const manager2 = manager.applyPendingUpdates({}, newLog);

			const report = manager2.getAccessReport();
			const member1Access = report.accessPatterns['member1'];

			expect(member1Access).toBeDefined();
			expect(member1Access).toHaveLength(1);
			expect(member1Access[0].operation).toBe('read');
			expect(member1Access[0].key).toBe('counter');
			expect(member1Access[0].agent).toBe('member1');
		});

		it('should track write access', () => {
			const config: StateConfig = {
				initial: { counter: 0 },
			};

			const manager1 = new StateManager(config);
			const manager2 = manager1.setStateFromMember(
				'member1',
				{ counter: 5 },
				{ set: ['counter'] }
			);

			const report = manager2.getAccessReport();
			const member1Access = report.accessPatterns['member1'];

			expect(member1Access).toBeDefined();
			expect(member1Access).toHaveLength(1);
			expect(member1Access[0].operation).toBe('write');
			expect(member1Access[0].key).toBe('counter');
			expect(member1Access[0].agent).toBe('member1');
		});

		it('should track multiple accesses', () => {
			const config: StateConfig = {
				initial: { value: 0 },
			};

			let manager = new StateManager(config);

			// Member1 reads
			const { getPendingUpdates: getPending1 } = manager.getStateForAgent('member1', { use: ['value'] });
			const { newLog: log1 } = getPending1();
			manager = manager.applyPendingUpdates({}, log1);

			// Member2 writes
			manager = manager.setStateFromMember('member2', { value: 10 }, { set: ['value'] });

			// Member3 reads
			const { getPendingUpdates: getPending3 } = manager.getStateForAgent('member3', { use: ['value'] });
			const { newLog: log3 } = getPending3();
			manager = manager.applyPendingUpdates({}, log3);

			const report = manager.getAccessReport();

			// Check member1's access
			const member1Access = report.accessPatterns['member1'];
			expect(member1Access).toBeDefined();
			expect(member1Access).toHaveLength(1);
			expect(member1Access[0].key).toBe('value');
			expect(member1Access[0].operation).toBe('read');

			// Check member2's access
			const member2Access = report.accessPatterns['member2'];
			expect(member2Access).toBeDefined();
			expect(member2Access).toHaveLength(1);
			expect(member2Access[0].key).toBe('value');
			expect(member2Access[0].operation).toBe('write');

			// Check member3's access
			const member3Access = report.accessPatterns['member3'];
			expect(member3Access).toBeDefined();
			expect(member3Access).toHaveLength(1);
			expect(member3Access[0].key).toBe('value');
			expect(member3Access[0].operation).toBe('read');
		});

		it('should identify unused keys', () => {
			const config: StateConfig = {
				initial: {
					used: 0,
					unused: 0,
				},
			};

			const manager = new StateManager(config);
			const { getPendingUpdates } = manager.getStateForAgent('member1', { use: ['used'] });

			// Apply pending updates to capture the access log
			const { newLog } = getPendingUpdates();
			const manager2 = manager.applyPendingUpdates({}, newLog);

			const report = manager2.getAccessReport();

			expect(report.unusedKeys).toContain('unused');
			expect(report.unusedKeys).not.toContain('used');
		});
	});

	describe('Complex Scenarios', () => {
		it('should handle workflow with multiple agents', () => {
			const config: StateConfig = {
				initial: {
					step1Result: null,
					step2Result: null,
					finalResult: null,
				},
			};

			let manager = new StateManager(config);

			// Step 1: Agent writes step1Result
			manager = manager.setStateFromMember(
				'step1',
				{ step1Result: 'data1' },
				{ set: ['step1Result'] }
			);

			// Step 2: Agent reads step1Result, writes step2Result
			const { context: ctx2 } = manager.getStateForAgent('step2', {
				use: ['step1Result'],
				set: ['step2Result'],
			});
			expect(ctx2.state.step1Result).toBe('data1');

			manager = manager.setStateFromMember(
				'step2',
				{ step2Result: 'data2' },
				{ set: ['step2Result'] }
			);

			// Step 3: Agent reads all, writes finalResult
			const { context: ctx3 } = manager.getStateForAgent('step3', {
				use: ['step1Result', 'step2Result'],
				set: ['finalResult'],
			});

			expect(ctx3.state.step1Result).toBe('data1');
			expect(ctx3.state.step2Result).toBe('data2');
		});

		it('should handle parallel updates with pending updates', () => {
			const config: StateConfig = {
				initial: { a: 0, b: 0 },
			};

			const manager = new StateManager(config);

			// Two agents update different keys
			const { context: ctx1, getPendingUpdates: get1 } = manager.getStateForAgent('member1', {
				set: ['a'],
			});
			const { context: ctx2, getPendingUpdates: get2 } = manager.getStateForAgent('member2', {
				set: ['b'],
			});

			ctx1.setState({ a: 10 });
			ctx2.setState({ b: 20 });

			// Apply both updates
			let updated = manager.applyPendingUpdates(...Object.values(get1()));
			updated = updated.applyPendingUpdates(...Object.values(get2()));

			expect(updated.getState().a).toBe(10);
			expect(updated.getState().b).toBe(20);
		});

		it('should maintain state consistency through chain of updates', () => {
			const config: StateConfig = {
				initial: { count: 0 },
			};

			const managers = [new StateManager(config)];

			// Chain 10 updates
			for (let i = 1; i <= 10; i++) {
				const prev = managers[i - 1];
				const next = prev.setStateFromMember(
					`agent${i}`,
					{ count: i },
					{ set: ['count'] }
				);
				managers.push(next);
			}

			// Verify each manager has the correct state
			for (let i = 0; i <= 10; i++) {
				expect(managers[i].getState().count).toBe(i);
			}
		});

		it('should optimize when no updates are pending', () => {
			const config: StateConfig = {
				initial: { value: 42 },
			};

			const manager1 = new StateManager(config);
			const manager2 = manager1.applyPendingUpdates({}, []);

			// Should return same instance when no updates
			expect(manager1).toBe(manager2);
		});
	});

	describe('Edge Cases', () => {
		it('should handle accessing non-existent keys', () => {
			const config: StateConfig = {
				initial: { existing: 'value' },
			};

			const manager = new StateManager(config);
			const { context } = manager.getStateForAgent('agent', {
				use: ['nonexistent'],
			});

			expect(context.state.nonexistent).toBeUndefined();
		});

		it('should handle empty updates', () => {
			const config: StateConfig = {
				initial: { value: 1 },
			};

			const manager1 = new StateManager(config);
			const manager2 = manager1.setStateFromMember('agent', {}, { set: ['value'] });

			expect(manager1.getState()).toEqual(manager2.getState());
		});

		it('should handle updating with same value', () => {
			const config: StateConfig = {
				initial: { value: 42 },
			};

			const manager1 = new StateManager(config);
			const manager2 = manager1.setStateFromMember(
				'agent',
				{ value: 42 },
				{ set: ['value'] }
			);

			expect(manager2.getState().value).toBe(42);
		});

		it('should handle complex nested objects', () => {
			const config: StateConfig = {
				initial: {
					user: {
						name: 'Alice',
						profile: {
							age: 30,
							city: 'NYC',
						},
					},
				},
			};

			const manager1 = new StateManager(config);
			const manager2 = manager1.setStateFromMember(
				'agent',
				{
					user: {
						name: 'Bob',
						profile: {
							age: 25,
							city: 'SF',
						},
					},
				},
				{ set: ['user'] }
			);

			expect((manager2.getState().user as any).name).toBe('Bob');
		});
	});
});
