import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		// ONLY run integration tests
		include: ['src/__integration__/**/*.test.ts'],
		exclude: ['**/node_modules/**', '**/dist/**'],
		// Integration tests need longer timeouts
		testTimeout: 120000, // 2 minutes per test
		hookTimeout: 600000, // 10 minutes for setup/teardown
		// Run tests sequentially to avoid port conflicts
		threads: false,
		// Don't bail on first failure - run all tests
		bail: 0,
	},
})
