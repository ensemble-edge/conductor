/**
 * Email Handler Routes
 *
 * Handle incoming emails via Cloudflare Email Routing to trigger ensembles.
 *
 * Setup in wrangler.toml:
 * [[email_handlers]]
 * destination = "https://your-worker.workers.dev/email"
 */
import { Hono } from 'hono';
import { CatalogLoader } from '../../runtime/catalog-loader.js';
import { Executor } from '../../runtime/executor.js';
import { createLogger } from '../../observability/index.js';
const app = new Hono();
const logger = createLogger({ serviceName: 'api-email' });
/**
 * Redact email address for logging (GDPR compliance)
 *
 * Converts "user@example.com" to "u***@e***.com"
 * This allows debugging while preventing PII storage in logs.
 */
function redactEmail(email) {
    if (!email || typeof email !== 'string') {
        return '[invalid]';
    }
    const atIndex = email.indexOf('@');
    if (atIndex === -1) {
        // Not a valid email format, just redact most of it
        return email.length > 2 ? email[0] + '***' + email.slice(-1) : '***';
    }
    const localPart = email.substring(0, atIndex);
    const domainPart = email.substring(atIndex + 1);
    const dotIndex = domainPart.lastIndexOf('.');
    // Redact local part: keep first char + ***
    const redactedLocal = localPart.length > 1 ? localPart[0] + '***' : '***';
    // Redact domain: keep first char + *** + TLD
    let redactedDomain = '***';
    if (dotIndex !== -1) {
        const domainName = domainPart.substring(0, dotIndex);
        const tld = domainPart.substring(dotIndex);
        redactedDomain = (domainName.length > 1 ? domainName[0] + '***' : '***') + tld;
    }
    return `${redactedLocal}@${redactedDomain}`;
}
/**
 * Handle incoming email
 * POST /email
 *
 * Called by Cloudflare Email Routing when an email is received
 */
app.post('/', async (c) => {
    const env = c.env;
    try {
        // Parse email message from request
        // Cloudflare Email Routing sends email as a special format
        const contentType = c.req.header('content-type') || '';
        if (!contentType.includes('message/rfc822') && !contentType.includes('multipart/form-data')) {
            return c.json({
                error: 'Invalid content type',
                message: 'Expected message/rfc822 or multipart/form-data',
            }, 400);
        }
        // Get email data
        const emailData = await parseEmailFromRequest(c);
        // Log with redacted emails for GDPR compliance
        logger.info('Email received', {
            from: redactEmail(emailData.from),
            to: redactEmail(emailData.to),
            subjectLength: emailData.subject?.length ?? 0,
        });
        // Find ensemble that handles this email address
        const ensemble = await findEnsembleForEmail(emailData.to, env);
        if (!ensemble) {
            logger.warn('No ensemble found for email address', {
                to: redactEmail(emailData.to),
            });
            // Return 200 to prevent bounce (silently ignore)
            return c.text('OK');
        }
        // Get the email trigger config (we know it exists since findEnsembleForEmail matched it)
        const emailTrigger = ensemble.trigger?.find((exp) => exp.type === 'email');
        // Authenticate sender if configured
        if (emailTrigger && !emailTrigger.public && emailTrigger.auth) {
            const isAuthorized = await authenticateEmailSender(emailData.from, emailTrigger.auth.from);
            if (!isAuthorized) {
                logger.warn('Email sender not authorized', {
                    ensemble: ensemble.name,
                    from: redactEmail(emailData.from),
                    whitelistCount: emailTrigger.auth.from.length,
                });
                // Send rejection email if configured
                if (emailTrigger?.reply_with_output) {
                    await sendRejectionEmail(emailData, env);
                }
                return c.text('OK');
            }
        }
        // Extract input from email
        const input = extractInputFromEmail(emailData);
        logger.info('Executing ensemble from email', {
            ensemble: ensemble.name,
            from: redactEmail(emailData.from),
            to: redactEmail(emailData.to),
        });
        // Execute ensemble
        const ctx = {
            waitUntil: (promise) => { },
            passThroughOnException: () => { },
        };
        const executor = new Executor({ env, ctx });
        const result = await executor.executeEnsemble(ensemble, input);
        // Send reply email if configured
        if (emailTrigger?.reply_with_output && result.success) {
            await sendReplyEmail(emailData, result.value.output, env);
        }
        else if (emailTrigger?.reply_with_output && !result.success) {
            await sendErrorEmail(emailData, result.error.message, env);
        }
        logger.info('Email execution completed', {
            ensemble: ensemble.name,
            success: result.success,
            duration: result.success ? result.value.metrics.totalDuration : 0,
        });
        return c.text('OK');
    }
    catch (error) {
        logger.error('Email handler error', error instanceof Error ? error : undefined);
        // Return 200 to prevent bounce (we've handled the error)
        return c.text('OK');
    }
});
/**
 * Parse email data from request
 */
