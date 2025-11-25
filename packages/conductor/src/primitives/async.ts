/**
 * Async Primitives
 *
 * Provides primitives for asynchronous execution patterns including
 * suspension, scheduling, delays, and human-in-the-loop (HITL) workflows.
 */

import type { FlowStepType } from './types.js'

/**
 * Suspension reason types
 */
export type SuspensionReason =
  | 'approval' // Waiting for human approval
  | 'input' // Waiting for additional input
  | 'external' // Waiting for external event
  | 'scheduled' // Waiting for scheduled time
  | 'manual' // Manual suspension

/**
 * Suspension state
 */
export interface SuspensionState {
  /** Unique suspension ID */
  id: string
  /** Reason for suspension */
  reason: SuspensionReason
  /** When the suspension was created */
  createdAt: Date
  /** When the suspension expires (optional) */
  expiresAt?: Date
  /** Data to preserve during suspension */
  data?: Record<string, unknown>
  /** Message describing what's needed to resume */
  message?: string
  /** URL or webhook for resume callback */
  resumeUrl?: string
  /** Allowed resume actions */
  allowedActions?: string[]
}

/**
 * Sleep/delay configuration
 */
export interface SleepConfig {
  /** Duration in milliseconds */
  duration: number
  /** Whether to use durable timer (survives restarts) */
  durable?: boolean
  /** Reason for the delay */
  reason?: string
}

/**
 * Schedule configuration
 */
export interface ScheduleConfig {
  /** ISO timestamp to resume at */
  at?: string | Date
  /** Cron expression for recurring */
  cron?: string
  /** Timezone for scheduling */
  timezone?: string
  /** Whether to use durable scheduling */
  durable?: boolean
}

/**
 * Approval request configuration
 */
export interface ApprovalConfig {
  /** Message to show to approver */
  message: string
  /** Who can approve (email, role, etc.) */
  approvers?: string[]
  /** Timeout for approval (in seconds) */
  timeout?: number
  /** Action on timeout */
  timeoutAction?: 'approve' | 'reject' | 'fail'
  /** Data to include in approval request */
  data?: Record<string, unknown>
  /** Allowed responses */
  options?: Array<{
    label: string
    value: string
    description?: string
  }>
}

/**
 * Webhook wait configuration
 */
export interface WebhookWaitConfig {
  /** Webhook path to listen on */
  path?: string
  /** Expected webhook event type */
  event?: string
  /** Timeout in seconds */
  timeout?: number
  /** Validation schema for webhook payload */
  schema?: Record<string, unknown>
  /** Secret for webhook verification */
  secret?: string
}

/**
 * Suspend step configuration
 */
export interface SuspendStepConfig {
  /** Step type marker */
  type: 'suspend'
  /** Suspension reason */
  reason: SuspensionReason
  /** Message for the suspension */
  message?: string
  /** Data to preserve */
  data?: Record<string, unknown>
  /** Timeout in seconds */
  timeout?: number
  /** Steps to execute on resume */
  onResume?: FlowStepType[]
  /** Steps to execute on timeout */
  onTimeout?: FlowStepType[]
}

/**
 * Sleep step configuration
 */
export interface SleepStepConfig {
  /** Step type marker */
  type: 'sleep'
  /** Duration in milliseconds */
  duration: number
  /** Whether to use durable timer */
  durable?: boolean
  /** Reason for the delay */
  reason?: string
}

/**
 * Schedule step configuration
 */
export interface ScheduleStepConfig {
  /** Step type marker */
  type: 'schedule'
  /** When to execute */
  at?: string | Date
  /** Cron expression */
  cron?: string
  /** Timezone */
  timezone?: string
  /** Steps to execute at scheduled time */
  steps: FlowStepType[]
}

/**
 * Approval step configuration
 */
