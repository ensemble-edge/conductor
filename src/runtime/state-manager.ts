/**
 * State Manager V2 - Refactored for Immutability
 *
 * Returns new instances instead of mutating internal state.
 * Follows functional programming principles for predictability.
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
	state: Readonly<Record<string, any>>;
	setState: (updates: Record<string, any>) => void;
}

export interface AccessLogEntry {
	member: string;
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
export class StateManager {
	private readonly schema: Readonly<Record<string, any>>;
	private readonly state: Readonly<Record<string, any>>;
	private readonly accessLog: ReadonlyArray<AccessLogEntry>;

	constructor(
		config: StateConfig,
		existingState?: Readonly<Record<string, any>>,
		existingLog?: ReadonlyArray<AccessLogEntry>
	) {
		this.schema = Object.freeze(config.schema || {});
		this.state = Object.freeze(existingState || { ...(config.initial || {}) });
		this.accessLog = existingLog || [];
	}

	/**
	 * Create a state context for a specific member
	 * Returns both the context and a function to retrieve accumulated updates
	 */
	getStateForMember(memberName: string, config: MemberStateConfig): {
		context: StateContext;
		getPendingUpdates: () => { updates: Record<string, any>; newLog: AccessLogEntry[] };
	} {
		const { use = [], set = [] } = config;

		// Create read-only state view (only includes declared 'use' keys)
		const viewState: Record<string, any> = {};
		const newLog: AccessLogEntry[] = [...this.accessLog];

		for (const key of use) {
			if (this.state && key in this.state) {
				viewState[key] = this.state[key];
				newLog.push({
					member: memberName,
					key,
					operation: 'read',
					timestamp: Date.now()
				});
			}
		}

		// Track pending updates in closure
		const pendingUpdates: Record<string, any> = {};

		// Create setState function that accumulates updates
		const setState = (updates: Record<string, any>) => {
			for (const [key, value] of Object.entries(updates)) {
				if (set.includes(key)) {
					pendingUpdates[key] = value;
					newLog.push({
						member: memberName,
						key,
						operation: 'write',
						timestamp: Date.now()
					});
				} else {
					console.warn(`Member "${memberName}" attempted to set undeclared state key: "${key}"`);
				}
			}
		};

		return {
			context: {
				state: Object.freeze(viewState),
				setState
			},
			getPendingUpdates: () => ({ updates: pendingUpdates, newLog })
		};
	}

	/**
	 * Apply pending updates from a member execution (returns new StateManager instance)
	 * This is the preferred method when using getStateForMember with getPendingUpdates
	 */
	applyPendingUpdates(
		updates: Record<string, any>,
		newLog: AccessLogEntry[]
	): StateManager {
		// If no updates, return this instance (optimization)
		if (Object.keys(updates).length === 0 && newLog.length === this.accessLog.length) {
			return this;
		}

		// Create new state with updates
		const newState: Record<string, any> = { ...this.state, ...updates };

		// Return new StateManager with updated state and log
		return new StateManager(
			{ schema: this.schema, initial: {} },
			newState,
			newLog
		);
	}

	/**
	 * Update state from a member (returns new StateManager instance)
	 * Use applyPendingUpdates for better performance when using getStateForMember
	 */
	setStateFromMember(
		memberName: string,
		updates: Record<string, any>,
		config: MemberStateConfig
	): StateManager {
		const { set = [] } = config;

		// Create new state object
		const newState: Record<string, any> = { ...this.state };
		const newLog: AccessLogEntry[] = [...this.accessLog];

		for (const [key, value] of Object.entries(updates)) {
			if (set.includes(key)) {
				newState[key] = value;
				newLog.push({
					member: memberName,
					key,
					operation: 'write',
					timestamp: Date.now()
				});
			} else {
				console.warn(`Member "${memberName}" attempted to set undeclared state key: "${key}"`);
			}
		}

		// Return new StateManager with updated state
		return new StateManager(
			{ schema: this.schema, initial: {} },
			newState,
			newLog
		);
	}

	/**
	 * Get the full current state snapshot
	 */
	getState(): Readonly<Record<string, any>> {
		return this.state;
	}

	/**
	 * Generate an access report showing state usage patterns
	 */
	getAccessReport(): AccessReport {
		const allKeys = Object.keys(this.state);
		const usedKeys = new Set<string>();

		// Collect all keys that were accessed
		for (const access of this.accessLog) {
			usedKeys.add(access.key);
		}

		// Find unused keys
		const unusedKeys = allKeys.filter(key => !usedKeys.has(key));

		// Group access log by member
		const accessPatterns: Record<string, AccessLogEntry[]> = {};
		for (const access of this.accessLog) {
			if (!accessPatterns[access.member]) {
				accessPatterns[access.member] = [];
			}
			accessPatterns[access.member].push(access);
		}

		return {
			unusedKeys,
			accessPatterns
		};
	}

	/**
	 * Clear access logs (returns new instance)
	 */
	clearAccessLog(): StateManager {
		return new StateManager(
			{ schema: this.schema, initial: {} },
			this.state,
			[]
		);
	}

	/**
	 * Reset state to initial values (returns new instance)
	 */
	reset(initialState?: Record<string, any>): StateManager {
		return new StateManager(
			{ schema: this.schema, initial: initialState || {} },
			undefined,
			[]
		);
	}

	/**
	 * Create a new StateManager with merged state
	 */
	merge(updates: Record<string, any>): StateManager {
		const newState = { ...this.state, ...updates };
		return new StateManager(
			{ schema: this.schema, initial: {} },
			newState,
			this.accessLog
		);
	}
}