async function parseEmailFromRequest(c) {
    const contentType = c.req.header('content-type') || '';
    if (contentType.includes('application/json')) {
        // JSON format (for testing)
        const data = await c.req.json();
        return {
            from: data.from || '',
            to: data.to || '',
            subject: data.subject || '',
            body: data.body || data.text || '',
            html: data.html,
            headers: data.headers || {},
            attachments: data.attachments,
        };
    }
    // RFC822 format (production - from Cloudflare Email Routing)
    // The raw email is in the request body
    const rawBody = await c.req.text();
    return parseRFC822(rawBody, {
        from: c.req.header('x-sender') || '',
        to: c.req.header('x-recipient') || '',
    });
}
/**
 * Parse RFC822 email format
 *
 * RFC822 emails have the format:
 * ```
 * Header-Name: Header-Value
 * Another-Header: Value
 *
 * Body content here...
 * ```
 *
 * The headers and body are separated by a blank line (CRLF CRLF).
 */
function parseRFC822(raw, defaults = {}) {
    const headers = {};
    let body = '';
    let html;
    // Split headers and body (blank line separates them)
    // Handle both \r\n and \n line endings
    const headerBodySplit = raw.split(/\r?\n\r?\n/);
    const headerSection = headerBodySplit[0] || '';
    const bodySection = headerBodySplit.slice(1).join('\n\n');
    // Parse headers (handle continuation lines - lines starting with whitespace)
    let currentHeader = '';
    for (const line of headerSection.split(/\r?\n/)) {
        if (line.startsWith(' ') || line.startsWith('\t')) {
            // Continuation of previous header
            if (currentHeader) {
                headers[currentHeader] += ' ' + line.trim();
            }
        }
        else if (line.includes(':')) {
            const colonIndex = line.indexOf(':');
            const name = line.substring(0, colonIndex).trim().toLowerCase();
            const value = line.substring(colonIndex + 1).trim();
            headers[name] = value;
            currentHeader = name;
        }
    }
    // Decode encoded words in headers (RFC 2047)
    const decodeHeader = (value) => {
        // Match =?charset?encoding?text?= patterns
        return value.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, charset, encoding, text) => {
            try {
                if (encoding.toUpperCase() === 'B') {
                    // Base64
                    return atob(text);
                }
                else if (encoding.toUpperCase() === 'Q') {
                    // Quoted-printable
                    return text.replace(/_/g, ' ').replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
                        return String.fromCharCode(parseInt(hex, 16));
                    });
                }
            }
            catch {
                return text;
            }
            return text;
        });
    };
    const subject = decodeHeader(headers['subject'] || '');
    const from = headers['from'] || defaults.from || '';
    const to = headers['to'] || defaults.to || '';
    // Handle MIME multipart content
    const contentTypeHeader = headers['content-type'] || '';
    const attachments = [];
    if (contentTypeHeader.includes('multipart/')) {
        // Extract boundary
        const boundaryMatch = contentTypeHeader.match(/boundary="?([^";\s]+)"?/);
        if (boundaryMatch) {
            const boundary = boundaryMatch[1];
            const parts = bodySection.split(new RegExp(`--${escapeRegex(boundary)}`));
            for (const part of parts) {
                if (part.trim() === '' || part.trim() === '--')
                    continue;
                // Parse part headers and content
                const partSplit = part.split(/\r?\n\r?\n/);
                const partHeaders = {};
                const partHeaderSection = partSplit[0] || '';
                const partContent = partSplit.slice(1).join('\n\n').trim();
                for (const line of partHeaderSection.split(/\r?\n/)) {
                    if (line.includes(':')) {
                        const colonIndex = line.indexOf(':');
                        const name = line.substring(0, colonIndex).trim().toLowerCase();
                        const value = line.substring(colonIndex + 1).trim();
                        partHeaders[name] = value;
                    }
                }
                const partContentType = partHeaders['content-type'] || '';
                if (partContentType.includes('text/plain') && !body) {
                    body = decodePartContent(partContent, partHeaders['content-transfer-encoding']);
                }
                else if (partContentType.includes('text/html')) {
                    html = decodePartContent(partContent, partHeaders['content-transfer-encoding']);
                }
                else if (partHeaders['content-disposition']?.includes('attachment')) {
                    // Extract attachment
                    const filenameMatch = partHeaders['content-disposition'].match(/filename="?([^";\s]+)"?/);
                    const filename = filenameMatch ? filenameMatch[1] : 'attachment';
                    const content = decodePartContentBinary(partContent, partHeaders['content-transfer-encoding']);
                    attachments.push({ filename, contentType: partContentType.split(';')[0], content });
                }
            }
        }
    }
    else {
        // Simple text email
        body = decodePartContent(bodySection, headers['content-transfer-encoding']);
    }
    return {
        from,
        to,
        subject,
        body,
        html,
        headers,
        attachments: attachments.length > 0 ? attachments : undefined,
    };
}
/**
 * Decode part content based on transfer encoding
 */