export interface ApprovalStepConfig {
  /** Step type marker */
  type: 'approval'
  /** Approval configuration */
  config: ApprovalConfig
  /** Steps to execute on approval */
  onApprove?: FlowStepType[]
  /** Steps to execute on rejection */
  onReject?: FlowStepType[]
  /** Steps to execute on timeout */
  onTimeout?: FlowStepType[]
}

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
export function suspend(config: {
  reason: SuspensionReason
  message?: string
  data?: Record<string, unknown>
  timeout?: number
  onResume?: FlowStepType[]
  onTimeout?: FlowStepType[]
}): SuspendStepConfig {
  return {
    type: 'suspend',
    reason: config.reason,
    message: config.message,
    data: config.data,
    timeout: config.timeout,
    onResume: config.onResume,
    onTimeout: config.onTimeout,
  }
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
export function sleep(
  duration: number,
  options?: { durable?: boolean; reason?: string }
): SleepStepConfig {
  return {
    type: 'sleep',
    duration,
    durable: options?.durable,
    reason: options?.reason,
  }
}

/**
 * Create a sleep step using seconds
 *
 * @example
 * ```typescript
 * const wait = sleepSeconds(30);
 * ```
 */
export function sleepSeconds(
  seconds: number,
  options?: { durable?: boolean; reason?: string }
): SleepStepConfig {
  return sleep(seconds * 1000, options)
}

/**
 * Create a sleep step using minutes
 *
 * @example
 * ```typescript
 * const wait = sleepMinutes(5);
 * ```
 */
export function sleepMinutes(
  minutes: number,
  options?: { durable?: boolean; reason?: string }
): SleepStepConfig {
  return sleep(minutes * 60 * 1000, options)
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
export function sleepUntil(
  time: Date | string,
  options?: { durable?: boolean; reason?: string }
): SleepStepConfig {
  const targetTime = typeof time === 'string' ? new Date(time) : time
  const now = new Date()
  const duration = Math.max(0, targetTime.getTime() - now.getTime())

  return {
    type: 'sleep',
    duration,
    durable: options?.durable ?? true, // Default to durable for absolute times
    reason: options?.reason ?? `Waiting until ${targetTime.toISOString()}`,
  }
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
export function schedule(config: {
  at?: string | Date
  cron?: string
  timezone?: string
  steps: FlowStepType[]
}): ScheduleStepConfig {
  return {
    type: 'schedule',
    at: config.at,
    cron: config.cron,
    timezone: config.timezone,
    steps: config.steps,
  }
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
export function approval(config: {
  message: string
  approvers?: string[]
  timeout?: number
  timeoutAction?: 'approve' | 'reject' | 'fail'
  data?: Record<string, unknown>
  options?: Array<{ label: string; value: string; description?: string }>
  onApprove?: FlowStepType[]
  onReject?: FlowStepType[]
  onTimeout?: FlowStepType[]
}): ApprovalStepConfig {
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
  }
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
export function waitForWebhook(config: {
  path?: string
  event?: string
  timeout?: number
  schema?: Record<string, unknown>
  secret?: string
  onReceive?: FlowStepType[]
  onTimeout?: FlowStepType[]
}): SuspendStepConfig {
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
  }
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
export function waitForInput(config: {
  message: string
  fields?: Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'object'
    required?: boolean
    default?: unknown
  }>
  timeout?: number
  onInput?: FlowStepType[]
  onTimeout?: FlowStepType[]
}): SuspendStepConfig {
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
  }
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
export function checkpoint(config: {
  name: string
  data?: Record<string, unknown>
}): SuspendStepConfig {
  return {
    type: 'suspend',
    reason: 'manual',
    message: `Checkpoint: ${config.name}`,
    data: {
      checkpoint: config.name,
      ...config.data,
    },
  }
}

/**
 * Type guards
 */
export function isSuspendStep(step: unknown): step is SuspendStepConfig {
  return typeof step === 'object' && step !== null && (step as SuspendStepConfig).type === 'suspend'
}

export function isSleepStep(step: unknown): step is SleepStepConfig {
  return typeof step === 'object' && step !== null && (step as SleepStepConfig).type === 'sleep'
}

export function isScheduleStep(step: unknown): step is ScheduleStepConfig {
  return (
    typeof step === 'object' && step !== null && (step as ScheduleStepConfig).type === 'schedule'
  )
}

export function isApprovalStep(step: unknown): step is ApprovalStepConfig {
  return (
    typeof step === 'object' && step !== null && (step as ApprovalStepConfig).type === 'approval'
  )
}

export function isAsyncStep(
  step: unknown
): step is SuspendStepConfig | SleepStepConfig | ScheduleStepConfig | ApprovalStepConfig {
  return isSuspendStep(step) || isSleepStep(step) || isScheduleStep(step) || isApprovalStep(step)
}
