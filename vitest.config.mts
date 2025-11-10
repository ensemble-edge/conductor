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
				'catalog/**',
				'dist/**',
			],
		},
		testTimeout: 15000,
		hookTimeout: 30000,
	},
});
