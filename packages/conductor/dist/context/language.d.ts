/**
 * Language Inference
 *
 * Infer user's preferred language from Accept-Language header
 * or country of origin. Supports matching against supported languages.
 */
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
export declare function parseAcceptLanguage(header: string | null): string[];
/**
 * Extract base language from a locale code
 *
 * @param locale - Locale code like "en-US" or "de-DE"
 * @returns Base language code like "en" or "de"
 */
export declare function getBaseLanguage(locale: string): string;
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
export declare function inferLanguage(acceptLanguageHeader: string | null, country: string): string;
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
export declare function preferredLanguage(acceptLanguageHeader: string | null, country: string, supported: string[]): string;
/**
 * Check if a language is RTL (right-to-left)
 *
 * @param language - ISO 639-1 language code
 * @returns True if language is RTL
 */
export declare function isRTL(language: string): boolean;
//# sourceMappingURL=language.d.ts.map