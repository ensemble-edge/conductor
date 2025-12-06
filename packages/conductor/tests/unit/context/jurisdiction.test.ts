/**
 * Jurisdiction Detection Tests
 *
 * Tests for jurisdiction detection logic
 */

import { describe, it, expect } from 'vitest'
import {
  detectJurisdictions,
  getPrimaryJurisdiction,
  hasJurisdiction,
  isInEU,
  isInEEA,
  isGDPRApplicable,
} from '../../../src/context/jurisdiction'

describe('Jurisdiction Detection', () => {
  describe('detectJurisdictions', () => {
    it('should detect GDPR for EU countries', () => {
      const euCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'PL', 'SE', 'AT', 'IE']

      for (const country of euCountries) {
        const jurisdictions = detectJurisdictions({ country, regionCode: '' })
        expect(jurisdictions).toContain('GDPR')
      }
    })

    it('should detect GDPR for EEA countries', () => {
      const eeaCountries = ['IS', 'LI', 'NO']

      for (const country of eeaCountries) {
        const jurisdictions = detectJurisdictions({ country, regionCode: '' })
        expect(jurisdictions).toContain('GDPR')
      }
    })

    it('should detect GDPR for UK (UK GDPR)', () => {
      const jurisdictions = detectJurisdictions({ country: 'GB', regionCode: '' })
      expect(jurisdictions).toContain('GDPR')
    })

    it('should detect CCPA for California', () => {
      const jurisdictions = detectJurisdictions({ country: 'US', regionCode: 'CA' })
      expect(jurisdictions).toContain('CCPA')
    })

    it('should NOT detect CCPA for other US states', () => {
      const otherStates = ['TX', 'NY', 'FL', 'WA', 'IL']

      for (const regionCode of otherStates) {
        const jurisdictions = detectJurisdictions({ country: 'US', regionCode })
        expect(jurisdictions).not.toContain('CCPA')
      }
    })

    it('should detect LGPD for Brazil', () => {
      const jurisdictions = detectJurisdictions({ country: 'BR', regionCode: '' })
      expect(jurisdictions).toContain('LGPD')
    })

    it('should detect PIPEDA for Canada', () => {
      const jurisdictions = detectJurisdictions({ country: 'CA', regionCode: '' })
      expect(jurisdictions).toContain('PIPEDA')
    })

    it('should detect POPIA for South Africa', () => {
      const jurisdictions = detectJurisdictions({ country: 'ZA', regionCode: '' })
      expect(jurisdictions).toContain('POPIA')
    })

    it('should detect PDPA for Singapore', () => {
      const jurisdictions = detectJurisdictions({ country: 'SG', regionCode: '' })
      expect(jurisdictions).toContain('PDPA')
    })

    it('should detect APPI for Japan', () => {
      const jurisdictions = detectJurisdictions({ country: 'JP', regionCode: '' })
      expect(jurisdictions).toContain('APPI')
    })

    it('should return empty array for countries without detected jurisdictions', () => {
      const noJurisdictionCountries = ['AU', 'NZ', 'MX', 'AR', 'IN', 'CN', 'KR']

      for (const country of noJurisdictionCountries) {
        const jurisdictions = detectJurisdictions({ country, regionCode: '' })
        expect(jurisdictions).toHaveLength(0)
      }
    })
  })

  describe('getPrimaryJurisdiction', () => {
    it('should return GDPR as primary for EU', () => {
      const primary = getPrimaryJurisdiction({ country: 'DE', regionCode: '' })
      expect(primary).toBe('GDPR')
    })

    it('should return CCPA as primary for California', () => {
      const primary = getPrimaryJurisdiction({ country: 'US', regionCode: 'CA' })
      expect(primary).toBe('CCPA')
    })

    it('should return null when no jurisdiction applies', () => {
      const primary = getPrimaryJurisdiction({ country: 'AU', regionCode: '' })
      expect(primary).toBe(null)
    })
  })

  describe('hasJurisdiction', () => {
    it('should return true when jurisdiction applies', () => {
      expect(hasJurisdiction({ country: 'DE', regionCode: '' }, 'GDPR')).toBe(true)
      expect(hasJurisdiction({ country: 'US', regionCode: 'CA' }, 'CCPA')).toBe(true)
      expect(hasJurisdiction({ country: 'BR', regionCode: '' }, 'LGPD')).toBe(true)
    })

    it('should return false when jurisdiction does not apply', () => {
      expect(hasJurisdiction({ country: 'US', regionCode: 'TX' }, 'GDPR')).toBe(false)
      expect(hasJurisdiction({ country: 'DE', regionCode: '' }, 'CCPA')).toBe(false)
      expect(hasJurisdiction({ country: 'AU', regionCode: '' }, 'LGPD')).toBe(false)
    })
  })

  describe('isInEU', () => {
    it('should return true for EU member states', () => {
      const euCountries = [
        'AT',
        'BE',
        'BG',
        'HR',
        'CY',
        'CZ',
        'DK',
        'EE',
        'FI',
        'FR',
        'DE',
        'GR',
        'HU',
        'IE',
        'IT',
        'LV',
        'LT',
        'LU',
        'MT',
        'NL',
        'PL',
        'PT',
        'RO',
        'SK',
        'SI',
        'ES',
        'SE',
      ]

      for (const country of euCountries) {
        expect(isInEU(country)).toBe(true)
      }
    })

    it('should return false for non-EU countries', () => {
      expect(isInEU('GB')).toBe(false) // UK left EU
      expect(isInEU('CH')).toBe(false) // Switzerland
      expect(isInEU('NO')).toBe(false) // Norway (EEA, not EU)
      expect(isInEU('US')).toBe(false)
    })
  })

  describe('isInEEA', () => {
    it('should return true for EEA countries (EU + 3)', () => {
      // EEA includes EU plus Iceland, Liechtenstein, Norway
      expect(isInEEA('DE')).toBe(true) // EU
      expect(isInEEA('IS')).toBe(true) // Iceland
      expect(isInEEA('LI')).toBe(true) // Liechtenstein
      expect(isInEEA('NO')).toBe(true) // Norway
    })

    it('should return false for non-EEA countries', () => {
      expect(isInEEA('GB')).toBe(false) // UK
      expect(isInEEA('CH')).toBe(false) // Switzerland
      expect(isInEEA('US')).toBe(false)
    })
  })

  describe('isGDPRApplicable', () => {
    it('should return true for all GDPR countries (EEA + UK)', () => {
      expect(isGDPRApplicable('DE')).toBe(true) // EU
      expect(isGDPRApplicable('NO')).toBe(true) // EEA
      expect(isGDPRApplicable('GB')).toBe(true) // UK GDPR
    })

    it('should return false for non-GDPR countries', () => {
      expect(isGDPRApplicable('US')).toBe(false)
      expect(isGDPRApplicable('CH')).toBe(false)
      expect(isGDPRApplicable('AU')).toBe(false)
    })
  })
})
