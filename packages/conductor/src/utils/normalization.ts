/**
 * Normalization Utilities
 *
 * Provides consistent normalization for common data types:
 * - URLs (lowercase, strip trailing slash, normalize www)
 * - Domains (lowercase, remove www)
 * - Company names (titlecase, remove suffixes)
 * - Emails (lowercase, trim)
 *
 * Follows registry pattern for extensibility.
 */

export type NormalizerFunction = (input: string) => string

export interface NormalizerMetadata {
  name: string
  description: string
  examples?: Array<{ input: string; output: string }>
}

export interface NormalizerEntry {
  metadata: NormalizerMetadata
  normalizer: NormalizerFunction
}

/**
 * Normalization Registry
 */
export class NormalizationRegistry {
  private normalizers = new Map<string, NormalizerEntry>()

  /**
   * Register a normalizer
   */
  register(metadata: NormalizerMetadata, normalizer: NormalizerFunction): void {
    this.normalizers.set(metadata.name, { metadata, normalizer })
  }

  /**
   * Get a normalizer by name
   */
  get(name: string): NormalizerFunction | null {
    const entry = this.normalizers.get(name)
    return entry ? entry.normalizer : null
  }

  /**
   * Check if a normalizer exists
   */
  has(name: string): boolean {
    return this.normalizers.has(name)
  }

  /**
   * List all registered normalizers
   */
  list(): NormalizerMetadata[] {
    return Array.from(this.normalizers.values()).map((entry) => entry.metadata)
  }

  /**
   * Normalize using a specific normalizer
   */
  normalize(name: string, input: string): string {
    const normalizer = this.get(name)
    if (!normalizer) {
      throw new Error(`Normalizer not found: ${name}`)
    }
    return normalizer(input)
  }
}

/**
 * URL Normalizer
 */
export function normalizeURL(url: string): string {
  try {
    // Parse URL
    const parsed = new URL(url)

    // Lowercase protocol and hostname
    parsed.protocol = parsed.protocol.toLowerCase()
    parsed.hostname = parsed.hostname.toLowerCase()

    // Remove trailing slash from pathname
    if (parsed.pathname.endsWith('/') && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.slice(0, -1)
    }

    // Sort query parameters
    const params = Array.from(parsed.searchParams.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    )
    parsed.search = ''
    params.forEach(([key, value]) => parsed.searchParams.append(key, value))

    return parsed.toString()
  } catch (error) {
    // If URL parsing fails, return lowercase trimmed version
    return url.toLowerCase().trim()
  }
}

/**
 * Domain Normalizer
 */
export function normalizeDomain(domain: string): string {
  // Remove protocol if present
  let normalized = domain.replace(/^https?:\/\//i, '')

  // Remove www prefix
  normalized = normalized.replace(/^www\./i, '')

  // Remove path if present
  normalized = normalized.split('/')[0]

  // Remove port if present
  normalized = normalized.split(':')[0]

  // Lowercase
  normalized = normalized.toLowerCase().trim()

  return normalized
}

/**
 * Company Name Normalizer
 */
export function normalizeCompanyName(name: string): string {
  // Trim whitespace
  let normalized = name.trim()

  // Remove common suffixes
  const suffixes = [
    'Inc.',
    'Inc',
    'LLC',
    'L.L.C.',
    'Ltd.',
    'Ltd',
    'Limited',
    'Corp.',
    'Corp',
    'Corporation',
    'Co.',
    'Co',
    'Company',
    'LP',
    'L.P.',
    'LLP',
    'L.L.P.',
    'PLC',
    'P.L.C.',
  ]

  for (const suffix of suffixes) {
    const regex = new RegExp(`[,\\s]+${suffix.replace('.', '\\.')}$`, 'i')
    normalized = normalized.replace(regex, '')
  }

  // Titlecase (capitalize first letter of each word)
  normalized = normalized
    .split(' ')
    .map((word) => {
      if (word.length === 0) return word
      // Preserve all-caps acronyms
      if (word === word.toUpperCase() && word.length > 1) return word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')

  return normalized.trim()
}

/**
 * Email Normalizer
 */
export function normalizeEmail(email: string): string {
  // Lowercase and trim
  let normalized = email.toLowerCase().trim()

  // Remove dots from Gmail addresses (gmail ignores dots)
  const [local, domain] = normalized.split('@')
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Remove dots and ignore everything after +
    const cleanLocal = local.replace(/\./g, '').split('+')[0]
    normalized = `${cleanLocal}@gmail.com`
  }

  return normalized
}

/**
 * Global normalization registry instance
 */
let globalRegistry: NormalizationRegistry | null = null

/**
 * Get or create the global normalization registry
 */
export function getGlobalNormalizationRegistry(): NormalizationRegistry {
  if (!globalRegistry) {
    globalRegistry = new NormalizationRegistry()

    // Register built-in normalizers
    globalRegistry.register(
      {
        name: 'url',
        description: 'Normalize URLs (lowercase, remove trailing slash, sort params)',
        examples: [
          { input: 'https://Example.com/Path/', output: 'https://example.com/Path' },
          { input: 'http://example.com?b=2&a=1', output: 'http://example.com?a=1&b=2' },
        ],
      },
      normalizeURL
    )

    globalRegistry.register(
      {
        name: 'domain',
        description: 'Normalize domains (lowercase, remove www, protocol, path)',
        examples: [
          { input: 'https://www.Example.com/path', output: 'example.com' },
          { input: 'www.Example.com:8080', output: 'example.com' },
        ],
      },
      normalizeDomain
    )

    globalRegistry.register(
      {
        name: 'company',
        description: 'Normalize company names (titlecase, remove suffixes)',
        examples: [
          { input: 'acme corporation', output: 'Acme' },
          { input: 'WIDGETS, INC.', output: 'Widgets' },
        ],
      },
      normalizeCompanyName
    )

    globalRegistry.register(
      {
        name: 'email',
        description: 'Normalize email addresses (lowercase, Gmail dot removal)',
        examples: [
          { input: 'User@Example.com', output: 'user@example.com' },
          { input: 'user.name+tag@gmail.com', output: 'username@gmail.com' },
        ],
      },
      normalizeEmail
    )
  }

  return globalRegistry
}

/**
 * Convenience function to normalize using the global registry
 */
export function normalize(type: string, input: string): string {
  return getGlobalNormalizationRegistry().normalize(type, input)
}
