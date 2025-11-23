/**
 * Conductor Configuration Constants
 *
 * Centralized configuration for all magic numbers and hardcoded values.
 * Makes configuration explicit, discoverable, and easy to modify.
 */
/**
 * Timeout Configuration (in milliseconds)
 */
export const TIMEOUTS = {
    /** Default API request timeout (30 seconds) */
    API_DEFAULT: 30000,
    /** Short timeout for quick operations (5 seconds) */
    API_SHORT: 5000,
    /** Long timeout for complex operations (10 seconds) */
    API_LONG: 10000,
    /** HITL approval timeout (24 hours) */
    HITL_APPROVAL: 86400000,
    /** Database query timeout (30 seconds) */
    DATABASE: 30000,
    /** Webhook delivery timeout (30 seconds) */
    WEBHOOK: 30000,
};
/**
 * TTL Configuration (Time To Live in seconds)
 */
export const TTL = {
    /** Default cache TTL (1 hour) */
    CACHE_DEFAULT: 3600,
    /** Short-lived cache (5 minutes) */
    CACHE_SHORT: 300,
    /** Long-lived cache (24 hours) */
    CACHE_LONG: 86400,
    /** Session memory TTL (1 hour) */
    SESSION: 3600,
    /** Resumption token TTL (24 hours) */
    RESUMPTION_TOKEN: 86400,
    /** Analytical memory cache (5 minutes) */
    ANALYTICAL_CACHE: 300,
};
/**
 * Retry Configuration
 */
export const RETRY = {
    /** Default number of retries for failed operations */
    DEFAULT_MAX: 3,
    /** Max retries for scoring agent execution */
    SCORING_MAX: 3,
};
/**
 * Threshold Configuration (0.0 to 1.0)
 */
export const THRESHOLDS = {
    /** Default minimum score threshold (70%) */
    SCORE_MINIMUM: 0.7,
    /** High confidence threshold (80%) */
    SCORE_HIGH: 0.8,
    /** Quality degradation detection threshold (10% drop) */
    QUALITY_DEGRADATION: 0.1,
    /** Score change detection threshold (5% change) */
    SCORE_CHANGE: 0.05,
};
/**
 * Size and Limit Configuration
 */
export const LIMITS = {
    /** Default chunk size for text processing */
    CHUNK_SIZE: 512,
    /** Window size for quality trend analysis */
    QUALITY_WINDOW: 5,
    /** Maximum input length for sanitization */
    INPUT_MAX_LENGTH: 1000,
};
/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TIMEOUT: 504,
    RATE_LIMIT: 429,
    INTERNAL_ERROR: 500,
};
/**
 * Complete Conductor Configuration
 * Re-exports all configuration constants
 */
export const ConductorConfig = {
    timeouts: TIMEOUTS,
    ttl: TTL,
    retry: RETRY,
    thresholds: THRESHOLDS,
    limits: LIMITS,
    httpStatus: HTTP_STATUS,
};
export default ConductorConfig;
