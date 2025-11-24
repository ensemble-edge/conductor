/**
 * Operation Types
 *
 * Defines the different types of operations available in the Conductor framework.
 * Operations represent the various capabilities and behaviors that agents can perform.
 */

/**
 * Operation types in Conductor framework
 *
 * Each operation type represents a distinct capability:
 * - think: AI-powered reasoning and language generation (LLMs, embeddings, classifiers)
 * - code: JavaScript/TypeScript execution for custom business logic
 * - storage: Key-value and object storage (KV, R2, Cache API)
 * - data: SQL databases and structured data stores (D1, Hyperdrive, Supabase, Neon)
 * - http: External API integration and HTTP calls
 * - tools: Model Context Protocol (MCP) and skill integration
 * - scoring: Evaluation and scoring operations
 * - email: Email sending and management
 * - sms: SMS messaging
 * - form: Form rendering and handling
 * - html: HTML content generation
 * - pdf: PDF document generation
 * - queue: Cloudflare Queues message processing and batch operations
 * - docs: API documentation generation and serving
 */
export enum Operation {
  think = 'think',
  code = 'code',
  storage = 'storage',
  data = 'data',
  http = 'http',
  tools = 'tools',
  scoring = 'scoring',
  email = 'email',
  sms = 'sms',
  form = 'form',
  html = 'html',
  pdf = 'pdf',
  queue = 'queue',
  docs = 'docs',
}

/**
 * String union type for operations
 */
export type OperationType =
  | 'think'
  | 'code'
  | 'storage'
  | 'data'
  | 'http'
  | 'tools'
  | 'scoring'
  | 'email'
  | 'sms'
  | 'form'
  | 'html'
  | 'pdf'
  | 'queue'
  | 'docs'

/**
 * Type guard to check if a value is a valid Operation
 */
export const isOperation = (value: string): value is Operation => {
  return Object.values(Operation).includes(value as Operation)
}

/**
 * Get all available operations
 */
export const getAllOperations = (): Operation[] => {
  return Object.values(Operation)
}

/**
 * Get operation display name
 */
export const getOperationDisplayName = (operation: Operation): string => {
  const names: Record<Operation, string> = {
    [Operation.think]: 'Think Agent',
    [Operation.code]: 'Code Agent',
    [Operation.storage]: 'Storage Agent',
    [Operation.data]: 'Data Agent',
    [Operation.http]: 'HTTP Agent',
    [Operation.tools]: 'Tools Agent',
    [Operation.scoring]: 'Scoring Agent',
    [Operation.email]: 'Email Agent',
    [Operation.sms]: 'SMS Agent',
    [Operation.form]: 'Form Agent',
    [Operation.html]: 'HTML Agent',
    [Operation.pdf]: 'PDF Agent',
    [Operation.queue]: 'Queue Agent',
    [Operation.docs]: 'Docs Agent',
  }
  return names[operation]
}

/**
 * Get operation description
 */
export const getOperationDescription = (operation: Operation): string => {
  const descriptions: Record<Operation, string> = {
    [Operation.think]: 'AI-powered reasoning and language generation',
    [Operation.code]: 'Custom code execution and business logic',
    [Operation.storage]: 'Key-value and object storage (KV, R2, Cache)',
    [Operation.data]: 'SQL databases and structured data (D1, Hyperdrive)',
    [Operation.http]: 'External API integration and calls',
    [Operation.tools]: 'Model Context Protocol integration',
    [Operation.scoring]: 'Evaluation, scoring, and quality assessment',
    [Operation.email]: 'Email sending and management',
    [Operation.sms]: 'SMS messaging and notifications',
    [Operation.form]: 'Form rendering and submission handling',
    [Operation.html]: 'HTML content generation',
    [Operation.pdf]: 'PDF document generation and processing',
    [Operation.queue]: 'Message queue processing and batch operations',
    [Operation.docs]: 'API documentation generation and serving',
  }
  return descriptions[operation]
}

/**
 * Check if an operation requires AI capabilities
 */
export const requiresAI = (operation: Operation): boolean => {
  return operation === Operation.think
}

/**
 * Check if an operation involves external communication
 */
export const isExternalOperation = (operation: Operation): boolean => {
  return [Operation.http, Operation.email, Operation.sms].includes(operation)
}

/**
 * Check if an operation generates content
 */
export const isContentGenerationOperation = (operation: Operation): boolean => {
  return [Operation.think, Operation.html, Operation.pdf, Operation.form, Operation.docs].includes(
    operation
  )
}

/**
 * Check if an operation involves data storage
 */
export const isDataOperation = (operation: Operation): boolean => {
  return [Operation.storage, Operation.data].includes(operation)
}

/**
 * Validate operation configuration based on operation type
 */
export interface OperationValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Operation metadata
 */
export interface OperationMetadata {
  operation: Operation
  displayName: string
  description: string
  requiresAI: boolean
  isExternal: boolean
  isContentGeneration: boolean
  isData: boolean
}

/**
 * Get complete metadata for an operation
 */
export const getOperationMetadata = (operation: Operation): OperationMetadata => {
  return {
    operation,
    displayName: getOperationDisplayName(operation),
    description: getOperationDescription(operation),
    requiresAI: requiresAI(operation),
    isExternal: isExternalOperation(operation),
    isContentGeneration: isContentGenerationOperation(operation),
    isData: isDataOperation(operation),
  }
}
