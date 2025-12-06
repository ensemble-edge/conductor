/**
 * Region Groups
 *
 * Predefined groups of countries for easy location checks.
 * Enables patterns like: ctx.location.isIn(['EU']) or ctx.location.isIn(['APAC'])
 */

import { EU_COUNTRIES, EEA_COUNTRIES, GDPR_COUNTRIES } from './jurisdiction-data.js'

/**
 * Region groups mapping group names to country codes
 *
 * Groups are organized by:
 * - Privacy jurisdictions (EU, EEA, GDPR)
 * - Geographic regions (EUROPE, NORTH_AMERICA, LATAM, APAC, MENA)
 * - Trade blocs (NAFTA, MERCOSUR, ASEAN)
 * - Intelligence alliances (useful for data sovereignty decisions)
 */
export const REGION_GROUPS: Record<string, readonly string[]> = {
  // ─────────────────────────────────────────────────────────────
  // Privacy Jurisdictions
  // ─────────────────────────────────────────────────────────────
  EU: EU_COUNTRIES,
  EEA: EEA_COUNTRIES,
  GDPR: GDPR_COUNTRIES,

  // ─────────────────────────────────────────────────────────────
  // Geographic Regions
  // ─────────────────────────────────────────────────────────────
  EUROPE: [
    ...EEA_COUNTRIES,
    'GB', // United Kingdom
    'CH', // Switzerland
    'UA', // Ukraine
    'BY', // Belarus
    'MD', // Moldova
    'AL', // Albania
    'MK', // North Macedonia
    'RS', // Serbia
    'ME', // Montenegro
    'BA', // Bosnia and Herzegovina
    'XK', // Kosovo
  ],

  NORTH_AMERICA: [
    'US', // United States
    'CA', // Canada
    'MX', // Mexico
  ],

  LATAM: [
    'MX', // Mexico
    'GT', // Guatemala
    'BZ', // Belize
    'HN', // Honduras
    'SV', // El Salvador
    'NI', // Nicaragua
    'CR', // Costa Rica
    'PA', // Panama
    'CO', // Colombia
    'VE', // Venezuela
    'EC', // Ecuador
    'PE', // Peru
    'BR', // Brazil
    'BO', // Bolivia
    'PY', // Paraguay
    'UY', // Uruguay
    'AR', // Argentina
    'CL', // Chile
    'GY', // Guyana
    'SR', // Suriname
    'GF', // French Guiana
  ],

  APAC: [
    'CN', // China
    'JP', // Japan
    'KR', // South Korea
    'TW', // Taiwan
    'HK', // Hong Kong
    'MO', // Macao
    'SG', // Singapore
    'MY', // Malaysia
    'TH', // Thailand
    'VN', // Vietnam
    'PH', // Philippines
    'ID', // Indonesia
    'AU', // Australia
    'NZ', // New Zealand
    'IN', // India
    'BD', // Bangladesh
    'PK', // Pakistan
    'LK', // Sri Lanka
    'MM', // Myanmar
    'KH', // Cambodia
    'LA', // Laos
    'BN', // Brunei
  ],

  MENA: [
    // Middle East
    'SA', // Saudi Arabia
    'AE', // United Arab Emirates
    'QA', // Qatar
    'KW', // Kuwait
    'BH', // Bahrain
    'OM', // Oman
    'YE', // Yemen
    'IQ', // Iraq
    'IR', // Iran
    'JO', // Jordan
    'LB', // Lebanon
    'SY', // Syria
    'IL', // Israel
    'PS', // Palestine
    'TR', // Turkey
    'CY', // Cyprus
    // North Africa
    'EG', // Egypt
    'LY', // Libya
    'TN', // Tunisia
    'DZ', // Algeria
    'MA', // Morocco
    'SD', // Sudan
  ],

  AFRICA: [
    'ZA', // South Africa
    'NG', // Nigeria
    'KE', // Kenya
    'EG', // Egypt
    'GH', // Ghana
    'TZ', // Tanzania
    'UG', // Uganda
    'ET', // Ethiopia
    'MA', // Morocco
    'DZ', // Algeria
    'TN', // Tunisia
    'LY', // Libya
    'SD', // Sudan
    'AO', // Angola
    'ZW', // Zimbabwe
    'ZM', // Zambia
    'MW', // Malawi
    'MZ', // Mozambique
    'BW', // Botswana
    'NA', // Namibia
    'RW', // Rwanda
    'SN', // Senegal
    'CI', // Cote d'Ivoire
    'CM', // Cameroon
  ],

  // ─────────────────────────────────────────────────────────────
  // Trade Blocs
  // ─────────────────────────────────────────────────────────────
  NAFTA: ['US', 'CA', 'MX'], // Now USMCA
  USMCA: ['US', 'CA', 'MX'],

  MERCOSUR: [
    'BR', // Brazil
    'AR', // Argentina
    'UY', // Uruguay
    'PY', // Paraguay
  ],

  ASEAN: [
    'SG', // Singapore
    'MY', // Malaysia
    'TH', // Thailand
    'VN', // Vietnam
    'PH', // Philippines
    'ID', // Indonesia
    'MM', // Myanmar
    'KH', // Cambodia
    'LA', // Laos
    'BN', // Brunei
  ],

  // ─────────────────────────────────────────────────────────────
  // Intelligence Alliances (relevant for data sovereignty)
  // ─────────────────────────────────────────────────────────────
  FIVE_EYES: ['US', 'GB', 'CA', 'AU', 'NZ'],

  NINE_EYES: ['US', 'GB', 'CA', 'AU', 'NZ', 'DK', 'FR', 'NL', 'NO'],

  FOURTEEN_EYES: [
    'US',
    'GB',
    'CA',
    'AU',
    'NZ',
    'DK',
    'FR',
    'NL',
    'NO',
    'DE',
    'BE',
    'IT',
    'SE',
    'ES',
  ],

  // ─────────────────────────────────────────────────────────────
  // Special Economic Zones
  // ─────────────────────────────────────────────────────────────
  G7: ['US', 'GB', 'CA', 'FR', 'DE', 'IT', 'JP'],

  G20: [
    'US',
    'GB',
    'CA',
    'FR',
    'DE',
    'IT',
    'JP',
    'CN',
    'IN',
    'BR',
    'RU',
    'AU',
    'KR',
    'MX',
    'ID',
    'SA',
    'TR',
    'AR',
    'ZA',
  ],

  BRICS: ['BR', 'RU', 'IN', 'CN', 'ZA'],
}

