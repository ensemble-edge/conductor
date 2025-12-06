/**
 * Consent Requirements
 *
 * Defines what consent is required for different purposes
 * under each privacy jurisdiction.
 */

import type { Jurisdiction } from './jurisdiction-data.js'

/**
 * Purposes for which consent may be required
 */
export type ConsentPurpose =
  | 'essential' // Core functionality (never requires consent)
  | 'analytics' // Usage tracking, metrics
  | 'marketing' // Ads, promotional emails
  | 'personalization' // Recommendations, preferences
  | 'third_party' // Sharing with partners

/**
 * Consent model type
 * - opt-in: Must get consent BEFORE processing
 * - opt-out: Can process until user says stop
 * - none: No consent required
 */
export type ConsentModel = 'opt-in' | 'opt-out' | 'none'

/**
 * Requirements for a specific jurisdiction
 */
export interface JurisdictionRequirements {
  /** Consent model (opt-in vs opt-out) */
  model: ConsentModel
  /** Whether consent is required for each purpose */
  purposes: Record<ConsentPurpose, boolean>
}

/**
 * Consent requirements by jurisdiction
 *
 * Key differences:
 * - GDPR (opt-in): Must get consent BEFORE processing non-essential data
 * - CCPA (opt-out): Can process until user opts out ("Do Not Sell")
 * - Most other laws follow GDPR's opt-in model
 */
export const JURISDICTION_REQUIREMENTS: Record<Jurisdiction, JurisdictionRequirements> = {
  GDPR: {
    model: 'opt-in',
    purposes: {
      essential: false, // Never requires consent
      analytics: true, // Requires consent
      marketing: true,
      personalization: true,
      third_party: true,
    },
  },
  CCPA: {
    model: 'opt-out',
    purposes: {
      essential: false,
      analytics: false, // Opt-out model: allowed by default
      marketing: false,
      personalization: false,
      third_party: false, // But must honor "Do Not Sell"
    },
  },
  LGPD: {
    model: 'opt-in',
    purposes: {
      essential: false,
      analytics: true,
      marketing: true,
      personalization: true,
      third_party: true,
    },
  },
  PIPEDA: {
    model: 'opt-in',
    purposes: {
      essential: false,
      analytics: true,
      marketing: true,
      personalization: true,
      third_party: true,
    },
  },
  POPIA: {
    model: 'opt-in',
    purposes: {
      essential: false,
      analytics: true,
      marketing: true,
      personalization: true,
      third_party: true,
    },
  },
  PDPA: {
    model: 'opt-in',
    purposes: {
      essential: false,
      analytics: true,
      marketing: true,
      personalization: true,
      third_party: true,
    },
  },
  APPI: {
    model: 'opt-in',
    purposes: {
      essential: false,
      analytics: true,
      marketing: true,
      personalization: true,
      third_party: true,
    },
  },
}

/**
 * Check if consent is required for a specific purpose
 *
 * Uses conservative approach: if ANY applicable jurisdiction
 * requires consent for this purpose, returns true.
 *
 * @param jurisdictions - Array of applicable jurisdictions
 * @param purpose - The purpose to check
 * @returns True if consent is required
 *
 * @example
 * ```typescript
 * // In Germany (GDPR applies)
 * requiresConsent(['GDPR'], 'analytics')  // true
 * requiresConsent(['GDPR'], 'essential')  // false
 *
 * // In California (CCPA applies)
 * requiresConsent(['CCPA'], 'analytics')  // false (opt-out model)
 *
 * // No jurisdiction
 * requiresConsent([], 'analytics')        // false
 * ```
 */
export function requiresConsent(jurisdictions: Jurisdiction[], purpose: ConsentPurpose): boolean {
  // Essential never requires consent
  if (purpose === 'essential') return false

  // If no jurisdictions apply, no consent required
  if (jurisdictions.length === 0) return false

  // If ANY jurisdiction requires consent for this purpose, return true
  // (Conservative approach: comply with strictest applicable law)
  return jurisdictions.some((j) => JURISDICTION_REQUIREMENTS[j]?.purposes[purpose] === true)
}

/**
 * Get the consent model for the strictest jurisdiction
 *
 * @param jurisdictions - Array of applicable jurisdictions
 * @returns The consent model to use
 */
export function getConsentModel(jurisdictions: Jurisdiction[]): ConsentModel {
  if (jurisdictions.length === 0) return 'none'

  // If any jurisdiction uses opt-in, use opt-in (stricter)
  for (const j of jurisdictions) {
    if (JURISDICTION_REQUIREMENTS[j]?.model === 'opt-in') {
      return 'opt-in'
    }
  }

  // Otherwise use opt-out if any jurisdiction requires it
  for (const j of jurisdictions) {
    if (JURISDICTION_REQUIREMENTS[j]?.model === 'opt-out') {
      return 'opt-out'
    }
  }

  return 'none'
}

/**
 * Get all purposes that require consent for given jurisdictions
 *
 * @param jurisdictions - Array of applicable jurisdictions
 * @returns Array of purposes that require consent
 */
export function getRequiredConsentPurposes(jurisdictions: Jurisdiction[]): ConsentPurpose[] {
  const purposes: ConsentPurpose[] = ['analytics', 'marketing', 'personalization', 'third_party']
  return purposes.filter((p) => requiresConsent(jurisdictions, p))
}
