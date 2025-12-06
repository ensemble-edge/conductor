/**
 * Jurisdiction Detection
 *
 * Determines which privacy laws apply based on user location.
 * Uses conservative approach: if multiple jurisdictions apply, all are reported.
 */
import { GDPR_COUNTRIES, EU_COUNTRIES, EEA_COUNTRIES, } from './jurisdiction-data.js';
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
export function detectJurisdictions(location) {
    const result = [];
    const { country, regionCode } = location;
    // GDPR: EU + EEA + UK
    if (GDPR_COUNTRIES.includes(country)) {
        result.push('GDPR');
    }
    // CCPA/CPRA: California
    if (country === 'US' && regionCode === 'CA') {
        result.push('CCPA');
    }
    // LGPD: Brazil
    if (country === 'BR') {
        result.push('LGPD');
    }
    // PIPEDA: Canada (federal level)
    if (country === 'CA') {
        result.push('PIPEDA');
    }
    // POPIA: South Africa
    if (country === 'ZA') {
        result.push('POPIA');
    }
    // PDPA: Singapore
    if (country === 'SG') {
        result.push('PDPA');
    }
    // APPI: Japan
    if (country === 'JP') {
        result.push('APPI');
    }
    return result;
}
/**
 * Get the primary jurisdiction for a location
 *
 * @param location - Location with country and regionCode
 * @returns Primary jurisdiction or null if none apply
 */
export function getPrimaryJurisdiction(location) {
    const jurisdictions = detectJurisdictions(location);
    return jurisdictions[0] || null;
}
/**
 * Check if a specific jurisdiction applies to a location
 *
 * @param location - Location with country and regionCode
 * @param jurisdiction - Jurisdiction to check
 * @returns True if the jurisdiction applies
 */
export function hasJurisdiction(location, jurisdiction) {
    return detectJurisdictions(location).includes(jurisdiction);
}
/**
 * Check if location is in EU
 */
export function isInEU(country) {
    return EU_COUNTRIES.includes(country);
}
/**
 * Check if location is in EEA (EU + Iceland, Liechtenstein, Norway)
 */
export function isInEEA(country) {
    return EEA_COUNTRIES.includes(country);
}
/**
 * Check if GDPR applies to this location
 */
export function isGDPRApplicable(country) {
    return GDPR_COUNTRIES.includes(country);
}
