/**
 * Conductor Primitives
 *
 * The canonical building blocks for both YAML and TypeScript authoring.
 * Both formats produce identical runtime objects through these primitives.
 *
 * Architecture:
 * - YAML files are parsed and converted INTO these primitives
 * - TypeScript files directly CREATE these primitives
 * - The executor runs the same primitives regardless of source
 *
 * This ensures a single implementation path: one set of primitives,
 * one execution engine, maximum consistency.
 */

// ============================================================================
// Types - Shared type definitions
// ============================================================================
export type {
  // Core context
  Context,
  // Flow step types
  FlowStepType,
  AgentFlowStep,
  ParallelFlowStep,
  BranchFlowStep,
  ForeachFlowStep,
  TryFlowStep,
  SwitchFlowStep,
  WhileFlowStep,
  MapReduceFlowStep,
  // Step configuration
  StepOptions,
  AgentSchemaConfig,
  AgentConfig,
  // State configuration
  StateConfig,
  // Hooks
  EnsembleHooks,
  // Output configuration
  OutputConfig,
  // Option types
  ParallelOptions,
  BranchOptions,
  ForeachOptions,
  TryOptions,
  WhileOptions,
  MapReduceOptions,
} from './types.js'

// Type guards from types
export {
  isParallelStep,
  isAgentStep,
  isBranchStep,
  isForeachStep,
  isTryStep,
  isSwitchStep,
  isWhileStep,
  isMapReduceStep,
  isFlowControlStep,
  isControlFlowStep,
} from './types.js'

// ============================================================================
// Step Primitives - Create individual execution steps
// ============================================================================
export {
  // Core step creation
  step,
  sequence,
  // Operation-specific shortcuts
  scriptStep,
  httpStep,
  thinkStep,
  storageStep,
  dataStep,
  emailStep,
  // Agent reference
  agentStep,
} from './step.js'

// ============================================================================
// Flow Control Primitives - Orchestrate step execution
// ============================================================================
export {
  // Parallel execution
  parallel,
  race,
  // Conditional branching
  branch,
  ifThen,
  ifThenElse,
  // Switching
  switchStep,
  // Iteration
  foreach,
  map,
  repeat,
  // Loops
  whileStep,
  doWhile,
  doUntil,
  // Error handling
  tryStep,
  fallback,
  // Map-reduce
  mapReduce,
} from './flow.js'

export type { LoopOptions } from './flow.js'

// ============================================================================
// Ensemble Primitives - Create and manage ensembles
// ============================================================================
export {
  // Factory function
  createEnsemble,
  // Class for type checking
  Ensemble,
  // Type guards
  isEnsemble,
  // Conversion from config (for YAML parser)
  ensembleFromConfig,
} from './ensemble.js'

export type {
  EnsembleOptions,
  EnsembleConfig,
  // Trigger types
  TriggerConfig,
  WebhookTrigger,
  HttpTrigger,
  McpTrigger,
  EmailTrigger,
  QueueTrigger,
  CronTrigger,
  // Notification types
  NotificationConfig,
  WebhookNotification,
  EmailNotification,
  // Scoring
  ScoringConfig,
  // Inline agents
  InlineAgentConfig,
} from './ensemble.js'

// ============================================================================
// Tool Primitives - Define agent tools and capabilities
// ============================================================================
export {
  // Tool creation
  createTool,
  mcpTool,
  customTool,
  httpTool,
  skillTool,
  toolCollection,
  // Class
  Tool,
  // Type guards
  isTool,
  isToolConfig,
} from './tool.js'

export type {
  ToolConfig,
  ToolDefinition,
  ToolParameter,
  ToolCollection,
  MCPServerConfig,
  CustomToolConfig,
  HTTPToolConfig,
  SkillToolConfig,
} from './tool.js'

// ============================================================================
// Instruction Primitives - Define prompts and system messages
// ============================================================================
export {
  // Instruction creation
  instruction,
  systemInstruction,
  userInstruction,
  assistantInstruction,
  fileInstruction,
  templateInstruction,
  dynamicInstruction,
  conditionalInstruction,
  // Utilities
  combineInstructions,
  prompt,
  // Class
  Instruction,
  // Type guards
  isInstruction,
  isInstructionConfig,
} from './instruction.js'

export type { InstructionConfig, InstructionSource, InstructionContext } from './instruction.js'

// ============================================================================
// Memory Primitives - Persistent storage (NOT workflow state)
// ============================================================================
export {
  // Memory creation
  memory,
  kvMemory,
  r2Memory,
  d1Memory,
  vectorMemory,
  durableMemory,
  customMemory,
  // Convenience helpers
  conversationMemory,
  knowledgeBase,
  // Class
  Memory,
  // Type guards
  isMemory,
  isMemoryConfig,
} from './memory.js'

export type {
  MemoryConfig,
  AgentMemoryConfig,
  MemoryProviderType,
  MemoryScope,
  MemoryEntry,
  VectorMemoryEntry,
  KVMemoryConfig,
  R2MemoryConfig,
  D1MemoryConfig,
  VectorizeMemoryConfig,
  DurableObjectMemoryConfig,
  CustomMemoryConfig,
  MemoryImplementation,
} from './memory.js'

// ============================================================================
// Reference Primitives - Dynamic value access
// ============================================================================
export {
  // Reference creation
  ref,
  inputRef,
  stateRef,
  envRef,
  stepRef,
  contextRef,
  outputRef,
  // Utilities
  computed,
  template,
  parseRef,
  refMap,
  // Class
  Reference,
  // Type guards
  isReference,
  isComputed,
  isTemplate,
  isRefExpression,
} from './reference.js'

export type { ReferenceSource, ReferenceOptions } from './reference.js'

// ============================================================================
// Async Primitives - Suspension, scheduling, HITL
// ============================================================================
export {
  // Suspension
  suspend,
  checkpoint,
  // Delays
  sleep,
  sleepSeconds,
  sleepMinutes,
  sleepUntil,
  // Scheduling
  schedule,
  // Human-in-the-loop
  approval,
  waitForWebhook,
  waitForInput,
  // Type guards
  isSuspendStep,
  isSleepStep,
  isScheduleStep,
  isApprovalStep,
  isAsyncStep,
} from './async.js'

export type {
  SuspensionReason,
  SuspensionState,
  SleepConfig,
  ScheduleConfig,
  ApprovalConfig,
  WebhookWaitConfig,
  SuspendStepConfig,
  SleepStepConfig,
  ScheduleStepConfig,
  ApprovalStepConfig,
} from './async.js'

// ============================================================================
// Version Primitives - Edgit integration for versioned components
// ============================================================================
export {
  // Factory functions
  componentRef,
  versionedAgent,
  versionedEnsemble,
  deploymentRef,
  // Batch creation
  versionedAgents,
  // Classes
  ComponentRef,
  VersionedAgent,
  VersionedEnsemble,
  DeploymentRef,
  // Type guards
  isComponentRef,
  isVersionedAgent,
  isVersionedEnsemble,
  isDeploymentRef,
  // Utilities
  parseVersion,
  satisfiesVersion,
} from './version.js'

export type {
  VersionConstraint,
  DeploymentEnvironment,
  ComponentRefOptions,
  VersionedAgentOptions,
  VersionedEnsembleOptions,
  DeploymentRefOptions,
} from './version.js'
