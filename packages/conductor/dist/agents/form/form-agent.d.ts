/**
 * Form Agent
 *
 * Declarative form generation with:
 * - Multiple field types (text, email, select, checkbox, etc.)
 * - Server-side validation
 * - Security features (CAPTCHA, CSRF, honeypot, rate limiting)
 * - Multi-step form support
 * - Customizable styling
 */
import { BaseAgent, type AgentExecutionContext } from '../base-agent.js';
import type { AgentConfig } from '../../runtime/parser.js';
import type { FormMemberOutput } from './types/index.js';
export declare class FormAgent extends BaseAgent {
    private formConfig;
    constructor(config: AgentConfig);
    /**
     * Validate agent configuration
     */
    private validateConfig;
    /**
     * Execute form operation
     */
    protected run(context: AgentExecutionContext): Promise<FormMemberOutput>;
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
//# sourceMappingURL=form-agent.d.ts.map