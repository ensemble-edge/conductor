/**
 * Conductor SDK - Exports
 */

export { ConductorClient, ConductorError, createClient } from './client.js'

export type {
  ClientConfig,
  ExecuteOptions,
  ExecuteResult,
  Agent,
  MemberDetail,
  HealthStatus,
} from './client.js'

export { MemberHelpers, createMemberHelpers } from './agents.js'

export type {
  FetchInput,
  FetchOutput,
  FetchConfig,
  ScrapeInput,
  ScrapeOutput,
  ScrapeConfig,
  ValidateInput,
  ValidateOutput,
  ValidateConfig,
  RAGInput,
  RAGIndexOutput,
  RAGSearchOutput,
  RAGOutput,
  RAGConfig,
  HITLInput,
  HITLRequestOutput,
  HITLRespondOutput,
  HITLOutput,
  HITLConfig,
  QueriesInput,
  QueriesOutput,
  QueriesConfig,
} from './agents.js'

// Agent factory functions
export {
  createAgent,
  createThinkAgent,
  createFunctionAgent,
  createStorageAgent,
  createDataAgent,
  createAPIAgent,
  generateAgentConfig,
} from './agent-factory.js'

export type { CreateAgentOptions, MemberHandler } from './types.js'

// Edgit integration (planned)
export { loadComponent, loadMemberConfig } from './edgit.js'
