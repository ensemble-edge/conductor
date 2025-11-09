/**
 * Cookie Utilities
 *
 * Handles cookie parsing, serialization, and signing.
 */

import type { Cookie, CookieOptions, ParsedCookie } from '../types/index.js';

/**
 * Parse cookies from Cookie header string
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
	const cookies: Record<string, string> = {};

	if (!cookieHeader) {
		return cookies;
	}

	const pairs = cookieHeader.split(';');

	for (const pair of pairs) {
		const [name, ...valueParts] = pair.split('=');
		const trimmedName = name?.trim();
		const value = valueParts.join('=').trim();

		if (trimmedName && value) {
			cookies[trimmedName] = decodeURIComponent(value);
		}
	}

	return cookies;
}

/**
 * Serialize a cookie to Set-Cookie header format
 */
export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
	const pairs: string[] = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

	if (options.maxAge !== undefined) {
		pairs.push(`Max-Age=${options.maxAge}`);
	}

	if (options.expires) {
		pairs.push(`Expires=${options.expires.toUTCString()}`);
	}

	if (options.domain) {
		pairs.push(`Domain=${options.domain}`);
	}

	if (options.path) {
		pairs.push(`Path=${options.path}`);
	} else {
		pairs.push('Path=/');
	}

	if (options.secure) {
		pairs.push('Secure');
	}

	if (options.httpOnly) {
		pairs.push('HttpOnly');
	}

	if (options.sameSite) {
		const sameSite = options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1);
		pairs.push(`SameSite=${sameSite}`);
	}

	return pairs.join('; ');
}

/**
 * Sign a cookie value using HMAC-SHA256
 */
export async function signCookie(value: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);

	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
	const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

	return `${value}.${signatureBase64}`;
}

/**
 * Verify and unsign a cookie value
 */
export async function unsignCookie(signedValue: string, secret: string): Promise<ParsedCookie | null> {
	const lastDotIndex = signedValue.lastIndexOf('.');

	if (lastDotIndex === -1) {
		return null;
	}

	const value = signedValue.slice(0, lastDotIndex);
	const signatureBase64 = signedValue.slice(lastDotIndex + 1);

	try {
		const expectedSigned = await signCookie(value, secret);
		const expectedSignature = expectedSigned.slice(expectedSigned.lastIndexOf('.') + 1);

		if (signatureBase64 === expectedSignature) {
			return { name: '', value, valid: true };
		}

		return { name: '', value, valid: false };
	} catch {
		return null;
	}
}

/**
 * Create a Set-Cookie header for a cookie
 */
export async function createSetCookieHeader(
	cookie: Cookie,
	secret?: string
): Promise<string> {
	let value = cookie.value;

	// Sign the cookie if requested and secret is provided
	if (cookie.options?.signed && secret) {
		value = await signCookie(value, secret);
	}

	return serializeCookie(cookie.name, value, cookie.options);
}

/**
 * Create a deletion cookie (expires in the past)
 */
export function createDeleteCookie(name: string, options: Partial<CookieOptions> = {}): string {
	return serializeCookie(name, '', {
		...options,
		expires: new Date(0),
		maxAge: 0
	});
}

/**
 * Parse and verify signed cookies
 */
export async function parseSignedCookies(
	cookies: Record<string, string>,
	secret: string
): Promise<Record<string, ParsedCookie>> {
	const parsed: Record<string, ParsedCookie> = {};

	for (const [name, value] of Object.entries(cookies)) {
		const unsigned = await unsignCookie(value, secret);

		if (unsigned) {
			parsed[name] = { ...unsigned, name };
		} else {
			// Not a signed cookie, return as-is
			parsed[name] = { name, value, valid: undefined };
		}
	}

	return parsed;
}

/**
 * Validate cookie name (RFC 6265)
 */
export function isValidCookieName(name: string): boolean {
	// Cookie names can't contain: ( ) < > @ , ; : \ " / [ ] ? = { }
	const invalidChars = /[()<>@,;:\\"\/\[\]?={}]/;
	return name.length > 0 && !invalidChars.test(name);
}

/**
 * Validate cookie value
 */
export function isValidCookieValue(value: string): boolean {
	// Cookie values can be any US-ASCII characters excluding control chars, whitespace, ", comma, semicolon, and backslash
	// We'll encode these, so this is mostly a sanity check
	return value !== null && value !== undefined;
}

/**
 * Merge cookie options with defaults
 */
export function mergeCookieOptions(
	options: CookieOptions | undefined,
	defaults: CookieOptions | undefined
): CookieOptions {
	return {
		...defaults,
		...options
	};
}
