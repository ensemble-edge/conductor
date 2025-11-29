/**
 * Zod Schemas for Configuration Validation
 *
 * Runtime validation schemas for Conductor configuration.
 * These schemas mirror the TypeScript interfaces in types.ts
 * and provide runtime validation with helpful error messages.
 *
 * @example
 * ```typescript
 * import { ConductorConfigSchema, validateConfig } from './schemas.js';
 *
 * const result = validateConfig(userConfig);
 * if (!result.success) {
 *   console.error('Invalid config:', result.error.format());
 * }
 * ```
 */

import { z } from 'zod'

// ============================================================================
// Authentication Schemas
// ============================================================================

/**
 * Rate limit configuration schema
 */
export const RateLimitConfigSchema = z.object({
  requests: z.number().int().positive().describe('Number of requests allowed'),
  window: z.number().int().positive().describe('Time window in seconds'),
  keyBy: z.enum(['ip', 'user', 'apiKey']).describe('Key to use for rate limiting'),
})

/**
 * Authentication failure handling schema
 */
export const AuthFailureSchema = z.object({
  action: z.enum(['error', 'redirect', 'page']).optional(),
  redirectTo: z.string().optional(),
  page: z.string().optional(),
  preserveReturn: z.boolean().optional(),
})

/**
 * Authentication rule schema
 */
export const AuthRuleSchema = z.object({
  requirement: z.enum(['public', 'optional', 'required']).optional(),
  methods: z.array(z.enum(['bearer', 'apiKey', 'cookie', 'custom'])).optional(),
  customValidator: z.string().optional(),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  onFailure: AuthFailureSchema.optional(),
  rateLimit: RateLimitConfigSchema.optional(),
})

/**
 * Path-based authentication rule schema
 */
export const PathAuthRuleSchema = z.object({
  pattern: z.string().min(1).describe('Path pattern (supports wildcards)'),
  auth: AuthRuleSchema.optional(),
  priority: z.number().int().optional(),
})

/**
 * Authentication configuration schema
 */
export const AuthConfigSchema = z.object({
  defaults: z
    .object({
      pages: AuthRuleSchema.optional(),
      api: AuthRuleSchema.optional(),
      webhooks: AuthRuleSchema.optional(),
      forms: AuthRuleSchema.optional(),
      docs: AuthRuleSchema.optional(),
    })
    .optional(),
  rules: z.array(PathAuthRuleSchema).optional(),
})

// ============================================================================
// Security Schema
// ============================================================================

/**
 * Security configuration schema
 */
export const SecurityConfigOptionsSchema = z.object({
  requireAuth: z.boolean().optional().describe('Require authentication on /api/* routes'),
  allowDirectAgentExecution: z
    .boolean()
    .optional()
    .describe('Allow direct agent execution via API'),
  autoPermissions: z
    .boolean()
    .optional()
    .describe('Automatically require resource-specific permissions'),
  productionEnvironments: z
    .array(z.string())
    .optional()
    .describe('Environment names treated as production'),
})

// ============================================================================
// Routing Schema
// ============================================================================

/**
 * Routing configuration schema
 */
export const RoutingConfigSchema = z.object({
  autoDiscover: z.boolean().optional().describe('Auto-discover pages from directory structure'),
  basePath: z.string().optional().describe('Base path for all routes'),
  auth: AuthConfigSchema.optional(),
})

// ============================================================================
// Documentation Schema
// ============================================================================

/**
 * Documentation UI framework type
 */
export const DocsUIFrameworkSchema = z.enum([
  'stoplight',
  'redoc',
  'swagger',
  'scalar',
  'rapidoc',
])

/**
 * Documentation theme schema
 */
export const DocsThemeSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #3B82F6)')
    .optional(),
  customCss: z.string().optional(),
  darkMode: z.boolean().optional(),
})

/**
 * Documentation AI settings schema
 */
export const DocsAISchema = z.object({
  enabled: z.boolean().optional(),
  model: z.string().optional(),
  provider: z.enum(['cloudflare', 'openai', 'anthropic']).optional(),
  temperature: z.number().min(0).max(1).optional(),
})

/**
 * Documentation cache schema
 */
export const DocsCacheSchema = z.object({
  enabled: z.boolean().optional(),
  ttl: z.number().int().positive().optional(),
})

/**
 * Server URL schema
 */
export const ServerUrlSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  description: z.string().optional(),
})

/**
 * Documentation configuration schema
 */
export const DocsConfigSchema = z.object({
  // Branding
  title: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  favicon: z.string().url().optional(),

  // UI Framework
  ui: DocsUIFrameworkSchema.optional(),
  theme: DocsThemeSchema.optional(),

  // Access Control
  auth: z
    .object({
      requirement: z.enum(['public', 'optional', 'required']).optional(),
      redirectTo: z.string().optional(),
    })
    .optional(),

  // AI Enhancement
  ai: DocsAISchema.optional(),

  // Content Filtering
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
  includeExamples: z.boolean().optional(),
  includeSecurity: z.boolean().optional(),

  // Caching
  cache: DocsCacheSchema.optional(),

  // Output
  outputDir: z.string().optional(),
  format: z.enum(['yaml', 'json']).optional(),

  // Server URLs
  servers: z.array(ServerUrlSchema).optional(),

  // Legacy (deprecated)
  useAI: z.boolean().optional(),
  aiAgent: z.string().optional(),
})

// ============================================================================
// Testing Schema
// ============================================================================

/**
 * Coverage thresholds schema
 */
export const CoverageThresholdsSchema = z.object({
  lines: z.number().min(0).max(100).optional(),
  functions: z.number().min(0).max(100).optional(),
  branches: z.number().min(0).max(100).optional(),
  statements: z.number().min(0).max(100).optional(),
})

