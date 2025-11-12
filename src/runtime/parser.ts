/**
 * YAML Parser - Refactored with Interpolation System
 *
 * Uses composition-based interpolation resolvers.
 * Reduced resolveInterpolation from 42 lines to 1 line via chain of responsibility.
 */

import * as YAML from 'yaml'
import { z } from 'zod'
import { getInterpolator } from './interpolation/index.js'
import type { ResolutionContext } from './interpolation/index.js'
import { Operation } from '../types/constants.js'

/**
 * Schema for validating ensemble configuration
 */
const EnsembleSchema = z.object({
  name: z.string().min(1, 'Ensemble name is required'),
  description: z.string().optional(),
  state: z
    .object({
      schema: z.record(z.unknown()).optional(),
      initial: z.record(z.unknown()).optional(),
    })
    .optional(),
  scoring: z
    .object({
      enabled: z.boolean(),
      defaultThresholds: z.object({
        minimum: z.number().min(0).max(1),
        target: z.number().min(0).max(1).optional(),
        excellent: z.number().min(0).max(1).optional(),
      }),
      maxRetries: z.number().positive().optional(),
      backoffStrategy: z.enum(['linear', 'exponential', 'fixed']).optional(),
      initialBackoff: z.number().positive().optional(),
      trackInState: z.boolean().optional(),
      criteria: z.union([z.record(z.string()), z.array(z.unknown())]).optional(),
      aggregation: z.enum(['weighted_average', 'minimum', 'geometric_mean']).optional(),
    })
    .optional(),
  webhooks: z
    .array(
      z.object({
        path: z.string().min(1),
        method: z.enum(['POST', 'GET']).optional(),
        auth: z
          .object({
            type: z.enum(['bearer', 'signature', 'basic']),
            secret: z.string(),
          })
          .optional(),
        mode: z.enum(['trigger', 'resume']).optional(),
        async: z.boolean().optional(),
        timeout: z.number().positive().optional(),
      })
    )
    .optional(),
  schedules: z
    .array(
      z.object({
        cron: z.string().min(1, 'Cron expression is required'),
        timezone: z.string().optional(),
        enabled: z.boolean().optional(),
        input: z.record(z.unknown()).optional(),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .optional(),
  flow: z.array(
    z.object({
      agent: z.string().min(1, 'Agent name is required'),
      input: z.record(z.unknown()).optional(),
      state: z
        .object({
          use: z.array(z.string()).optional(),
          set: z.array(z.string()).optional(),
        })
        .optional(),
      cache: z
        .object({
          ttl: z.number().positive().optional(),
          bypass: z.boolean().optional(),
        })
        .optional(),
      scoring: z
        .object({
          evaluator: z.string().min(1),
          thresholds: z
            .object({
              minimum: z.number().min(0).max(1).optional(),
              target: z.number().min(0).max(1).optional(),
              excellent: z.number().min(0).max(1).optional(),
            })
            .optional(),
          criteria: z.union([z.record(z.string()), z.array(z.unknown())]).optional(),
          onFailure: z.enum(['retry', 'continue', 'abort']).optional(),
          retryLimit: z.number().positive().optional(),
          requireImprovement: z.boolean().optional(),
          minImprovement: z.number().min(0).max(1).optional(),
        })
        .optional(),
      condition: z.unknown().optional(),
    })
  ),
  output: z.record(z.unknown()).optional(),
})

const AgentSchema = z.object({
  name: z.string().min(1, 'Agent name is required'),
  operation: z.enum([
    Operation.think,
    Operation.code,
    Operation.storage,
    Operation.http,
    Operation.tools,
    Operation.scoring,
    Operation.email,
    Operation.sms,
    Operation.form,
    Operation.page,
    Operation.html,
    Operation.pdf,
  ]),
  description: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  schema: z
    .object({
      input: z.record(z.unknown()).optional(),
      output: z.record(z.unknown()).optional(),
    })
    .optional(),
})

export type EnsembleConfig = z.infer<typeof EnsembleSchema>
export type AgentConfig = z.infer<typeof AgentSchema>
export type FlowStep = EnsembleConfig['flow'][number]
export type WebhookConfig = NonNullable<EnsembleConfig['webhooks']>[number]
export type ScheduleConfig = NonNullable<EnsembleConfig['schedules']>[number]

export class Parser {
  private static interpolator = getInterpolator()

  /**
   * Parse and validate an ensemble YAML file
   */
  static parseEnsemble(yamlContent: string): EnsembleConfig {
    try {
      const parsed = YAML.parse(yamlContent)

      if (!parsed) {
        throw new Error('Empty or invalid YAML content')
      }

      const validated = EnsembleSchema.parse(parsed)
      return validated
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Ensemble validation failed: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        )
      }
      throw new Error(
        `Failed to parse ensemble YAML: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Parse and validate an agent YAML file
   */
  static parseAgent(yamlContent: string): AgentConfig {
    try {
      const parsed = YAML.parse(yamlContent)

      if (!parsed) {
        throw new Error('Empty or invalid YAML content')
      }

      const validated = AgentSchema.parse(parsed)
      return validated
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Agent validation failed: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        )
      }
      throw new Error(
        `Failed to parse agent YAML: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Resolve input interpolations using composition-based resolver chain
   *
   * Supports: ${input.x}, ${state.y}, ${agent.output.z}
   *
   * Reduced from 42 lines of nested if/else to 1 line via chain of responsibility
   */
  static resolveInterpolation(template: unknown, context: ResolutionContext): unknown {
    return this.interpolator.resolve(template, context)
  }

  /**
   * Parse an agent reference that may include version
   * Supports formats:
   * - "agent-name" (no version)
   * - "agent-name@v1.0.0" (semver version)
   * - "agent-name@production" (deployment tag)
   * - "agent-name@latest" (latest tag)
   */
  static parseAgentReference(agentRef: string): { name: string; version?: string } {
    const parts = agentRef.split('@')

    if (parts.length === 1) {
      return { name: parts[0] }
    }

    if (parts.length === 2) {
      return {
        name: parts[0],
        version: parts[1],
      }
    }

    throw new Error(
      `Invalid agent reference format: ${agentRef}. Expected "name" or "name@version"`
    )
  }

  /**
   * Validate that all required agents exist
   */
  static validateAgentReferences(ensemble: EnsembleConfig, availableAgents: Set<string>): void {
    const missingAgents: string[] = []

    for (const step of ensemble.flow) {
      const { name } = this.parseAgentReference(step.agent)

      if (!availableAgents.has(name)) {
        missingAgents.push(step.agent)
      }
    }

    if (missingAgents.length > 0) {
      throw new Error(
        `Ensemble "${ensemble.name}" references missing agents: ${missingAgents.join(', ')}`
      )
    }
  }
}
