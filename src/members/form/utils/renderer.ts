/**
 * Form HTML rendering utilities
 */

import type { FormMemberConfig, FormField, SelectOption, ValidationError } from '../types/index.js';

export interface RenderOptions {
	config: FormMemberConfig;
	fields: FormField[];
	data: Record<string, unknown>;
	errors: ValidationError[];
	csrfToken?: string;
	currentStep?: string;
}

/**
 * Render complete form HTML
 */
export async function renderForm(options: RenderOptions): Promise<string> {
	const { config, fields, data, errors, csrfToken, currentStep } = options;

	const style = config.style || {};
	const classes = style.classes || {};

	// Build error map for quick lookup
	const errorMap = new Map<string, string[]>();
	for (const error of errors) {
		if (!errorMap.has(error.field)) {
			errorMap.set(error.field, []);
		}
		errorMap.get(error.field)!.push(error.message);
	}

	// Start form
	let html = `<form
		class="${classes.form || 'conductor-form'}"
		method="${config.method || 'POST'}"
		${config.action ? `action="${escapeHtml(config.action)}"` : ''}
		novalidate
	>`;

	// Form title and description
	if (config.title) {
		html += `<h2 class="form-title">${escapeHtml(config.title)}</h2>`;
	}
	if (config.description) {
		html += `<p class="form-description">${escapeHtml(config.description)}</p>`;
	}

	// CSRF token field
	if (csrfToken) {
		const csrfFieldName = config.csrf?.fieldName || '_csrf';
		html += `<input type="hidden" name="${escapeHtml(csrfFieldName)}" value="${escapeHtml(csrfToken)}">`;
	}

	// Honeypot field
	if (config.honeypot) {
		html += `<input type="text" name="${escapeHtml(config.honeypot)}" value="" style="position:absolute;left:-9999px;" tabindex="-1" autocomplete="off" aria-hidden="true">`;
	}

	// Current step field (for multi-step forms)
	if (currentStep) {
		html += `<input type="hidden" name="_currentStep" value="${escapeHtml(currentStep)}">`;
	}

	// Render fields
	for (const field of fields) {
		html += renderField(field, data[field.name], errorMap.get(field.name), classes);
	}

	// CAPTCHA
	if (config.captcha) {
		html += renderCaptcha(config.captcha.type, config.captcha.siteKey, config.captcha);
	}

	// Submit button
	html += `<div class="form-actions">
		<button type="submit" class="${classes.button || 'form-submit'}">
			${escapeHtml(config.submitText || 'Submit')}
		</button>
	</div>`;

	html += `</form>`;

	// Add default styles if requested
	if (style.includeDefaultStyles !== false) {
		html = renderDefaultStyles() + html;
	}

	return html;
}

/**
 * Render a single form field
 */
function renderField(
	field: FormField,
	value: unknown,
	errors: string[] | undefined,
	classes: Record<string, string>
): string {
	const hasError = errors && errors.length > 0;
	const fieldClass = `${classes.field || 'form-field'} ${hasError ? 'has-error' : ''}`.trim();

	let html = `<div class="${fieldClass}">`;

	// Label
	if (field.label && field.type !== 'hidden') {
		const required = field.validation?.required ? ' <span class="required">*</span>' : '';
		html += `<label for="${field.name}" class="${classes.label || 'form-label'}">
			${escapeHtml(field.label)}${required}
		</label>`;
	}

	// Field input
	html += renderFieldInput(field, value, classes);

	// Help text
	if (field.help) {
		html += `<div class="${classes.help || 'form-help'}">${escapeHtml(field.help)}</div>`;
	}

	// Error messages
	if (hasError) {
		for (const error of errors!) {
			html += `<div class="${classes.error || 'form-error'}">${escapeHtml(error)}</div>`;
		}
	}

	html += `</div>`;
	return html;
}

/**
 * Render field input element
 */
function renderFieldInput(
	field: FormField,
	value: unknown,
	classes: Record<string, string>
): string {
	const inputClass = `${classes.input || 'form-input'} ${field.className || ''}`.trim();
	const commonAttrs = `
		name="${escapeHtml(field.name)}"
		id="${field.name}"
		class="${inputClass}"
		${field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : ''}
		${field.disabled ? 'disabled' : ''}
		${field.readonly ? 'readonly' : ''}
		${field.autocomplete ? `autocomplete="${escapeHtml(field.autocomplete)}"` : ''}
	`.trim();

	switch (field.type) {
		case 'textarea':
			return `<textarea ${commonAttrs} ${field.rows ? `rows="${field.rows}"` : ''} ${field.cols ? `cols="${field.cols}"` : ''}>${escapeHtml(String(value || field.default || ''))}</textarea>`;

		case 'select':
			return renderSelectField(field, value, commonAttrs);

		case 'checkbox':
			return renderCheckboxField(field, value, commonAttrs);

		case 'radio':
			return renderRadioField(field, value, commonAttrs);

		case 'hidden':
			return `<input type="hidden" name="${escapeHtml(field.name)}" value="${escapeHtml(String(value || field.default || ''))}">`;

		default:
			// text, email, password, number, tel, url, date, time, datetime-local, file
			return `<input
				type="${field.type}"
				${commonAttrs}
				${field.min !== undefined ? `min="${field.min}"` : ''}
				${field.max !== undefined ? `max="${field.max}"` : ''}
				${field.step !== undefined ? `step="${field.step}"` : ''}
				${field.accept ? `accept="${escapeHtml(field.accept)}"` : ''}
				value="${escapeHtml(String(value || field.default || ''))}"
			>`;
	}
}

