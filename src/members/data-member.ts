/**
 * Data Member Engine
 *
 * Handles data operations with Cloudflare storage:
 * - KV: Key-value storage
 * - D1: SQL database
 * - R2: Object storage
 */

import { BaseMember, type MemberExecutionContext } from './base-member';
import type { MemberConfig } from '../runtime/parser';

export interface DataConfig {
	storage: 'kv' | 'd1' | 'r2';
	operation: 'get' | 'put' | 'delete' | 'list' | 'query';
	binding?: string; // Name of the binding in wrangler.toml
	// KV specific
	ttl?: number;
	// D1 specific
	database?: string;
	// R2 specific
	bucket?: string;
}

/**
 * Data Member performs storage operations on Cloudflare infrastructure
 *
 * @example User's member definition (KV):
 * ```yaml
 * # members/cache-lookup/member.yaml
 * name: cache-lookup
 * type: Data
 * description: Look up cached data from KV
 * config:
 *   storage: kv
 *   operation: get
 *   binding: CACHE
 * schema:
 *   input:
 *     key: string
 *   output:
 *     value: any
 *     found: boolean
 * ```
 *
 * @example User's member definition (D1):
 * ```yaml
 * # members/query-customers/member.yaml
 * name: query-customers
 * type: Data
 * description: Query customer database
 * config:
 *   storage: d1
 *   operation: query
 *   binding: DB
 * schema:
 *   input:
 *     sql: string
 *     params: array
 *   output:
 *     results: array
 * ```
 */
export class DataMember extends BaseMember {
	private dataConfig: DataConfig;

	constructor(config: MemberConfig) {
		super(config);

		this.dataConfig = {
			storage: config.config?.storage,
			operation: config.config?.operation,
			binding: config.config?.binding,
			ttl: config.config?.ttl,
			database: config.config?.database,
			bucket: config.config?.bucket
		};

		// Validate config
		if (!this.dataConfig.storage) {
			throw new Error(`Data member "${config.name}" requires storage type (kv, d1, or r2)`);
		}

		if (!this.dataConfig.operation) {
			throw new Error(`Data member "${config.name}" requires operation type`);
		}
	}

	/**
	 * Execute data operation
	 */
	protected async run(context: MemberExecutionContext): Promise<any> {
		switch (this.dataConfig.storage) {
			case 'kv':
				return await this.executeKV(context);

			case 'd1':
				return await this.executeD1(context);

			case 'r2':
				return await this.executeR2(context);

			default:
				throw new Error(`Unknown storage type: ${this.dataConfig.storage}`);
		}
	}

	/**
	 * Execute KV operations
	 */
	private async executeKV(context: MemberExecutionContext): Promise<any> {
		const { input, env } = context;
		const bindingName = this.dataConfig.binding || 'CACHE';
		const kv = (env as any)[bindingName] as KVNamespace;

		if (!kv) {
			throw new Error(`KV binding "${bindingName}" not found. Add to wrangler.toml`);
		}

		switch (this.dataConfig.operation) {
			case 'get': {
				const key = input.key;
				if (!key) {
					throw new Error('KV get operation requires "key" in input');
				}

				const value = await kv.get(key, { type: input.type || 'text' });

				return {
					key,
					value: value ? (input.type === 'json' ? JSON.parse(value) : value) : null,
					found: value !== null
				};
			}

			case 'put': {
				const key = input.key;
				const value = input.value;

				if (!key) {
					throw new Error('KV put operation requires "key" in input');
				}

				const valueString = typeof value === 'string' ? value : JSON.stringify(value);
				const options: any = {};

				if (this.dataConfig.ttl || input.ttl) {
					options.expirationTtl = this.dataConfig.ttl || input.ttl;
				}

				await kv.put(key, valueString, options);

				return {
					key,
					success: true
				};
			}

			case 'delete': {
				const key = input.key;
				if (!key) {
					throw new Error('KV delete operation requires "key" in input');
				}

				await kv.delete(key);

				return {
					key,
					success: true
				};
			}

			case 'list': {
				const options: any = {};
				if (input.prefix) options.prefix = input.prefix;
				if (input.limit) options.limit = input.limit;
				if (input.cursor) options.cursor = input.cursor;

				const result = await kv.list(options);

				return {
					keys: result.keys,
					list_complete: result.list_complete
				};
			}

			default:
				throw new Error(`Unknown KV operation: ${this.dataConfig.operation}`);
		}
	}

	/**
	 * Execute D1 operations
	 */
	private async executeD1(context: MemberExecutionContext): Promise<any> {
		const { input, env } = context;
		const bindingName = this.dataConfig.binding || 'DB';
		const db = (env as any)[bindingName] as D1Database;

		if (!db) {
			throw new Error(`D1 binding "${bindingName}" not found. Add to wrangler.toml`);
		}

		switch (this.dataConfig.operation) {
			case 'query': {
				const sql = input.sql;
				if (!sql) {
					throw new Error('D1 query operation requires "sql" in input');
				}

				const params = input.params || [];
				const result = await db.prepare(sql).bind(...params).all();

				return {
					results: result.results,
					success: result.success,
					meta: result.meta
				};
			}

			default:
				throw new Error(`Unknown D1 operation: ${this.dataConfig.operation}`);
		}
	}

	/**
	 * Execute R2 operations
	 */
	private async executeR2(context: MemberExecutionContext): Promise<any> {
		const { input, env } = context;
		const bindingName = this.dataConfig.binding || 'STORAGE';
		const r2 = (env as any)[bindingName] as R2Bucket;

		if (!r2) {
			throw new Error(`R2 binding "${bindingName}" not found. Add to wrangler.toml`);
		}

		switch (this.dataConfig.operation) {
			case 'get': {
				const key = input.key;
				if (!key) {
					throw new Error('R2 get operation requires "key" in input');
				}

				const object = await r2.get(key);
				if (!object) {
					return {
						key,
						found: false,
						value: null
					};
				}

				return {
					key,
					found: true,
					value: await object.text(),
					contentType: object.httpMetadata?.contentType,
					size: object.size,
					uploaded: object.uploaded
				};
			}

			case 'put': {
				const key = input.key;
				const value = input.value;

				if (!key || value === undefined) {
					throw new Error('R2 put operation requires "key" and "value" in input');
				}

				await r2.put(key, value, {
					httpMetadata: input.httpMetadata,
					customMetadata: input.customMetadata
				});

				return {
					key,
					success: true
				};
			}

			case 'delete': {
				const key = input.key;
				if (!key) {
					throw new Error('R2 delete operation requires "key" in input');
				}

				await r2.delete(key);

				return {
					key,
					success: true
				};
			}

			case 'list': {
				const options: any = {};
				if (input.prefix) options.prefix = input.prefix;
				if (input.limit) options.limit = input.limit;
				if (input.cursor) options.cursor = input.cursor;

				const result = await r2.list(options);

				return {
					objects: result.objects.map(obj => ({
						key: obj.key,
						size: obj.size,
						uploaded: obj.uploaded
					})),
					truncated: result.truncated
				};
			}

			default:
				throw new Error(`Unknown R2 operation: ${this.dataConfig.operation}`);
		}
	}

	/**
	 * Get Data configuration
	 */
	getDataConfig(): DataConfig {
		return { ...this.dataConfig };
	}
}
