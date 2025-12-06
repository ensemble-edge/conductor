/**
 * Jurisdiction Detection
 *
 * Determines which privacy laws apply based on user location.
 * Uses conservative approach: if multiple jurisdictions apply, all are reported.
 */
import { type Jurisdiction } from './jurisdiction-data.js';
/**
 * Location data needed for jurisdiction detection
 */
export interface JurisdictionLocation {
    country: string;
    regionCode: string;
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
export declare function detectJurisdictions(location: JurisdictionLocation): Jurisdiction[];
/**
 * Get the primary jurisdiction for a location
 *
 * @param location - Location with country and regionCode
 * @returns Primary jurisdiction or null if none apply
 */
export declare function getPrimaryJurisdiction(location: JurisdictionLocation): Jurisdiction | null;
/**
 * Check if a specific jurisdiction applies to a location
 *
 * @param location - Location with country and regionCode
 * @param jurisdiction - Jurisdiction to check
 * @returns True if the jurisdiction applies
 */
export declare function hasJurisdiction(location: JurisdictionLocation, jurisdiction: Jurisdiction): boolean;
/**
 * Check if location is in EU
 */
export declare function isInEU(country: string): boolean;
/**
 * Check if location is in EEA (EU + Iceland, Liechtenstein, Norway)
 */
export declare function isInEEA(country: string): boolean;
/**
 * Check if GDPR applies to this location
 */
export declare function isGDPRApplicable(country: string): boolean;
export type { Jurisdiction };
//# sourceMappingURL=jurisdiction.d.ts.map