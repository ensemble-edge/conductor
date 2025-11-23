/**
 * Base Platform Types
 *
 * Core types shared across all platform adapters
 */

export interface PlatformModel {
  id: string
  name: string
  family: string
  type: string
  status: 'active' | 'deprecated'
  introducedAt: string
  deprecatedAt?: string
  deprecatedReason?: string
  replacementModel?: string
  endOfLife?: string
  capabilities: string[]
  contextWindow: number
  pricing: 'free' | 'metered'
  recommended?: boolean
}

export interface PlatformProvider {
  name: string
  description: string
  documentation: string
  models: PlatformModel[]
}

export interface PlatformModelsData {
  version: string
  lastUpdated: string
  providers: Record<string, PlatformProvider>
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface ModelValidationResult extends ValidationResult {
  model?: PlatformModel
  isDeprecated: boolean
  replacement?: string
  daysUntilEOL?: number
}
