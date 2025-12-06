/**
 * Language Inference Tests
 *
 * Tests for Accept-Language parsing and language inference
 */

import { describe, it, expect } from 'vitest'
import {
  parseAcceptLanguage,
  getBaseLanguage,
  inferLanguage,
  preferredLanguage,
  isRTL,
} from '../../../src/context/language'

describe('Language Inference', () => {
  describe('parseAcceptLanguage', () => {
    it('should parse simple Accept-Language header', () => {
      const result = parseAcceptLanguage('en-US')
      expect(result).toEqual(['en-us'])
    })

    it('should parse multiple languages with quality values', () => {
      const result = parseAcceptLanguage('en-US,en;q=0.9,de;q=0.8')
      expect(result).toEqual(['en-us', 'en', 'de'])
    })

    it('should sort by quality value (highest first)', () => {
      const result = parseAcceptLanguage('de;q=0.8,en;q=0.9,fr;q=0.7')
      expect(result).toEqual(['en', 'de', 'fr'])
    })

    it('should handle quality value of 1 (default)', () => {
      const result = parseAcceptLanguage('de-DE, de;q=0.9, en;q=0.8')
      expect(result[0]).toBe('de-de')
    })

    it('should return empty array for null header', () => {
      const result = parseAcceptLanguage(null)
      expect(result).toEqual([])
    })

    it('should return empty array for empty string', () => {
      const result = parseAcceptLanguage('')
      expect(result).toEqual([])
    })

    it('should handle whitespace in header', () => {
      const result = parseAcceptLanguage('  en-US  ,  de;q=0.8  ')
      expect(result).toContain('en-us')
      expect(result).toContain('de')
    })
  })

  describe('getBaseLanguage', () => {
    it('should extract base language from locale', () => {
      expect(getBaseLanguage('en-US')).toBe('en')
      expect(getBaseLanguage('de-DE')).toBe('de')
      expect(getBaseLanguage('zh-Hans-CN')).toBe('zh')
    })

    it('should return same value for simple language codes', () => {
      expect(getBaseLanguage('en')).toBe('en')
      expect(getBaseLanguage('de')).toBe('de')
    })

    it('should lowercase the result', () => {
      expect(getBaseLanguage('EN-US')).toBe('en')
    })
  })

  describe('inferLanguage', () => {
    it('should return language from Accept-Language header', () => {
      expect(inferLanguage('de-DE,de;q=0.9,en;q=0.8', 'US')).toBe('de')
      expect(inferLanguage('fr-FR', 'US')).toBe('fr')
    })

    it('should fallback to country language when no header', () => {
      expect(inferLanguage(null, 'DE')).toBe('de')
      expect(inferLanguage(null, 'FR')).toBe('fr')
      expect(inferLanguage(null, 'JP')).toBe('ja')
      expect(inferLanguage(null, 'MX')).toBe('es')
    })

    it('should fallback to English for unknown country', () => {
      expect(inferLanguage(null, 'XX')).toBe('en')
      expect(inferLanguage(null, '')).toBe('en')
    })

    it('should respect user preference over country', () => {
      // User in Germany with English browser
      expect(inferLanguage('en-US,en;q=0.9', 'DE')).toBe('en')
    })
  })

  describe('preferredLanguage', () => {
    it('should return exact match from Accept-Language', () => {
      const supported = ['en', 'de', 'fr']
      expect(preferredLanguage('de-DE,de;q=0.9,en;q=0.8', 'US', supported)).toBe('de')
    })

    it('should return base match when exact not available', () => {
      const supported = ['en', 'de', 'fr']
      expect(preferredLanguage('de-AT,de;q=0.9', 'US', supported)).toBe('de')
    })

    it('should fallback to country language when no Accept-Language match', () => {
      const supported = ['en', 'de', 'fr', 'es']
      expect(preferredLanguage('ja-JP', 'MX', supported)).toBe('es')
    })

    it('should return first supported when nothing matches', () => {
      const supported = ['en', 'de', 'fr']
      expect(preferredLanguage('ja-JP', 'CN', supported)).toBe('en')
    })

    it('should handle empty supported array', () => {
      expect(preferredLanguage('de-DE', 'DE', [])).toBe('en')
    })

    it('should handle null Accept-Language', () => {
      const supported = ['en', 'de', 'fr', 'es']
      expect(preferredLanguage(null, 'MX', supported)).toBe('es')
      expect(preferredLanguage(null, 'JP', supported)).toBe('en') // Japanese not supported
    })

    it('should handle complex Accept-Language with multiple matches', () => {
      const supported = ['en', 'de', 'fr', 'es']
      // Portuguese first, then Spanish
      expect(preferredLanguage('pt-BR,es;q=0.9,en;q=0.8', 'BR', supported)).toBe('es')
    })
  })

  describe('isRTL', () => {
    it('should return true for RTL languages', () => {
      expect(isRTL('ar')).toBe(true) // Arabic
      expect(isRTL('he')).toBe(true) // Hebrew
      expect(isRTL('fa')).toBe(true) // Persian/Farsi
      expect(isRTL('ur')).toBe(true) // Urdu
      expect(isRTL('yi')).toBe(true) // Yiddish
      expect(isRTL('ps')).toBe(true) // Pashto
    })

    it('should return false for LTR languages', () => {
      expect(isRTL('en')).toBe(false)
      expect(isRTL('de')).toBe(false)
      expect(isRTL('fr')).toBe(false)
      expect(isRTL('es')).toBe(false)
      expect(isRTL('zh')).toBe(false)
      expect(isRTL('ja')).toBe(false)
    })

    it('should be case-insensitive', () => {
      expect(isRTL('AR')).toBe(true)
      expect(isRTL('Ar')).toBe(true)
    })
  })
})
