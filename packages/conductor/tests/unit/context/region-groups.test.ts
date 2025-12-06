/**
 * Region Groups Tests
 *
 * Tests for the isIn() helper and region group definitions
 */

import { describe, it, expect } from 'vitest'
import {
  isIn,
  getGroupCountries,
  isValidGroup,
  getAvailableGroups,
  REGION_GROUPS,
} from '../../../src/context/region-groups'

describe('Region Groups', () => {
  describe('isIn', () => {
    describe('Country code matching', () => {
      it('should match exact country code', () => {
        expect(isIn({ country: 'US', regionCode: '' }, ['US'])).toBe(true)
        expect(isIn({ country: 'DE', regionCode: '' }, ['DE'])).toBe(true)
      })

      it('should match from array of countries', () => {
        expect(isIn({ country: 'JP', regionCode: '' }, ['US', 'JP', 'KR'])).toBe(true)
        expect(isIn({ country: 'FR', regionCode: '' }, ['US', 'JP', 'KR'])).toBe(false)
      })

      it('should be case-insensitive for country codes', () => {
        expect(isIn({ country: 'US', regionCode: '' }, ['us'])).toBe(true)
        expect(isIn({ country: 'de', regionCode: '' }, ['DE'])).toBe(false) // country code should already be uppercase
      })
    })

    describe('Country-region matching', () => {
      it('should match country-region format', () => {
        expect(isIn({ country: 'US', regionCode: 'CA' }, ['US-CA'])).toBe(true)
        expect(isIn({ country: 'US', regionCode: 'TX' }, ['US-TX'])).toBe(true)
      })

      it('should not match wrong region', () => {
        expect(isIn({ country: 'US', regionCode: 'CA' }, ['US-NY'])).toBe(false)
        expect(isIn({ country: 'US', regionCode: 'TX' }, ['US-CA'])).toBe(false)
      })

      it('should match from array with country-regions', () => {
        expect(isIn({ country: 'US', regionCode: 'CA' }, ['US-NY', 'US-CA', 'US-TX'])).toBe(true)
        expect(isIn({ country: 'US', regionCode: 'FL' }, ['US-NY', 'US-CA', 'US-TX'])).toBe(false)
      })
    })

    describe('Group matching', () => {
      it('should match EU group', () => {
        expect(isIn({ country: 'DE', regionCode: '' }, ['EU'])).toBe(true)
        expect(isIn({ country: 'FR', regionCode: '' }, ['EU'])).toBe(true)
        expect(isIn({ country: 'IT', regionCode: '' }, ['EU'])).toBe(true)
        expect(isIn({ country: 'US', regionCode: '' }, ['EU'])).toBe(false)
        expect(isIn({ country: 'GB', regionCode: '' }, ['EU'])).toBe(false) // UK not in EU
      })

      it('should match EEA group', () => {
        expect(isIn({ country: 'DE', regionCode: '' }, ['EEA'])).toBe(true)
        expect(isIn({ country: 'NO', regionCode: '' }, ['EEA'])).toBe(true) // Norway
        expect(isIn({ country: 'IS', regionCode: '' }, ['EEA'])).toBe(true) // Iceland
        expect(isIn({ country: 'LI', regionCode: '' }, ['EEA'])).toBe(true) // Liechtenstein
      })

      it('should match GDPR group', () => {
        expect(isIn({ country: 'DE', regionCode: '' }, ['GDPR'])).toBe(true)
        expect(isIn({ country: 'GB', regionCode: '' }, ['GDPR'])).toBe(true) // UK has GDPR
        expect(isIn({ country: 'NO', regionCode: '' }, ['GDPR'])).toBe(true)
        expect(isIn({ country: 'US', regionCode: '' }, ['GDPR'])).toBe(false)
      })

      it('should match APAC group', () => {
        expect(isIn({ country: 'JP', regionCode: '' }, ['APAC'])).toBe(true)
        expect(isIn({ country: 'SG', regionCode: '' }, ['APAC'])).toBe(true)
        expect(isIn({ country: 'AU', regionCode: '' }, ['APAC'])).toBe(true)
        expect(isIn({ country: 'KR', regionCode: '' }, ['APAC'])).toBe(true)
        expect(isIn({ country: 'US', regionCode: '' }, ['APAC'])).toBe(false)
      })

      it('should match LATAM group', () => {
        expect(isIn({ country: 'BR', regionCode: '' }, ['LATAM'])).toBe(true)
        expect(isIn({ country: 'MX', regionCode: '' }, ['LATAM'])).toBe(true)
        expect(isIn({ country: 'AR', regionCode: '' }, ['LATAM'])).toBe(true)
        expect(isIn({ country: 'US', regionCode: '' }, ['LATAM'])).toBe(false)
      })

      it('should match ASEAN group', () => {
        expect(isIn({ country: 'SG', regionCode: '' }, ['ASEAN'])).toBe(true)
        expect(isIn({ country: 'MY', regionCode: '' }, ['ASEAN'])).toBe(true)
        expect(isIn({ country: 'TH', regionCode: '' }, ['ASEAN'])).toBe(true)
        expect(isIn({ country: 'JP', regionCode: '' }, ['ASEAN'])).toBe(false)
      })

      it('should match FIVE_EYES group', () => {
        expect(isIn({ country: 'US', regionCode: '' }, ['FIVE_EYES'])).toBe(true)
        expect(isIn({ country: 'GB', regionCode: '' }, ['FIVE_EYES'])).toBe(true)
        expect(isIn({ country: 'CA', regionCode: '' }, ['FIVE_EYES'])).toBe(true)
        expect(isIn({ country: 'AU', regionCode: '' }, ['FIVE_EYES'])).toBe(true)
        expect(isIn({ country: 'NZ', regionCode: '' }, ['FIVE_EYES'])).toBe(true)
        expect(isIn({ country: 'DE', regionCode: '' }, ['FIVE_EYES'])).toBe(false)
      })

      it('should match NORTH_AMERICA group', () => {
        expect(isIn({ country: 'US', regionCode: '' }, ['NORTH_AMERICA'])).toBe(true)
        expect(isIn({ country: 'CA', regionCode: '' }, ['NORTH_AMERICA'])).toBe(true)
        expect(isIn({ country: 'MX', regionCode: '' }, ['NORTH_AMERICA'])).toBe(true)
        expect(isIn({ country: 'BR', regionCode: '' }, ['NORTH_AMERICA'])).toBe(false)
      })
    })

    describe('Mixed matching', () => {
      it('should match if any target matches (groups + countries)', () => {
        expect(isIn({ country: 'BR', regionCode: '' }, ['GDPR', 'BR'])).toBe(true)
        expect(isIn({ country: 'DE', regionCode: '' }, ['GDPR', 'BR'])).toBe(true)
        expect(isIn({ country: 'AU', regionCode: '' }, ['GDPR', 'BR'])).toBe(false)
      })

      it('should match if any target matches (groups + country-regions)', () => {
        expect(isIn({ country: 'US', regionCode: 'CA' }, ['GDPR', 'US-CA'])).toBe(true)
        expect(isIn({ country: 'DE', regionCode: '' }, ['GDPR', 'US-CA'])).toBe(true)
        expect(isIn({ country: 'US', regionCode: 'TX' }, ['GDPR', 'US-CA'])).toBe(false)
      })
    })

    describe('Case handling', () => {
      it('should handle group names case-insensitively', () => {
        expect(isIn({ country: 'DE', regionCode: '' }, ['eu'])).toBe(true)
        expect(isIn({ country: 'DE', regionCode: '' }, ['Eu'])).toBe(true)
        expect(isIn({ country: 'DE', regionCode: '' }, ['EU'])).toBe(true)
      })
    })
  })

  describe('getGroupCountries', () => {
    it('should return countries for EU group', () => {
      const countries = getGroupCountries('EU')
      expect(countries).toContain('DE')
      expect(countries).toContain('FR')
      expect(countries).toContain('IT')
      expect(countries.length).toBe(27)
    })

    it('should return countries for EEA group', () => {
      const countries = getGroupCountries('EEA')
      expect(countries).toContain('DE')
      expect(countries).toContain('NO')
      expect(countries).toContain('IS')
      expect(countries).toContain('LI')
      expect(countries.length).toBe(30) // 27 EU + 3
    })

    it('should return empty array for unknown group', () => {
      const countries = getGroupCountries('UNKNOWN_GROUP')
      expect(countries).toEqual([])
    })

    it('should be case-insensitive', () => {
      expect(getGroupCountries('eu')).toEqual(getGroupCountries('EU'))
    })
  })

  describe('isValidGroup', () => {
    it('should return true for valid groups', () => {
      expect(isValidGroup('EU')).toBe(true)
      expect(isValidGroup('EEA')).toBe(true)
      expect(isValidGroup('GDPR')).toBe(true)
      expect(isValidGroup('APAC')).toBe(true)
      expect(isValidGroup('FIVE_EYES')).toBe(true)
    })

    it('should return false for invalid groups', () => {
      expect(isValidGroup('INVALID')).toBe(false)
      expect(isValidGroup('')).toBe(false)
      expect(isValidGroup('US')).toBe(false) // US is a country, not a group
    })

    it('should be case-insensitive', () => {
      expect(isValidGroup('eu')).toBe(true)
      expect(isValidGroup('Eu')).toBe(true)
    })
  })

  describe('getAvailableGroups', () => {
    it('should return all available group names', () => {
      const groups = getAvailableGroups()

      expect(groups).toContain('EU')
      expect(groups).toContain('EEA')
      expect(groups).toContain('GDPR')
      expect(groups).toContain('APAC')
      expect(groups).toContain('LATAM')
      expect(groups).toContain('FIVE_EYES')
      expect(groups).toContain('NINE_EYES')
      expect(groups).toContain('FOURTEEN_EYES')
    })
  })

  describe('REGION_GROUPS', () => {
    it('should have all expected groups defined', () => {
      const expectedGroups = [
        'EU',
        'EEA',
        'GDPR',
        'EUROPE',
        'NORTH_AMERICA',
        'LATAM',
        'APAC',
        'MENA',
        'AFRICA',
        'NAFTA',
        'USMCA',
        'MERCOSUR',
        'ASEAN',
        'FIVE_EYES',
        'NINE_EYES',
        'FOURTEEN_EYES',
        'G7',
        'G20',
        'BRICS',
      ]

      for (const group of expectedGroups) {
        expect(REGION_GROUPS[group]).toBeDefined()
        expect(Array.isArray(REGION_GROUPS[group])).toBe(true)
      }
    })
  })
})
