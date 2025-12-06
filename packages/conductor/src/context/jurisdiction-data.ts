/**
 * Jurisdiction Data
 *
 * Country lists for privacy jurisdictions (GDPR, CCPA, etc.)
 * and geographic groupings (EU, EEA, etc.)
 */

/**
 * European Union member states (27 countries as of 2024)
 * These countries are subject to EU regulations including GDPR
 */
export const EU_COUNTRIES = [
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czech Republic
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
] as const

/**
 * European Economic Area (EU + Iceland, Liechtenstein, Norway)
 * GDPR applies to all EEA countries
 */
export const EEA_COUNTRIES = [
  ...EU_COUNTRIES,
  'IS', // Iceland
  'LI', // Liechtenstein
  'NO', // Norway
] as const

/**
 * Countries where GDPR applies
 * Includes EEA + UK (which retained GDPR post-Brexit as "UK GDPR")
 */
export const GDPR_COUNTRIES = [
  ...EEA_COUNTRIES,
  'GB', // United Kingdom (UK GDPR)
] as const

/**
 * US states with comprehensive privacy laws
 * Used for state-level jurisdiction detection
 */
export const US_PRIVACY_STATES = {
  CA: 'CCPA', // California Consumer Privacy Act / CPRA
  VA: 'VCDPA', // Virginia Consumer Data Protection Act
  CO: 'CPA', // Colorado Privacy Act
  CT: 'CTDPA', // Connecticut Data Privacy Act
  UT: 'UCPA', // Utah Consumer Privacy Act
  // More states coming in 2024-2025
} as const

/**
 * Type for jurisdiction identifiers
 */
export type Jurisdiction =
  | 'GDPR' // EU + EEA + UK
  | 'CCPA' // California (includes CPRA)
  | 'LGPD' // Brazil
  | 'PIPEDA' // Canada
  | 'POPIA' // South Africa
  | 'PDPA' // Singapore, Thailand
  | 'APPI' // Japan

/**
 * Check if a country is in the EU
 */
export function isEU(country: string): boolean {
  return (EU_COUNTRIES as readonly string[]).includes(country)
}

/**
 * Check if a country is in the EEA
 */
export function isEEA(country: string): boolean {
  return (EEA_COUNTRIES as readonly string[]).includes(country)
}

/**
 * Check if GDPR applies to this country
 */
export function isGDPR(country: string): boolean {
  return (GDPR_COUNTRIES as readonly string[]).includes(country)
}

/**
 * Check if this is California (CCPA applies)
 */
export function isCCPA(country: string, regionCode: string): boolean {
  return country === 'US' && regionCode === 'CA'
}

/**
 * Check if this is Brazil (LGPD applies)
 */
export function isLGPD(country: string): boolean {
  return country === 'BR'
}

/**
 * Check if this is a US state with privacy law
 */
export function getUSPrivacyLaw(regionCode: string): string | null {
  return US_PRIVACY_STATES[regionCode as keyof typeof US_PRIVACY_STATES] || null
}
