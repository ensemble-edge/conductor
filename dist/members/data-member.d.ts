/**
 * Data Member - Refactored with Repository Pattern
 *
 * Handles data operations through a unified Repository interface.
 * Storage backend is injected, making it testable and platform-agnostic.
 *
 * Reduced from 326 lines to ~120 lines through abstraction.
 */
import { BaseMember, type MemberExecutionContext } from './base-member.js';
import type { MemberConfig } from '../runtime/parser.js';
import type { Repository } from '../storage/index.js';
import { StorageType } from '../types/constants.js';
export interface DataConfig {
    storage: StorageType;
    operation: 'get' | 'put' | 'delete' | 'list';
    binding?: string;
    ttl?: number;
}
export interface DataInput {
    key?: string;
    value?: unknown;
    prefix?: string;
    limit?: number;
    cursor?: string;
    ttl?: number;
}
/**
 * Data Member performs storage operations via Repository pattern
 *
 * Benefits of Repository pattern:
 * - Platform-agnostic (works with any storage backend)
 * - Testable (easy to inject mock repositories)
 * - Composable (repositories can be chained, cached, etc.)
 * - Type-safe (Result types for error handling)
 */
export declare class DataMember extends BaseMember {
    private readonly repository?;
    private dataConfig;
    constructor(config: MemberConfig, repository?: Repository<unknown, string> | undefined);
    /**
     * Execute data operation via repository
     */
    protected run(context: MemberExecutionContext): Promise<unknown>;
    /**
     * Execute GET operation
     */
    private executeGet;
    /**
     * Execute PUT operation
     */
    private executePut;
    /**
     * Execute DELETE operation
     */
    private executeDelete;
    /**
     * Execute LIST operation
     */
    private executeList;
    /**
     * Create repository from environment bindings
     * Falls back to original behavior if no repository injected
     */
    private createRepository;
    /**
     * Get binding name with sensible defaults
     */
    private getBindingName;
    /**
     * Get Data configuration
     */
    getDataConfig(): DataConfig;
}
//# sourceMappingURL=data-member.d.ts.map