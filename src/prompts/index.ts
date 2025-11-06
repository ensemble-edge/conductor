/**
 * Prompt Management - Exports
 *
 * YAML-based prompt templates with versioning and variable substitution.
 */

export { PromptManager, getGlobalPromptManager } from './prompt-manager.js'

export type { PromptManagerConfig, RenderOptions, RenderedPrompt } from './prompt-manager.js'

export { PromptParser, parseTemplate } from './prompt-parser.js'

export type { ParserOptions } from './prompt-parser.js'

export {
  validatePromptVariables,
  applyDefaultVariables,
  extractVariables,
  getVariableInfo,
} from './prompt-schema.js'

export type {
  PromptVariable,
  PromptMetadata,
  PromptTemplate,
  PromptValidationError,
  PromptValidationResult,
} from './prompt-schema.js'
