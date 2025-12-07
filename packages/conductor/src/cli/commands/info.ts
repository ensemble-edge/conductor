/**
 * Info Command - Show project info and component counts
 *
 * This is the authoritative source for project statistics.
 * Ensemble CLI calls this via `npx @ensemble-edge/conductor info --json`
 *
 * Why "info" instead of "status"?
 * - Avoids conflict with potential git-related status commands
 * - Consistent naming across Conductor and Edgit CLIs
 * - Ensemble CLI uses "status" as a user-friendly alias
 *
 * Features:
 * - Counts agents, ensembles, and other components
 * - Shows security settings with actual defaults
 * - Shows projectId from conductor.config.ts
 * - Parses wrangler.toml for Cloudflare services
 * - Supports --json output for programmatic access
 */

import { Command } from 'commander'
import chalk from 'chalk'
import * as fs from 'fs/promises'
import * as path from 'path'
import { glob } from 'glob'
import { existsSync } from 'fs'
import { DEFAULT_SECURITY_CONFIG } from '../../config/security.js'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ProjectInfo {
  name: string
  version: string
  conductorVersion?: string
  projectId?: string
}

interface ConfigStatus {
  conductorConfig: boolean
  wranglerConfig: boolean
}

interface ComponentCounts {
  agents: { total: number; custom: number; builtIn: number }
  ensembles: number
  prompts: number
  schemas: number
  configs: number
  queries: number
  scripts: number
  templates: number
  docs: number
}

interface TriggerCounts {
  http: number
  webhook: number
  mcp: number
  cron: number
  email: number
  queue: number
  startup: number
  cli: number
  build: number
}

interface SecuritySettings {
  requireAuth: boolean
  requireAuthExplicit: boolean // true if explicitly set in config
  stealthMode: boolean
  stealthModeExplicit: boolean
  allowDirectAgentExecution: boolean
  allowDirectAgentExecutionExplicit: boolean
}

interface CloudflareService {
  configured: boolean
  name?: string
  bindings?: string[]
  count?: number
}

interface CloudflareServices {
  workersAI: CloudflareService
  aiGateway: CloudflareService
  vectorize: CloudflareService
  kv: CloudflareService
  d1: CloudflareService
  r2: CloudflareService
  durableObjects: CloudflareService
  queues: CloudflareService
  hyperdrive: CloudflareService
  analyticsEngine: CloudflareService
}

interface DeploymentStatus {
  workerUrl?: string
  cloudEnabled: boolean
  pulse: boolean
}

interface ConductorStatusOutput {
  project: ProjectInfo
  config: ConfigStatus
  environment: string
  components: ComponentCounts
  triggers: TriggerCounts
  security: SecuritySettings
  plugins: string[]
  cloudflare: CloudflareServices
  deployment: DeploymentStatus
}

interface StatusOptions {
  json?: boolean
  compact?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read package.json for project info
 */
async function readProjectInfo(): Promise<ProjectInfo> {
  const info: ProjectInfo = {
    name: path.basename(process.cwd()),
    version: '0.0.0',
  }

  try {
    if (existsSync('package.json')) {
      const content = await fs.readFile('package.json', 'utf-8')
      const pkg = JSON.parse(content)
      info.name = pkg.name || info.name
      info.version = pkg.version || info.version

      // Find conductor version in dependencies
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }
      if (deps['@ensemble-edge/conductor']) {
        info.conductorVersion = deps['@ensemble-edge/conductor'].replace(/^[\^~]/, '')
      }
    }
  } catch {
    // Ignore errors
  }

  // Read projectId from conductor.config.ts
  const configFiles = ['conductor.config.ts', 'conductor.config.js']
  for (const configFile of configFiles) {
    if (!existsSync(configFile)) continue

    try {
      const content = await fs.readFile(configFile, 'utf-8')

      // Extract projectId
      const projectIdMatch = content.match(/projectId\s*:\s*['"]([^'"]+)['"]/)
      if (projectIdMatch && projectIdMatch[1] !== '__PROJECT_ID__') {
        info.projectId = projectIdMatch[1]
      }

      break
    } catch {
      // Continue
    }
  }

