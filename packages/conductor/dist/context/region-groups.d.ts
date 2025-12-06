/**
 * Region Groups
 *
 * Predefined groups of countries for easy location checks.
 * Enables patterns like: ctx.location.isIn(['EU']) or ctx.location.isIn(['APAC'])
 */
/**
 * Region groups mapping group names to country codes
 *
 * Groups are organized by:
 * - Privacy jurisdictions (EU, EEA, GDPR)
 * - Geographic regions (EUROPE, NORTH_AMERICA, LATAM, APAC, MENA)
 * - Trade blocs (NAFTA, MERCOSUR, ASEAN)
 * - Intelligence alliances (useful for data sovereignty decisions)
 */
export declare const REGION_GROUPS: Record<string, readonly string[]>;
/**
 * Location data needed for isIn check
 */
interface IsInLocation {
    country: string;
    regionCode: string;
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
export declare function isIn(location: IsInLocation, targets: string[]): boolean;
/**
 * Get all countries in a region group
 *
 * @param groupName - Name of the region group
 * @returns Array of country codes, or empty array if group not found
 */
export declare function getGroupCountries(groupName: string): readonly string[];
/**
 * Check if a group name exists
 *
 * @param groupName - Name to check
 * @returns True if group exists
 */
export declare function isValidGroup(groupName: string): boolean;
/**
 * Get all available region group names
 */
export declare function getAvailableGroups(): string[];
export {};
//# sourceMappingURL=region-groups.d.ts.map