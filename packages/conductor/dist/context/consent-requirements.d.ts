/**
 * Consent Requirements
 *
 * Defines what consent is required for different purposes
 * under each privacy jurisdiction.
 */
import type { Jurisdiction } from './jurisdiction-data.js';
/**
 * Purposes for which consent may be required
 */
export type ConsentPurpose = 'essential' | 'analytics' | 'marketing' | 'personalization' | 'third_party';
/**
 * Consent model type
 * - opt-in: Must get consent BEFORE processing
 * - opt-out: Can process until user says stop
 * - none: No consent required
 */
export type ConsentModel = 'opt-in' | 'opt-out' | 'none';
/**
 * Requirements for a specific jurisdiction
 */
export interface JurisdictionRequirements {
    /** Consent model (opt-in vs opt-out) */
    model: ConsentModel;
    /** Whether consent is required for each purpose */
    purposes: Record<ConsentPurpose, boolean>;
}
/**
 * Consent requirements by jurisdiction
 *
 * Key differences:
 * - GDPR (opt-in): Must get consent BEFORE processing non-essential data
 * - CCPA (opt-out): Can process until user opts out ("Do Not Sell")
 * - Most other laws follow GDPR's opt-in model
 */
export declare const JURISDICTION_REQUIREMENTS: Record<Jurisdiction, JurisdictionRequirements>;
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
export declare function requiresConsent(jurisdictions: Jurisdiction[], purpose: ConsentPurpose): boolean;
/**
 * Get the consent model for the strictest jurisdiction
 *
 * @param jurisdictions - Array of applicable jurisdictions
 * @returns The consent model to use
 */
export declare function getConsentModel(jurisdictions: Jurisdiction[]): ConsentModel;
/**
 * Get all purposes that require consent for given jurisdictions
 *
 * @param jurisdictions - Array of applicable jurisdictions
 * @returns Array of purposes that require consent
 */
export declare function getRequiredConsentPurposes(jurisdictions: Jurisdiction[]): ConsentPurpose[];
//# sourceMappingURL=consent-requirements.d.ts.map