  return info
}

/**
 * Check config files exist
 */
function checkConfigFiles(): ConfigStatus {
  return {
    conductorConfig: existsSync('conductor.config.ts') || existsSync('conductor.config.js'),
    wranglerConfig: existsSync('wrangler.toml') || existsSync('wrangler.json'),
  }
}

/**
 * Detect environment
 */
async function detectEnvironment(): Promise<string> {
  if (process.env.ENVIRONMENT) {
    return process.env.ENVIRONMENT
  }

  try {
    if (existsSync('wrangler.toml')) {
      const content = await fs.readFile('wrangler.toml', 'utf-8')
      const match = content.match(/ENVIRONMENT\s*=\s*["']([^"']+)["']/)
      if (match) {
        return match[1]
      }
    }
  } catch {
    // Ignore
  }

  return 'development'
}

/**
 * Parse conductor.config.ts for security settings
 * Returns both the effective value and whether it was explicitly set
 */
async function parseSecuritySettings(): Promise<SecuritySettings> {
  const settings: SecuritySettings = {
    requireAuth: DEFAULT_SECURITY_CONFIG.requireAuth,
    requireAuthExplicit: false,
    stealthMode: false,
    stealthModeExplicit: false,
    allowDirectAgentExecution: DEFAULT_SECURITY_CONFIG.allowDirectAgentExecution,
    allowDirectAgentExecutionExplicit: false,
  }

  const configFiles = ['conductor.config.ts', 'conductor.config.js']

  for (const configFile of configFiles) {
    if (!existsSync(configFile)) continue

    try {
      const content = await fs.readFile(configFile, 'utf-8')

      // Parse requireAuth
      if (content.match(/requireAuth\s*:\s*true/)) {
        settings.requireAuth = true
        settings.requireAuthExplicit = true
      } else if (content.match(/requireAuth\s*:\s*false/)) {
        settings.requireAuth = false
        settings.requireAuthExplicit = true
      }

      // Parse stealthMode
      if (content.match(/stealthMode\s*:\s*true/)) {
        settings.stealthMode = true
        settings.stealthModeExplicit = true
      } else if (content.match(/stealthMode\s*:\s*false/)) {
        settings.stealthMode = false
        settings.stealthModeExplicit = true
      }

      // Parse allowDirectAgentExecution
      if (content.match(/allowDirectAgentExecution\s*:\s*true/)) {
        settings.allowDirectAgentExecution = true
        settings.allowDirectAgentExecutionExplicit = true
      } else if (content.match(/allowDirectAgentExecution\s*:\s*false/)) {
        settings.allowDirectAgentExecution = false
        settings.allowDirectAgentExecutionExplicit = true
      }

      break
    } catch {
      // Continue
    }
  }

  return settings
}

/**
 * Count components by scanning directories
 * Uses same patterns as Conductor's Vite plugins for consistency
 */
