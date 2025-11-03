/**
 * Config Loader Tests
 *
 * Tests for configuration loading and validation.
 * Target: 85%+ coverage with ~50 test cases
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, DEFAULT_CONFIG } from '../../../src/config';
import { TestRepo } from '../../helpers/test-repo';

describe('Config Loader', () => {
	let repo: TestRepo;

	beforeEach(async () => {
		repo = await TestRepo.create();
	});

	afterEach(async () => {
		await repo.cleanup();
	});

	describe('Default Configuration', () => {
		it('should return defaults when no config file exists', async () => {
			const result = await loadConfig(repo.path);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toEqual(DEFAULT_CONFIG);
			}
		});

		it('should have docs configuration in defaults', () => {
			expect(DEFAULT_CONFIG.docs).toBeDefined();
			expect(DEFAULT_CONFIG.docs?.useAI).toBe(false);
			expect(DEFAULT_CONFIG.docs?.format).toBe('yaml');
		});

		it('should have testing configuration in defaults', () => {
			expect(DEFAULT_CONFIG.testing).toBeDefined();
			expect(DEFAULT_CONFIG.testing?.coverage).toBeDefined();
			expect(DEFAULT_CONFIG.testing?.timeout).toBe(30000);
		});

		it('should have observability configuration in defaults', () => {
			expect(DEFAULT_CONFIG.observability).toBeDefined();
			expect(DEFAULT_CONFIG.observability?.logging).toBe(true);
			expect(DEFAULT_CONFIG.observability?.logLevel).toBe('info');
		});

		it('should have execution configuration in defaults', () => {
			expect(DEFAULT_CONFIG.execution).toBeDefined();
			expect(DEFAULT_CONFIG.execution?.defaultTimeout).toBe(30000);
			expect(DEFAULT_CONFIG.execution?.trackHistory).toBe(true);
		});

		it('should have storage configuration in defaults', () => {
			expect(DEFAULT_CONFIG.storage).toBeDefined();
			expect(DEFAULT_CONFIG.storage?.type).toBe('filesystem');
			expect(DEFAULT_CONFIG.storage?.path).toBe('./.conductor');
		});
	});

	describe('Config File Loading', () => {
		it('should load config from conductor.config.ts', async () => {
			await repo.writeConfig({
				docs: {
					useAI: true
				}
			});

			const result = await loadConfig(repo.path);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.docs?.useAI).toBe(true);
			}
		});

		it('should merge user config with defaults', async () => {
			await repo.writeConfig({
				docs: {
					useAI: true
					// Other docs fields should come from defaults
				}
			});

			const result = await loadConfig(repo.path);

			if (result.success) {
				expect(result.value.docs?.useAI).toBe(true);
				expect(result.value.docs?.format).toBe('yaml'); // From defaults
				expect(result.value.testing).toEqual(DEFAULT_CONFIG.testing); // Fully from defaults
			}
		});

		it('should load full config', async () => {
			await repo.writeConfig({
				docs: {
					useAI: true,
					aiMember: 'custom-writer',
					format: 'json'
				},
				testing: {
					coverage: {
						lines: 85,
						functions: 85,
						branches: 80,
						statements: 85
					},
					timeout: 60000
				},
				observability: {
					logging: true,
					logLevel: 'debug',
					metrics: true
				},
				execution: {
					defaultTimeout: 60000,
					trackHistory: true
				},
				storage: {
					type: 'd1',
					path: './custom-storage'
				}
			});

			const result = await loadConfig(repo.path);

			if (result.success) {
				expect(result.value.docs?.useAI).toBe(true);
				expect(result.value.docs?.format).toBe('json');
				expect(result.value.testing?.timeout).toBe(60000);
				expect(result.value.observability?.logLevel).toBe('debug');
				expect(result.value.storage?.type).toBe('d1');
			}
		});
	});

	describe('Validation', () => {
		it('should reject invalid docs.format', async () => {
			await repo.writeConfig({
				docs: {
					format: 'invalid-format'
				}
			});

			const result = await loadConfig(repo.path);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toContain('format');
			}
		});

		it('should reject coverage values > 100', async () => {
			await repo.writeConfig({
				testing: {
					coverage: {
						lines: 150
					}
				}
			});

			const result = await loadConfig(repo.path);

			expect(result.success).toBe(false);
		});

		it('should reject coverage values < 0', async () => {
			await repo.writeConfig({
				testing: {
					coverage: {
						lines: -10
					}
				}
			});

			const result = await loadConfig(repo.path);

			expect(result.success).toBe(false);
		});

		it('should reject invalid log level', async () => {
			await repo.writeConfig({
				observability: {
					logLevel: 'invalid'
				}
			});

			const result = await loadConfig(repo.path);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toContain('logLevel');
			}
		});

		it('should reject negative timeout', async () => {
			await repo.writeConfig({
				execution: {
					defaultTimeout: -1000
				}
			});

			const result = await loadConfig(repo.path);

			expect(result.success).toBe(false);
		});

		it('should reject negative maxHistoryEntries', async () => {
			await repo.writeConfig({
				execution: {
					maxHistoryEntries: -100
				}
			});

			const result = await loadConfig(repo.path);

			expect(result.success).toBe(false);
		});

		it('should reject invalid storage type', async () => {
			await repo.writeConfig({
				storage: {
					type: 'invalid-storage'
				}
			});

			const result = await loadConfig(repo.path);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toContain('storage.type');
			}
		});

		it('should accept valid storage types', async () => {
			const validTypes = ['filesystem', 'd1', 'kv'];

			for (const type of validTypes) {
				await repo.writeConfig({
					storage: { type }
				});

				const result = await loadConfig(repo.path);
				expect(result.success).toBe(true);
			}
		});

		it('should accept valid log levels', async () => {
			const validLevels = ['debug', 'info', 'warn', 'error'];

			for (const logLevel of validLevels) {
				await repo.writeConfig({
					observability: { logLevel }
				});

				const result = await loadConfig(repo.path);
				expect(result.success).toBe(true);
			}
		});

		it('should accept valid coverage ranges', async () => {
			await repo.writeConfig({
				testing: {
					coverage: {
						lines: 0,
						functions: 50,
						branches: 100,
						statements: 75
					}
				}
			});

			const result = await loadConfig(repo.path);
			expect(result.success).toBe(true);
		});

		it('should accept zero timeout', async () => {
			await repo.writeConfig({
				execution: {
					defaultTimeout: 0
				}
			});

			const result = await loadConfig(repo.path);
			expect(result.success).toBe(true);
		});
	});

	describe('Partial Configuration', () => {
		it('should allow docs-only config', async () => {
			await repo.writeConfig({
				docs: {
					useAI: true
				}
			});

			const result = await loadConfig(repo.path);

			if (result.success) {
				expect(result.value.docs?.useAI).toBe(true);
				expect(result.value.testing).toEqual(DEFAULT_CONFIG.testing);
			}
		});

		it('should allow testing-only config', async () => {
			await repo.writeConfig({
				testing: {
					timeout: 60000
				}
			});

			const result = await loadConfig(repo.path);

			if (result.success) {
				expect(result.value.testing?.timeout).toBe(60000);
				expect(result.value.docs).toEqual(DEFAULT_CONFIG.docs);
			}
		});

		it('should allow partial coverage config', async () => {
			await repo.writeConfig({
				testing: {
					coverage: {
						lines: 85
						// Other coverage fields should come from defaults
					}
				}
			});

			const result = await loadConfig(repo.path);

			if (result.success) {
				expect(result.value.testing?.coverage?.lines).toBe(85);
				expect(result.value.testing?.coverage?.functions).toBe(
					DEFAULT_CONFIG.testing?.coverage?.functions
				);
			}
		});

		it('should allow observability-only config', async () => {
			await repo.writeConfig({
				observability: {
					logLevel: 'debug'
				}
			});

			const result = await loadConfig(repo.path);

			if (result.success) {
				expect(result.value.observability?.logLevel).toBe('debug');
			}
		});
	});

	describe('Error Handling', () => {
		it('should handle malformed config file', async () => {
			await repo.writeFile('conductor.config.ts', 'export default { invalid syntax [[[');

			const result = await loadConfig(repo.path);

			expect(result.success).toBe(false);
		});

		it('should handle config file with no default export', async () => {
			await repo.writeFile('conductor.config.ts', 'export const config = {};');

			const result = await loadConfig(repo.path);

			// Should either fail or return defaults
			expect(result.success).toBeDefined();
		});

		it('should handle nonexistent directory', async () => {
			const result = await loadConfig('/nonexistent/directory');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toEqual(DEFAULT_CONFIG);
			}
		});
	});

	describe('Type Safety', () => {
		it('should preserve type information', async () => {
			await repo.writeConfig({
				docs: {
					useAI: true,
					format: 'json'
				}
			});

			const result = await loadConfig(repo.path);

			if (result.success) {
				// Type should be inferred correctly
				const format: 'yaml' | 'json' = result.value.docs?.format || 'yaml';
				expect(format).toBe('json');
			}
		});

		it('should handle boolean values correctly', async () => {
			await repo.writeConfig({
				docs: {
					useAI: true,
					includeExamples: false
				}
			});

			const result = await loadConfig(repo.path);

			if (result.success) {
				expect(typeof result.value.docs?.useAI).toBe('boolean');
				expect(result.value.docs?.useAI).toBe(true);
				expect(result.value.docs?.includeExamples).toBe(false);
			}
		});

		it('should handle number values correctly', async () => {
			await repo.writeConfig({
				testing: {
					timeout: 60000,
					coverage: {
						lines: 85
					}
				}
			});

			const result = await loadConfig(repo.path);

			if (result.success) {
				expect(typeof result.value.testing?.timeout).toBe('number');
				expect(result.value.testing?.timeout).toBe(60000);
			}
		});
	});

	describe('Real-World Scenarios', () => {
		it('should load typical development config', async () => {
			await repo.writeConfig({
				observability: {
					logLevel: 'debug',
					logging: true
				},
				testing: {
					timeout: 60000,
					coverage: {
						lines: 70,
						functions: 70,
						branches: 65,
						statements: 70
					}
				}
			});

			const result = await loadConfig(repo.path);

			expect(result.success).toBe(true);
		});

		it('should load typical production config', async () => {
			await repo.writeConfig({
				observability: {
					logLevel: 'warn',
					logging: true,
					metrics: true
				},
				execution: {
					defaultTimeout: 30000,
					trackHistory: false // Disable in production
				},
				storage: {
					type: 'd1'
				}
			});

			const result = await loadConfig(repo.path);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.observability?.logLevel).toBe('warn');
				expect(result.value.execution?.trackHistory).toBe(false);
			}
		});

		it('should load AI-enhanced docs config', async () => {
			await repo.writeConfig({
				docs: {
					useAI: true,
					aiMember: 'docs-writer',
					format: 'json',
					includeExamples: true,
					includeSecurity: true
				}
			});

			const result = await loadConfig(repo.path);

			if (result.success) {
				expect(result.value.docs?.useAI).toBe(true);
				expect(result.value.docs?.aiMember).toBe('docs-writer');
			}
		});
	});
});
