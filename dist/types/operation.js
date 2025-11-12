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
 */
export var Operation;
(function (Operation) {
    Operation["think"] = "think";
    Operation["code"] = "code";
    Operation["storage"] = "storage";
    Operation["http"] = "http";
    Operation["tools"] = "tools";
    Operation["scoring"] = "scoring";
    Operation["email"] = "email";
    Operation["sms"] = "sms";
    Operation["form"] = "form";
    Operation["page"] = "page";
    Operation["html"] = "html";
    Operation["pdf"] = "pdf";
})(Operation || (Operation = {}));
/**
 * Type guard to check if a value is a valid Operation
 */
export const isOperation = (value) => {
    return Object.values(Operation).includes(value);
};
/**
 * Get all available operations
 */
export const getAllOperations = () => {
    return Object.values(Operation);
};
/**
 * Get operation display name
 */
export const getOperationDisplayName = (operation) => {
    const names = {
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
    };
    return names[operation];
};
/**
 * Get operation description
 */
export const getOperationDescription = (operation) => {
    const descriptions = {
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
    };
    return descriptions[operation];
};
/**
 * Check if an operation requires AI capabilities
 */
export const requiresAI = (operation) => {
    return operation === Operation.think;
};
/**
 * Check if an operation involves external communication
 */
export const isExternalOperation = (operation) => {
    return [Operation.http, Operation.email, Operation.sms].includes(operation);
};
/**
 * Check if an operation generates content
 */
export const isContentGenerationOperation = (operation) => {
    return [Operation.think, Operation.html, Operation.pdf, Operation.page, Operation.form].includes(operation);
};
/**
 * Check if an operation involves data storage
 */
export const isDataOperation = (operation) => {
    return operation === Operation.storage;
};
/**
 * Get complete metadata for an operation
 */
export const getOperationMetadata = (operation) => {
    return {
        operation,
        displayName: getOperationDisplayName(operation),
        description: getOperationDescription(operation),
        requiresAI: requiresAI(operation),
        isExternal: isExternalOperation(operation),
        isContentGeneration: isContentGenerationOperation(operation),
        isData: isDataOperation(operation),
    };
};
