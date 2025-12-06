/**
 * Analytics Types
 *
 * Types for Workers Analytics Engine integration.
 * Analytics is for aggregated metrics (counts, rates, costs) - not debugging traces.
 */
/**
 * Default instrumentation config
 */
export const DEFAULT_INSTRUMENTATION_CONFIG = {
    enabled: true,
    dataset: 'telemetry',
    agents: true,
    ensembles: true,
    steps: false,
    errors: true,
    console: true,
};
