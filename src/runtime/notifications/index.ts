/**
 * Notifications System - Exports
 */

export { NotificationManager } from './notification-manager.js'
export { WebhookNotifier } from './webhook-notifier.js'
export { EmailNotifier } from './email-notifier.js'
export type {
  NotificationEvent,
  NotificationEventData,
  NotificationDeliveryResult,
  EmailNotificationData,
  NotificationQueueEntry,
} from './types.js'
