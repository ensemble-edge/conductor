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
        useAI: false,
        aiMember: 'docs-writer',
        format: 'yaml',
        includeExamples: true,
        includeSecurity: true,
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
        logging: true,
        logLevel: 'info',
        metrics: true,
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
};
