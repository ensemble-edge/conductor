/**
 * Utilities - Exports
 *
 * Core utilities for normalization and URL resolution.
 */

export {
  NormalizationRegistry,
  normalizeURL,
  normalizeDomain,
  normalizeCompanyName,
  normalizeEmail,
  getGlobalNormalizationRegistry,
  normalize,
} from './normalization'

export type { NormalizerFunction, NormalizerMetadata, NormalizerEntry } from './normalization'

export { URLResolver, resolveURL, isURLReachable } from './url-resolver'

export type { URLResolverOptions, URLResolution } from './url-resolver'
