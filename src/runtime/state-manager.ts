/**
 * State Manager for Ensemble workflows
 *
 * Manages shared state across member executions, providing selective access
 * and tracking state usage patterns for optimization
 */

export interface StateConfig {
	schema?: Record<string, any>;
	initial?: Record<string, any>;
}

export interface MemberStateConfig {
	use?: string[];
	set?: string[];
}

export interface StateContext {
	state: Record<string, any>;
	setState: (updates: Record<string, any>) => void;
}

export interface AccessLogEntry {
	key: string;
	operation: 'read' | 'write';
	timestamp: number;
}

export interface AccessReport {
	unusedKeys: string[];
	accessPatterns: Record<string, AccessLogEntry[]>;
}

/**
 * StateManager handles shared state across ensemble member executions
 */
export class StateManager {
	private schema: Record<string, any>;
	private state: Record<string, any>;
	private accessLog: Map<string, AccessLogEntry[]>;

	constructor(config: StateConfig) {
		this.schema = config.schema || {};
		this.state = { ...(config.initial || {}) };
		this.accessLog = new Map();
	}

	/**
	 * Create a state context for a specific member
	 * @param memberName - Name of the member
	 * @param memberStateConfig - State configuration for this member
	 * @returns State context with limited access
	 */
	getStateForMember(memberName: string, config: MemberStateConfig): StateContext {
		const { use = [], set = [] } = config;

		// Create read-only state view (only includes declared 'use' keys)
		const state: Record<string, any> = {};
		for (const key of use) {
			if (this.state && key in this.state) {
				state[key] = this.state[key];
				this.logAccess(memberName, key, 'read');
			}
		}

		// Create setter function (only allows declared 'set' keys)
		const setState = (updates: Record<string, any>) => {
			this.setStateFromMember(memberName, updates, config);
		};

		return { state, setState };
	}

	/**
	 * Update state from a member (enforces 'set' permissions)
	 * @param memberName - Name of the member making the update
	 * @param updates - State updates
	 * @param config - Member's state configuration
	 */
	setStateFromMember(memberName: string, updates: Record<string, any>, config: MemberStateConfig): void {
		const { set = [] } = config;

		for (const key of Object.keys(updates)) {
			if (set.includes(key)) {
				this.state[key] = updates[key];
				this.logAccess(memberName, key, 'write');
			} else {
				console.warn(`Member "${memberName}" attempted to set undeclared state key: "${key}"`);
			}
		}
	}

	/**
	 * Get the full current state snapshot (for final output)
	 * @returns Current state
	 */
	getState(): Record<string, any> {
		return { ...this.state };
	}

	/**
	 * Log state access for monitoring and optimization
	 * @param member - Member name
	 * @param key - State key being accessed
	 * @param operation - Read or write operation
	 */
	private logAccess(member: string, key: string, operation: 'read' | 'write'): void {
		if (!this.accessLog.has(member)) {
			this.accessLog.set(member, []);
		}

		this.accessLog.get(member)!.push({
			key,
			operation,
			timestamp: Date.now()
		});
	}

	/**
	 * Generate an access report showing state usage patterns
	 * @returns Access report
	 */
	getAccessReport(): AccessReport {
		const allKeys = Object.keys(this.state);
		const usedKeys = new Set<string>();

		// Collect all keys that were accessed
		for (const accesses of this.accessLog.values()) {
			accesses.forEach(access => usedKeys.add(access.key));
		}

		// Find unused keys
		const unusedKeys = allKeys.filter(key => !usedKeys.has(key));

		return {
			unusedKeys,
			accessPatterns: Object.fromEntries(this.accessLog)
		};
	}

	/**
	 * Clear access logs (useful for testing or resetting monitoring)
	 */
	clearAccessLog(): void {
		this.accessLog.clear();
	}

	/**
	 * Reset state to initial values
	 */
	reset(): void {
		// Reset to initial state based on schema
		this.state = {};
		this.clearAccessLog();
	}
}
