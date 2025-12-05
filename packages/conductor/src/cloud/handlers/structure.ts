/**
 * Cloud Structure Endpoint
 *
 * GET /cloud/structure
 *
 * Returns the project structure (agents, ensembles, components).
 * This provides Cloud with a view of the deployed project shape.
 */

import type {
  CloudEnv,
  CloudStructureResponse,
  CloudAgentInfo,
  CloudEnsembleInfo,
  CloudComponentInfo,
} from '../types.js'
import { getMemberLoader, getEnsembleLoader } from '../../api/auto-discovery.js'
import type { EnsembleConfig } from '../../runtime/parser.js'

/**
 * Handle structure request
 *
 * Returns the project shape including agents, ensembles, and edgit-managed components.
 * This is used by Ensemble Cloud to understand what's deployed.
 */
export async function handleStructure(_request: Request, env: CloudEnv): Promise<Response> {
  // Get project info from env or defaults
  const projectName = env.CONDUCTOR_PROJECT_NAME || 'conductor-project'
  const projectVersion = env.CONDUCTOR_PROJECT_VERSION || '1.0.0'

  // Get loaded agents from MemberLoader
  const memberLoader = getMemberLoader()
  const agents: CloudAgentInfo[] = []

  if (memberLoader) {
    // Use getAgentNames + getAgentConfig to access agent metadata
    const agentNames = memberLoader.getAgentNames()
    for (const name of agentNames) {
      const config = memberLoader.getAgentConfig(name)
      if (config) {
        agents.push({
          name: config.name,
          type: 'operation', // All YAML agents are operation-based
          operation: config.operation,
        })
      }
    }
  }

  // Get loaded ensembles from EnsembleLoader
  const ensembleLoader = getEnsembleLoader()
  const ensembles: CloudEnsembleInfo[] = []

  if (ensembleLoader) {
    const loadedEnsembles = ensembleLoader.getAllEnsembles()
    for (const ensemble of loadedEnsembles) {
      // Extract agent names from ensemble steps
      const agentNames = extractAgentNames(ensemble)
      ensembles.push({
        name: ensemble.name,
        agents: agentNames,
      })
    }
  }

  // Edgit components (stubbed for now - will integrate with edgit registry)
  // TODO: Integrate with actual edgit component registry when available
  const components: CloudComponentInfo[] = []
  const edgitInitialized = false
  const componentsCount = 0

  const response: CloudStructureResponse = {
    project: {
      name: projectName,
      version: projectVersion,
    },
    agents,
    ensembles,
    components,
    edgit: {
      initialized: edgitInitialized,
      componentsCount,
    },
  }

  return Response.json(response)
}

/**
 * Extract agent names from ensemble configuration
 *
 * Looks through:
 * - `flow` array for agent steps (each has an `agent` property)
 * - `agents` array for inline agent definitions (each has a `name` property)
 */
function extractAgentNames(ensemble: EnsembleConfig): string[] {
  const names = new Set<string>()

  // Extract from flow array (agent flow steps)
  if (ensemble.flow) {
    for (const step of ensemble.flow) {
      // Handle object steps with agent property (AgentFlowStep)
      if (typeof step === 'object' && step !== null && 'agent' in step) {
        const agentStep = step as { agent?: string }
        if (agentStep.agent) {
          names.add(agentStep.agent)
        }
      }
    }
  }

  // Extract from inline agents array
  if (ensemble.agents) {
    for (const agent of ensemble.agents) {
      // Inline agents are Record<string, unknown>, extract name if present
      if (typeof agent === 'object' && agent !== null) {
        const agentRecord = agent as Record<string, unknown>
        if (typeof agentRecord.name === 'string') {
          names.add(agentRecord.name)
        }
      }
    }
  }

  return Array.from(names)
}
