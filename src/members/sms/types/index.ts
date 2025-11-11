/**
 * SMS Member Types
 *
 * Type definitions for the SMS member system including
 * messages, providers, and responses.
 */

/**
 * SMS message structure
 */
export interface SmsMessage {
  /** Recipient phone number (E.164 format) */
  to: string | string[]
  /** Sender phone number or ID */
  from?: string
  /** Message body */
  body: string
  /** Media URLs (MMS) */
  mediaUrl?: string[]
  /** Custom metadata */
  metadata?: Record<string, unknown>
}

/**
 * SMS send result
 */
export interface SmsResult {
  /** Message ID from provider */
  messageId: string
  /** Send status */
  status: 'sent' | 'queued' | 'failed'
  /** Provider name */
  provider: string
  /** Error message if failed */
  error?: string
}

/**
 * SMS status response
 */
export interface SmsStatus {
  /** Message ID */
  messageId: string
  /** Current status */
  status: 'sent' | 'delivered' | 'failed' | 'undelivered'
  /** Timestamp of status */
  timestamp: string
  /** Additional details */
  details?: Record<string, unknown>
}

/**
 * SMS provider interface
 */
export interface SmsProvider {
  /** Provider name */
  name: string

  /** Send an SMS */
  send(message: SmsMessage): Promise<SmsResult>

  /** Get SMS status (optional) */
  getStatus?(messageId: string): Promise<SmsStatus>

  /** Validate provider configuration */
  validateConfig(): Promise<ValidationResult>
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

/**
 * SMS provider configuration
 */
export interface SmsProviderConfig {
  /** Provider type */
  provider: 'twilio' | 'vonage' | 'aws-sns' | string

  /** Twilio config */
  twilio?: {
    /** Account SID */
    accountSid: string
    /** Auth token */
    authToken: string
    /** Messaging service SID (optional) */
    messagingServiceSid?: string
  }

  /** Vonage (Nexmo) config */
  vonage?: {
    /** API key */
    apiKey: string
    /** API secret */
    apiSecret: string
  }

  /** AWS SNS config */
  sns?: {
    /** AWS region */
    region: string
    /** Access key ID */
    accessKeyId: string
    /** Secret access key */
    secretAccessKey: string
  }

  /** Default sender */
  from?: string
}

/**
 * SMS member input
 */
export interface SmsMemberInput {
  /** Recipient(s) */
  to: string | string[]
  /** Sender (optional, uses config default) */
  from?: string
  /** Message body */
  body: string
  /** Media URLs for MMS (optional) */
  mediaUrl?: string[]
  /** Custom metadata */
  metadata?: Record<string, unknown>
}

/**
 * SMS member output
 */
export interface SmsMemberOutput {
  messageId: string
  status: string
  provider: string
  timestamp: string
}

/**
 * Batch SMS input
 */
export interface BatchSmsInput {
  /** Recipients with personalized data */
  recipients: Array<{
    phone: string
    data?: Record<string, unknown>
  }>
  /** Message template (can include {{variables}}) */
  body: string
  /** Common data for all recipients */
  commonData?: Record<string, unknown>
  /** Media URLs for all messages */
  mediaUrl?: string[]
}

/**
 * Batch SMS output
 */
export interface BatchSmsOutput {
  sent: number
  failed: number
  messageIds: string[]
  errors?: Array<{
    phone: string
    error: string
  }>
}
