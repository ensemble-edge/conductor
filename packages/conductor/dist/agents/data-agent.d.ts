/**
 * Data Agent - SQL Databases and Structured Data
 *
 * Handles database operations through a unified Repository interface.
 * Database backend is injected, making it testable and platform-agnostic.
 *
 * Database types:
 * - D1: SQLite database (Cloudflare D1)
 * - Hyperdrive: PostgreSQL/MySQL connection pooling (Cloudflare Hyperdrive)
 * - Vectorize: Vector database for embeddings (Cloudflare Vectorize)
 * - External: Supabase, Neon, PlanetScale, etc.
 */
import { BaseAgent, type AgentExecutionContext } from './base-agent.js';
import type { AgentConfig } from '../runtime/parser.js';
import type { Repository } from '../storage/index.js';
import { DatabaseType } from '../types/constants.js';
import { type ExportOptions, type ExportFormat } from './data/export-formats.js';
export interface DataConfig {
    database: DatabaseType;
    operation: 'get' | 'put' | 'delete' | 'list' | 'query' | 'export';
    binding?: string;
    tableName?: string;
    exportFormat?: ExportFormat;
    exportOptions?: ExportOptions;
}
export interface DataInput {
    key?: string;
    value?: unknown;
    prefix?: string;
    limit?: number;
    cursor?: string;
    query?: string;
    params?: unknown[];
    filter?: Record<string, unknown>;
    sort?: string;
    format?: ExportFormat;
    exportOptions?: ExportOptions;
    streaming?: boolean;
}
/**
 * Data Agent performs database operations via Repository pattern
 *
 * Benefits of Repository pattern:
 * - Platform-agnostic (works with any database backend)
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