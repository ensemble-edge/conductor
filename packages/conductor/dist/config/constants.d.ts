/**
 * Conductor Configuration Constants
 *
 * Centralized configuration for all magic numbers and hardcoded values.
 * Makes configuration explicit, discoverable, and easy to modify.
 */
/**
 * Timeout Configuration (in milliseconds)
 */
export declare const TIMEOUTS: {
    /** Default API request timeout (30 seconds) */
    readonly API_DEFAULT: 30000;
    /** Short timeout for quick operations (5 seconds) */
    readonly API_SHORT: 5000;
    /** Long timeout for complex operations (10 seconds) */
    readonly API_LONG: 10000;
    /** HITL approval timeout (24 hours) */
    readonly HITL_APPROVAL: 86400000;
    /** Database query timeout (30 seconds) */
    readonly DATABASE: 30000;
    /** Webhook delivery timeout (30 seconds) */
    readonly WEBHOOK: 30000;
};
/**
 * TTL Configuration (Time To Live in seconds)
 */
export declare const TTL: {
    /** Default cache TTL (1 hour) */
    readonly CACHE_DEFAULT: 3600;
    /** Short-lived cache (5 minutes) */
    readonly CACHE_SHORT: 300;
    /** Long-lived cache (24 hours) */
    readonly CACHE_LONG: 86400;
    /** Session memory TTL (1 hour) */
    readonly SESSION: 3600;
    /** Resumption token TTL (24 hours) */
    readonly RESUMPTION_TOKEN: 86400;
    /** Analytical memory cache (5 minutes) */
    readonly ANALYTICAL_CACHE: 300;
};
/**
 * Retry Configuration
 */
export declare const RETRY: {
    /** Default number of retries for failed operations */
    readonly DEFAULT_MAX: 3;
    /** Max retries for scoring agent execution */
    readonly SCORING_MAX: 3;
};
/**
 * Threshold Configuration (0.0 to 1.0)
 */
export declare const THRESHOLDS: {
    /** Default minimum score threshold (70%) */
    readonly SCORE_MINIMUM: 0.7;
    /** High confidence threshold (80%) */
    readonly SCORE_HIGH: 0.8;
    /** Quality degradation detection threshold (10% drop) */
    readonly QUALITY_DEGRADATION: 0.1;
    /** Score change detection threshold (5% change) */
    readonly SCORE_CHANGE: 0.05;
};
/**
 * Size and Limit Configuration
 */
export declare const LIMITS: {
    /** Default chunk size for text processing */
    readonly CHUNK_SIZE: 512;
    /** Window size for quality trend analysis */
    readonly QUALITY_WINDOW: 5;
    /** Maximum input length for sanitization */
    readonly INPUT_MAX_LENGTH: 1000;
};
/**
 * HTTP Status Codes
 */
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly TIMEOUT: 504;
    readonly RATE_LIMIT: 429;
    readonly INTERNAL_ERROR: 500;
};
/**
 * Complete Conductor Configuration
 * Re-exports all configuration constants
 */
export declare const ConductorConfig: {
    readonly timeouts: {
        /** Default API request timeout (30 seconds) */
        readonly API_DEFAULT: 30000;
        /** Short timeout for quick operations (5 seconds) */
        readonly API_SHORT: 5000;
        /** Long timeout for complex operations (10 seconds) */
        readonly API_LONG: 10000;
        /** HITL approval timeout (24 hours) */
        readonly HITL_APPROVAL: 86400000;
        /** Database query timeout (30 seconds) */
        readonly DATABASE: 30000;
        /** Webhook delivery timeout (30 seconds) */
        readonly WEBHOOK: 30000;
    };
    readonly ttl: {
        /** Default cache TTL (1 hour) */
        readonly CACHE_DEFAULT: 3600;
        /** Short-lived cache (5 minutes) */
        readonly CACHE_SHORT: 300;
        /** Long-lived cache (24 hours) */
        readonly CACHE_LONG: 86400;
        /** Session memory TTL (1 hour) */
        readonly SESSION: 3600;
        /** Resumption token TTL (24 hours) */
        readonly RESUMPTION_TOKEN: 86400;
        /** Analytical memory cache (5 minutes) */
        readonly ANALYTICAL_CACHE: 300;
    };
    readonly retry: {
        /** Default number of retries for failed operations */
        readonly DEFAULT_MAX: 3;
        /** Max retries for scoring agent execution */
        readonly SCORING_MAX: 3;
    };
    readonly thresholds: {
        /** Default minimum score threshold (70%) */
        readonly SCORE_MINIMUM: 0.7;
        /** High confidence threshold (80%) */
        readonly SCORE_HIGH: 0.8;
        /** Quality degradation detection threshold (10% drop) */
        readonly QUALITY_DEGRADATION: 0.1;
        /** Score change detection threshold (5% change) */
        readonly SCORE_CHANGE: 0.05;
    };
    readonly limits: {
        /** Default chunk size for text processing */
        readonly CHUNK_SIZE: 512;
        /** Window size for quality trend analysis */
        readonly QUALITY_WINDOW: 5;
        /** Maximum input length for sanitization */
        readonly INPUT_MAX_LENGTH: 1000;
    };
    readonly httpStatus: {
        readonly OK: 200;
        readonly BAD_REQUEST: 400;
        readonly UNAUTHORIZED: 401;
        readonly FORBIDDEN: 403;
        readonly NOT_FOUND: 404;
        readonly TIMEOUT: 504;
        readonly RATE_LIMIT: 429;
        readonly INTERNAL_ERROR: 500;
    };
};
export default ConductorConfig;
//# sourceMappingURL=constants.d.ts.map