function decodePartContent(content, encoding) {
    if (!encoding)
        return content;
    encoding = encoding.toLowerCase();
    if (encoding === 'base64') {
        try {
            return atob(content.replace(/\s/g, ''));
        }
        catch {
            return content;
        }
    }
    if (encoding === 'quoted-printable') {
        return content
            .replace(/=\r?\n/g, '') // Soft line breaks
            .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    }
    return content;
}
/**
 * Decode part content to binary
 */
function decodePartContentBinary(content, encoding) {
    const decoded = decodePartContent(content, encoding);
    return new TextEncoder().encode(decoded);
}
/**
 * Escape regex special characters
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Find ensemble that handles this email address
 */
async function findEnsembleForEmail(emailAddress, env) {
    // Load all ensembles from catalog
    const allEnsembles = await CatalogLoader.loadAllEnsembles(env);
    // Normalize the target email for comparison
    const normalizedTarget = emailAddress.toLowerCase().trim();
    for (const ensemble of allEnsembles) {
        // Check if ensemble has email trigger
        const emailTrigger = ensemble.trigger?.find((t) => t.type === 'email');
        if (!emailTrigger)
            continue;
        // Check if the email address matches
        const exposedAddresses = emailTrigger.addresses || [];
        for (const pattern of exposedAddresses) {
            if (matchEmailPattern(normalizedTarget, pattern)) {
                logger.info('Found ensemble for email', {
                    ensemble: ensemble.name,
                    pattern,
                    to: redactEmail(emailAddress),
                });
                return ensemble;
            }
        }
    }
    logger.debug('No ensemble found for email', { to: redactEmail(emailAddress) });
    return null;
}
/**
 * Match email address against a pattern
 *
 * Supports:
 * - Exact match: user@example.com
 * - Wildcard domain: *@example.com
 * - Wildcard local: support+*@example.com
 * - Full wildcard: * (matches all)
 */
function matchEmailPattern(email, pattern) {
    const normalizedPattern = pattern.toLowerCase().trim();
    // Full wildcard
    if (normalizedPattern === '*') {
        return true;
    }
    // Exact match
    if (email === normalizedPattern) {
        return true;
    }
    // Convert pattern to regex
    // Escape special chars except *, then replace * with .*
    const regexPattern = '^' +
        normalizedPattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*') +
        '$';
    try {
        const regex = new RegExp(regexPattern);
        return regex.test(email);
    }
    catch {
        // Invalid pattern, try simple includes
        return email.includes(normalizedPattern.replace(/\*/g, ''));
    }
}
/**
 * Authenticate email sender against whitelist
 */
