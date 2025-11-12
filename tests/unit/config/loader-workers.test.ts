/**
 * Tests for Workers-Compatible Config Loader
 *
 * These tests use in-memory config sources that work in Workers environment
 */

import { describe, it, expect } from 'vitest';
import { createConfig, type ConfigSource } from '../../../src/config';
import type { ConductorConfig } from '../../../src/config';

describe('Workers Config Loader', () => {
	describe('Direct Object Source', () => {
		it('should load config from direct object', async () => {
			const result = await createConfig({
				type: 'object',
				config: {
					docs: {
						useAI: true,
						format: 'json'
					}
				}
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.docs.useAI).toBe(true);
				expect(result.value.docs.format).toBe('json');
			}
		});

		it('should merge partial config with defaults', async () => {
			const result = await createConfig({
				type: 'object',
				config: {
					docs: {
						useAI: true
					}
				}
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.docs.useAI).toBe(true);
				// Should have defaults for other properties
				expect(result.value.observability).toBeDefined();
				expect(result.value.execution).toBeDefined();
			}
		});

		it('should support nested config overrides', async () => {
			const result = await createConfig({
				type: 'object',
				config: {
					testing: {
						coverage: {
							lines: 80,
							functions: 75
						}
					}
				}
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.testing?.coverage?.lines).toBe(80);
				expect(result.value.testing?.coverage?.functions).toBe(75);
			}
		});
	});

	describe('Environment Variables Source', () => {
		it('should load docs config from env vars', async () => {
			const result = await createConfig({
				type: 'env',
				env: {
					CONDUCTOR_DOCS_USE_AI: 'true',
					CONDUCTOR_DOCS_FORMAT: 'yaml',
					CONDUCTOR_DOCS_AI_AGENT: 'gpt-4',
					CONDUCTOR_DOCS_OUTPUT_DIR: './docs-output'
				}
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.docs.useAI).toBe(true);
				expect(result.value.docs.format).toBe('yaml');
				expect(result.value.docs.aiAgent).toBe('gpt-4');
				expect(result.value.docs.outputDir).toBe('./docs-output');
			}
		});

		it('should load observability config from env vars', async () => {
			const result = await createConfig({
				type: 'env',
				env: {
					CONDUCTOR_OBSERVABILITY_LOGGING: 'true',
					CONDUCTOR_OBSERVABILITY_LOG_LEVEL: 'debug',
					CONDUCTOR_OBSERVABILITY_METRICS: 'true'
				}
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.observability?.logging).toBe(true);
				expect(result.value.observability?.logLevel).toBe('debug');
				expect(result.value.observability?.metrics).toBe(true);
			}
		});

		it('should load execution config from env vars', async () => {
			const result = await createConfig({
				type: 'env',
				env: {
					CONDUCTOR_EXECUTION_DEFAULT_TIMEOUT: '60000',
					CONDUCTOR_EXECUTION_TRACK_HISTORY: 'true',
					CONDUCTOR_EXECUTION_MAX_HISTORY_ENTRIES: '500'
				}
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.execution?.defaultTimeout).toBe(60000);
				expect(result.value.execution?.trackHistory).toBe(true);
				expect(result.value.execution?.maxHistoryEntries).toBe(500);
			}
		});

		it('should load storage config from env vars', async () => {
			const result = await createConfig({
				type: 'env',
				env: {
					CONDUCTOR_STORAGE_TYPE: 'kv',
					CONDUCTOR_STORAGE_PATH: '/data/conductor'
				}
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.storage?.type).toBe('kv');
				expect(result.value.storage?.path).toBe('/data/conductor');
			}
		});

		it('should handle empty env vars', async () => {
			const result = await createConfig({
				type: 'env',
				env: {}
			});

			expect(result.success).toBe(true);
			if (result.success) {
				// Should just return defaults
				expect(result.value.docs).toBeDefined();
			}
		});

		it('should parse boolean env vars correctly', async () => {
			const trueResult = await createConfig({
				type: 'env',
				env: { CONDUCTOR_DOCS_USE_AI: 'true' }
			});

			const falseResult = await createConfig({
				type: 'env',
				env: { CONDUCTOR_DOCS_USE_AI: 'false' }
			});

			expect(trueResult.success).toBe(true);
			expect(falseResult.success).toBe(true);
			if (trueResult.success && falseResult.success) {
				expect(trueResult.value.docs.useAI).toBe(true);
				expect(falseResult.value.docs.useAI).toBe(false);
			}
		});

		it('should parse numeric env vars correctly', async () => {
			const result = await createConfig({
				type: 'env',
				env: {
					CONDUCTOR_EXECUTION_DEFAULT_TIMEOUT: '30000',
					CONDUCTOR_EXECUTION_MAX_HISTORY_ENTRIES: '1000'
				}
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.execution?.defaultTimeout).toBe(30000);
				expect(result.value.execution?.maxHistoryEntries).toBe(1000);
			}
		});
	});

	describe('KV Storage Source', () => {
		it('should load config from KV storage', async () => {
			// Mock KV namespace
			const mockKV = {
				get: async (key: string, type: string) => {
					if (key === 'conductor-config' && type === 'json') {
						return {
							docs: {
								useAI: true,
								format: 'json'
							}
						};
					}
					return null;
				}
			} as unknown as KVNamespace;

			const result = await createConfig({
				type: 'kv',
				namespace: mockKV
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.docs.useAI).toBe(true);
				expect(result.value.docs.format).toBe('json');
			}
		});

		it('should use custom KV key', async () => {
			const mockKV = {
				get: async (key: string, type: string) => {
					if (key === 'custom-config' && type === 'json') {
						return {
							docs: { useAI: false }
						};
					}
					return null;
				}
			} as unknown as KVNamespace;

			const result = await createConfig({
				type: 'kv',
				namespace: mockKV,
				key: 'custom-config'
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.docs.useAI).toBe(false);
			}
		});

		it('should handle missing KV config gracefully', async () => {
			const mockKV = {
				get: async () => null
			} as unknown as KVNamespace;

			const result = await createConfig({
				type: 'kv',
				namespace: mockKV
			});

			expect(result.success).toBe(true);
			if (result.success) {
				// Should return defaults when no config in KV
				expect(result.value.docs).toBeDefined();
			}
		});

		it('should handle KV errors', async () => {
			const mockKV = {
				get: async () => {
					throw new Error('KV connection failed');
				}
			} as unknown as KVNamespace;

			const result = await createConfig({
				type: 'kv',
				namespace: mockKV
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toContain('Failed to load config from KV');
			}
		});
	});

	describe('Imported Module Source', () => {
		it('should load config from imported module', async () => {
			const mockModule = {
				default: {
					docs: {
						useAI: true,
						format: 'yaml' as const
					},
					observability: {
						logging: true,
						logLevel: 'debug' as const
					}
				}
			};

			const result = await createConfig({
				type: 'imported',
				module: mockModule
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.docs.useAI).toBe(true);
				expect(result.value.docs.format).toBe('yaml');
				expect(result.value.observability?.logging).toBe(true);
			}
		});

		it('should handle module without default export', async () => {
			const mockModule = {} as any;

			const result = await createConfig({
				type: 'imported',
				module: mockModule
			});

			expect(result.success).toBe(true);
			if (result.success) {
				// Should just use defaults
				expect(result.value.docs).toBeDefined();
			}
		});
	});

	describe('No Source (Defaults)', () => {
		it('should return defaults when no source provided', async () => {
			const result = await createConfig();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.docs).toBeDefined();
				expect(result.value.observability).toBeDefined();
				expect(result.value.execution).toBeDefined();
				expect(result.value.storage).toBeDefined();
			}
		});
	});

	describe('Validation', () => {
		it('should reject invalid docs format', async () => {
			const result = await createConfig({
				type: 'object',
				config: {
					docs: {
						format: 'xml' as any
					}
				}
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toContain('Invalid docs.format');
			}
		});

		it('should reject invalid coverage values', async () => {
			const result = await createConfig({
				type: 'object',
				config: {
					testing: {
						coverage: {
							lines: 150 // > 100
						}
					}
				}
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toContain('Invalid testing.coverage.lines');
			}
		});

		it('should reject invalid log level', async () => {
			const result = await createConfig({
				type: 'object',
				config: {
					observability: {
						logLevel: 'verbose' as any
					}
				}
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toContain('Invalid observability.logLevel');
			}
		});

		it('should reject negative timeout', async () => {
			const result = await createConfig({
				type: 'object',
				config: {
					execution: {
						defaultTimeout: -1000
					}
				}
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toContain('Invalid execution.defaultTimeout');
			}
		});

		it('should reject invalid storage type', async () => {
			const result = await createConfig({
				type: 'object',
				config: {
					storage: {
						type: 'redis' as any
					}
				}
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toContain('Invalid storage.type');
			}
		});

		it('should validate multiple errors at once', async () => {
			const result = await createConfig({
				type: 'object',
				config: {
					docs: {
						format: 'xml' as any
					},
					execution: {
						defaultTimeout: -500
					}
				}
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toContain('Invalid docs.format');
				expect(result.error.message).toContain('Invalid execution.defaultTimeout');
			}
		});
	});

	describe('Edge Cases', () => {
		it('should handle undefined in config', async () => {
			const result = await createConfig({
				type: 'object',
				config: {
					docs: {
						useAI: undefined
					}
				} as any
			});

			expect(result.success).toBe(true);
			// undefined values should be ignored, defaults used
		});

		it('should handle unknown config source type', async () => {
			const result = await createConfig({
				type: 'unknown' as any
			} as any);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toContain('Unknown config source type');
			}
		});

		it('should handle exception during config creation', async () => {
			const mockKV = {
				get: async () => {
					throw new Error('Unexpected error');
				}
			} as unknown as KVNamespace;

			const result = await createConfig({
				type: 'kv',
				namespace: mockKV
			});

			expect(result.success).toBe(false);
		});
	});

	describe('Integration Scenarios', () => {
		it('should support production Workers deployment pattern', async () => {
			// Simulate a real Workers fetch handler pattern
			const env = {
				CONDUCTOR_DOCS_USE_AI: 'true',
				CONDUCTOR_OBSERVABILITY_LOGGING: 'true'
			};

			const result = await createConfig({
				type: 'env',
				env
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.docs.useAI).toBe(true);
				expect(result.value.observability?.logging).toBe(true);
			}
		});

		it('should support local development pattern', async () => {
			const result = await createConfig({
				type: 'object',
				config: {
					docs: { useAI: false },
					observability: { logging: true, logLevel: 'debug' }
				}
			});

			expect(result.success).toBe(true);
		});

		it('should support test pattern', async () => {
			const result = await createConfig({
				type: 'object',
				config: {
					execution: { trackHistory: true },
					observability: { logging: false }
				}
			});

			expect(result.success).toBe(true);
		});
	});
});
