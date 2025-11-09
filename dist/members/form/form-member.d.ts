/**
 * Form Member
 *
 * Declarative form generation with:
 * - Multiple field types (text, email, select, checkbox, etc.)
 * - Server-side validation
 * - Security features (CAPTCHA, CSRF, honeypot, rate limiting)
 * - Multi-step form support
 * - Customizable styling
 */
import { BaseMember, type MemberExecutionContext } from '../base-member.js';
import type { MemberConfig } from '../../runtime/parser.js';
import type { FormMemberOutput } from './types/index.js';
export declare class FormMember extends BaseMember {
    private formConfig;
    constructor(config: MemberConfig);
    /**
     * Validate member configuration
     */
    private validateConfig;
    /**
     * Execute form operation
     */
    protected run(context: MemberExecutionContext): Promise<FormMemberOutput>;
    /**
     * Render form HTML
     */
    private renderForm;
    /**
     * Validate form data
     */
    private validateForm;
    /**
     * Submit form (validate + return next step/completion)
     */
    private submitForm;
    /**
     * Get current step for multi-step forms
     */
    private getCurrentStep;
    /**
     * Get fields for current step or all fields
     */
    private getFieldsForStep;
    /**
     * Sanitize form data
     */
    private sanitizeData;
}
//# sourceMappingURL=form-member.d.ts.map