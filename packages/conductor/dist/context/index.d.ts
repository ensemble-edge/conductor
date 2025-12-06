/**
 * Context Module
 *
 * Exports for location, edge, jurisdiction, and related utilities.
 *
 * The context module provides rich information about each request:
 * - LocationContext: Geographic location, jurisdiction, consent, language, timezone
 * - EdgeContext: Network, protocol, datacenter information
 */
export { createLocationContext, createDefaultLocationContext, type LocationContext, type CloudflareRequestCF, type Jurisdiction, type ConsentPurpose, type ConsentModel, } from './location.js';
export { createEdgeContext, createDefaultEdgeContext, type EdgeContext } from './edge.js';
export { COUNTRY_NAMES, CONTINENT_NAMES, getCountryName, getContinentName } from './location-data.js';
export { detectJurisdictions, getPrimaryJurisdiction, hasJurisdiction, isInEU, isInEEA, isGDPRApplicable, } from './jurisdiction.js';
export { EU_COUNTRIES, EEA_COUNTRIES, GDPR_COUNTRIES, US_PRIVACY_STATES, isEU, isEEA, isGDPR, isCCPA, isLGPD, } from './jurisdiction-data.js';
export { requiresConsent, getConsentModel, getRequiredConsentPurposes, JURISDICTION_REQUIREMENTS, } from './consent-requirements.js';
export { isIn, getGroupCountries, isValidGroup, getAvailableGroups, REGION_GROUPS, } from './region-groups.js';
export { inferLanguage, preferredLanguage, parseAcceptLanguage, getBaseLanguage, isRTL, } from './language.js';
export { COUNTRY_LANGUAGES, getPrimaryLanguage, getCountryLanguages } from './language-data.js';
export { getTimezoneOffset, getTimezoneOffsetHours, isDST, formatTime, formatTimeOnly, formatDateOnly, nowInTimezone, getCurrentHour, isBusinessHours, getTimeOfDay, } from './timezone.js';
//# sourceMappingURL=index.d.ts.map