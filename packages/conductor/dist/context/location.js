/**
 * Location Context
 *
 * Main LocationContext implementation that brings together geographic data,
 * jurisdiction detection, consent helpers, language inference, and timezone utilities.
 *
 * Powered by Cloudflare's request.cf data - available on every request at the edge.
 */
import { COUNTRY_NAMES, CONTINENT_NAMES } from './location-data.js';
import { detectJurisdictions, isInEU, isInEEA, isGDPRApplicable, } from './jurisdiction.js';
import { requiresConsent as checkConsent, getConsentModel, getRequiredConsentPurposes, } from './consent-requirements.js';
import { isIn as checkIsIn } from './region-groups.js';
import { inferLanguage, preferredLanguage as getPrefLang, isRTL } from './language.js';
import { COUNTRY_LANGUAGES } from './language-data.js';
import { getTimezoneOffset, getTimezoneOffsetHours, isDST, formatTime, nowInTimezone, getTimeOfDay, isBusinessHours, } from './timezone.js';
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
export function createLocationContext(cf, acceptLanguageHeader = null) {
    // Extract values from CF, with defaults for when cf is undefined
    const country = cf?.country || 'XX';
    const regionCode = cf?.regionCode || '';
    const latitude = parseFloat(cf?.latitude || '0');
    const longitude = parseFloat(cf?.longitude || '0');
    const timezone = cf?.timezone || 'UTC';
    const continent = cf?.continent || 'XX';
    // Detect jurisdictions for this location
    const jurisdictions = detectJurisdictions({ country, regionCode });
    // Calculate timezone info
    const timezoneOffset = getTimezoneOffset(timezone);
    // Infer language
    const language = inferLanguage(acceptLanguageHeader, country);
    // Build the context object
    const context = {
        // Geographic
        country,
        countryName: COUNTRY_NAMES[country] || 'Unknown',
        continent,
        continentName: CONTINENT_NAMES[continent] || 'Unknown',
        region: cf?.region || '',
        regionCode,
        city: cf?.city || '',
        postalCode: cf?.postalCode || '',
        latitude,
        longitude,
        coordinates: { lat: latitude, lng: longitude },
        // Time
        timezone,
        timezoneOffset,
        timezoneOffsetHours: getTimezoneOffsetHours(timezone),
        isDST: isDST(timezone),
        // Language
        language,
        languages: COUNTRY_LANGUAGES[country] || ['en'],
        isRTL: isRTL(language),
        // Jurisdiction
        jurisdiction: jurisdictions[0] || null,
        jurisdictions,
        consentModel: getConsentModel(jurisdictions),
        // Convenience booleans
        isEU: isInEU(country),
        isEEA: isInEEA(country),
        isGDPR: isGDPRApplicable(country),
        isCCPA: country === 'US' && regionCode === 'CA',
        isLGPD: country === 'BR',
        // Methods
        isIn(targets) {
            return checkIsIn({ country, regionCode }, targets);
        },
        requiresConsent(purpose) {
            return checkConsent(jurisdictions, purpose);
        },
        getRequiredConsentPurposes() {
            return getRequiredConsentPurposes(jurisdictions);
        },
        preferredLanguage(supported) {
            return getPrefLang(acceptLanguageHeader, country, supported);
        },
        formatTime(date = new Date()) {
            return formatTime(timezone, date);
        },
        now() {
            return nowInTimezone(timezone);
        },
        getTimeOfDay() {
            return getTimeOfDay(timezone);
        },
        isBusinessHours(startHour = 9, endHour = 17) {
            return isBusinessHours(timezone, startHour, endHour);
        },
    };
    return context;
}
/**
 * Create a default/empty LocationContext for testing or when CF data is unavailable
 */
export function createDefaultLocationContext() {
    return createLocationContext(undefined, null);
}
