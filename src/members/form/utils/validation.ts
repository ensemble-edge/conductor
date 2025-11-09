/**
 * Form field validation utilities
 */

import type { FormField, ValidationError } from '../types/index.js';
import type { MemberExecutionContext } from '../../base-member.js';

/**
 * Validate a single field
 */
export async function validateField(
	field: FormField,
	value: unknown,
	allData: Record<string, unknown>,
	context: MemberExecutionContext
): Promise<ValidationError[]> {
	const errors: ValidationError[] = [];

	// Skip validation for disabled or readonly fields
	if (field.disabled || field.readonly) {
		return errors;
	}

	const validation = field.validation;
	if (!validation) {
		return errors;
	}

	// Required validation
	if (validation.required) {
		if (isEmpty(value)) {
			const message =
				typeof validation.required === 'string'
					? validation.required
					: `${field.label || field.name} is required`;
			errors.push({ field: field.name, message, rule: 'required' });
			// If required fails, skip other validations
			return errors;
		}
	}

	// Skip further validation if value is empty and not required
	if (isEmpty(value)) {
		return errors;
	}

	const stringValue = String(value);

	// Email validation
	if (validation.email) {
		if (!isValidEmail(stringValue)) {
			const message =
				typeof validation.email === 'string'
					? validation.email
					: 'Please enter a valid email address';
			errors.push({ field: field.name, message, rule: 'email' });
		}
	}

	// URL validation
	if (validation.url) {
		if (!isValidUrl(stringValue)) {
			const message =
				typeof validation.url === 'string' ? validation.url : 'Please enter a valid URL';
			errors.push({ field: field.name, message, rule: 'url' });
		}
	}

	// Pattern validation
	if (validation.pattern) {
		const pattern =
			typeof validation.pattern === 'string'
				? { regex: validation.pattern, message: 'Invalid format' }
				: validation.pattern;

		const regex = new RegExp(pattern.regex);
		if (!regex.test(stringValue)) {
			errors.push({ field: field.name, message: pattern.message, rule: 'pattern' });
		}
	}

	// Min/Max for numbers
	if (field.type === 'number' && typeof value === 'number') {
		if (validation.min !== undefined) {
			const min = typeof validation.min === 'number' ? { value: validation.min, message: `Minimum value is ${validation.min}` } : validation.min;
			if (value < min.value) {
				errors.push({ field: field.name, message: min.message, rule: 'min' });
			}
		}

		if (validation.max !== undefined) {
			const max = typeof validation.max === 'number' ? { value: validation.max, message: `Maximum value is ${validation.max}` } : validation.max;
			if (value > max.value) {
				errors.push({ field: field.name, message: max.message, rule: 'max' });
			}
		}
	}

	// MinLength/MaxLength for strings
	if (validation.minLength !== undefined) {
		const minLength =
			typeof validation.minLength === 'number'
				? { value: validation.minLength, message: `Minimum length is ${validation.minLength}` }
				: validation.minLength;
		if (stringValue.length < minLength.value) {
			errors.push({ field: field.name, message: minLength.message, rule: 'minLength' });
		}
	}

	if (validation.maxLength !== undefined) {
		const maxLength =
			typeof validation.maxLength === 'number'
				? { value: validation.maxLength, message: `Maximum length is ${validation.maxLength}` }
				: validation.maxLength;
		if (stringValue.length > maxLength.value) {
			errors.push({ field: field.name, message: maxLength.message, rule: 'maxLength' });
		}
	}

	// Matches validation (e.g., password confirmation)
	if (validation.matches) {
		const matches =
			typeof validation.matches === 'string'
				? { field: validation.matches, message: 'Fields do not match' }
				: validation.matches;

		const matchValue = allData[matches.field];
		if (value !== matchValue) {
			errors.push({ field: field.name, message: matches.message, rule: 'matches' });
		}
	}

	// Custom validation function
	if (validation.custom) {
		// Custom validation would be provided in context
		const customValidator = (context.input as any)?.validators?.[validation.custom];
		if (typeof customValidator === 'function') {
			const customResult = await customValidator(value, allData, field);
			if (customResult !== true) {
				const message = typeof customResult === 'string' ? customResult : 'Validation failed';
				errors.push({ field: field.name, message, rule: 'custom' });
			}
		}
	}

	return errors;
}

/**
 * Check if value is empty
 */
function isEmpty(value: unknown): boolean {
	if (value === null || value === undefined) {
		return true;
	}

	if (typeof value === 'string') {
		return value.trim() === '';
	}

	if (Array.isArray(value)) {
		return value.length === 0;
	}

	return false;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
	// RFC 5322 simplified regex
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}
