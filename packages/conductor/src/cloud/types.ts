/**
 * Ensemble Cloud Types
 *
 * Types for the /cloud endpoint that connects deployed workers
 * to Ensemble Cloud platform.
 */

import type { ConductorEnv } from '../types/env.js'

/**
 * Extended environment with cloud-specific bindings
 *
 * These are set via:
 * - ENSEMBLE_CLOUD_KEY: `wrangler secret put ENSEMBLE_CLOUD_KEY`
 * - CONDUCTOR_VERSION: typically injected at build time
 * - CONDUCTOR_PROJECT_NAME: from wrangler.toml [vars] or conductor.config.ts
 * - CONDUCTOR_PROJECT_VERSION: from package.json version
 */
export interface CloudEnv extends ConductorEnv {
  /** Cloud authentication key (stored as wrangler secret) */
  ENSEMBLE_CLOUD_KEY?: string
  /** Conductor version for health check */
  CONDUCTOR_VERSION?: string
  /** Project name for structure endpoint */
  CONDUCTOR_PROJECT_NAME?: string
  /** Project version for structure endpoint */
  CONDUCTOR_PROJECT_VERSION?: string
}

/**
 * Cloud health response
 */
export interface CloudHealthResponse {
  status: 'ok' | 'error'
  timestamp: string
  version: string
}

/**
 * Agent info in structure response
 */
export interface CloudAgentInfo {
  name: string
  type: 'operation' | 'custom'
  operation?: string
  path?: string
}

/**
 * Ensemble info in structure response
 */
export interface CloudEnsembleInfo {
  name: string
  agents: string[]
}

/**
 * Component info (edgit-managed)
 */
export interface CloudComponentInfo {
  name: string
  type: 'prompt' | 'query' | 'template' | 'config'
  path: string
  version?: string
}

/**
 * Edgit integration status
 */
export interface CloudEdgitStatus {
  initialized: boolean
  componentsCount: number
}

/**
 * Cloud structure response
 */
export interface CloudStructureResponse {
  project: {
    name: string
    version: string
  }
  agents: CloudAgentInfo[]
  ensembles: CloudEnsembleInfo[]
  components: CloudComponentInfo[]
  edgit: CloudEdgitStatus
}

/**
 * Execution record
 */
export interface CloudExecution {
  id: string
  ensemble: string
  status: 'success' | 'error' | 'running'
  duration_ms?: number
  started_at: string
  completed_at?: string
}

/**
 * Cloud executions query params
 */
export interface CloudExecutionsQuery {
  limit?: number
  offset?: number
  ensemble?: string
  status?: 'success' | 'error' | 'running'
  since?: string
}

/**
 * Cloud executions response
 */
export interface CloudExecutionsResponse {
  total: number
  limit: number
  offset: number
  items: CloudExecution[]
}

/**
 * Log entry
 */
export interface CloudLogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, unknown>
}

/**
 * Cloud logs response
 */
export interface CloudLogsResponse {
  execution_id?: string
  entries: CloudLogEntry[]
}

/**
 * Cloud sync response
 */
export interface CloudSyncResponse {
  status: 'ok' | 'error'
  message: string
  timestamp: string
}

/**
 * Cloud error response
 */
export interface CloudErrorResponse {
  error: string
}
