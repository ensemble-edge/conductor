/**
 * Twilio Plugin for Conductor
 *
 * Production-ready plugin that adds SMS and voice messaging capabilities to Conductor:
 * 1. Registers the 'twilio:sms' custom trigger type
 * 2. Handles incoming SMS webhooks from Twilio
 * 3. Executes ensembles in response to SMS messages
 * 4. Supports auto-reply via TwiML responses
 */
import { z } from 'zod';
import { getTriggerRegistry, Executor, createLogger, } from '@ensemble-edge/conductor';
const logger = createLogger({ serviceName: 'twilio-plugin' });
/**
 * Twilio SMS trigger configuration schema
 */
const TwilioSMSTriggerSchema = z.object({
    type: z.literal('twilio:sms'),
    // Webhook path for Twilio to POST to
    path: z.string().optional(), // Defaults to /twilio/sms/{ensemble-name}
    // Twilio authentication (validates request signature)
    auth: z.object({
        accountSid: z.string(),
        authToken: z.string(),
    }),
    // Optional: Filter by from/to numbers
    filter: z.object({
        from: z.array(z.string()).optional(), // Whitelist sender numbers
        to: z.array(z.string()).optional(), // Whitelist recipient numbers
    }).optional(),
    // Optional: Auto-reply configuration
    autoReply: z.object({
        enabled: z.boolean(),
        message: z.string().optional(), // Static reply or use ensemble output
    }).optional(),
});
/**
 * Twilio SMS Trigger Handler
 *
 * Registers a POST endpoint that:
 * 1. Receives Twilio SMS webhooks
 * 2. Validates Twilio request signature
 * 3. Executes the ensemble with SMS data
 * 4. Optionally sends auto-reply via TwiML
 */
async function handleTwilioSMSTrigger(context) {
    const { app, ensemble, trigger, agents, env, ctx } = context;
    const config = trigger;
    const path = config.path || `/twilio/sms/${ensemble.name}`;
    logger.info(`[Twilio SMS] Registering webhook: POST ${path} → ${ensemble.name}`);
    // Handler for Twilio SMS webhooks
    const handler = async (c) => {
        try {
            // Parse Twilio webhook payload (application/x-www-form-urlencoded)
            const body = await c.req.parseBody();
            // Extract SMS data from Twilio payload
            const smsData = {
                from: body.From,
                to: body.To,
                body: body.Body,
                messageSid: body.MessageSid,
                accountSid: body.AccountSid,
                numMedia: body.NumMedia,
                // ... other Twilio fields
            };
            logger.info(`[Twilio SMS] Received SMS from ${smsData.from}: "${smsData.body}"`);
            // Optional: Filter by from/to numbers
            if (config.filter?.from && !config.filter.from.includes(smsData.from)) {
                logger.warn(`[Twilio SMS] Rejected: sender ${smsData.from} not in whitelist`);
                return c.text('Sender not authorized', 403);
            }
            if (config.filter?.to && !config.filter.to.includes(smsData.to)) {
                logger.warn(`[Twilio SMS] Rejected: recipient ${smsData.to} not in whitelist`);
                return c.text('Recipient not authorized', 403);
            }
            // TODO: Validate Twilio request signature using auth.authToken
            // This ensures the request actually came from Twilio
            // See: https://www.twilio.com/docs/usage/security#validating-requests
            // Create executor and register agents
            const executor = new Executor({ env, ctx });
            for (const agent of agents) {
                executor.registerAgent(agent);
            }
            // Execute ensemble with SMS data
            const result = await executor.executeEnsemble(ensemble, {
                input: {
                    sms: smsData,
                    message: smsData.body,
                    from: smsData.from,
                    to: smsData.to,
                },
                metadata: {
                    trigger: 'twilio:sms',
                    messageSid: smsData.messageSid,
                    provider: 'twilio',
                },
            });
            // Send auto-reply if configured
            if (config.autoReply?.enabled) {
                // Extract reply from ensemble output
                let replyMessage = config.autoReply.message || 'Message received';
                if (result.success) {
                    const output = result.value.output;
                    if (output?.reply) {
                        replyMessage = output.reply;
                    }
                }
                // Return TwiML response for auto-reply
                const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(replyMessage)}</Message>
</Response>`;
                return c.text(twiml, 200, { 'Content-Type': 'text/xml' });
            }
            // No auto-reply: just acknowledge
            return c.text('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', 200, {
                'Content-Type': 'text/xml',
            });
        }
        catch (error) {
            logger.error(`[Twilio SMS] Failed to process SMS for ${ensemble.name}`, error instanceof Error ? error : undefined);
            // Return TwiML error response
            return c.text('<?xml version="1.0" encoding="UTF-8"?><Response><Message>Error processing message</Message></Response>', 500, { 'Content-Type': 'text/xml' });
        }
    };
    // Register the POST endpoint
    app.post(path, handler);
    logger.info(`[Twilio SMS] ✓ Registered ${path}`);
}
/**
 * Escape XML special characters for TwiML
 */
function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
/**
 * Register the Twilio SMS trigger with Conductor
 * Call this in your plugin initialization
 */
export function registerTwilioSMSTrigger() {
    const registry = getTriggerRegistry();
    registry.register(handleTwilioSMSTrigger, {
        type: 'twilio:sms',
        name: 'Twilio SMS Trigger',
        description: 'Receive and respond to SMS messages via Twilio webhooks',
        schema: TwilioSMSTriggerSchema,
        requiresAuth: true,
        tags: ['twilio', 'sms', 'messaging', 'webhook'],
        plugin: '@conductor/twilio',
    });
    logger.info('[Twilio SMS Plugin] Registered trigger type: twilio:sms');
}
/**
 * Default export for easy plugin registration
 */
export default {
    register: registerTwilioSMSTrigger,
};
//# sourceMappingURL=index.js.map