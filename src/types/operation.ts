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
 * - storage: Database/KV/R2/D1 access for data operations
 * - http: External API integration and HTTP calls
 * - tools: Model Context Protocol (MCP) and skill integration
 * - scoring: Evaluation and scoring operations
 * - email: Email sending and management
 * - sms: SMS messaging
 * - form: Form rendering and handling
 * - page: Full-stack web page generation
 * - html: HTML content generation
 * - pdf: PDF document generation
 * - queue: Cloudflare Queues message processing and batch operations
 */
export enum Operation {
  think = 'think',
  code = 'code',
  storage = 'storage',
  http = 'http',
  tools = 'tools',
  scoring = 'scoring',
  email = 'email',
  sms = 'sms',
  form = 'form',
  page = 'page',
  html = 'html',
  pdf = 'pdf',
  queue = 'queue',
}

/**
 * String union type for operations
 */
export type OperationType =
  | 'think'
  | 'code'
  | 'storage'
  | 'http'
  | 'tools'
  | 'scoring'
  | 'email'
  | 'sms'
  | 'form'
  | 'page'
  | 'html'
  | 'pdf'
  | 'queue'

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
    [Operation.http]: 'HTTP Agent',
    [Operation.tools]: 'Tools Agent',
    [Operation.scoring]: 'Scoring Agent',
    [Operation.email]: 'Email Agent',
    [Operation.sms]: 'SMS Agent',
    [Operation.form]: 'Form Agent',
    [Operation.page]: 'Page Agent',
    [Operation.html]: 'HTML Agent',
    [Operation.pdf]: 'PDF Agent',
    [Operation.queue]: 'Queue Agent',
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
    [Operation.storage]: 'Data storage, retrieval, and management',
    [Operation.http]: 'External API integration and calls',
    [Operation.tools]: 'Model Context Protocol integration',
    [Operation.scoring]: 'Evaluation, scoring, and quality assessment',
    [Operation.email]: 'Email sending and management',
    [Operation.sms]: 'SMS messaging and notifications',
    [Operation.form]: 'Form rendering and submission handling',
    [Operation.page]: 'Web page generation and rendering',
    [Operation.html]: 'HTML content generation',
    [Operation.pdf]: 'PDF document generation and processing',
    [Operation.queue]: 'Message queue processing and batch operations',
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
  return [Operation.think, Operation.html, Operation.pdf, Operation.page, Operation.form].includes(
    operation
  )
}

/**
 * Check if an operation involves data storage
 */
export const isDataOperation = (operation: Operation): boolean => {
  return operation === Operation.storage
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
