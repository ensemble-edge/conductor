/**
 * Custom Vitest Matchers for Conductor Testing
 */

import type { TestExecutionResult } from './types';
import { expect } from 'vitest';

// Type declarations for custom matchers
export interface CustomMatchers<R = unknown> {
	toBeSuccessful(): R;
	toHaveFailed(): R;
	toHaveExecutedMember(memberName: string): R;
	toHaveExecutedSteps(count: number): R;
	toHaveCompletedIn(ms: number): R;
	toHaveState(key: string, value?: unknown): R;
	toHaveCalledAI(memberName?: string): R;
	toHaveUsedTokens(count: number): R;
	toHaveCostLessThan(dollars: number): R;
	toHaveOutput(expected: unknown): R;
	toMatchOutputShape(shape: Record<string, unknown>): R;
}

/**
 * Check if execution was successful
 */
export function toBeSuccessful(received: TestExecutionResult) {
	const pass = received.success === true && !received.error;
	return {
		pass,
		message: () =>
			pass
				? 'Expected execution to have failed but it succeeded'
				: `Expected execution to succeed but it failed with: ${received.error?.message || 'unknown error'}`
	};
}

/**
 * Check if execution failed
 */
export function toHaveFailed(received: TestExecutionResult) {
	const pass = received.success === false || !!received.error;
	return {
		pass,
		message: () =>
			pass
				? 'Expected execution to succeed but it failed'
				: 'Expected execution to have failed but it succeeded'
	};
}

/**
 * Check if a specific member was executed
 */
export function toHaveExecutedMember(received: TestExecutionResult, memberName: string) {
	const executedMembers = received.stepsExecuted.map(s => s.member);
	const pass = executedMembers.includes(memberName);

	return {
		pass,
		message: () =>
			pass
				? `Expected ${memberName} not to be executed`
				: `Expected ${memberName} to be executed. Executed members: ${executedMembers.join(', ') || 'none'}`
	};
}

/**
 * Check if a specific number of steps were executed
 */
export function toHaveExecutedSteps(received: TestExecutionResult, count: number) {
	const actualCount = received.stepsExecuted.length;
	const pass = actualCount === count;

	return {
		pass,
		message: () =>
			pass
				? `Expected not to have executed ${count} steps`
				: `Expected ${count} steps to be executed, but ${actualCount} were executed`
	};
}

/**
 * Check if execution completed within a time limit
 */
export function toHaveCompletedIn(received: TestExecutionResult, ms: number) {
	const pass = received.executionTime <= ms;

	return {
		pass,
		message: () =>
			pass
				? `Expected execution to take more than ${ms}ms but it took ${received.executionTime}ms`
				: `Expected execution to complete in ${ms}ms but it took ${received.executionTime}ms`
	};
}

/**
 * Check if state contains a key with optional value check
 */
export function toHaveState(
	received: TestExecutionResult,
	key: string,
	value?: unknown
) {
	const lastState = received.stateHistory[received.stateHistory.length - 1];
	if (!lastState) {
		return {
			pass: false,
			message: () => 'No state history available'
		};
	}

	const hasKey = key in lastState.state;
	const pass = hasKey && (value === undefined || lastState.state[key] === value);

	return {
		pass,
		message: () => {
			if (!hasKey) {
				return `Expected state to have key '${key}'`;
			}
			if (value !== undefined) {
				return `Expected state['${key}'] to be ${JSON.stringify(value)} but got ${JSON.stringify(lastState.state[key])}`;
			}
			return `Expected state not to have key '${key}'`;
		}
	};
}

/**
 * Check if AI was called (optionally for a specific member)
 */
export function toHaveCalledAI(received: TestExecutionResult, memberName?: string) {
	const aiCalls = memberName
		? received.aiCalls.filter(call => call.member === memberName)
		: received.aiCalls;

	const pass = aiCalls.length > 0;

	return {
		pass,
		message: () => {
			if (memberName) {
				return pass
					? `Expected AI not to be called for member '${memberName}'`
					: `Expected AI to be called for member '${memberName}' but it wasn't`;
			}
			return pass
				? 'Expected AI not to be called'
				: 'Expected AI to be called but it wasn\'t';
		}
	};
}

/**
 * Check if a certain number of tokens were used
 */
export function toHaveUsedTokens(received: TestExecutionResult, count: number) {
	const totalTokens = received.aiCalls.reduce(
		(sum, call) => sum + (call.usage?.totalTokens || 0),
		0
	);
	const pass = totalTokens >= count;

	return {
		pass,
		message: () =>
			pass
				? `Expected to use less than ${count} tokens but used ${totalTokens}`
				: `Expected to use at least ${count} tokens but only used ${totalTokens}`
	};
}

/**
 * Check if execution cost is below a threshold
 */
export function toHaveCostLessThan(received: TestExecutionResult, dollars: number) {
	const totalCost = received.aiCalls.reduce(
		(sum, call) => sum + (call.estimatedCost || 0),
		0
	);
	const pass = totalCost < dollars;

	return {
		pass,
		message: () =>
			pass
				? `Expected cost to be at least $${dollars} but was $${totalCost.toFixed(4)}`
				: `Expected cost to be less than $${dollars} but was $${totalCost.toFixed(4)}`
	};
}

/**
 * Check if output matches expected value
 */
export function toHaveOutput(received: TestExecutionResult, expected: unknown) {
	const pass = JSON.stringify(received.output) === JSON.stringify(expected);

	return {
		pass,
		message: () =>
			pass
				? 'Expected output not to match'
				: `Expected output to match:\n${JSON.stringify(expected, null, 2)}\n\nReceived:\n${JSON.stringify(received.output, null, 2)}`
	};
}

/**
 * Check if output matches a shape (partial match)
 */
export function toMatchOutputShape(
	received: TestExecutionResult,
	shape: Record<string, unknown>
) {
	if (!received.output || typeof received.output !== 'object') {
		return {
			pass: false,
			message: () => `Expected output to be an object but got ${typeof received.output}`
		};
	}

	const output = received.output as Record<string, unknown>;
	const missingKeys: string[] = [];
	const mismatchedTypes: string[] = [];

	for (const [key, expectedType] of Object.entries(shape)) {
		if (!(key in output)) {
			missingKeys.push(key);
		} else if (typeof output[key] !== typeof expectedType) {
			mismatchedTypes.push(
				`${key} (expected ${typeof expectedType}, got ${typeof output[key]})`
			);
		}
	}

	const pass = missingKeys.length === 0 && mismatchedTypes.length === 0;

	return {
		pass,
		message: () => {
			if (missingKeys.length > 0) {
				return `Output is missing keys: ${missingKeys.join(', ')}`;
			}
			if (mismatchedTypes.length > 0) {
				return `Output has type mismatches: ${mismatchedTypes.join(', ')}`;
			}
			return 'Output shape matches';
		}
	};
}

/**
 * Register all custom matchers with Vitest
 */
export function registerMatchers() {
	expect.extend({
		toBeSuccessful,
		toHaveFailed,
		toHaveExecutedMember,
		toHaveExecutedSteps,
		toHaveCompletedIn,
		toHaveState,
		toHaveCalledAI,
		toHaveUsedTokens,
		toHaveCostLessThan,
		toHaveOutput,
		toMatchOutputShape
	});
}
