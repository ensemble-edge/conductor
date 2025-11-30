/**
 * Conductor Configuration Types
 *
 * Type-safe configuration for Conductor projects.
 */
/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
    docs: {
        title: 'API Documentation',
        ui: 'stoplight',
        auth: {
            requirement: 'public',
        },
        ai: {
            enabled: false,
            model: '@cf/meta/llama-3.1-8b-instruct',
            provider: 'cloudflare',
            temperature: 0.3,
        },
        includeExamples: true,
        includeSecurity: true,
        cache: {
            enabled: true,
            ttl: 300,
        },
        format: 'yaml',
        outputDir: './docs',
    },
    testing: {
        coverage: {
            lines: 70,
            functions: 70,
            branches: 65,
            statements: 70,
        },
        timeout: 30000,
        environment: 'node',
        globals: true,
    },
    observability: {
        logging: {
            enabled: true,
            level: 'info',
            format: 'json',
            context: ['requestId', 'executionId', 'ensembleName', 'agentName'],
            redact: ['password', 'apiKey', 'token', 'authorization', 'secret', 'creditCard'],
            events: ['request', 'response', 'agent:start', 'agent:complete', 'agent:error'],
        },
        metrics: {
            enabled: true,
            binding: 'ANALYTICS',
            track: ['ensemble:execution', 'agent:execution', 'http:request', 'error'],
        },
        trackTokenUsage: true,
    },
    execution: {
        defaultTimeout: 30000,
        trackHistory: true,
        maxHistoryEntries: 1000,
        storeStateSnapshots: true,
    },
    storage: {
        type: 'filesystem',
        path: './.conductor',
    },
    api: {
        execution: {
            agents: {
                requireExplicit: false,
            },
            ensembles: {
                requireExplicit: false,
            },
        },
    },
};
