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
export declare enum Operation {
    think = "think",
    code = "code",
    storage = "storage",
    data = "data",
    http = "http",
    tools = "tools",
    scoring = "scoring",
    email = "email",
    sms = "sms",
    form = "form",
    html = "html",
    pdf = "pdf",
    queue = "queue",
    docs = "docs"
}
/**
 * String union type for operations
 */
export type OperationType = 'think' | 'code' | 'storage' | 'data' | 'http' | 'tools' | 'scoring' | 'email' | 'sms' | 'form' | 'html' | 'pdf' | 'queue' | 'docs';
/**
 * Type guard to check if a value is a valid Operation
 */
export declare const isOperation: (value: string) => value is Operation;
/**
 * Get all available operations
 */
export declare const getAllOperations: () => Operation[];
/**
 * Get operation display name
 */
export declare const getOperationDisplayName: (operation: Operation) => string;
/**
 * Get operation description
 */
export declare const getOperationDescription: (operation: Operation) => string;
/**
 * Check if an operation requires AI capabilities
 */
export declare const requiresAI: (operation: Operation) => boolean;
/**
 * Check if an operation involves external communication
 */
export declare const isExternalOperation: (operation: Operation) => boolean;
/**
 * Check if an operation generates content
 */
export declare const isContentGenerationOperation: (operation: Operation) => boolean;
/**
 * Check if an operation involves data storage
 */
export declare const isDataOperation: (operation: Operation) => boolean;
/**
 * Validate operation configuration based on operation type
 */
export interface OperationValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Operation metadata
 */
export interface OperationMetadata {
    operation: Operation;
    displayName: string;
    description: string;
    requiresAI: boolean;
    isExternal: boolean;
    isContentGeneration: boolean;
    isData: boolean;
}
/**
 * Get complete metadata for an operation
 */
export declare const getOperationMetadata: (operation: Operation) => OperationMetadata;
//# sourceMappingURL=operation.d.ts.map