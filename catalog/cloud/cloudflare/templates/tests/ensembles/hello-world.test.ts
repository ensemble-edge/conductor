/**
 * Example Ensemble Test
 *
 * This demonstrates how to test Conductor ensembles end-to-end.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestConductor, registerMatchers } from '@ensemble-edge/conductor/testing';

// Register custom matchers
registerMatchers();

describe('Hello World Ensemble', () => {
	let conductor: TestConductor;

	beforeEach(async () => {
		conductor = await TestConductor.create({
			projectPath: '.'
		});

		// Mock AI response for the greet member
		conductor.mockAI('hello', {
			message: 'Hello, World! Welcome to Conductor.'
		});
	});

	afterEach(async () => {
		await conductor.cleanup();
	});

	it('should execute successfully with default input', async () => {
		const result = await conductor.executeEnsemble('hello-world', {
			name: 'World'
		});

		// Use custom matchers
		expect(result).toBeSuccessful();
		expect(result).toHaveExecutedMember('hello');
		expect(result).toHaveCompletedIn(1000);
	});

	it('should pass name through to member', async () => {
		conductor.mockAI('hello', {
			message: 'Hello, Alice! Welcome to Conductor.'
		});

		const result = await conductor.executeEnsemble('hello-world', {
			name: 'Alice',
			style: 'friendly'
		});

		expect(result).toBeSuccessful();
		expect(result.output).toHaveProperty('greeting');
		expect(result.output.greeting).toContain('Alice');
	});

	it('should handle formal style', async () => {
		conductor.mockAI('hello', {
			message: 'Good day, Bob. It is a pleasure to make your acquaintance.'
		});

		const result = await conductor.executeEnsemble('hello-world', {
			name: 'Bob',
			style: 'formal'
		});

		expect(result).toBeSuccessful();
		expect(result.output.greeting).toContain('Bob');
	});

	it('should include metadata in output', async () => {
		const result = await conductor.executeEnsemble('hello-world', {
			name: 'Alice'
		});

		expect(result).toBeSuccessful();
		expect(result.output).toHaveProperty('metadata');
		expect(result.output.metadata).toHaveProperty('promptUsed');
		expect(result.output.metadata).toHaveProperty('configUsed');
	});

	it('should execute only the greet member', async () => {
		const result = await conductor.executeEnsemble('hello-world', {
			name: 'Alice'
		});

		expect(result).toBeSuccessful();
		expect(result).toHaveExecutedSteps(1);
		expect(result).toHaveExecutedMember('hello');
	});

	it('should handle AI failures gracefully', async () => {
		conductor.mockAI('hello', new Error('AI service temporarily unavailable'));

		const result = await conductor.executeEnsemble('hello-world', {
			name: 'Alice'
		});

		expect(result).toHaveFailed();
		expect(result.error?.message).toContain('AI service');
	});

	it('should track AI usage', async () => {
		conductor.mockAI('hello', {
			message: 'Hello, Alice!'
		});

		const result = await conductor.executeEnsemble('hello-world', {
			name: 'Alice'
		});

		expect(result).toBeSuccessful();

		// Check AI calls were tracked
		const aiCalls = conductor.getAICalls();
		expect(aiCalls.length).toBeGreaterThan(0);
	});
});
