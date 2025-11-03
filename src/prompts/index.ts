/**
 * Prompt Management - Exports
 *
 * YAML-based prompt templates with versioning and variable substitution.
 */

export { PromptManager, getGlobalPromptManager } from './prompt-manager'

export type { PromptManagerConfig, RenderOptions, RenderedPrompt } from './prompt-manager'

export { PromptParser, parseTemplate } from './prompt-parser'

export type { ParserOptions } from './prompt-parser'

export {
  validatePromptVariables,
  applyDefaultVariables,
  extractVariables,
  getVariableInfo,
} from './prompt-schema'

export type {
  PromptVariable,
  PromptMetadata,
  PromptTemplate,
  PromptValidationError,
  PromptValidationResult,
} from './prompt-schema'
