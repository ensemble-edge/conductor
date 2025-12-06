/**
 * Language Inference
 *
 * Infer user's preferred language from Accept-Language header
 * or country of origin. Supports matching against supported languages.
 */
import { COUNTRY_LANGUAGES } from './language-data.js';
/**
 * Parse Accept-Language header into sorted array of languages
 *
 * @param header - Accept-Language header value
 * @returns Array of language codes sorted by preference (highest first)
 *
 * @example
 * ```typescript
 * parseAcceptLanguage('en-US,en;q=0.9,de;q=0.8')
 * // => ['en-us', 'en', 'de']
 *
 * parseAcceptLanguage('de-DE, de;q=0.9, en;q=0.8')
 * // => ['de-de', 'de', 'en']
 * ```
 */
export function parseAcceptLanguage(header) {
    if (!header)
        return [];
    const entries = [];
    for (const part of header.split(',')) {
        const trimmed = part.trim();
        if (!trimmed)
            continue;
        const [lang, qPart] = trimmed.split(';q=');
        const q = qPart ? parseFloat(qPart) : 1;
        if (!isNaN(q) && lang) {
            entries.push({
                lang: lang.trim().toLowerCase(),
                q,
            });
        }
    }
    // Sort by quality value (highest first)
    entries.sort((a, b) => b.q - a.q);
    return entries.map((e) => e.lang);
}
/**
 * Extract base language from a locale code
 *
 * @param locale - Locale code like "en-US" or "de-DE"
 * @returns Base language code like "en" or "de"
 */
export function getBaseLanguage(locale) {
    return locale.split('-')[0].toLowerCase();
}
/**
 * Infer best language for a request
 *
 * Priority:
 * 1. Accept-Language header (user's explicit preference)
 * 2. Country's primary language
 * 3. English as fallback
 *
 * @param acceptLanguageHeader - Accept-Language header value
 * @param country - ISO country code
 * @returns Best guess language code (ISO 639-1)
 *
 * @example
 * ```typescript
 * // User in Germany with German browser
 * inferLanguage('de-DE, de;q=0.9', 'DE')  // 'de'
 *
 * // User in Germany with English browser
 * inferLanguage('en-US, en;q=0.9', 'DE')  // 'en'
 *
 * // API call from Germany (no header)
 * inferLanguage(null, 'DE')  // 'de'
 *
 * // Unknown location, no header
 * inferLanguage(null, 'XX')  // 'en'
 * ```
 */
export function inferLanguage(acceptLanguageHeader, country) {
    // 1. Try Accept-Language header first (user's preference)
    const accepted = parseAcceptLanguage(acceptLanguageHeader);
    if (accepted.length > 0) {
        // Return base language (e.g., "en" from "en-US")
        return getBaseLanguage(accepted[0]);
    }
    // 2. Fall back to country's primary language
    const countryLangs = COUNTRY_LANGUAGES[country?.toUpperCase()];
    if (countryLangs && countryLangs.length > 0) {
        return countryLangs[0];
    }
    // 3. Ultimate fallback
    return 'en';
}
/**
 * Get best language match from supported languages
 *
 * Matching priority:
 * 1. Exact match from Accept-Language (e.g., "en-US" in supported)
 * 2. Base match from Accept-Language (e.g., "en" when "en-US" requested)
 * 3. Country's language if in supported
 * 4. First supported language
 *
 * @param acceptLanguageHeader - Accept-Language header value
 * @param country - ISO country code
 * @param supported - Array of supported language codes
 * @returns Best matching supported language
 *
 * @example
 * ```typescript
 * // Your app supports English, German, French, Spanish
 * const supported = ['en', 'de', 'fr', 'es'];
 *
 * // User's Accept-Language: "pt-BR, en-US;q=0.9"
 * preferredLanguage('pt-BR, en-US;q=0.9', 'BR', supported)
 * // => 'en' (pt not supported, en is)
 *
 * // User's Accept-Language: "de-DE, de;q=0.9, en;q=0.8"
 * preferredLanguage('de-DE, de;q=0.9, en;q=0.8', 'DE', supported)
 * // => 'de'
 *
 * // No Accept-Language header, user in Japan
 * preferredLanguage(null, 'JP', supported)
 * // => 'en' (ja not supported, falls back to first)
 *
 * // No Accept-Language header, user in Mexico
 * preferredLanguage(null, 'MX', supported)
 * // => 'es' (country language matches supported)
 * ```
 */
export function preferredLanguage(acceptLanguageHeader, country, supported) {
    if (supported.length === 0)
        return 'en';
    // Normalize supported to lowercase
    const supportedLower = supported.map((s) => s.toLowerCase());
    const accepted = parseAcceptLanguage(acceptLanguageHeader);
    // 1. Try to match Accept-Language preferences
    for (const lang of accepted) {
        const langLower = lang.toLowerCase();
        // Exact match (e.g., "en-US" in supported)
        if (supportedLower.includes(langLower)) {
            return supported[supportedLower.indexOf(langLower)];
        }
        // Base match (e.g., "en" when "en-US" requested)
        const base = getBaseLanguage(langLower);
        if (supportedLower.includes(base)) {
            return supported[supportedLower.indexOf(base)];
        }
    }
    // 2. Try country's languages
    const countryLangs = COUNTRY_LANGUAGES[country?.toUpperCase()] || [];
    for (const lang of countryLangs) {
        const langLower = lang.toLowerCase();
        if (supportedLower.includes(langLower)) {
            return supported[supportedLower.indexOf(langLower)];
        }
    }
    // 3. Return first supported language
    return supported[0];
}
/**
 * Check if a language is RTL (right-to-left)
 *
 * @param language - ISO 639-1 language code
 * @returns True if language is RTL
 */
export function isRTL(language) {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'yi', 'ps', 'sd', 'ckb'];
    return rtlLanguages.includes(language.toLowerCase());
}