/**
 * Testing configuration schema
 */
export const TestingConfigSchema = z.object({
  coverage: CoverageThresholdsSchema.optional(),
  timeout: z.number().int().positive().optional(),
  environment: z.enum(['node', 'jsdom', 'edge-runtime']).optional(),
  setupFiles: z.array(z.string()).optional(),
  globals: z.boolean().optional(),
})

// ============================================================================
// Observability Schemas
// ============================================================================

/**
 * Log event types
 */
export const LogEventTypeSchema = z.enum([
  'request',
  'response',
  'agent:start',
  'agent:complete',
  'agent:error',
  'ensemble:start',
  'ensemble:complete',
  'ensemble:error',
  'cache:hit',
  'cache:miss',
])

/**
 * Metric types
 */
export const MetricTypeSchema = z.enum([
  'ensemble:execution',
  'agent:execution',
  'http:request',
  'cache:performance',
  'error',
])

/**
 * Logging configuration schema
 */
export const LoggingConfigSchema = z.object({
  enabled: z.boolean().optional(),
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  format: z.enum(['json', 'pretty']).optional(),
  context: z.array(z.string()).optional(),
  redact: z.array(z.string()).optional(),
  events: z.array(LogEventTypeSchema).optional(),
})

/**
 * Metrics configuration schema
 */
export const MetricsConfigSchema = z.object({
  enabled: z.boolean().optional(),
  binding: z.string().optional(),
  track: z.array(MetricTypeSchema).optional(),
  dimensions: z.array(z.string()).optional(),
})

/**
 * OpenTelemetry configuration schema
 */
export const OpenTelemetryConfigSchema = z.object({
  enabled: z.boolean().optional(),
  endpoint: z.string().url().optional(),
  headers: z.record(z.string()).optional(),
  samplingRate: z.number().min(0).max(1).optional(),
})

/**
 * Observability configuration schema
 * Supports boolean shorthand or full config object
 */
export const ObservabilityConfigSchema = z.object({
  logging: z.union([z.boolean(), LoggingConfigSchema]).optional(),
  metrics: z.union([z.boolean(), MetricsConfigSchema]).optional(),
  opentelemetry: OpenTelemetryConfigSchema.optional(),
  trackTokenUsage: z.boolean().optional(),
})

// ============================================================================
// Execution Schema
// ============================================================================

/**
 * Execution configuration schema
 */
export const ExecutionConfigSchema = z.object({
  defaultTimeout: z.number().int().positive().optional(),
  trackHistory: z.boolean().optional(),
  maxHistoryEntries: z.number().int().positive().optional(),
  storeStateSnapshots: z.boolean().optional(),
})

// ============================================================================
// Storage Schema
// ============================================================================

/**
 * Storage configuration schema
 */
export const StorageConfigSchema = z.object({
  type: z.enum(['filesystem', 'd1', 'kv']).optional(),
  path: z.string().optional(),
  d1Binding: z.string().optional(),
  kvBinding: z.string().optional(),
})

// ============================================================================
// Main Config Schema
// ============================================================================

/**
 * Complete Conductor configuration schema
 */
export const ConductorConfigSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  security: SecurityConfigOptionsSchema.optional(),
  routing: RoutingConfigSchema.optional(),
  docs: DocsConfigSchema.optional(),
  testing: TestingConfigSchema.optional(),
  observability: ObservabilityConfigSchema.optional(),
  execution: ExecutionConfigSchema.optional(),
  storage: StorageConfigSchema.optional(),
})

// ============================================================================
// Type Inference
// ============================================================================

/**
 * Inferred types from Zod schemas
 * These should match the interfaces in types.ts
 */
export type ValidatedConductorConfig = z.infer<typeof ConductorConfigSchema>
export type ValidatedSecurityConfig = z.infer<typeof SecurityConfigOptionsSchema>
export type ValidatedRoutingConfig = z.infer<typeof RoutingConfigSchema>
export type ValidatedDocsConfig = z.infer<typeof DocsConfigSchema>
export type ValidatedTestingConfig = z.infer<typeof TestingConfigSchema>
export type ValidatedObservabilityConfig = z.infer<typeof ObservabilityConfigSchema>
export type ValidatedExecutionConfig = z.infer<typeof ExecutionConfigSchema>
export type ValidatedStorageConfig = z.infer<typeof StorageConfigSchema>

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError }

/**
 * Validate a ConductorConfig object
 *
 * @param config - Raw configuration object
 * @returns Validation result with typed data or error
 *
 * @example
 * ```typescript
 * const result = validateConfig(userConfig);
 * if (result.success) {
 *   console.log('Valid config:', result.data);
 * } else {
 *   console.error('Validation errors:', result.error.format());
 * }
 * ```
 */
export function validateConfig(config: unknown): ValidationResult<ValidatedConductorConfig> {
  const result = ConductorConfigSchema.safeParse(config)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * Validate and throw if invalid
 *
 * @param config - Raw configuration object
 * @returns Validated configuration
 * @throws {z.ZodError} if validation fails
 */
export function validateConfigOrThrow(config: unknown): ValidatedConductorConfig {
  return ConductorConfigSchema.parse(config)
}

/**
 * Format validation errors for user display
 *
 * @param error - Zod validation error
 * @returns Human-readable error messages
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.')
    return path ? `${path}: ${err.message}` : err.message
  })
}

/**
 * Validate a partial config section
 *
 * @example
 * ```typescript
 * const result = validateSection(DocsConfigSchema, docsConfig);
 * ```
 */
export function validateSection<T extends z.ZodType>(
  schema: T,
  data: unknown
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}
