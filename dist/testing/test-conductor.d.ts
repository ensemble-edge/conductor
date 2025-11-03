/**
 * Test Conductor - Testing Helper for Conductor Projects
 */
import type { EnsembleConfig, MemberConfig } from '../runtime/parser';
import type { TestConductorOptions, TestExecutionResult, TestMemberResult, AICall, DatabaseQuery, ExecutionRecord, ProjectSnapshot } from './types';
/**
 * Test helper for executing and testing Conductor ensembles
 */
export declare class TestConductor {
    private env;
    private ctx;
    private executor;
    private parser;
    private mocks;
    private executionHistory;
    private catalog;
    private constructor();
    /**
     * Create a new test conductor instance
     */
    static create(options?: TestConductorOptions): Promise<TestConductor>;
    /**
     * Execute an ensemble in test mode
     */
    executeEnsemble(name: string, input: Record<string, unknown>): Promise<TestExecutionResult>;
    /**
     * Execute a member directly
     */
    executeMember(name: string, input: unknown): Promise<TestMemberResult>;
    /**
     * Mock AI provider responses
     */
    mockAI(memberName: string, response: unknown | Error): void;
    /**
     * Mock database responses
     */
    mockDatabase(table: string, data: unknown[]): void;
    /**
     * Mock external API responses
     */
    mockAPI(url: string, response: unknown): void;
    /**
     * Get execution history
     */
    getExecutionHistory(): ExecutionRecord[];
    /**
     * Get AI calls from history
     */
    getAICalls(): AICall[];
    /**
     * Get database queries from history
     */
    getDatabaseQueries(): DatabaseQuery[];
    /**
     * Add ensemble to catalog programmatically
     */
    addEnsemble(name: string, config: EnsembleConfig): void;
    /**
     * Add member to catalog programmatically
     */
    addMember(name: string, config: MemberConfig): void;
    /**
     * Get ensemble from catalog
     */
    getEnsemble(name: string): EnsembleConfig | undefined;
    /**
     * Get member from catalog
     */
    getMember(name: string): MemberConfig | undefined;
    /**
     * Create project snapshot
     */
    snapshot(): Promise<ProjectSnapshot>;
    /**
     * Cleanup test resources
     */
    cleanup(): Promise<void>;
    /**
     * Load catalog from project directory
     */
    private loadCatalog;
    /**
     * Create test environment
     */
    private createTestEnv;
    /**
     * Create test execution context
     */
    private createTestContext;
}
//# sourceMappingURL=test-conductor.d.ts.map