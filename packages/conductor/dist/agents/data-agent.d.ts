/**
 * Data Agent - Refactored with Repository Pattern
 *
 * Handles data operations through a unified Repository interface.
 * Storage backend is injected, making it testable and platform-agnostic.
 *
 * Reduced from 326 lines to ~120 lines through abstraction.
 */
import { BaseAgent, type AgentExecutionContext } from './base-agent.js';
import type { AgentConfig } from '../runtime/parser.js';
import type { Repository } from '../storage/index.js';
import { StorageType } from '../types/constants.js';
import { type ExportOptions, type ExportFormat } from './data/export-formats.js';
export interface DataConfig {
    storage: StorageType;
    operation: 'get' | 'put' | 'delete' | 'list' | 'query' | 'export';
    binding?: string;
    ttl?: number;
    exportFormat?: ExportFormat;
    exportOptions?: ExportOptions;
}
export interface DataInput {
    key?: string;
    value?: unknown;
    prefix?: string;
    limit?: number;
    cursor?: string;
    ttl?: number;
    query?: string;
    filter?: Record<string, unknown>;
    sort?: string;
    format?: ExportFormat;
    exportOptions?: ExportOptions;
    streaming?: boolean;
}
/**
 * Data Agent performs storage operations via Repository pattern
 *
 * Benefits of Repository pattern:
 * - Platform-agnostic (works with any storage backend)
 * - Testable (easy to inject mock repositories)
 * - Composable (repositories can be chained, cached, etc.)
 * - Type-safe (Result types for error handling)
 */
export declare class DataAgent extends BaseAgent {
    private readonly repository?;
    private dataConfig;
    constructor(config: AgentConfig, repository?: Repository<unknown, string> | undefined);
    /**
     * Execute data operation via repository
     */
    protected run(context: AgentExecutionContext): Promise<unknown>;
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
     * Execute QUERY operation (D1 only)
     */
    private executeQuery;
    /**
     * Execute EXPORT operation
     */
    private executeExport;
    /**
     * Get Data configuration
     */
    getDataConfig(): DataConfig;
}
//# sourceMappingURL=data-agent.d.ts.map