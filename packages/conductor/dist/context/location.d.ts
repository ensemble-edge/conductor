/**
 * Location Context
 *
 * Main LocationContext implementation that brings together geographic data,
 * jurisdiction detection, consent helpers, language inference, and timezone utilities.
 *
 * Powered by Cloudflare's request.cf data - available on every request at the edge.
 */
import { type Jurisdiction } from './jurisdiction.js';
import { type ConsentPurpose, type ConsentModel } from './consent-requirements.js';
/**
 * Location context available on every request
 *
 * Provides geographic location, jurisdiction detection, consent helpers,
 * language inference, and timezone utilities.
 *
 * @example
 * ```typescript
 * export default async function myAgent(ctx: AgentExecutionContext) {
 *   const { location } = ctx;
 *
 *   // Geographic
 *   console.log(location.country);     // "US"
 *   console.log(location.city);        // "Austin"
 *
 *   // Jurisdiction
 *   if (location.requiresConsent('analytics')) {
 *     return { needsConsent: true };
 *   }
 *
 *   // Language
 *   const lang = location.preferredLanguage(['en', 'de', 'fr']);
 *
 *   // Time
 *   const localTime = location.formatTime();
 * }
 * ```
 */
export interface LocationContext {
    /** ISO 3166-1 alpha-2 country code (e.g., "US", "DE") */
    country: string;
    /** Human-readable country name (e.g., "United States", "Germany") */
    countryName: string;
    /** Continent code (e.g., "NA", "EU") */
    continent: string;
    /** Human-readable continent name (e.g., "North America", "Europe") */
    continentName: string;
    /** Region/state/province name (e.g., "Texas", "Bavaria") */
    region: string;
    /** Region/state/province code (e.g., "TX", "BY") */
    regionCode: string;
    /** City name (e.g., "Austin", "Munich") */
    city: string;
    /** Postal/ZIP code (e.g., "78701", "80331") */
    postalCode: string;
    /** Latitude coordinate */
    latitude: number;
    /** Longitude coordinate */
    longitude: number;
    /** Coordinates as an object */
    coordinates: {
        lat: number;
        lng: number;
    };
    /** IANA timezone identifier (e.g., "America/Chicago") */
    timezone: string;
    /** Offset from UTC in minutes (DST-aware) */
    timezoneOffset: number;
    /** Offset from UTC in hours (rounded) */
    timezoneOffsetHours: number;
    /** Whether daylight saving time is currently active */
    isDST: boolean;
    /** Best guess language (from Accept-Language or country) */
    language: string;
    /** Country's official languages */
    languages: string[];
    /** Whether the inferred language is RTL */
    isRTL: boolean;
    /** Primary applicable privacy jurisdiction (e.g., "GDPR", "CCPA") */
    jurisdiction: Jurisdiction | null;
    /** All applicable jurisdictions */
    jurisdictions: Jurisdiction[];
    /** Consent model for strictest jurisdiction */
    consentModel: ConsentModel;
    /** True if country is an EU member state */
    isEU: boolean;
    /** True if country is in EEA (EU + Iceland, Liechtenstein, Norway) */
    isEEA: boolean;
    /** True if GDPR applies (EEA + UK) */
    isGDPR: boolean;
    /** True if California (CCPA/CPRA applies) */
    isCCPA: boolean;
    /** True if Brazil (LGPD applies) */
    isLGPD: boolean;
    /**
     * Check if location is in any of the target locations or groups
     *
     * @param targets - Array of groups, countries, or country-regions
     * @returns True if location matches any target
     *
     * @example
     * ```typescript
     * location.isIn(['EU'])           // Any EU country
     * location.isIn(['US-CA'])        // California
     * location.isIn(['GDPR', 'BR'])   // GDPR countries OR Brazil
     * ```
     */
    isIn(targets: string[]): boolean;
    /**
     * Check if consent is required for a specific purpose
     *
     * Uses conservative approach: if ANY applicable jurisdiction
     * requires consent, returns true.
     *
     * @param purpose - The purpose to check
     * @returns True if consent is required
     *
     * @example
     * ```typescript
     * location.requiresConsent('analytics')  // true in GDPR, false in CCPA
     * location.requiresConsent('essential')  // always false
     * ```
     */
    requiresConsent(purpose: ConsentPurpose): boolean;
    /**
     * Get all purposes that require consent in this jurisdiction
     *
     * @returns Array of purposes requiring consent
     */
    getRequiredConsentPurposes(): ConsentPurpose[];
    /**
     * Get best language match from supported languages
     *
     * @param supported - Array of language codes you support
     * @returns Best matching language
     *
     * @example
     * ```typescript
     * location.preferredLanguage(['en', 'de', 'fr', 'es'])
     * ```
     */
    preferredLanguage(supported: string[]): string;
    /**
     * Format a date/time in user's local timezone
     *
     * @param date - Date to format (defaults to now)
     * @returns Formatted string like "Dec 6, 2024, 2:30 PM"
     */
    formatTime(date?: Date): string;
    /**
     * Get current time in user's timezone
     *
     * @returns Date object in user's timezone
     */
    now(): Date;
    /**
     * Get time of day in user's timezone
     *
     * @returns "morning", "afternoon", or "evening"
     */
    getTimeOfDay(): 'morning' | 'afternoon' | 'evening';
    /**
     * Check if it's business hours in user's timezone
     *
     * @param startHour - Start hour (default: 9)
     * @param endHour - End hour (default: 17)
     * @returns True if within business hours
     */
    isBusinessHours(startHour?: number, endHour?: number): boolean;
}
/**
 * Cloudflare's request.cf properties we use
 * @see https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties
 */
export interface CloudflareRequestCF {
    country?: string;
    continent?: string;
    region?: string;
    regionCode?: string;
    city?: string;
    postalCode?: string;
    latitude?: string;
    longitude?: string;
    timezone?: string;
    colo?: string;
    asn?: number;
    asOrganization?: string;
    isEUCountry?: string;
    metroCode?: string;
    httpProtocol?: string;
    tlsVersion?: string;
    tlsCipher?: string;
    tlsClientAuth?: {
        certPresented?: string;
        certVerified?: string;
        certIssuerDN?: string;
        certSubjectDN?: string;
    };
    clientAcceptEncoding?: string;
}
/**
 * Create a LocationContext from Cloudflare's request.cf data
 *
 * @param cf - Cloudflare's request.cf object (IncomingRequestCfProperties)
 * @param acceptLanguageHeader - Accept-Language header value (optional)
 * @returns LocationContext with all geographic, jurisdiction, and helper methods
 *
 * @example
 * ```typescript
 * // In a Cloudflare Worker
 * const location = createLocationContext(
 *   request.cf,
 *   request.headers.get('Accept-Language')
 * );
 *
 * console.log(location.country);           // "DE"
 * console.log(location.requiresConsent('analytics'));  // true (GDPR)
 * ```
 */
export declare function createLocationContext(cf: CloudflareRequestCF | undefined, acceptLanguageHeader?: string | null): LocationContext;
/**
 * Create a default/empty LocationContext for testing or when CF data is unavailable
 */
export declare function createDefaultLocationContext(): LocationContext;
export type { Jurisdiction, ConsentPurpose, ConsentModel };
//# sourceMappingURL=location.d.ts.map