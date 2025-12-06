/**
 * Location Context Tests
 *
 * Tests for the LocationContext creation and all its helper methods
 */

import { describe, it, expect } from 'vitest'
import {
  createLocationContext,
  createDefaultLocationContext,
  type CloudflareRequestCF,
} from '../../../src/context/location'

describe('LocationContext', () => {
  describe('createLocationContext', () => {
    it('should create context with full CF data', () => {
      const cf: CloudflareRequestCF = {
        country: 'US',
        continent: 'NA',
        region: 'Texas',
        regionCode: 'TX',
        city: 'Austin',
        postalCode: '78701',
        latitude: '30.2672',
        longitude: '-97.7431',
        timezone: 'America/Chicago',
        colo: 'DFW',
        asn: 7922,
        asOrganization: 'Comcast',
      }

      const location = createLocationContext(cf, 'en-US,en;q=0.9')

      expect(location.country).toBe('US')
      expect(location.countryName).toBe('United States')
      expect(location.continent).toBe('NA')
      expect(location.continentName).toBe('North America')
      expect(location.region).toBe('Texas')
      expect(location.regionCode).toBe('TX')
      expect(location.city).toBe('Austin')
      expect(location.postalCode).toBe('78701')
      expect(location.latitude).toBe(30.2672)
      expect(location.longitude).toBe(-97.7431)
      expect(location.coordinates).toEqual({ lat: 30.2672, lng: -97.7431 })
      expect(location.timezone).toBe('America/Chicago')
    })

    it('should handle undefined CF data with defaults', () => {
      const location = createLocationContext(undefined, null)

      expect(location.country).toBe('XX')
      expect(location.countryName).toBe('Unknown')
      expect(location.continent).toBe('XX')
      expect(location.continentName).toBe('Unknown')
      expect(location.latitude).toBe(0)
      expect(location.longitude).toBe(0)
      expect(location.timezone).toBe('UTC')
    })

    it('should detect GDPR jurisdiction for German user', () => {
      const cf: CloudflareRequestCF = {
        country: 'DE',
        continent: 'EU',
        timezone: 'Europe/Berlin',
      }

      const location = createLocationContext(cf)

      expect(location.isGDPR).toBe(true)
      expect(location.isEU).toBe(true)
      expect(location.isEEA).toBe(true)
      expect(location.jurisdiction).toBe('GDPR')
      expect(location.jurisdictions).toContain('GDPR')
    })

    it('should detect CCPA jurisdiction for California user', () => {
      const cf: CloudflareRequestCF = {
        country: 'US',
        regionCode: 'CA',
        continent: 'NA',
        timezone: 'America/Los_Angeles',
      }

      const location = createLocationContext(cf)

      expect(location.isCCPA).toBe(true)
      expect(location.isGDPR).toBe(false)
      expect(location.jurisdiction).toBe('CCPA')
    })

    it('should detect LGPD jurisdiction for Brazilian user', () => {
      const cf: CloudflareRequestCF = {
        country: 'BR',
        continent: 'SA',
        timezone: 'America/Sao_Paulo',
      }

      const location = createLocationContext(cf)

      expect(location.isLGPD).toBe(true)
      expect(location.jurisdiction).toBe('LGPD')
    })

    it('should not detect jurisdiction for user outside privacy zones', () => {
      const cf: CloudflareRequestCF = {
        country: 'AU',
        regionCode: 'NSW',
        continent: 'OC',
        timezone: 'Australia/Sydney',
      }

      const location = createLocationContext(cf)

      expect(location.isGDPR).toBe(false)
      expect(location.isCCPA).toBe(false)
      expect(location.isLGPD).toBe(false)
      expect(location.jurisdiction).toBe(null)
    })
  })

  describe('createDefaultLocationContext', () => {
    it('should create context with safe defaults', () => {
      const location = createDefaultLocationContext()

      expect(location.country).toBe('XX')
      expect(location.timezone).toBe('UTC')
      expect(location.language).toBe('en')
    })
  })

  describe('requiresConsent method', () => {
    it('should require consent for analytics in GDPR countries', () => {
      const cf: CloudflareRequestCF = { country: 'DE' }
      const location = createLocationContext(cf)

      expect(location.requiresConsent('analytics')).toBe(true)
      expect(location.requiresConsent('marketing')).toBe(true)
      expect(location.requiresConsent('personalization')).toBe(true)
    })

    it('should NOT require consent for analytics in CCPA (opt-out model)', () => {
      const cf: CloudflareRequestCF = { country: 'US', regionCode: 'CA' }
      const location = createLocationContext(cf)

      expect(location.requiresConsent('analytics')).toBe(false)
      expect(location.requiresConsent('marketing')).toBe(false)
    })

    it('should never require consent for essential purpose', () => {
      const gdprLocation = createLocationContext({ country: 'DE' })
      const ccpaLocation = createLocationContext({ country: 'US', regionCode: 'CA' })
      const noJurisdiction = createLocationContext({ country: 'AU' })

      expect(gdprLocation.requiresConsent('essential')).toBe(false)
      expect(ccpaLocation.requiresConsent('essential')).toBe(false)
      expect(noJurisdiction.requiresConsent('essential')).toBe(false)
    })

    it('should not require consent when no jurisdiction applies', () => {
      const cf: CloudflareRequestCF = { country: 'AU' }
      const location = createLocationContext(cf)

      expect(location.requiresConsent('analytics')).toBe(false)
      expect(location.requiresConsent('marketing')).toBe(false)
    })
  })

  describe('isIn method', () => {
    it('should match EU group', () => {
      const cf: CloudflareRequestCF = { country: 'FR' }
      const location = createLocationContext(cf)

      expect(location.isIn(['EU'])).toBe(true)
      expect(location.isIn(['GDPR'])).toBe(true)
      expect(location.isIn(['EEA'])).toBe(true)
    })

    it('should match country code directly', () => {
      const cf: CloudflareRequestCF = { country: 'JP' }
      const location = createLocationContext(cf)

      expect(location.isIn(['JP'])).toBe(true)
      expect(location.isIn(['US', 'JP', 'KR'])).toBe(true)
      expect(location.isIn(['US', 'KR'])).toBe(false)
    })

    it('should match country-region format', () => {
      const cf: CloudflareRequestCF = { country: 'US', regionCode: 'CA' }
      const location = createLocationContext(cf)

      expect(location.isIn(['US-CA'])).toBe(true)
      expect(location.isIn(['US-TX'])).toBe(false)
      expect(location.isIn(['US-NY', 'US-CA'])).toBe(true)
    })

    it('should match APAC group', () => {
      const cf: CloudflareRequestCF = { country: 'SG' }
      const location = createLocationContext(cf)

      expect(location.isIn(['APAC'])).toBe(true)
      expect(location.isIn(['ASEAN'])).toBe(true)
    })

    it('should match mixed groups and countries', () => {
      const cf: CloudflareRequestCF = { country: 'BR' }
      const location = createLocationContext(cf)

      expect(location.isIn(['GDPR', 'BR'])).toBe(true)
      expect(location.isIn(['LATAM'])).toBe(true)
      expect(location.isIn(['MERCOSUR'])).toBe(true)
    })
  })

  describe('preferredLanguage method', () => {
    it('should return language from Accept-Language header', () => {
      const cf: CloudflareRequestCF = { country: 'DE' }
      const location = createLocationContext(cf, 'de-DE,de;q=0.9,en;q=0.8')

      expect(location.preferredLanguage(['en', 'de', 'fr'])).toBe('de')
    })

    it('should fallback to country language when not in Accept-Language', () => {
      const cf: CloudflareRequestCF = { country: 'JP' }
      const location = createLocationContext(cf, 'ja-JP')

      // Japanese not in supported, should fallback
      expect(location.preferredLanguage(['en', 'de', 'fr'])).toBe('en')
    })

    it('should use country language when no Accept-Language header', () => {
      const cf: CloudflareRequestCF = { country: 'MX' }
      const location = createLocationContext(cf, null)

      expect(location.preferredLanguage(['en', 'es', 'fr'])).toBe('es')
    })

    it('should return first supported when nothing matches', () => {
      const cf: CloudflareRequestCF = { country: 'CN' }
      const location = createLocationContext(cf, 'zh-CN')

      expect(location.preferredLanguage(['en', 'de', 'fr'])).toBe('en')
    })
  })

  describe('language inference', () => {
    it('should infer language from Accept-Language', () => {
      const cf: CloudflareRequestCF = { country: 'US' }
      const location = createLocationContext(cf, 'fr-FR,fr;q=0.9,en;q=0.8')

      expect(location.language).toBe('fr')
    })

    it('should infer language from country when no header', () => {
      const cf: CloudflareRequestCF = { country: 'DE' }
      const location = createLocationContext(cf, null)

      expect(location.language).toBe('de')
    })

    it('should detect RTL languages', () => {
      const arabicLocation = createLocationContext({ country: 'SA' }, 'ar')
      const hebrewLocation = createLocationContext({ country: 'IL' }, 'he')
      const englishLocation = createLocationContext({ country: 'US' }, 'en')

      expect(arabicLocation.isRTL).toBe(true)
      expect(hebrewLocation.isRTL).toBe(true)
      expect(englishLocation.isRTL).toBe(false)
    })
  })

  describe('timezone methods', () => {
    it('should have timezone information', () => {
      const cf: CloudflareRequestCF = {
        country: 'US',
        timezone: 'America/New_York',
      }
      const location = createLocationContext(cf)

      expect(location.timezone).toBe('America/New_York')
      expect(typeof location.timezoneOffset).toBe('number')
      expect(typeof location.timezoneOffsetHours).toBe('number')
      expect(typeof location.isDST).toBe('boolean')
    })

    it('should format time in user timezone', () => {
      const cf: CloudflareRequestCF = {
        country: 'US',
        timezone: 'America/New_York',
      }
      const location = createLocationContext(cf)
      const testDate = new Date('2024-06-15T12:00:00Z')

      const formatted = location.formatTime(testDate)

      // Should be a formatted string
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('should return current time in user timezone', () => {
      const cf: CloudflareRequestCF = {
        country: 'JP',
        timezone: 'Asia/Tokyo',
      }
      const location = createLocationContext(cf)

      const now = location.now()
      expect(now).toBeInstanceOf(Date)
    })

    it('should get time of day', () => {
      const cf: CloudflareRequestCF = {
        country: 'US',
        timezone: 'America/Chicago',
      }
      const location = createLocationContext(cf)

      const timeOfDay = location.getTimeOfDay()
      expect(['morning', 'afternoon', 'evening']).toContain(timeOfDay)
    })

    it('should check business hours', () => {
      const cf: CloudflareRequestCF = {
        country: 'US',
        timezone: 'America/Chicago',
      }
      const location = createLocationContext(cf)

      const isBusinessHours = location.isBusinessHours()
      expect(typeof isBusinessHours).toBe('boolean')

      // Custom hours
      const isCustomHours = location.isBusinessHours(0, 24)
      expect(isCustomHours).toBe(true) // Always true for 0-24
    })
  })

  describe('consent model', () => {
    it('should return opt-in model for GDPR', () => {
      const cf: CloudflareRequestCF = { country: 'DE' }
      const location = createLocationContext(cf)

      expect(location.consentModel).toBe('opt-in')
    })

    it('should return opt-out model for CCPA', () => {
      const cf: CloudflareRequestCF = { country: 'US', regionCode: 'CA' }
      const location = createLocationContext(cf)

      expect(location.consentModel).toBe('opt-out')
    })

    it('should return none when no jurisdiction', () => {
      const cf: CloudflareRequestCF = { country: 'AU' }
      const location = createLocationContext(cf)

      expect(location.consentModel).toBe('none')
    })
  })

  describe('getRequiredConsentPurposes', () => {
    it('should return all consent purposes for GDPR', () => {
      const cf: CloudflareRequestCF = { country: 'DE' }
      const location = createLocationContext(cf)

      const purposes = location.getRequiredConsentPurposes()

      expect(purposes).toContain('analytics')
      expect(purposes).toContain('marketing')
      expect(purposes).toContain('personalization')
      expect(purposes).toContain('third_party')
      expect(purposes).not.toContain('essential')
    })

    it('should return empty for CCPA (opt-out model)', () => {
      const cf: CloudflareRequestCF = { country: 'US', regionCode: 'CA' }
      const location = createLocationContext(cf)

      const purposes = location.getRequiredConsentPurposes()

      expect(purposes).toHaveLength(0)
    })
  })
})