async function countComponents(): Promise<ComponentCounts> {
  const counts: ComponentCounts = {
    agents: { total: 0, custom: 0, builtIn: 0 },
    ensembles: 0,
    prompts: 0,
    schemas: 0,
    configs: 0,
    queries: 0,
    scripts: 0,
    templates: 0,
    docs: 0,
  }

  // Count agents - look for agent.yaml files recursively
  const agentDirs = ['agents', 'src/agents']
  for (const dir of agentDirs) {
    if (existsSync(dir)) {
      const agentFiles = await glob('**/agent.yaml', {
        cwd: dir,
        ignore: ['**/node_modules/**', '**/generate-docs/**'],
      })
      counts.agents.total += agentFiles.length
    }
  }
  counts.agents.custom = counts.agents.total

  // Count ensembles - YAML and TS files recursively
  const ensembleDirs = ['ensembles', 'src/ensembles']
  for (const dir of ensembleDirs) {
    if (existsSync(dir)) {
      const ensembleFiles = await glob('**/*.{yaml,yml}', {
        cwd: dir,
        ignore: ['**/node_modules/**'],
      })
      counts.ensembles += ensembleFiles.length
    }
  }

  // Count other components
  const componentDirs: [keyof ComponentCounts, string[]][] = [
    ['prompts', ['prompts', 'src/prompts']],
    ['schemas', ['schemas', 'src/schemas']],
    ['configs', ['configs', 'src/configs']],
    ['queries', ['queries', 'src/queries']],
    ['scripts', ['scripts', 'src/scripts']],
    ['templates', ['templates', 'src/templates']],
    ['docs', ['docs', 'src/docs']],
  ]

  for (const [key, dirs] of componentDirs) {
    if (key === 'agents' || key === 'ensembles') continue
    for (const dir of dirs) {
      if (existsSync(dir)) {
        const files = await glob('**/*', {
          cwd: dir,
          nodir: true,
          ignore: ['**/node_modules/**', '**/README.md'],
        })
        ;(counts[key] as number) += files.length
      }
    }
  }

  return counts
}

/**
 * Count triggers by parsing ensemble YAML files
 */
