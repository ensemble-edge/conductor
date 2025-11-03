/**
 * DataMember Tests with Mock Repository
 *
 * Tests data operations member with mock repository
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DataMember } from '../../../src/members/data-member';
import type { MemberConfig } from '../../../src/runtime/parser';
import type { Repository } from '../../../src/storage';
import { Result } from '../../../src/types/result';
import { StorageType } from '../../../src/types/constants';
import type { ConductorEnv } from '../../../src/types/env';

// Mock error class to match expected structure
class MockError {
	constructor(public message: string) {}
}

// Mock Repository for testing
class MockRepository implements Repository<unknown, string> {
	private store = new Map<string, unknown>();
	private getError: string | null = null;
	private putError: string | null = null;

	// Mock control methods
	setGetError(error: string | null): void {
		this.getError = error;
	}

	setPutError(error: string | null): void {
		this.putError = error;
	}

	// Repository interface
	async get(key: string): Promise<Result<unknown, any>> {
		if (this.getError) {
			return Result.err(new MockError(this.getError) as any);
		}

		const value = this.store.get(key);
		if (value === undefined) {
			return Result.err(new MockError(`Key not found: ${key}`) as any);
		}

		return Result.ok(value);
	}

	async put(key: string, value: unknown, options?: { ttl?: number }): Promise<Result<void, any>> {
		if (this.putError) {
			return Result.err(new MockError(this.putError) as any);
		}

		this.store.set(key, value);
		return Result.ok(undefined);
	}

	async delete(key: string): Promise<Result<void, any>> {
		this.store.delete(key);
		return Result.ok(undefined);
	}

	async list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<Result<{ keys: string[]; cursor?: string }, any>> {
		const keys = Array.from(this.store.keys());
		const filtered = options?.prefix
			? keys.filter(k => k.startsWith(options.prefix!))
			: keys;

		const limited = options?.limit
			? filtered.slice(0, options.limit)
			: filtered;

		return Result.ok({ keys: limited });
	}
}

describe('DataMember', () => {
	let mockRepo: MockRepository;
	let mockEnv: Partial<ConductorEnv>;

	beforeEach(() => {
		mockRepo = new MockRepository();
		mockEnv = {};
	});

	describe('Constructor and Configuration', () => {
		it('should initialize with valid config', () => {
			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.KV,
					operation: 'get',
				},
			};

			const member = new DataMember(config, mockRepo);
			expect(member).toBeDefined();
		});

		it('should throw error for missing storage type', () => {
			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					operation: 'get',
				},
			};

			expect(() => new DataMember(config, mockRepo)).toThrow('requires storage type');
		});

		it('should throw error for missing operation', () => {
			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.KV,
				},
			};

			expect(() => new DataMember(config, mockRepo)).toThrow('requires operation type');
		});

		it('should accept injected repository', () => {
			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.KV,
					operation: 'get',
				},
			};

			const member = new DataMember(config, mockRepo);
			expect(member).toBeDefined();
		});
	});

	describe('GET Operation', () => {
		it('should retrieve value by key', async () => {
			// Setup mock data
			await mockRepo.put('user:123', { name: 'Alice', age: 30 });

			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.KV,
					operation: 'get',
				},
			};

			const member = new DataMember(config, mockRepo);
			const result = await member.execute({
				input: { key: 'user:123' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.found).toBe(true);
			expect(data.value).toEqual({ name: 'Alice', age: 30 });
			expect(data.key).toBe('user:123');
		});

		it('should handle missing keys', async () => {
			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.KV,
					operation: 'get',
				},
			};

			const member = new DataMember(config, mockRepo);
			const result = await member.execute({
				input: { key: 'nonexistent' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true); // DataMember returns success with found:false
			const data = result.data as any;
			expect(data.found).toBe(false);
			expect(data.value).toBeNull();
			expect(data.error).toContain('Key not found');
		});

		it('should handle repository errors', async () => {
			mockRepo.setGetError('Connection timeout');

			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.KV,
					operation: 'get',
				},
			};

			const member = new DataMember(config, mockRepo);
			const result = await member.execute({
				input: { key: 'test' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true); // DataMember returns success with found:false
			const data = result.data as any;
			expect(data.found).toBe(false);
			expect(data.error).toContain('Connection timeout');
		});
	});

	describe('PUT Operation', () => {
		it('should store value by key', async () => {
			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.KV,
					operation: 'put',
				},
			};

			const member = new DataMember(config, mockRepo);
			const result = await member.execute({
				input: {
					key: 'user:456',
					value: { name: 'Bob', age: 25 },
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.success).toBe(true);
			expect(data.key).toBe('user:456');

			// Verify it was stored
			const getResult = await mockRepo.get('user:456');
			expect(getResult.success).toBe(true);
			expect(getResult.value).toEqual({ name: 'Bob', age: 25 });
		});

		it('should handle TTL option', async () => {
			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.KV,
					operation: 'put',
					ttl: 3600,
				},
			};

			const member = new DataMember(config, mockRepo);
			const result = await member.execute({
				input: {
					key: 'temp:123',
					value: 'temporary data',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.success).toBe(true);
		});

		it('should handle repository errors on put', async () => {
			mockRepo.setPutError('Storage quota exceeded');

			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.KV,
					operation: 'put',
				},
			};

			const member = new DataMember(config, mockRepo);
			const result = await member.execute({
				input: {
					key: 'test',
					value: 'data',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true); // DataMember returns success with success:false field
			const data = result.data as any;
			expect(data.success).toBe(false);
			expect(data.error).toContain('Storage quota exceeded');
		});
	});

	describe('DELETE Operation', () => {
		it('should delete value by key', async () => {
			// Setup mock data
			await mockRepo.put('user:789', { name: 'Charlie' });

			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.KV,
					operation: 'delete',
				},
			};

			const member = new DataMember(config, mockRepo);
			const result = await member.execute({
				input: { key: 'user:789' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.success).toBe(true);
			expect(data.key).toBe('user:789');

			// Verify it was deleted
			const getResult = await mockRepo.get('user:789');
			expect(getResult.success).toBe(false);
		});

		it('should handle deleting nonexistent keys', async () => {
			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.KV,
					operation: 'delete',
				},
			};

			const member = new DataMember(config, mockRepo);
			const result = await member.execute({
				input: { key: 'nonexistent' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			// Delete is idempotent - success even if key doesn't exist
			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.success).toBe(true);
		});
	});

	describe('LIST Operation', () => {
		it('should list all keys', async () => {
			// Setup mock data
			await mockRepo.put('user:1', { name: 'Alice' });
			await mockRepo.put('user:2', { name: 'Bob' });
			await mockRepo.put('product:1', { name: 'Widget' });

			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.KV,
					operation: 'list',
				},
			};

			const member = new DataMember(config, mockRepo);
			const result = await member.execute({
				input: {},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.success).toBe(true);
			expect(data.items.keys).toHaveLength(3);
		});

		it('should list keys with prefix filter', async () => {
			// Setup mock data
			await mockRepo.put('user:1', { name: 'Alice' });
			await mockRepo.put('user:2', { name: 'Bob' });
			await mockRepo.put('product:1', { name: 'Widget' });

			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.KV,
					operation: 'list',
				},
			};

			const member = new DataMember(config, mockRepo);
			const result = await member.execute({
				input: { prefix: 'user:' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.success).toBe(true);
			expect(data.items.keys).toHaveLength(2);
			expect(data.items.keys).toContain('user:1');
			expect(data.items.keys).toContain('user:2');
		});

		it('should respect limit option', async () => {
			// Setup mock data
			await mockRepo.put('item:1', {});
			await mockRepo.put('item:2', {});
			await mockRepo.put('item:3', {});
			await mockRepo.put('item:4', {});

			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.KV,
					operation: 'list',
				},
			};

			const member = new DataMember(config, mockRepo);
			const result = await member.execute({
				input: { limit: 2 },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.success).toBe(true);
			expect(data.items.keys).toHaveLength(2);
		});
	});

	describe('Storage Type Handling', () => {
		it('should work with KV storage type', () => {
			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.KV,
					operation: 'get',
				},
			};

			const member = new DataMember(config, mockRepo);
			expect(member).toBeDefined();
		});

		it('should work with D1 storage type', () => {
			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.D1,
					operation: 'get',
				},
			};

			const member = new DataMember(config, mockRepo);
			expect(member).toBeDefined();
		});

		it('should work with R2 storage type', () => {
			const config: MemberConfig = {
				name: 'test-data',
				type: 'Data',
				config: {
					storage: StorageType.R2,
					operation: 'get',
				},
			};

			const member = new DataMember(config, mockRepo);
			expect(member).toBeDefined();
		});
	});
});
