/**
 * Agent Type Definitions
 *
 * Core types for defining agents in the Conductor framework.
 * Agents are the fundamental building blocks that perform operations.
 */
/**
 * Type guard to check if a value is a valid AgentStatus
 */
export const isAgentStatus = (value) => {
    return ['active', 'inactive', 'error', 'suspended'].includes(value);
};
/**
 * Type guard to check if a value is a valid AgentPriority
 */
export const isAgentPriority = (value) => {
    return ['low', 'normal', 'high', 'critical'].includes(value);
};
/**
 * Create default agent config
 */
export const createDefaultAgentConfig = (name, operation) => {
    return {
        name,
        operation,
        priority: 'normal',
        enabled: true,
        timeout: 30000, // 30 seconds
        retry: {
            maxAttempts: 3,
            backoff: 'exponential',
            initialDelay: 1000,
            maxDelay: 10000,
        },
    };
};
