/**
 * Validate Member - Type Definitions
 */

export type EvalType = 'rule' | 'judge' | 'nlp' | 'embedding'

export interface ValidateConfig {
  evalType?: EvalType
  threshold?: number
  rules?: Rule[]
  criteria?: Criterion[]
  metrics?: string[]
  reference?: string
  model?: string
}

export interface ValidateInput {
  content: string
  reference?: string
  expected?: unknown
}

export interface ValidationResult {
  passed: boolean
  score: number
  scores: Record<string, number>
  details: Record<string, unknown>
  evalType: EvalType
}

export interface Rule {
  name: string
  check: string // JavaScript expression
  weight: number
  description?: string
}

export interface Criterion {
  name: string
  description?: string
  weight: number
}

export interface EvaluationScore {
  average: number
  breakdown: Record<string, number>
  details?: Record<string, unknown>
}
