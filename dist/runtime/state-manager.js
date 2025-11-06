/**
 * State Manager V2 - Refactored for Immutability
 *
 * Returns new instances instead of mutating internal state.
 * Follows functional programming principles for predictability.
 */
import { createLogger } from '../observability/index.js';
/**
 * Immutable StateManager - returns new instances for all mutations
 */
export class StateManager {
    constructor(config, existingState, existingLog) {
        this.schema = Object.freeze(config.schema || {});
        this.state = Object.freeze(existingState || { ...(config.initial || {}) });
        this.accessLog = existingLog || [];
        this.logger = config.logger || createLogger({ serviceName: 'state-manager' });
    }
    /**
     * Create a state context for a specific member
     * Returns both the context and a function to retrieve accumulated updates
     */
    getStateForMember(memberName, config) {
        const { use = [], set = [] } = config;
        // Create read-only state view (only includes declared 'use' keys)
        const viewState = {};
        const newLog = [...this.accessLog];
        for (const key of use) {
            if (this.state && key in this.state) {
                viewState[key] = this.state[key];
                newLog.push({
                    member: memberName,
                    key,
                    operation: 'read',
                    timestamp: Date.now(),
                });
            }
        }
        // Track pending updates in closure
        const pendingUpdates = {};
        // Create setState function that accumulates updates
        const setState = (updates) => {
            for (const [key, value] of Object.entries(updates)) {
                if (set.includes(key)) {
                    pendingUpdates[key] = value;
                    newLog.push({
                        member: memberName,
                        key,
                        operation: 'write',
                        timestamp: Date.now(),
                    });
                }
                else {
                    this.logger.warn('Member attempted to set undeclared state key', {
                        memberName,
                        key,
                        declaredKeys: set,
                    });
                }
            }
        };
        return {
            context: {
                state: Object.freeze(viewState),
                setState,
            },
            getPendingUpdates: () => ({ updates: pendingUpdates, newLog }),
        };
    }
    /**
     * Apply pending updates from a member execution (returns new StateManager instance)
     * This is the preferred method when using getStateForMember with getPendingUpdates
     */
    applyPendingUpdates(updates, newLog) {
        // If no updates, return this instance (optimization)
        if (Object.keys(updates).length === 0 && newLog.length === this.accessLog.length) {
            return this;
        }
        // Create new state with updates
        const newState = { ...this.state, ...updates };
        // Return new StateManager with updated state and log
        return new StateManager({ schema: this.schema, initial: {}, logger: this.logger }, newState, newLog);
    }
    /**
     * Update state from a member (returns new StateManager instance)
     * Use applyPendingUpdates for better performance when using getStateForMember
     */
    setStateFromMember(memberName, updates, config) {
        const { set = [] } = config;
        // Create new state object
        const newState = { ...this.state };
        const newLog = [...this.accessLog];
        for (const [key, value] of Object.entries(updates)) {
            if (set.includes(key)) {
                newState[key] = value;
                newLog.push({
                    member: memberName,
                    key,
                    operation: 'write',
                    timestamp: Date.now(),
                });
            }
            else {
                this.logger.warn('Member attempted to set undeclared state key', {
                    memberName,
                    key,
                    declaredKeys: set,
                });
            }
        }
        // Return new StateManager with updated state
        return new StateManager({ schema: this.schema, initial: {}, logger: this.logger }, newState, newLog);
    }
    /**
     * Get the full current state snapshot
     */
    getState() {
        return this.state;
    }
    /**
     * Generate an access report showing state usage patterns
     */
    getAccessReport() {
        const allKeys = Object.keys(this.state);
        const usedKeys = new Set();
        // Collect all keys that were accessed
        for (const access of this.accessLog) {
            usedKeys.add(access.key);
        }
        // Find unused keys
        const unusedKeys = allKeys.filter((key) => !usedKeys.has(key));
        // Group access log by member
        const accessPatterns = {};
        for (const access of this.accessLog) {
            if (!accessPatterns[access.member]) {
                accessPatterns[access.member] = [];
            }
            accessPatterns[access.member].push(access);
        }
        return {
            unusedKeys,
            accessPatterns,
        };
    }
    /**
     * Clear access logs (returns new instance)
     */
    clearAccessLog() {
        return new StateManager({ schema: this.schema, initial: {}, logger: this.logger }, this.state, []);
    }
    /**
     * Reset state to initial values (returns new instance)
     */
    reset(initialState) {
        return new StateManager({ schema: this.schema, initial: initialState || {}, logger: this.logger }, undefined, []);
    }
    /**
     * Create a new StateManager with merged state
     */
    merge(updates) {
        const newState = { ...this.state, ...updates };
        return new StateManager({ schema: this.schema, initial: {}, logger: this.logger }, newState, this.accessLog);
    }
}
