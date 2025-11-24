/**
 * CLI Exec Command
 *
 * Execute agents locally or remotely.
 */

import { Command } from 'commander'
import chalk from 'chalk'
import { getBuiltInRegistry } from '../../agents/built-in/registry.js'
import { createClient, type ExecuteResult } from '../../sdk/client.js'
import type { AgentExecutionContext } from '../../agents/base-agent.js'
import type { ConductorEnv } from '../../types/env.js'

/**
 * CLI execution options
 */
interface ExecOptions {
  input?: string
  config?: string
  file?: string
  remote?: boolean
  apiUrl?: string
  apiKey?: string
  output?: 'json' | 'pretty' | 'raw'
}

export function createExecCommand(): Command {
  const exec = new Command('exec')
    .description('Execute a agent')
    .argument('<agent>', 'Agent name to execute')
    .option('-i, --input <json>', 'Input data as JSON string')
    .option('-c, --config <json>', 'Configuration as JSON string')
    .option('-f, --file <path>', 'Input data from JSON file')
    .option('--remote', 'Force remote execution via API')
    .option('--api-url <url>', 'API URL (default: from CONDUCTOR_API_URL env)')
    .option('--api-key <key>', 'API key (default: from CONDUCTOR_API_KEY env)')
    .option('--output <format>', 'Output format: json, pretty, or raw (default: pretty)', 'pretty')
    .action(async (agentName: string, options: ExecOptions) => {
      try {
        // Parse input
        let input: Record<string, unknown> = {}
        if (options.input) {
          input = JSON.parse(options.input)
        } else if (options.file) {
          const fs = await import('fs')
          const content = fs.readFileSync(options.file, 'utf-8')
          input = JSON.parse(content)
        }

        // Parse config
        let config: Record<string, unknown> = {}
        if (options.config) {
          config = JSON.parse(options.config)
        }

        // Decide execution mode
        const forceRemote = options.remote
        const canExecuteLocally = !forceRemote && canExecuteLocal()

        let result: ExecuteResult
        let executionMode: 'local' | 'remote'

        if (canExecuteLocally) {
          // Try local execution
          console.log(chalk.dim('→ Executing locally...'))
          executionMode = 'local'
          result = await executeLocal(agentName, input, config)
        } else {
          // Fall back to remote execution
          const apiUrl = options.apiUrl || process.env.CONDUCTOR_API_URL
          const apiKey = options.apiKey || process.env.CONDUCTOR_API_KEY

          if (!apiUrl) {
            console.error(
              chalk.red('Error: API URL not configured. Set CONDUCTOR_API_URL or use --api-url')
            )
            process.exit(1)
          }

          console.log(chalk.dim(`→ Executing remotely via ${apiUrl}...`))
          executionMode = 'remote'
          result = await executeRemote(agentName, input, config, apiUrl, apiKey)
        }

        // Output result
        if (options.output === 'json') {
          console.log(JSON.stringify(result, null, 2))
        } else if (options.output === 'raw') {
          console.log(result.data)
        } else {
          // Pretty output
          console.log('')
          if (result.success) {
            console.log(chalk.green('✓ Execution successful'))
            console.log('')
            console.log(chalk.bold('Result:'))
            console.log(JSON.stringify(result.data, null, 2))
            console.log('')
            console.log(chalk.dim(`Duration: ${result.metadata?.duration || 'N/A'}ms`))
            console.log(chalk.dim(`Mode: ${executionMode}`))
          } else {
            console.log(chalk.red('✗ Execution failed'))
            console.log('')
            console.log(chalk.bold('Error:'))
            console.log(chalk.red(result.error || 'Unknown error'))
          }
        }

        process.exit(result.success ? 0 : 1)
      } catch (error) {
        console.error(chalk.red('Error:'), (error as Error).message)
        if (options.output === 'json') {
          console.log(JSON.stringify({ error: (error as Error).message }, null, 2))
        }
        process.exit(1)
      }
    })

  return exec
}

/**
 * Check if local execution is possible
 */
function canExecuteLocal(): boolean {
  // Check if we're in a Node.js environment with access to built-in registry
  // In production, this could check for required env bindings
  try {
    const registry = getBuiltInRegistry()
    return !!registry
  } catch {
    return false
  }
}

/**
 * Execute agent locally
 */
async function executeLocal(
  agentName: string,
  input: Record<string, unknown>,
  config: Record<string, unknown>
): Promise<ExecuteResult> {
  const startTime = Date.now()

  // Get built-in registry
  const registry = getBuiltInRegistry()

  // Check if agent exists
  if (!registry.isBuiltIn(agentName)) {
    throw new Error(`Agent not found: ${agentName}`)
  }

  // Get agent metadata
  const metadata = registry.getMetadata(agentName)
  if (!metadata) {
    throw new Error(`Agent metadata not found: ${agentName}`)
  }

  // Create agent instance
  const agentConfig = {
    name: agentName,
    operation: metadata.operation,
    config,
  }

  // Create mock env (no real bindings in CLI)
  const mockEnv = {} as unknown as ConductorEnv

  const agent = await registry.create(agentName, agentConfig, mockEnv)

  // Create execution context
  const context: AgentExecutionContext = {
    input,
    env: mockEnv,
    ctx: {
      waitUntil: () => {},
      passThroughOnException: () => {},
    } as unknown as ExecutionContext,
  }

  // Execute agent
  const result = await agent.execute(context)

  return {
    success: result.success,
    data: result.data,
    error: result.error,
    metadata: {
      executionId: `local-${Date.now()}`,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    },
  }
}

/**
 * Execute agent remotely via API
 */
async function executeRemote(
  agentName: string,
  input: Record<string, unknown>,
  config: Record<string, unknown>,
  apiUrl: string,
  apiKey?: string
): Promise<ExecuteResult> {
  const client = createClient({
    baseUrl: apiUrl,
    apiKey,
  })

  const result = await client.execute({
    agent: agentName,
    input,
    config,
  })

  return result
}
