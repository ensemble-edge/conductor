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
/**
 * Twilio SMS trigger configuration schema
 */
declare const TwilioSMSTriggerSchema: z.ZodObject<{
    type: z.ZodLiteral<"twilio:sms">;
    path: z.ZodOptional<z.ZodString>;
    auth: z.ZodObject<{
        accountSid: z.ZodString;
        authToken: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        accountSid: string;
        authToken: string;
    }, {
        accountSid: string;
        authToken: string;
    }>;
    filter: z.ZodOptional<z.ZodObject<{
        from: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        to: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        from?: string[] | undefined;
        to?: string[] | undefined;
    }, {
        from?: string[] | undefined;
        to?: string[] | undefined;
    }>>;
    autoReply: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        message: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        message?: string | undefined;
    }, {
        enabled: boolean;
        message?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "twilio:sms";
    auth: {
        accountSid: string;
        authToken: string;
    };
    filter?: {
        from?: string[] | undefined;
        to?: string[] | undefined;
    } | undefined;
    path?: string | undefined;
    autoReply?: {
        enabled: boolean;
        message?: string | undefined;
    } | undefined;
}, {
    type: "twilio:sms";
    auth: {
        accountSid: string;
        authToken: string;
    };
    filter?: {
        from?: string[] | undefined;
        to?: string[] | undefined;
    } | undefined;
    path?: string | undefined;
    autoReply?: {
        enabled: boolean;
        message?: string | undefined;
    } | undefined;
}>;
export type TwilioSMSTriggerConfig = z.infer<typeof TwilioSMSTriggerSchema>;
/**
 * Register the Twilio SMS trigger with Conductor
 * Call this in your plugin initialization
 */
export declare function registerTwilioSMSTrigger(): void;
/**
 * Default export for easy plugin registration
 */
declare const _default: {
    register: typeof registerTwilioSMSTrigger;
};
export default _default;
//# sourceMappingURL=index.d.ts.map