/**
 * Utilities - Exports
 *
 * Core utilities for normalization, URL resolution, and script loading.
 */
export { NormalizationRegistry, normalizeURL, normalizeDomain, normalizeCompanyName, normalizeEmail, getGlobalNormalizationRegistry, normalize, } from './normalization.js';
export { URLResolver, resolveURL, isURLReachable } from './url-resolver.js';
// Script loader for bundled scripts (Workers-compatible)
export { createScriptLoader, parseScriptURI, isScriptReference, setGlobalScriptLoader, getGlobalScriptLoader, hasGlobalScriptLoader, } from './script-loader.js';
