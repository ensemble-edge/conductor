/**
 * State Manager V2 - Refactored for Immutability
 *
 * Returns new instances instead of mutating internal state.
 * Follows functional programming principles for predictability.
 */
import { type Logger } from '../observability/index.js';
export interface StateConfig {
    schema?: Record<string, unknown>;
    initial?: Record<string, unknown>;
    logger?: Logger;
}
export interface MemberStateConfig {
    use?: string[];
    set?: string[];
}
export interface StateContext {
    state: Readonly<Record<string, unknown>>;
    setState: (updates: Record<string, unknown>) => void;
}
export interface AccessLogEntry {
    agent: string;
    key: string;
    operation: 'read' | 'write';
    timestamp: number;
}
export interface AccessReport {
    unusedKeys: string[];
    accessPatterns: Record<string, AccessLogEntry[]>;
}
/**
 * Immutable StateManager - returns new instances for all mutations
 */
export declare class StateManager {
    private readonly schema;
    private readonly state;
    private readonly accessLog;
    private readonly logger;
    constructor(config: StateConfig, existingState?: Readonly<Record<string, unknown>>, existingLog?: ReadonlyArray<AccessLogEntry>);
    /**
     * Create a state context for a specific agent
     * Returns both the context and a function to retrieve accumulated updates
     */
    getStateForAgent(agentName: string, config: MemberStateConfig): {
        context: StateContext;
        getPendingUpdates: () => {
            updates: Record<string, unknown>;
            newLog: AccessLogEntry[];
        };
    };
    /**
     * Apply pending updates from a agent execution (returns new StateManager instance)
     * This is the preferred method when using getStateForAgent with getPendingUpdates
     */
    applyPendingUpdates(updates: Record<string, unknown>, newLog: AccessLogEntry[]): StateManager;
    /**
     * Update state from a agent (returns new StateManager instance)
     * Use applyPendingUpdates for better performance when using getStateForAgent
     */
    setStateFromMember(agentName: string, updates: Record<string, unknown>, config: MemberStateConfig): StateManager;
    /**
     * Get the full current state snapshot
     */
    getState(): Readonly<Record<string, unknown>>;
    /**
     * Generate an access report showing state usage patterns
     */
    getAccessReport(): AccessReport;
    /**
     * Clear access logs (returns new instance)
     */
    clearAccessLog(): StateManager;
    /**
     * Reset state to initial values (returns new instance)
     */
    reset(initialState?: Record<string, unknown>): StateManager;
    /**
     * Create a new StateManager with merged state
     */
    merge(updates: Record<string, unknown>): StateManager;
}
//# sourceMappingURL=state-manager.d.ts.map