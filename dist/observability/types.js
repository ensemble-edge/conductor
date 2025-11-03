/**
 * Observability Types
 *
 * Type definitions for logging, tracing, and metrics following
 * Cloudflare Workers Observability best practices (2025).
 */
/**
 * Log levels following standard severity hierarchy
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (LogLevel = {}));