/**
 * Render select field
 */
function renderSelectField(field: FormField, value: unknown, commonAttrs: string): string {
	let html = `<select ${commonAttrs} ${field.multiple ? 'multiple' : ''}>`;

	const options = normalizeOptions(field.options || []);
	const selectedValues = field.multiple && Array.isArray(value) ? value : [value];

	for (const option of options) {
		const selected = selectedValues.includes(option.value) || option.selected;
		html += `<option value="${escapeHtml(option.value)}" ${selected ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}>
			${escapeHtml(option.label)}
		</option>`;
	}

	html += `</select>`;
	return html;
}

/**
 * Render checkbox field
 */
function renderCheckboxField(field: FormField, value: unknown, commonAttrs: string): string {
	const checked = Boolean(value || field.default);
	return `<input type="checkbox" ${commonAttrs} ${checked ? 'checked' : ''} value="true">`;
}

/**
 * Render radio field
 */
function renderRadioField(field: FormField, value: unknown, commonAttrs: string): string {
	const options = normalizeOptions(field.options || []);
	let html = '';

	for (const option of options) {
		const checked = value === option.value || option.selected;
		html += `<label class="radio-option">
			<input
				type="radio"
				name="${escapeHtml(field.name)}"
				value="${escapeHtml(option.value)}"
				${checked ? 'checked' : ''}
				${option.disabled ? 'disabled' : ''}
			>
			${escapeHtml(option.label)}
		</label>`;
	}

	return html;
}

/**
 * Normalize options to SelectOption format
 */
function normalizeOptions(options: (SelectOption | string)[]): SelectOption[] {
	return options.map((opt) =>
		typeof opt === 'string' ? { label: opt, value: opt } : opt
	);
}

/**
 * Render CAPTCHA widget
 */
function renderCaptcha(
	type: string,
	siteKey: string,
	config: { theme?: string; size?: string }
): string {
	switch (type) {
		case 'turnstile':
			return `<div class="cf-turnstile"
				data-sitekey="${escapeHtml(siteKey)}"
				data-theme="${config.theme || 'auto'}"
				data-size="${config.size || 'normal'}">
			</div>
			<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>`;

		case 'recaptcha':
			return `<div class="g-recaptcha"
				data-sitekey="${escapeHtml(siteKey)}"
				data-theme="${config.theme || 'light'}"
				data-size="${config.size || 'normal'}">
			</div>
			<script src="https://www.google.com/recaptcha/api.js" async defer></script>`;

		case 'hcaptcha':
			return `<div class="h-captcha"
				data-sitekey="${escapeHtml(siteKey)}"
				data-theme="${config.theme || 'light'}"
				data-size="${config.size || 'normal'}">
			</div>
			<script src="https://js.hcaptcha.com/1/api.js" async defer></script>`;

		default:
			return '';
	}
}

/**
 * Render default form styles
 */
function renderDefaultStyles(): string {
	return `<style>
		.conductor-form {
			max-width: 600px;
			margin: 0 auto;
			padding: 2rem;
		}
		.form-title {
			margin: 0 0 0.5rem;
			font-size: 1.75rem;
			font-weight: 600;
		}
		.form-description {
			margin: 0 0 1.5rem;
			color: #666;
		}
		.form-field {
			margin-bottom: 1.5rem;
		}
		.form-label {
			display: block;
			margin-bottom: 0.5rem;
			font-weight: 500;
		}
		.required {
			color: #e53e3e;
		}
		.form-input, .form-input textarea, .form-input select {
			width: 100%;
			padding: 0.5rem 0.75rem;
			border: 1px solid #d1d5db;
			border-radius: 0.375rem;
			font-size: 1rem;
			transition: border-color 0.15s;
		}
		.form-input:focus {
			outline: none;
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}
		.form-help {
			margin-top: 0.25rem;
			font-size: 0.875rem;
			color: #6b7280;
		}
		.form-error {
			margin-top: 0.25rem;
			font-size: 0.875rem;
			color: #e53e3e;
		}
		.has-error .form-input {
			border-color: #e53e3e;
		}
		.radio-option {
			display: block;
			margin-bottom: 0.5rem;
		}
		.radio-option input {
			margin-right: 0.5rem;
		}
		.form-actions {
			margin-top: 2rem;
		}
		.form-submit {
			padding: 0.75rem 1.5rem;
			background-color: #3b82f6;
			color: white;
			border: none;
			border-radius: 0.375rem;
			font-size: 1rem;
			font-weight: 500;
			cursor: pointer;
			transition: background-color 0.15s;
		}
		.form-submit:hover {
			background-color: #2563eb;
		}
		.form-submit:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	</style>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	};
	return str.replace(/[&<>"']/g, (char) => map[char]);
}