/**
 * Location data needed for isIn check
 */
interface IsInLocation {
  country: string
  regionCode: string
}

/**
 * Check if a location is in any of the target locations or groups
 *
 * Supports:
 * - Region groups: "EU", "APAC", "GDPR"
 * - Country codes: "US", "DE", "JP"
 * - Country-region: "US-CA" (California), "US-NY" (New York)
 *
 * @param location - Location with country and regionCode
 * @param targets - Array of groups, countries, or country-regions to check
 * @returns True if location matches any target
 *
 * @example
 * ```typescript
 * // Check groups
 * isIn({ country: 'DE', regionCode: '' }, ['EU'])      // true
 * isIn({ country: 'US', regionCode: 'CA' }, ['GDPR'])  // false
 *
 * // Check specific countries
 * isIn({ country: 'JP', regionCode: '' }, ['JP', 'KR', 'CN'])  // true
 *
 * // Check specific state
 * isIn({ country: 'US', regionCode: 'CA' }, ['US-CA'])  // true
 * isIn({ country: 'US', regionCode: 'TX' }, ['US-CA'])  // false
 *
 * // Mixed
 * isIn({ country: 'BR', regionCode: '' }, ['GDPR', 'US-CA', 'BR'])  // true
 * ```
 */
export function isIn(location: IsInLocation, targets: string[]): boolean {
  const { country, regionCode } = location

  return targets.some((target) => {
    // Check if it's a region group
    const group = REGION_GROUPS[target.toUpperCase()]
    if (group) {
      return group.includes(country)
    }

    // Check if it's a country-region code (e.g., "US-CA")
    if (target.includes('-')) {
      const [targetCountry, targetRegion] = target.split('-')
      return country === targetCountry && regionCode === targetRegion
    }

    // Plain country code
    return country === target.toUpperCase()
  })
}

/**
 * Get all countries in a region group
 *
 * @param groupName - Name of the region group
 * @returns Array of country codes, or empty array if group not found
 */
export function getGroupCountries(groupName: string): readonly string[] {
  return REGION_GROUPS[groupName.toUpperCase()] || []
}

/**
 * Check if a group name exists
 *
 * @param groupName - Name to check
 * @returns True if group exists
 */
export function isValidGroup(groupName: string): boolean {
  return groupName.toUpperCase() in REGION_GROUPS
}

/**
 * Get all available region group names
 */
export function getAvailableGroups(): string[] {
  return Object.keys(REGION_GROUPS)
}
