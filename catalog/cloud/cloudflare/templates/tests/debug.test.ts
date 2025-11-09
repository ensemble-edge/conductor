import { describe, it, expect, beforeEach } from 'vitest';
import { TestConductor } from '@ensemble-edge/conductor/testing';

describe('Debug TestConductor', () => {
	let conductor: TestConductor;

	beforeEach(async () => {
		conductor = await TestConductor.create({
			projectPath: '.'
		});
	});

	it('should load members', async () => {
		// @ts-expect-error - accessing private catalog for debugging
		const members = conductor.catalog.members;
		console.log('Loaded members:', Array.from(members.keys()));
		console.log('Members size:', members.size);

		// Try to get greet member
		// @ts-expect-error - accessing private method
		const greetMember = conductor.catalog.members.get('hello');
		console.log('Greet member:', greetMember);

		expect(members.size).toBeGreaterThan(0);
	});
});
