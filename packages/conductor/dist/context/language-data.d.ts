/**
 * Language Data
 *
 * Mapping of countries to their official/primary languages.
 * Used for language inference when Accept-Language header is not available.
 */
/**
 * Country to official languages mapping (ISO 639-1 codes)
 * First language in array is the primary/most common
 */
export declare const COUNTRY_LANGUAGES: Record<string, string[]>;
/**
 * Get the primary language for a country
 */
export declare function getPrimaryLanguage(country: string): string;
/**
 * Get all official languages for a country
 */
export declare function getCountryLanguages(country: string): string[];
//# sourceMappingURL=language-data.d.ts.map