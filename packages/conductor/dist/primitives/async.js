/**
 * Async Primitives
 *
 * Provides primitives for asynchronous execution patterns including
 * suspension, scheduling, delays, and human-in-the-loop (HITL) workflows.
 */
/**
 * Create a suspend step that pauses execution
 *
 * @example
 * ```typescript
 * // Suspend for manual review
 * const reviewStep = suspend({
 *   reason: 'approval',
 *   message: 'Please review the generated content',
 *   timeout: 3600, // 1 hour
 *   onResume: [step('publish', { ... })]
 * });
 * ```
 */
export function suspend(config) {
    return {
        type: 'suspend',
        reason: config.reason,
        message: config.message,
        data: config.data,
        timeout: config.timeout,
        onResume: config.onResume,
        onTimeout: config.onTimeout,
    };
}
/**
 * Create a sleep step that delays execution
 *
 * @example
 * ```typescript
 * // Wait 5 seconds
 * const waitStep = sleep(5000);
 *
 * // Wait with durable timer (survives restarts)
 * const durableWait = sleep(60000, { durable: true });
 * ```
 */
export function sleep(duration, options) {
    return {
        type: 'sleep',
        duration,
        durable: options?.durable,
        reason: options?.reason,
    };
}
/**
 * Create a sleep step using seconds
 *
 * @example
 * ```typescript
 * const wait = sleepSeconds(30);
 * ```
 */
export function sleepSeconds(seconds, options) {
    return sleep(seconds * 1000, options);
}
/**
 * Create a sleep step using minutes
 *
 * @example
 * ```typescript
 * const wait = sleepMinutes(5);
 * ```
 */
export function sleepMinutes(minutes, options) {
    return sleep(minutes * 60 * 1000, options);
}
/**
 * Create a sleep step that waits until a specific time
 *
 * @example
 * ```typescript
 * // Wait until a specific timestamp
 * const waitUntil = sleepUntil(new Date('2024-12-25T00:00:00Z'));
 *
 * // Wait until an ISO string time
 * const waitUntilStr = sleepUntil('2024-12-25T00:00:00Z');
 * ```
 */
export function sleepUntil(time, options) {
    const targetTime = typeof time === 'string' ? new Date(time) : time;
    const now = new Date();
    const duration = Math.max(0, targetTime.getTime() - now.getTime());
    return {
        type: 'sleep',
        duration,
        durable: options?.durable ?? true, // Default to durable for absolute times
        reason: options?.reason ?? `Waiting until ${targetTime.toISOString()}`,
    };
}
/**
 * Create a scheduled execution step
 *
 * @example
 * ```typescript
 * // Execute at a specific time
 * const scheduledJob = schedule({
 *   at: '2024-12-25T00:00:00Z',
 *   steps: [step('send-notification', { ... })]
 * });
 *
 * // Execute on a cron schedule
 * const recurringJob = schedule({
 *   cron: '0 9 * * MON',
 *   timezone: 'America/New_York',
 *   steps: [step('weekly-report', { ... })]
 * });
 * ```
 */
export function schedule(config) {
    return {
        type: 'schedule',
        at: config.at,
        cron: config.cron,
        timezone: config.timezone,
        steps: config.steps,
    };
}
/**
 * Create a human approval step
 *
 * @example
 * ```typescript
 * const approvalStep = approval({
 *   message: 'Approve deployment to production?',
 *   approvers: ['team-lead@example.com'],
 *   timeout: 7200, // 2 hours
 *   options: [
 *     { label: 'Approve', value: 'approve' },
 *     { label: 'Reject', value: 'reject' },
 *     { label: 'Defer', value: 'defer' }
 *   ],
 *   onApprove: [step('deploy', { ... })],
 *   onReject: [step('notify-rejection', { ... })]
 * });
 * ```
 */
export function approval(config) {
    return {
        type: 'approval',
        config: {
            message: config.message,
            approvers: config.approvers,
            timeout: config.timeout,
            timeoutAction: config.timeoutAction,
            data: config.data,
            options: config.options,
        },
        onApprove: config.onApprove,
        onReject: config.onReject,
        onTimeout: config.onTimeout,
    };
}
/**
 * Create a step that waits for a webhook event
 *
 * @example
 * ```typescript
 * const paymentStep = waitForWebhook({
 *   event: 'payment.completed',
 *   timeout: 3600,
 *   schema: {
 *     type: 'object',
 *     properties: {
 *       paymentId: { type: 'string' },
 *       amount: { type: 'number' }
 *     }
 *   },
 *   onReceive: [step('process-payment', { ... })]
 * });
 * ```
 */
export function waitForWebhook(config) {
    return {
        type: 'suspend',
        reason: 'external',
        message: `Waiting for webhook event: ${config.event ?? 'any'}`,
        data: {
            webhookConfig: {
                path: config.path,
                event: config.event,
                schema: config.schema,
                secret: config.secret,
            },
        },
        timeout: config.timeout,
        onResume: config.onReceive,
        onTimeout: config.onTimeout,
    };
}
/**
 * Create a step that waits for external input
 *
 * @example
 * ```typescript
 * const inputStep = waitForInput({
 *   message: 'Please provide additional information',
 *   fields: [
 *     { name: 'reason', type: 'string', required: true },
 *     { name: 'priority', type: 'number', default: 1 }
 *   ],
 *   timeout: 86400 // 24 hours
 * });
 * ```
 */
export function waitForInput(config) {
    return {
        type: 'suspend',
        reason: 'input',
        message: config.message,
        data: {
            inputConfig: {
                fields: config.fields,
            },
        },
        timeout: config.timeout,
        onResume: config.onInput,
        onTimeout: config.onTimeout,
    };
}
/**
 * Create a checkpoint that can be resumed from
 *
 * @example
 * ```typescript
 * const checkpoint = createCheckpoint({
 *   name: 'after-analysis',
 *   data: { analysisResult: stepRef('analyze', 'result') }
 * });
 * ```
 */
export function checkpoint(config) {
    return {
        type: 'suspend',
        reason: 'manual',
        message: `Checkpoint: ${config.name}`,
        data: {
            checkpoint: config.name,
            ...config.data,
        },
    };
}
/**
 * Type guards
 */
export function isSuspendStep(step) {
    return typeof step === 'object' && step !== null && step.type === 'suspend';
}
export function isSleepStep(step) {
    return typeof step === 'object' && step !== null && step.type === 'sleep';
}
export function isScheduleStep(step) {
    return typeof step === 'object' && step !== null && step.type === 'schedule';
}
export function isApprovalStep(step) {
    return typeof step === 'object' && step !== null && step.type === 'approval';
}
export function isAsyncStep(step) {
    return isSuspendStep(step) || isSleepStep(step) || isScheduleStep(step) || isApprovalStep(step);
}
