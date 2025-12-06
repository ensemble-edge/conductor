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
export declare const EU_COUNTRIES: readonly ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"];
/**
 * European Economic Area (EU + Iceland, Liechtenstein, Norway)
 * GDPR applies to all EEA countries
 */
export declare const EEA_COUNTRIES: readonly ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO"];
/**
 * Countries where GDPR applies
 * Includes EEA + UK (which retained GDPR post-Brexit as "UK GDPR")
 */
export declare const GDPR_COUNTRIES: readonly ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB"];
/**
 * US states with comprehensive privacy laws
 * Used for state-level jurisdiction detection
 */
export declare const US_PRIVACY_STATES: {
    readonly CA: "CCPA";
    readonly VA: "VCDPA";
    readonly CO: "CPA";
    readonly CT: "CTDPA";
    readonly UT: "UCPA";
};
/**
 * Type for jurisdiction identifiers
 */
export type Jurisdiction = 'GDPR' | 'CCPA' | 'LGPD' | 'PIPEDA' | 'POPIA' | 'PDPA' | 'APPI';
/**
 * Check if a country is in the EU
 */
export declare function isEU(country: string): boolean;
/**
 * Check if a country is in the EEA
 */
export declare function isEEA(country: string): boolean;
/**
 * Check if GDPR applies to this country
 */
export declare function isGDPR(country: string): boolean;
/**
 * Check if this is California (CCPA applies)
 */
export declare function isCCPA(country: string, regionCode: string): boolean;
/**
 * Check if this is Brazil (LGPD applies)
 */
export declare function isLGPD(country: string): boolean;
/**
 * Check if this is a US state with privacy law
 */
export declare function getUSPrivacyLaw(regionCode: string): string | null;
//# sourceMappingURL=jurisdiction-data.d.ts.map