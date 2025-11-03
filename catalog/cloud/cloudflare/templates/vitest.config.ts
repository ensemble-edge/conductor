/**
 * Vitest Configuration for Conductor Project
 *
 * Pre-configured for testing Conductor ensembles and members.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['tests/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			include: [
				'members/**/*.ts',
				'src/**/*.ts'
			],
			exclude: [
				'tests/**',
				'**/*.test.ts',
				'**/*.spec.ts',
				'node_modules/**',
				'dist/**'
			],
			thresholds: {
				lines: 70,
				functions: 70,
				branches: 65,
				statements: 70
			}
		}
	}
});
