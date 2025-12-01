/**
 * Components Module
 *
 * Provides typed access to all component types from KV storage:
 * - schemas - JSON Schema definitions
 * - prompts - AI prompt templates
 * - configs - Configuration objects
 * - queries - SQL query templates
 * - scripts - JavaScript/TypeScript scripts
 * - templates - HTML/Handlebars templates
 *
 * Used by TypeScript handlers via the execution context.
 *
 * @module components
 */
export { ComponentRegistry, createComponentRegistry, parseNameWithVersion } from './registry.js';
export { SchemaRegistry, validateJsonSchema } from './schemas.js';
export type { JSONSchema, ValidationResult, ValidationError } from './schemas.js';
export { PromptRegistry, renderHandlebars } from './prompts.js';
export type { PromptTemplate } from './prompts.js';
export { ConfigRegistry } from './configs.js';
export { QueryRegistry } from './queries.js';
export type { QueryTemplate } from './queries.js';
export { ScriptRegistry } from './scripts.js';
export type { ScriptMetadata, LoadedScript } from './scripts.js';
export { TemplateRegistry } from './templates.js';
export type { Template } from './templates.js';
export { createAgentRegistry, createEnsembleRegistry, createDocsRegistry } from './discovery.js';
export type { AgentRegistry, EnsembleRegistry, DocsRegistry, AgentMetadata, EnsembleMetadata, DocsPageMetadata, } from './discovery.js';
//# sourceMappingURL=index.d.ts.map