/**
 * Execution History Storage
 *
 * Store and retrieve execution history for debugging.
 */
/**
 * Execution record stored in history
 */
export interface ExecutionRecord {
    /** Unique execution ID */
    id: string;
    /** Ensemble or member name */
    name: string;
    /** Execution type */
    type: 'ensemble' | 'member';
    /** Input data */
    input: Record<string, unknown>;
    /** Output data (if successful) */
    output?: unknown;
    /** Error (if failed) */
    error?: {
        message: string;
        code?: string;
        stack?: string;
    };
    /** Execution status */
    status: 'success' | 'failure';
    /** Start timestamp */
    startTime: number;
    /** End timestamp */
    endTime: number;
    /** Duration in milliseconds */
    duration: number;
    /** Steps executed (for ensembles) */
    steps?: ExecutionStep[];
    /** State snapshots at each step */
    stateSnapshots?: StateSnapshot[];
    /** Logs generated during execution */
    logs?: LogEntry[];
}
/**
 * Execution step
 */
export interface ExecutionStep {
    /** Step name/member */
    name: string;
    /** Step status */
    status: 'success' | 'failure' | 'skipped';
    /** Start time */
    startTime: number;
    /** End time */
    endTime: number;
    /** Duration */
    duration: number;
    /** Output */
    output?: unknown;
    /** Error if failed */
    error?: string;
}
/**
 * State snapshot at a point in time
 */
export interface StateSnapshot {
    /** Step index */
    stepIndex: number;
    /** Step name */
    stepName: string;
    /** Timestamp */
    timestamp: number;
    /** State at this point */
    state: Record<string, unknown>;
}
/**
 * Log entry
 */
export interface LogEntry {
    /** Timestamp */
    timestamp: number;
    /** Log level */
    level: 'debug' | 'info' | 'warn' | 'error';
    /** Log message */
    message: string;
    /** Additional context */
    context?: Record<string, unknown>;
    /** Step name (if applicable) */
    step?: string;
}
/**
 * Execution history manager
 */
export declare class ExecutionHistory {
    private storagePath;
    constructor(storagePath?: string);
    /**
     * Initialize storage directory
     */
    initialize(): Promise<void>;
    /**
     * Store execution record
     */
    store(record: ExecutionRecord): Promise<void>;
    /**
     * Get execution record by ID
     */
    get(executionId: string): Promise<ExecutionRecord | null>;
    /**
     * List all execution records
     */
    list(options?: {
        limit?: number;
        type?: 'ensemble' | 'member';
        status?: 'success' | 'failure';
    }): Promise<ExecutionRecord[]>;
    /**
     * Get logs for an execution
     */
    getLogs(executionId: string): Promise<LogEntry[]>;
    /**
     * Get state snapshots for an execution
     */
    getStateSnapshots(executionId: string): Promise<StateSnapshot[]>;
    /**
     * Delete old execution records
     */
    cleanup(maxAge?: number): Promise<number>;
}
/**
 * Generate unique execution ID
 */
export declare function generateExecutionId(): string;
//# sourceMappingURL=execution-history.d.ts.map