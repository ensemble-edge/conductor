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
import { BaseMember } from '../base-member.js';
import { validateField } from './utils/validation.js';
import { renderForm } from './utils/renderer.js';
import { generateCsrfToken, validateCsrfToken } from './utils/csrf.js';
import { checkRateLimit } from './utils/rate-limit.js';
export class FormMember extends BaseMember {
    constructor(config) {
        super(config);
        this.formConfig = config;
        // Validate configuration
        this.validateConfig();
    }
    /**
     * Validate member configuration
     */
    validateConfig() {
        // Must have either fields or steps
        if (!this.formConfig.fields && !this.formConfig.steps) {
            throw new Error('Form member requires either fields or steps configuration');
        }
        // Can't have both fields and steps
        if (this.formConfig.fields && this.formConfig.steps) {
            throw new Error('Form member cannot have both fields and steps - use one or the other');
        }
        // Validate CAPTCHA config if present
        if (this.formConfig.captcha) {
            if (!this.formConfig.captcha.siteKey) {
                throw new Error('CAPTCHA configuration requires siteKey');
            }
        }
        // Validate CSRF config if enabled
        if (this.formConfig.csrf?.enabled) {
            if (!this.formConfig.csrf.secret) {
                throw new Error('CSRF protection requires a secret');
            }
        }
    }
    /**
     * Execute form operation
     */
    async run(context) {
        const input = context.input;
        const mode = input.mode || 'render';
        // Check rate limit if configured
        if (this.formConfig.rateLimit) {
            const identifier = input.request?.ip || 'anonymous';
            const rateLimitResult = await checkRateLimit(identifier, this.formConfig.rateLimit, context.env.RATE_LIMIT);
            if (!rateLimitResult.allowed) {
                return {
                    valid: false,
                    errors: [
                        {
                            field: '_form',
                            message: 'Rate limit exceeded. Please try again later.',
                            rule: 'rate_limit'
                        }
                    ],
                    rateLimit: {
                        remaining: rateLimitResult.remaining,
                        reset: rateLimitResult.reset
                    }
                };
            }
        }
        switch (mode) {
            case 'render':
                return this.renderForm(input, context);
            case 'validate':
                return this.validateForm(input, context);
            case 'submit':
                return this.submitForm(input, context);
            default:
                throw new Error(`Invalid form mode: ${mode}`);
        }
    }
    /**
     * Render form HTML
     */
    async renderForm(input, context) {
        // Generate CSRF token if enabled
        let csrfToken;
        if (this.formConfig.csrf?.enabled) {
            csrfToken = await generateCsrfToken(this.formConfig.csrf, context.env);
        }
        // Get current step for multi-step forms
        const currentStep = this.getCurrentStep(input);
        const fields = this.getFieldsForStep(currentStep);
        // Render form HTML
        const html = await renderForm({
            config: this.formConfig,
            fields,
            data: input.data || {},
            csrfToken,
            currentStep: currentStep?.id,
            errors: []
        });
        return {
            html,
            currentStep: currentStep?.id,
            csrfToken,
            valid: true
        };
    }
    /**
     * Validate form data
     */
    async validateForm(input, context) {
        const data = input.data || {};
        const errors = [];
        // Check honeypot if configured
        if (this.formConfig.honeypot && data[this.formConfig.honeypot]) {
            // Bot detected - fail silently with generic error
            return {
                valid: false,
                errors: [{ field: '_form', message: 'Form submission failed', rule: 'honeypot' }]
            };
        }
        // Validate CSRF token if enabled
        if (this.formConfig.csrf?.enabled) {
            const csrfToken = data[this.formConfig.csrf.fieldName || '_csrf'];
            const isValid = await validateCsrfToken(csrfToken, this.formConfig.csrf, context.env);
            if (!isValid) {
                errors.push({
                    field: '_csrf',
                    message: 'Invalid or expired security token',
                    rule: 'csrf'
                });
            }
        }
        // Get fields to validate for current step
        const currentStep = this.getCurrentStep(input);
        const fields = this.getFieldsForStep(currentStep);
        // Validate each field
        for (const field of fields) {
            const value = data[field.name];
            const fieldErrors = await validateField(field, value, data, context);
            errors.push(...fieldErrors);
        }
        // Sanitize and normalize data
        const sanitizedData = this.sanitizeData(data, fields);
        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
            data: sanitizedData,
            currentStep: currentStep?.id
        };
    }
    /**
     * Submit form (validate + return next step/completion)
     */
    async submitForm(input, context) {
        // First validate
        const validationResult = await this.validateForm(input, context);
        if (!validationResult.valid) {
            return validationResult;
        }
        // For multi-step forms, determine next step
        if (this.formConfig.steps) {
            const currentStepIndex = this.formConfig.steps.findIndex((step) => step.id === input.currentStep);
            const nextStep = this.formConfig.steps[currentStepIndex + 1];
            return {
                ...validationResult,
                currentStep: input.currentStep,
                nextStep: nextStep?.id,
                isLastStep: !nextStep
            };
        }
        // Single-step form - submission complete
        return {
            ...validationResult,
            isLastStep: true
        };
    }
    /**
     * Get current step for multi-step forms
     */
    getCurrentStep(input) {
        if (!this.formConfig.steps) {
            return null;
        }
        // If currentStep specified, find it
        if (input.currentStep) {
            const step = this.formConfig.steps.find((s) => s.id === input.currentStep);
            if (step)
                return step;
        }
        // Default to first step
        return this.formConfig.steps[0];
    }
    /**
     * Get fields for current step or all fields
     */
    getFieldsForStep(step) {
        if (step) {
            return step.fields;
        }
        return this.formConfig.fields || [];
    }
    /**
     * Sanitize form data
     */
    sanitizeData(data, fields) {
        const sanitized = {};
        for (const field of fields) {
            const value = data[field.name];
            if (value === undefined || value === null) {
                continue;
            }
            // Type-specific sanitization
            switch (field.type) {
                case 'email':
                    sanitized[field.name] = String(value).toLowerCase().trim();
                    break;
                case 'number':
                    sanitized[field.name] = Number(value);
                    break;
                case 'checkbox':
                    sanitized[field.name] = Boolean(value);
                    break;
                case 'select':
                    if (field.multiple && Array.isArray(value)) {
                        sanitized[field.name] = value.map((v) => String(v).trim());
                    }
                    else {
                        sanitized[field.name] = String(value).trim();
                    }
                    break;
                case 'textarea':
                case 'text':
                case 'password':
                case 'tel':
                case 'url':
                default:
                    sanitized[field.name] = String(value).trim();
            }
        }
        return sanitized;
    }
}
