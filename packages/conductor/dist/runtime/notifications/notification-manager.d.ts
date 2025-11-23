/**
 * Notification Manager
 *
 * Coordinates outbound notifications (webhooks and email) for ensemble events
 */
import type { EnsembleConfig } from '../parser.js';
import type { NotificationEvent, NotificationDeliveryResult } from './types.js';
export declare class NotificationManager {
    /**
     * Send notifications for an event
     */
    static notify(ensemble: EnsembleConfig, event: NotificationEvent, eventData: Record<string, unknown>, env: Env): Promise<NotificationDeliveryResult[]>;
    /**
     * Send a single notification
     */
    private static sendNotification;
    /**
     * Emit an event (convenience method for common events)
     */
    static emitExecutionStarted(ensemble: EnsembleConfig, executionId: string, input: Record<string, unknown>, env: Env): Promise<NotificationDeliveryResult[]>;
    static emitExecutionCompleted(ensemble: EnsembleConfig, executionId: string, output: unknown, duration: number, env: Env): Promise<NotificationDeliveryResult[]>;
    static emitExecutionFailed(ensemble: EnsembleConfig, executionId: string, error: Error, duration: number, env: Env): Promise<NotificationDeliveryResult[]>;
    static emitExecutionTimeout(ensemble: EnsembleConfig, executionId: string, duration: number, timeout: number, env: Env): Promise<NotificationDeliveryResult[]>;
    static emitAgentCompleted(ensemble: EnsembleConfig, executionId: string, agentName: string, output: unknown, duration: number, env: Env): Promise<NotificationDeliveryResult[]>;
    static emitStateUpdated(ensemble: EnsembleConfig, executionId: string, state: Record<string, unknown>, env: Env): Promise<NotificationDeliveryResult[]>;
}
//# sourceMappingURL=notification-manager.d.ts.map