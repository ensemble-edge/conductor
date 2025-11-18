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
import { Executor } from '../../runtime/executor.js';
import { createLogger } from '../../observability/index.js';
const app = new Hono();
const logger = createLogger({ serviceName: 'api-email' });
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
        logger.info('Email received', {
            from: emailData.from,
            to: emailData.to,
            subject: emailData.subject,
        });
        // Find ensemble that handles this email address
        const ensemble = await findEnsembleForEmail(emailData.to, env);
        if (!ensemble) {
            logger.warn('No ensemble found for email address', {
                to: emailData.to,
            });
            // Return 200 to prevent bounce (silently ignore)
            return c.text('OK');
        }
        // Check if ensemble has email exposure configured
        const emailExpose = ensemble.trigger?.find((exp) => exp.type === 'email');
        if (!emailExpose || emailExpose.type !== 'email') {
            logger.warn('Ensemble found but no email exposure configured', {
                ensemble: ensemble.name,
                to: emailData.to,
            });
            return c.text('OK');
        }
        // Check if recipient address matches
        if (!emailExpose.addresses.includes(emailData.to)) {
            logger.warn('Email address not in configured addresses', {
                ensemble: ensemble.name,
                to: emailData.to,
                configured: emailExpose.addresses,
            });
            return c.text('OK');
        }
        // Authenticate sender if configured
        if (!emailExpose.public && emailExpose.auth) {
            const isAuthorized = await authenticateEmailSender(emailData.from, emailExpose.auth.from);
            if (!isAuthorized) {
                logger.warn('Email sender not authorized', {
                    ensemble: ensemble.name,
                    from: emailData.from,
                    whitelist: emailExpose.auth.from,
                });
                // Send rejection email if configured
                if (emailExpose.reply_with_output) {
                    await sendRejectionEmail(emailData, env);
                }
                return c.text('OK');
            }
        }
        // Extract input from email
        const input = extractInputFromEmail(emailData);
        logger.info('Executing ensemble from email', {
            ensemble: ensemble.name,
            from: emailData.from,
            to: emailData.to,
        });
        // Execute ensemble
        const ctx = {
            waitUntil: (promise) => { },
            passThroughOnException: () => { },
        };
        const executor = new Executor({ env, ctx });
        const result = await executor.executeEnsemble(ensemble, input);
        // Send reply email if configured
        if (emailExpose.reply_with_output && result.success) {
            await sendReplyEmail(emailData, result.value.output, env);
        }
        else if (emailExpose.reply_with_output && !result.success) {
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
    // For now, parse from form data or JSON
    // In production, this would parse the actual RFC822 message
    const contentType = c.req.header('content-type') || '';
    if (contentType.includes('application/json')) {
        // JSON format (for testing)
        const data = await c.req.json();
        return {
            from: data.from || '',
            to: data.to || '',
            subject: data.subject || '',
            body: data.body || data.text || '',
            headers: data.headers || {},
        };
    }
    else {
        // Form data or RFC822 (production)
        // TODO: Implement full RFC822 parsing
        // For now, return mock data
        return {
            from: c.req.header('x-sender') || '',
            to: c.req.header('x-recipient') || '',
            subject: c.req.header('x-subject') || '',
            body: '',
            headers: {},
        };
    }
}
/**
 * Find ensemble that handles this email address
 */
async function findEnsembleForEmail(emailAddress, env) {
    // TODO: Load all ensembles from catalog/KV and find one with matching email exposure
    // For now, return null (not found)
    // In production, this would:
    // 1. List all ensemble YAMLs from KV or catalog
    // 2. Parse each one
    // 3. Filter for those with expose.type === 'email' and matching addresses
    return null;
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
async function sendReplyEmail(originalEmail, output, env) {
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
async function sendRejectionEmail(originalEmail, env) {
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
async function sendErrorEmail(originalEmail, errorMessage, env) {
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
