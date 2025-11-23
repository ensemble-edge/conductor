import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		// Exclude catalog tests - they are tested separately in their own environments
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'catalog/**/tests/**',
			'**/__integration__/**', // Integration tests run separately
		],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			reportsDirectory: './coverage',
			thresholds: {
				lines: 40,
				functions: 40,
				branches: 35,
				statements: 40,
			},
			exclude: [
				'test/**',
				'tests/**',
				'**/*.spec.ts',
				'**/*.test.ts',
				'**/index.ts',
				'**/*.d.ts',
				'src/platforms/*/examples/**',
				'src/__integration__/**',
				'catalog/**',
				'dist/**',
			],
		},
		testTimeout: 15000,
		hookTimeout: 30000,
	},
});