async function authenticateEmailSender(from, whitelist) {
    // Check if sender matches any pattern in whitelist
    for (const pattern of whitelist) {
        if (pattern === '*') {
            // Allow all
            return true;
        }
        if (pattern.includes('*')) {
            // Wildcard pattern (e.g., *@company.com)
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
            if (regex.test(from)) {
                return true;
            }
        }
        else {
            // Exact match
            if (from.toLowerCase() === pattern.toLowerCase()) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Extract input data from email
 */
function extractInputFromEmail(emailData) {
    // Extract structured data from email
    // For now, pass the entire email as input
    return {
        email: {
            from: emailData.from,
            to: emailData.to,
            subject: emailData.subject,
            body: emailData.body,
        },
        // Try to extract parameters from subject
        subject: emailData.subject,
        // Try to extract parameters from body
        message: emailData.body,
    };
}
/**
 * Send reply email with execution results
 */
async function sendReplyEmail(originalEmail, output, _env) {
    try {
        const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personalizations: [
                    {
                        to: [{ email: originalEmail.from }],
                    },
                ],
                from: {
                    email: originalEmail.to,
                    name: 'Conductor',
                },
                subject: `Re: ${originalEmail.subject}`,
                content: [
                    {
                        type: 'text/plain',
                        value: formatOutputAsText(output),
                    },
                    {
                        type: 'text/html',
                        value: formatOutputAsHtml(output),
                    },
                ],
            }),
        });
        if (!response.ok) {
            throw new Error(`MailChannels error: ${response.status}`);
        }
    }
    catch (error) {
        logger.error('Failed to send reply email', error instanceof Error ? error : undefined);
    }
}
/**
 * Send rejection email
 */
async function sendRejectionEmail(originalEmail, _env) {
    try {
        await fetch('https://api.mailchannels.net/tx/v1/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personalizations: [
                    {
                        to: [{ email: originalEmail.from }],
                    },
                ],
                from: {
                    email: originalEmail.to,
                    name: 'Conductor',
                },
                subject: `Re: ${originalEmail.subject}`,
                content: [
                    {
                        type: 'text/plain',
                        value: 'Your email address is not authorized to trigger this workflow.',
                    },
                ],
            }),
        });
    }
    catch (error) {
        logger.error('Failed to send rejection email', error instanceof Error ? error : undefined);
    }
}
/**
 * Send error email
 */
async function sendErrorEmail(originalEmail, errorMessage, _env) {
    try {
        await fetch('https://api.mailchannels.net/tx/v1/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personalizations: [
                    {
                        to: [{ email: originalEmail.from }],
                    },
                ],
                from: {
                    email: originalEmail.to,
                    name: 'Conductor',
                },
                subject: `Re: ${originalEmail.subject} - Error`,
                content: [
                    {
                        type: 'text/plain',
                        value: `Workflow execution failed:\n\n${errorMessage}`,
                    },
                ],
            }),
        });
    }
    catch (error) {
        logger.error('Failed to send error email', error instanceof Error ? error : undefined);
    }
}
/**
 * Format output as plain text
 */
function formatOutputAsText(output) {
    if (typeof output === 'string') {
        return output;
    }
    if (typeof output === 'object' && output !== null) {
        return JSON.stringify(output, null, 2);
    }
    return String(output);
}
/**
 * Format output as HTML
 */
function formatOutputAsHtml(output) {
    const text = formatOutputAsText(output);
    return `
<!DOCTYPE html>
<html>
<head>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			line-height: 1.6;
			color: #333;
			max-width: 600px;
			margin: 0 auto;
			padding: 20px;
		}
		pre {
			background-color: #f5f5f5;
			padding: 15px;
			border-radius: 5px;
			overflow-x: auto;
		}
	</style>
</head>
<body>
	<h2>Workflow Result</h2>
	<pre>${escapeHtml(text)}</pre>
	<hr>
	<p style="color: #666; font-size: 14px;">
		This is an automated response from Conductor.
	</p>
</body>
</html>
	`.trim();
}
/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
export default app;
