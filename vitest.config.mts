import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: './wrangler.jsonc' },
			},
		},
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
		testTimeout: 15000, // 15 seconds for Worker operations
		hookTimeout: 30000,
	},
});
