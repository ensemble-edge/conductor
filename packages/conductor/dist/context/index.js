/**
 * Context Module
 *
 * Exports for location, edge, jurisdiction, and related utilities.
 *
 * The context module provides rich information about each request:
 * - LocationContext: Geographic location, jurisdiction, consent, language, timezone
 * - EdgeContext: Network, protocol, datacenter information
 */
// ─────────────────────────────────────────────────────────────
// Location Context (main export)
// ─────────────────────────────────────────────────────────────
export { createLocationContext, createDefaultLocationContext, } from './location.js';
// ─────────────────────────────────────────────────────────────
// Edge Context
// ─────────────────────────────────────────────────────────────
export { createEdgeContext, createDefaultEdgeContext } from './edge.js';
// ─────────────────────────────────────────────────────────────
// Location Data (for direct access if needed)
// ─────────────────────────────────────────────────────────────
export { COUNTRY_NAMES, CONTINENT_NAMES, getCountryName, getContinentName, } from './location-data.js';
// ─────────────────────────────────────────────────────────────
// Jurisdiction Detection
// ─────────────────────────────────────────────────────────────
export { detectJurisdictions, getPrimaryJurisdiction, hasJurisdiction, isInEU, isInEEA, isGDPRApplicable, } from './jurisdiction.js';
export { EU_COUNTRIES, EEA_COUNTRIES, GDPR_COUNTRIES, US_PRIVACY_STATES, isEU, isEEA, isGDPR, isCCPA, isLGPD, } from './jurisdiction-data.js';
// ─────────────────────────────────────────────────────────────
// Consent Requirements
// ─────────────────────────────────────────────────────────────
export { requiresConsent, getConsentModel, getRequiredConsentPurposes, JURISDICTION_REQUIREMENTS, } from './consent-requirements.js';
// ─────────────────────────────────────────────────────────────
// Region Groups
// ─────────────────────────────────────────────────────────────
export { isIn, getGroupCountries, isValidGroup, getAvailableGroups, REGION_GROUPS, } from './region-groups.js';
// ─────────────────────────────────────────────────────────────
// Language
// ─────────────────────────────────────────────────────────────
export { inferLanguage, preferredLanguage, parseAcceptLanguage, getBaseLanguage, isRTL, } from './language.js';
export { COUNTRY_LANGUAGES, getPrimaryLanguage, getCountryLanguages } from './language-data.js';
// ─────────────────────────────────────────────────────────────
// Timezone
// ─────────────────────────────────────────────────────────────
export { getTimezoneOffset, getTimezoneOffsetHours, isDST, formatTime, formatTimeOnly, formatDateOnly, nowInTimezone, getCurrentHour, isBusinessHours, getTimeOfDay, } from './timezone.js';
