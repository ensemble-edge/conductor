/**
 * Notifications System - Type Definitions
 *
 * For sending outbound notifications (webhooks, email) when events occur
 */

import type { NotificationConfig } from '../parser.js'

/**
 * Notification event types
 */
export type NotificationEvent =
  | 'execution.started'
  | 'execution.completed'
  | 'execution.failed'
  | 'execution.timeout'
  | 'agent.completed'
  | 'state.updated'

/**
 * Notification event data
 */
export interface NotificationEventData {
  /** Event type */
  event: NotificationEvent
  /** Event timestamp */
  timestamp: string
  /** Event data payload */
  data: Record<string, unknown>
}

/**
 * Webhook notification payload
 */
export interface WebhookNotificationPayload extends NotificationEventData {
  /** Signature for verification */
  signature?: string
}

/**
 * Email notification data
 */
export interface EmailNotificationData {
  /** Recipient addresses */
  to: string[]
  /** Sender address */
  from: string
  /** Email subject */
  subject: string
  /** Email body (plain text) */
  text: string
  /** Email body (HTML) */
  html?: string
  /** Event that triggered this email */
  event: NotificationEvent
  /** Event data */
  eventData: Record<string, unknown>
}

/**
 * Notification delivery result
 */
export interface NotificationDeliveryResult {
  /** Whether delivery succeeded */
  success: boolean
  /** Notification type */
  type: 'webhook' | 'email'
  /** Target (URL or email addresses) */
  target: string
  /** Event that was sent */
  event: NotificationEvent
  /** Delivery duration in ms */
  duration: number
  /** Error message if failed */
  error?: string
  /** HTTP status code (for webhooks) */
  statusCode?: number
  /** Number of retry attempts */
  attempts?: number
}

/**
 * Notification queue entry
 */
export interface NotificationQueueEntry {
  /** Unique notification ID */
  id: string
  /** Notification configuration */
  config: NotificationConfig
  /** Event data to send */
  eventData: NotificationEventData
  /** Number of delivery attempts */
  attempts: number
  /** Next retry time (if applicable) */
  nextRetry?: number
  /** Created timestamp */
  createdAt: number
}
