/**
 * Consent Requirements Tests
 *
 * Tests for consent requirement logic across different jurisdictions
 */

import { describe, it, expect } from 'vitest'
import {
  requiresConsent,
  getConsentModel,
  getRequiredConsentPurposes,
  JURISDICTION_REQUIREMENTS,
} from '../../../src/context/consent-requirements'
import type { Jurisdiction } from '../../../src/context/jurisdiction-data'
import type { ConsentPurpose } from '../../../src/context/consent-requirements'

describe('Consent Requirements', () => {
  describe('requiresConsent', () => {
    describe('GDPR (opt-in model)', () => {
      const jurisdictions: Jurisdiction[] = ['GDPR']

      it('should require consent for analytics', () => {
        expect(requiresConsent(jurisdictions, 'analytics')).toBe(true)
      })

      it('should require consent for marketing', () => {
        expect(requiresConsent(jurisdictions, 'marketing')).toBe(true)
      })

      it('should require consent for personalization', () => {
        expect(requiresConsent(jurisdictions, 'personalization')).toBe(true)
      })

      it('should require consent for third_party', () => {
        expect(requiresConsent(jurisdictions, 'third_party')).toBe(true)
      })

      it('should NOT require consent for essential', () => {
        expect(requiresConsent(jurisdictions, 'essential')).toBe(false)
      })
    })

    describe('CCPA (opt-out model)', () => {
      const jurisdictions: Jurisdiction[] = ['CCPA']

      it('should NOT require consent for analytics (opt-out model)', () => {
        expect(requiresConsent(jurisdictions, 'analytics')).toBe(false)
      })

      it('should NOT require consent for marketing', () => {
        expect(requiresConsent(jurisdictions, 'marketing')).toBe(false)
      })

      it('should NOT require consent for personalization', () => {
        expect(requiresConsent(jurisdictions, 'personalization')).toBe(false)
      })

      it('should NOT require consent for third_party', () => {
        expect(requiresConsent(jurisdictions, 'third_party')).toBe(false)
      })

      it('should NOT require consent for essential', () => {
        expect(requiresConsent(jurisdictions, 'essential')).toBe(false)
      })
    })

    describe('LGPD (opt-in model)', () => {
      const jurisdictions: Jurisdiction[] = ['LGPD']

      it('should require consent for analytics', () => {
        expect(requiresConsent(jurisdictions, 'analytics')).toBe(true)
      })

      it('should require consent for marketing', () => {
        expect(requiresConsent(jurisdictions, 'marketing')).toBe(true)
      })

      it('should NOT require consent for essential', () => {
        expect(requiresConsent(jurisdictions, 'essential')).toBe(false)
      })
    })

    describe('No jurisdiction', () => {
      const jurisdictions: Jurisdiction[] = []

      it('should NOT require consent for any purpose when no jurisdiction', () => {
        const purposes: ConsentPurpose[] = [
          'essential',
          'analytics',
          'marketing',
          'personalization',
          'third_party',
        ]

        for (const purpose of purposes) {
          expect(requiresConsent(jurisdictions, purpose)).toBe(false)
        }
      })
    })

    describe('Multiple jurisdictions (conservative approach)', () => {
      it('should require consent if ANY jurisdiction requires it', () => {
        // GDPR requires consent, CCPA does not
        const jurisdictions: Jurisdiction[] = ['GDPR', 'CCPA']

        // Should be true because GDPR requires it
        expect(requiresConsent(jurisdictions, 'analytics')).toBe(true)
      })
    })

    describe('Essential always exempt', () => {
      it('should never require consent for essential regardless of jurisdiction', () => {
        const allJurisdictions: Jurisdiction[] = [
          'GDPR',
          'CCPA',
          'LGPD',
          'PIPEDA',
          'POPIA',
          'PDPA',
          'APPI',
        ]

        for (const j of allJurisdictions) {
          expect(requiresConsent([j], 'essential')).toBe(false)
        }
      })
    })
  })

  describe('getConsentModel', () => {
    it('should return opt-in for GDPR', () => {
      expect(getConsentModel(['GDPR'])).toBe('opt-in')
    })

    it('should return opt-out for CCPA', () => {
      expect(getConsentModel(['CCPA'])).toBe('opt-out')
    })

    it('should return opt-in for LGPD', () => {
      expect(getConsentModel(['LGPD'])).toBe('opt-in')
    })

    it('should return none when no jurisdiction', () => {
      expect(getConsentModel([])).toBe('none')
    })

    it('should return opt-in when mixed (stricter wins)', () => {
      // If both GDPR (opt-in) and CCPA (opt-out) apply, opt-in wins
      expect(getConsentModel(['GDPR', 'CCPA'])).toBe('opt-in')
      expect(getConsentModel(['CCPA', 'GDPR'])).toBe('opt-in')
    })
  })

  describe('getRequiredConsentPurposes', () => {
    it('should return all non-essential purposes for GDPR', () => {
      const purposes = getRequiredConsentPurposes(['GDPR'])

      expect(purposes).toContain('analytics')
      expect(purposes).toContain('marketing')
      expect(purposes).toContain('personalization')
      expect(purposes).toContain('third_party')
      expect(purposes).not.toContain('essential')
    })

    it('should return empty array for CCPA', () => {
      const purposes = getRequiredConsentPurposes(['CCPA'])
      expect(purposes).toHaveLength(0)
    })

    it('should return empty array when no jurisdiction', () => {
      const purposes = getRequiredConsentPurposes([])
      expect(purposes).toHaveLength(0)
    })
  })

  describe('JURISDICTION_REQUIREMENTS', () => {
    it('should have requirements for all known jurisdictions', () => {
      const knownJurisdictions: Jurisdiction[] = [
        'GDPR',
        'CCPA',
        'LGPD',
        'PIPEDA',
        'POPIA',
        'PDPA',
        'APPI',
      ]

      for (const j of knownJurisdictions) {
        expect(JURISDICTION_REQUIREMENTS[j]).toBeDefined()
        expect(JURISDICTION_REQUIREMENTS[j].model).toBeDefined()
        expect(JURISDICTION_REQUIREMENTS[j].purposes).toBeDefined()
      }
    })

    it('should have all purpose types defined for each jurisdiction', () => {
      const purposes: ConsentPurpose[] = [
        'essential',
        'analytics',
        'marketing',
        'personalization',
        'third_party',
      ]

      for (const [, req] of Object.entries(JURISDICTION_REQUIREMENTS)) {
        for (const purpose of purposes) {
          expect(typeof req.purposes[purpose]).toBe('boolean')
        }
      }
    })
  })
})