async function countTriggers(): Promise<TriggerCounts> {
  const counts: TriggerCounts = {
    http: 0,
    webhook: 0,
    mcp: 0,
    cron: 0,
    email: 0,
    queue: 0,
    startup: 0,
    cli: 0,
    build: 0,
  }

  const ensembleDirs = ['ensembles', 'src/ensembles']

  for (const dir of ensembleDirs) {
    if (!existsSync(dir)) continue

    const files = await glob('**/*.{yaml,yml}', {
      cwd: dir,
      ignore: ['**/node_modules/**'],
    })

    for (const file of files) {
      try {
        const content = await fs.readFile(path.join(dir, file), 'utf-8')

        // Count trigger types
        const httpMatches = content.match(/type:\s*['"]?http['"]?/g)
        if (httpMatches) counts.http += httpMatches.length

        const webhookMatches = content.match(/type:\s*['"]?webhook['"]?/g)
        if (webhookMatches) counts.webhook += webhookMatches.length

        const mcpMatches = content.match(/type:\s*['"]?mcp['"]?/g)
        if (mcpMatches) counts.mcp += mcpMatches.length

        const cronMatches = content.match(/type:\s*['"]?cron['"]?/g)
        if (cronMatches) counts.cron += cronMatches.length

        const emailMatches = content.match(/type:\s*['"]?email['"]?/g)
        if (emailMatches) counts.email += emailMatches.length

        const queueMatches = content.match(/type:\s*['"]?queue['"]?/g)
        if (queueMatches) counts.queue += queueMatches.length

        const startupMatches = content.match(/type:\s*['"]?startup['"]?/g)
        if (startupMatches) counts.startup += startupMatches.length

        const cliMatches = content.match(/type:\s*['"]?cli['"]?/g)
        if (cliMatches) counts.cli += cliMatches.length

        const buildMatches = content.match(/type:\s*['"]?build['"]?/g)
        if (buildMatches) counts.build += buildMatches.length
      } catch {
        // Skip files that can't be read
      }
    }
  }

  return counts
}

/**
 * Parse wrangler.toml for Cloudflare services
 */
async function parseCloudflareServices(): Promise<CloudflareServices> {
  const services: CloudflareServices = {
    workersAI: { configured: false },
    aiGateway: { configured: false },
    vectorize: { configured: false },
    kv: { configured: false },
    d1: { configured: false },
    r2: { configured: false },
    durableObjects: { configured: false },
    queues: { configured: false },
    hyperdrive: { configured: false },
    analyticsEngine: { configured: false },
  }

  if (!existsSync('wrangler.toml')) {
    return services
  }

  try {
    const content = await fs.readFile('wrangler.toml', 'utf-8')

    // Workers AI - [ai] section (not commented)
    if (content.match(/^(?!#)\s*\[ai\]/m)) {
      services.workersAI.configured = true
    }

    // KV Namespaces
    const kvMatches = content.matchAll(
      /^\[\[kv_namespaces\]\][\s\S]*?binding\s*=\s*["']([^"']+)["']/gm
    )
    const kvBindings: string[] = []
    for (const match of kvMatches) {
      kvBindings.push(match[1])
    }
    if (kvBindings.length > 0) {
      services.kv.configured = true
      services.kv.bindings = kvBindings
      services.kv.count = kvBindings.length
    }

    // D1 Databases
    const d1Matches = content.matchAll(
      /^\[\[d1_databases\]\][\s\S]*?binding\s*=\s*["']([^"']+)["']/gm
    )
    const d1Bindings: string[] = []
    for (const match of d1Matches) {
      d1Bindings.push(match[1])
    }
    if (d1Bindings.length > 0) {
      services.d1.configured = true
      services.d1.bindings = d1Bindings
    }

    // R2 Buckets
    const r2Matches = content.matchAll(
      /^\[\[r2_buckets\]\][\s\S]*?binding\s*=\s*["']([^"']+)["']/gm
    )
    const r2Bindings: string[] = []
    for (const match of r2Matches) {
      r2Bindings.push(match[1])
    }
    if (r2Bindings.length > 0) {
      services.r2.configured = true
      services.r2.bindings = r2Bindings
      services.r2.count = r2Bindings.length
    }

    // Durable Objects
    if (content.match(/^\[\[durable_objects\.bindings\]\]/m)) {
      services.durableObjects.configured = true
    }

    // Queues
    if (content.match(/^\[\[queues\.(producers|consumers)\]\]/m)) {
      services.queues.configured = true
    }

    // Hyperdrive
    if (content.match(/^\[\[hyperdrive\]\]/m)) {
      services.hyperdrive.configured = true
    }

    // Analytics Engine
    if (content.match(/^\[\[analytics_engine_datasets\]\]/m)) {
      services.analyticsEngine.configured = true
    }

    // Vectorize
    if (content.match(/^\[\[vectorize\]\]/m)) {
      services.vectorize.configured = true
    }

    // AI Gateway
    if (content.match(/ai_gateway/i)) {
      services.aiGateway.configured = true
    }
  } catch {
    // Ignore errors
  }

  return services
}

/**
 * Parse deployment settings
 */
async function parseDeploymentSettings(): Promise<DeploymentStatus> {
  const deployment: DeploymentStatus = {
    cloudEnabled: false,
    pulse: true,
  }

  // Check wrangler.toml for [ensemble.cloud]
  if (existsSync('wrangler.toml')) {
    try {
      const content = await fs.readFile('wrangler.toml', 'utf-8')
      if (content.match(/\[ensemble\.cloud\][\s\S]*?enabled\s*=\s*true/)) {
        deployment.cloudEnabled = true
      }
    } catch {
      // Ignore
    }
  }

  // Check conductor.config.ts for cloud settings
  const configFiles = ['conductor.config.ts', 'conductor.config.js']
  for (const configFile of configFiles) {
    if (!existsSync(configFile)) continue

    try {
      const content = await fs.readFile(configFile, 'utf-8')

      // Extract workerUrl
      const workerUrlMatch = content.match(/workerUrl\s*:\s*['"]([^'"]+)['"]/)
      if (workerUrlMatch) {
        deployment.workerUrl = workerUrlMatch[1]
      }

      // Check pulse setting
      if (content.match(/pulse\s*:\s*false/)) {
        deployment.pulse = false
      }

      break
    } catch {
      // Continue
    }
  }

  return deployment
}

/**
 * Parse plugins from conductor.config.ts
 */
async function parsePlugins(): Promise<string[]> {
  const plugins: string[] = []
  const configFiles = ['conductor.config.ts', 'conductor.config.js']

  for (const configFile of configFiles) {
    if (!existsSync(configFile)) continue

    try {
      const content = await fs.readFile(configFile, 'utf-8')

      const pluginPatterns = [
        /cloudflarePlugin/,
        /unkeyPlugin/,
        /payloadPlugin/,
        /plasmicPlugin/,
        /resendPlugin/,
        /twilioPlugin/,
        /stripePlugin/,
      ]

      for (const pattern of pluginPatterns) {
        if (pattern.test(content)) {
          const name = pattern.source.replace('Plugin', '')
          plugins.push(name)
        }
      }

      break
    } catch {
      // Continue
    }
  }

  return plugins
}

// ─────────────────────────────────────────────────────────────────────────────
// Display Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format security setting with explicit/default indicator
 */
function formatSecuritySetting(value: boolean, explicit: boolean, defaultValue: boolean): string {
  const icon = value ? chalk.green('✓') : chalk.dim('○')
  const valueStr = value ? 'true' : 'false'

  if (explicit) {
    return `${icon} ${valueStr}`
  } else {
    return `${icon} ${valueStr} ${chalk.dim('(default)')}`
  }
}

/**
 * Display status in full mode
 */
function displayFullStatus(status: ConductorStatusOutput): void {
  console.log('')
  console.log(chalk.bold.cyan('Conductor Status'))
  console.log(chalk.dim('─'.repeat(50)))
  console.log('')

  // Project section
  console.log(chalk.bold('Project'))
  console.log(`  Name:             ${chalk.cyan(status.project.name)}`)
  console.log(`  Version:          ${status.project.version}`)
  if (status.project.conductorVersion) {
    console.log(`  Conductor:        @ensemble-edge/conductor@${status.project.conductorVersion}`)
  }
  if (status.project.projectId) {
    console.log(`  Project ID:       ${chalk.dim(status.project.projectId)}`)
  }
  console.log(
    `  Environment:      ${chalk.cyan(status.environment)}${status.environment === 'development' ? chalk.dim(' (local)') : ''}`
  )
  console.log('')

  // Configuration section
  console.log(chalk.bold('Configuration'))
  console.log(
    `  conductor.config: ${status.config.conductorConfig ? chalk.green('✓ Found') : chalk.dim('○ Not found')}`
  )
  console.log(
    `  wrangler.toml:    ${status.config.wranglerConfig ? chalk.green('✓ Found') : chalk.dim('○ Not found')}`
  )
  console.log('')

  // Components section
  console.log(chalk.bold('Components'))
  const otherCount =
    status.components.prompts +
    status.components.schemas +
    status.components.configs +
    status.components.queries +
    status.components.scripts +
    status.components.templates +
    status.components.docs

  console.log(
    `  Agents:           ${status.components.agents.total}${status.components.agents.total > 0 ? chalk.dim(` (${status.components.agents.custom} custom)`) : ''}`
  )
  console.log(`  Ensembles:        ${status.components.ensembles}`)
  if (otherCount > 0) {
    const parts: string[] = []
    if (status.components.prompts > 0) parts.push(`${status.components.prompts} prompts`)
    if (status.components.schemas > 0) parts.push(`${status.components.schemas} schemas`)
    if (status.components.configs > 0) parts.push(`${status.components.configs} configs`)
    if (status.components.queries > 0) parts.push(`${status.components.queries} queries`)
    if (status.components.scripts > 0) parts.push(`${status.components.scripts} scripts`)
    if (status.components.templates > 0) parts.push(`${status.components.templates} templates`)
    if (status.components.docs > 0) parts.push(`${status.components.docs} docs`)
    console.log(`  Other:            ${otherCount} ${chalk.dim(`(${parts.join(', ')})`)}`)
  }
  console.log('')

  // Security section
  console.log(chalk.bold('Security'))
  console.log(
    `  requireAuth:      ${formatSecuritySetting(status.security.requireAuth, status.security.requireAuthExplicit, true)}`
  )
  console.log(
    `  stealthMode:      ${formatSecuritySetting(status.security.stealthMode, status.security.stealthModeExplicit, false)}`
  )
  console.log(
    `  allowDirectAgentExecution: ${formatSecuritySetting(status.security.allowDirectAgentExecution, status.security.allowDirectAgentExecutionExplicit, true)}`
  )
  console.log('')

  // Deployment section
  console.log(chalk.bold('Deployment'))
  if (status.deployment.workerUrl) {
    console.log(`  Worker URL:       ${chalk.cyan(status.deployment.workerUrl)}`)
  } else {
    console.log(`  Worker URL:       ${chalk.dim('Not configured')}`)
  }
  console.log(
    `  Ensemble Cloud:   ${status.deployment.cloudEnabled ? chalk.green('✓ Connected') : chalk.dim('○ Not connected')}`
  )
  console.log(
    `  Pulse:            ${status.deployment.pulse ? chalk.green('✓ Enabled') : chalk.dim('○ Disabled')}`
  )
  console.log('')

  console.log(chalk.dim('Docs: https://docs.ensemble.ai/conductor'))
  console.log('')
}

/**
 * Display status in compact mode
 */
function displayCompactStatus(status: ConductorStatusOutput): void {
  console.log('')
  console.log(chalk.bold.cyan('Conductor Status'))
  console.log('')
  console.log(`Project:     ${chalk.cyan(status.project.name)} v${status.project.version}`)
  if (status.project.projectId) {
    console.log(`Project ID:  ${chalk.dim(status.project.projectId)}`)
  }
  console.log(
    `Config:      ${status.config.conductorConfig ? chalk.green('✓') : chalk.dim('○')} conductor.config ${status.config.wranglerConfig ? chalk.green('✓') : chalk.dim('○')} wrangler.toml`
  )
  console.log(
    `Components:  ${status.components.agents.total} agents, ${status.components.ensembles} ensembles`
  )
  console.log(
    `Security:    requireAuth=${status.security.requireAuth} stealthMode=${status.security.stealthMode}`
  )
  console.log('')
}

// ─────────────────────────────────────────────────────────────────────────────
// Command
// ─────────────────────────────────────────────────────────────────────────────

export function createInfoCommand(): Command {
  const info = new Command('info')

  info
    .description('Show project info and component counts')
    .option('--json', 'Output as JSON (for programmatic access)')
    .option('--compact', 'Compact single-line format')
    .action(async (options: StatusOptions) => {
      try {
        // Check if we're in a Conductor project
        const configStatus = checkConfigFiles()
        if (!configStatus.conductorConfig && !configStatus.wranglerConfig) {
          if (options.json) {
            console.log(
              JSON.stringify({
                initialized: false,
                error: 'Not a Conductor project (no conductor.config.ts or wrangler.toml)',
              })
            )
            return
          }

          console.log('')
          console.log(chalk.yellow('Not a Conductor project'))
          console.log(chalk.dim('Run `conductor init` to create a new project'))
          console.log('')
          return
        }

        // Gather all status information
        const [
          project,
          environment,
          components,
          triggers,
          security,
          plugins,
          cloudflare,
          deployment,
        ] = await Promise.all([
          readProjectInfo(),
          detectEnvironment(),
          countComponents(),
          countTriggers(),
          parseSecuritySettings(),
          parsePlugins(),
          parseCloudflareServices(),
          parseDeploymentSettings(),
        ])

        const statusOutput: ConductorStatusOutput = {
          project,
          config: configStatus,
          environment,
          components,
          triggers,
          security,
          plugins,
          cloudflare,
          deployment,
        }

        // Output based on format
        if (options.json) {
          console.log(JSON.stringify(statusOutput, null, 2))
        } else if (options.compact) {
          displayCompactStatus(statusOutput)
        } else {
          displayFullStatus(statusOutput)
        }
      } catch (error) {
        if (options.json) {
          console.log(
            JSON.stringify({
              error: (error as Error).message,
            })
          )
          process.exit(1)
        }

        console.error(chalk.red('Error:'), (error as Error).message)
        process.exit(1)
      }
    })

  return info
}
