/**
 * Jurisdiction Detection
 *
 * Determines which privacy laws apply based on user location.
 * Uses conservative approach: if multiple jurisdictions apply, all are reported.
 */

import {
  type Jurisdiction,
  GDPR_COUNTRIES,
  EU_COUNTRIES,
  EEA_COUNTRIES,
} from './jurisdiction-data.js'

/**
 * Location data needed for jurisdiction detection
 */
export interface JurisdictionLocation {
  country: string
  regionCode: string
}

/**
 * Detect all applicable jurisdictions for a location
 *
 * Returns an array of applicable privacy laws. The first element
 * is considered the "primary" jurisdiction.
 *
 * @param location - Location with country and regionCode
 * @returns Array of applicable jurisdictions
 *
 * @example
 * ```typescript
 * detectJurisdictions({ country: 'DE', regionCode: '' })
 * // => ['GDPR']
 *
 * detectJurisdictions({ country: 'US', regionCode: 'CA' })
 * // => ['CCPA']
 *
 * detectJurisdictions({ country: 'BR', regionCode: '' })
 * // => ['LGPD']
 * ```
 */
export function detectJurisdictions(location: JurisdictionLocation): Jurisdiction[] {
  const result: Jurisdiction[] = []
  const { country, regionCode } = location

  // GDPR: EU + EEA + UK
  if ((GDPR_COUNTRIES as readonly string[]).includes(country)) {
    result.push('GDPR')
  }

  // CCPA/CPRA: California
  if (country === 'US' && regionCode === 'CA') {
    result.push('CCPA')
  }

  // LGPD: Brazil
  if (country === 'BR') {
    result.push('LGPD')
  }

  // PIPEDA: Canada (federal level)
  if (country === 'CA') {
    result.push('PIPEDA')
  }

  // POPIA: South Africa
  if (country === 'ZA') {
    result.push('POPIA')
  }

  // PDPA: Singapore
  if (country === 'SG') {
    result.push('PDPA')
  }

  // APPI: Japan
  if (country === 'JP') {
    result.push('APPI')
  }

  return result
}

/**
 * Get the primary jurisdiction for a location
 *
 * @param location - Location with country and regionCode
 * @returns Primary jurisdiction or null if none apply
 */
export function getPrimaryJurisdiction(location: JurisdictionLocation): Jurisdiction | null {
  const jurisdictions = detectJurisdictions(location)
  return jurisdictions[0] || null
}

/**
 * Check if a specific jurisdiction applies to a location
 *
 * @param location - Location with country and regionCode
 * @param jurisdiction - Jurisdiction to check
 * @returns True if the jurisdiction applies
 */
export function hasJurisdiction(
  location: JurisdictionLocation,
  jurisdiction: Jurisdiction
): boolean {
  return detectJurisdictions(location).includes(jurisdiction)
}

/**
 * Check if location is in EU
 */
export function isInEU(country: string): boolean {
  return (EU_COUNTRIES as readonly string[]).includes(country)
}

/**
 * Check if location is in EEA (EU + Iceland, Liechtenstein, Norway)
 */
export function isInEEA(country: string): boolean {
  return (EEA_COUNTRIES as readonly string[]).includes(country)
}

/**
 * Check if GDPR applies to this location
 */
export function isGDPRApplicable(country: string): boolean {
  return (GDPR_COUNTRIES as readonly string[]).includes(country)
}

// Re-export jurisdiction type
export type { Jurisdiction }
