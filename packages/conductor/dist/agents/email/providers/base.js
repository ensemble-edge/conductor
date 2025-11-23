/**
 * Base Email Provider
 *
 * Abstract base class for all email providers
 */
/**
 * Abstract base email provider
 */
export class BaseEmailProvider {
    /**
     * Normalize recipients to array
     */
    normalizeRecipients(recipients) {
        return Array.isArray(recipients) ? recipients : [recipients];
    }
    /**
     * Validate email address format
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Validate required fields
     */
    validateMessage(message) {
        const errors = [];
        if (!message.to || (Array.isArray(message.to) && message.to.length === 0)) {
            errors.push('Recipient (to) is required');
        }
        if (!message.subject || message.subject.trim() === '') {
            errors.push('Subject is required');
        }
        if (!message.html && !message.text) {
            errors.push('Either html or text content is required');
        }
        // Validate email addresses
        const recipients = this.normalizeRecipients(message.to);
        for (const email of recipients) {
            if (!this.validateEmail(email)) {
                errors.push(`Invalid email address: ${email}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
}
