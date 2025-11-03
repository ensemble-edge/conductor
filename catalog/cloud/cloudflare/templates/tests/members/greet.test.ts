/**
 * Example Member Test
 *
 * This demonstrates how to test Conductor members in your project.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestConductor, registerMatchers } from '@ensemble-edge/conductor/testing';

// Register custom matchers
registerMatchers();

describe('Greet Member', () => {
	let conductor: TestConductor;

	beforeEach(async () => {
		// Create test conductor with mocked AI responses
		conductor = await TestConductor.create({
			projectPath: '.',
			mocks: {
				ai: {
					greet: {
						message: 'Hello, Alice! Welcome to Conductor. Great to have you here!'
					}
				}
			}
		});
	});

	afterEach(async () => {
		await conductor.cleanup();
	});

	it('should greet user by name', async () => {
		// Mock AI response for this specific test
		conductor.mockAI('greet', {
			message: 'Hello, Alice! Nice to meet you!'
		});

		const result = await conductor.executeMember('greet', {
			name: 'Alice',
			style: 'friendly'
		});

		expect(result.output).toBeDefined();
		expect(result.output).toHaveProperty('message');
		expect(result.output.message).toContain('Alice');
	});

	it('should handle formal style', async () => {
		conductor.mockAI('greet', {
			message: 'Good day, Bob. It is a pleasure to make your acquaintance.'
		});

		const result = await conductor.executeMember('greet', {
			name: 'Bob',
			style: 'formal'
		});

		expect(result.output.message).toContain('Bob');
		expect(result.executionTime).toBeLessThan(1000);
	});

	it('should handle casual style', async () => {
		conductor.mockAI('greet', {
			message: 'Hey Charlie! Great to see you!'
		});

		const result = await conductor.executeMember('greet', {
			name: 'Charlie',
			style: 'casual'
		});

		expect(result.output.message).toContain('Charlie');
	});

	it('should handle different languages', async () => {
		conductor.mockAI('greet', {
			message: 'Bonjour, Marie! Bienvenue chez Conductor!'
		});

		const result = await conductor.executeMember('greet', {
			name: 'Marie',
			language: 'fr'
		});

		expect(result.output.message).toContain('Marie');
	});

	it('should handle AI provider errors gracefully', async () => {
		// Mock an AI error
		conductor.mockAI('greet', new Error('AI service unavailable'));

		await expect(async () => {
			await conductor.executeMember('greet', { name: 'Alice' });
		}).rejects.toThrow('AI service unavailable');
	});

	it('should complete within reasonable time', async () => {
		conductor.mockAI('greet', {
			message: 'Hello, Alice!'
		});

		const result = await conductor.executeMember('greet', { name: 'Alice' });

		expect(result.executionTime).toBeLessThan(500);
	});
});
