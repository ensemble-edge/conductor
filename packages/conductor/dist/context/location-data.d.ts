/**
 * Location Data
 *
 * Static data for country names, continent names, and geographic lookups.
 * Data sourced from ISO 3166-1 alpha-2 country codes.
 */
/**
 * ISO 3166-1 alpha-2 country codes to human-readable names
 */
export declare const COUNTRY_NAMES: Record<string, string>;
/**
 * Continent codes to human-readable names
 */
export declare const CONTINENT_NAMES: Record<string, string>;
/**
 * Get country name from ISO code
 */
export declare function getCountryName(code: string): string;
/**
 * Get continent name from code
 */
export declare function getContinentName(code: string): string;
//# sourceMappingURL=location-data.d.ts.map