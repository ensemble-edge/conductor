/**
 * Notification Manager
 *
 * Coordinates outbound notifications (webhooks and email) for ensemble events
 */

import type { EnsembleConfig, NotificationConfig } from '../parser.js'
import type {
  NotificationEvent,
  NotificationEventData,
  NotificationDeliveryResult,
} from './types.js'
import { WebhookNotifier } from './webhook-notifier.js'
import { EmailNotifier } from './email-notifier.js'
import { createLogger } from '../../observability/index.js'
import type { ConductorEnv } from '../../types/env.js'

const logger = createLogger({ serviceName: 'notification-manager' })

export class NotificationManager {
  /**
   * Send notifications for an event
   */
  static async notify(
    ensemble: EnsembleConfig,
    event: NotificationEvent,
    eventData: Record<string, unknown>,
    env: ConductorEnv
  ): Promise<NotificationDeliveryResult[]> {
    // Check if ensemble has notifications configured
    if (!ensemble.notifications || ensemble.notifications.length === 0) {
      return []
    }

    // Build event data
    const notificationEvent: NotificationEventData = {
      event,
      timestamp: new Date().toISOString(),
      data: {
        ensemble: ensemble.name,
        ...eventData,
      },
    }

    // Filter notifications that should be triggered for this event
    const relevantNotifications = ensemble.notifications.filter((notification) =>
      notification.events.includes(event)
    )

    if (relevantNotifications.length === 0) {
      return []
    }

    logger.info('Sending notifications', {
      ensemble: ensemble.name,
      event,
      count: relevantNotifications.length,
    })

    // Send all notifications in parallel
    const results = await Promise.all(
      relevantNotifications.map((notification) =>
        this.sendNotification(notification, notificationEvent, env)
      )
    )

    // Log results
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    logger.info('Notifications sent', {
      ensemble: ensemble.name,
      event,
      total: results.length,
      successful,
      failed,
    })

    return results
  }

  /**
   * Send a single notification
   */
  private static async sendNotification(
    config: NotificationConfig,
    eventData: NotificationEventData,
    env: ConductorEnv
  ): Promise<NotificationDeliveryResult> {
    try {
      switch (config.type) {
        case 'webhook': {
          const notifier = new WebhookNotifier({
            url: config.url,
            secret: config.secret,
            retries: config.retries,
            timeout: config.timeout,
          })
          return await notifier.send(eventData)
        }

        case 'email': {
          const notifier = new EmailNotifier({
            to: config.to,
            from: config.from,
            subject: config.subject,
            events: config.events,
          })
          return await notifier.send(eventData, env)
        }

        default: {
          // Exhaustive type check - should never reach here with valid configs
          const exhaustiveCheck: never = config
          throw new Error(`Unknown notification type: ${(exhaustiveCheck as { type: string }).type}`)
        }
      }
    } catch (error) {
      logger.error('Notification failed', error instanceof Error ? error : undefined, {
        type: config.type,
        event: eventData.event,
      })

      // Determine target based on type
      const target =
        config.type === 'webhook'
          ? config.url
          : config.type === 'email'
            ? config.to.join(', ')
            : 'unknown'

      return {
        success: false,
        type: config.type,
        target,
        event: eventData.event,
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Emit an event (convenience method for common events)
   */
  static async emitExecutionStarted(
    ensemble: EnsembleConfig,
    executionId: string,
    input: Record<string, unknown>,
    env: ConductorEnv
  ): Promise<NotificationDeliveryResult[]> {
    return this.notify(
      ensemble,
      'execution.started',
      {
        id: executionId,
        input,
      },
      env
    )
  }

  static async emitExecutionCompleted(
    ensemble: EnsembleConfig,
    executionId: string,
    output: unknown,
    duration: number,
    env: ConductorEnv
  ): Promise<NotificationDeliveryResult[]> {
    return this.notify(
      ensemble,
      'execution.completed',
      {
        id: executionId,
        status: 'completed',
        output,
        duration,
      },
      env
    )
  }

  static async emitExecutionFailed(
    ensemble: EnsembleConfig,
    executionId: string,
    error: Error,
    duration: number,
    env: ConductorEnv
  ): Promise<NotificationDeliveryResult[]> {
    return this.notify(
      ensemble,
      'execution.failed',
      {
        id: executionId,
        status: 'failed',
        error: {
          message: error.message,
          stack: error.stack,
        },
        duration,
      },
      env
    )
  }

  static async emitExecutionTimeout(
    ensemble: EnsembleConfig,
    executionId: string,
    duration: number,
    timeout: number,
    env: ConductorEnv
  ): Promise<NotificationDeliveryResult[]> {
    return this.notify(
      ensemble,
      'execution.timeout',
      {
        id: executionId,
        duration,
        timeout,
      },
      env
    )
  }

  static async emitAgentCompleted(
    ensemble: EnsembleConfig,
    executionId: string,
    agentName: string,
    output: unknown,
    duration: number,
    env: Env
  ): Promise<NotificationDeliveryResult[]> {
    return this.notify(
      ensemble,
      'agent.completed',
      {
        executionId,
        agent: agentName,
        output,
        duration,
      },
      env
    )
  }

  static async emitStateUpdated(
    ensemble: EnsembleConfig,
    executionId: string,
    state: Record<string, unknown>,
    env: Env
  ): Promise<NotificationDeliveryResult[]> {
    return this.notify(
      ensemble,
      'state.updated',
      {
        executionId,
        state,
      },
      env
    )
  }
}
