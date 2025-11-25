/**
 * Bundle Command - Export ensembles or agents with all dependencies
 *
 * Features:
 * - Bundles an ensemble with all referenced agents, prompts, and configs
 * - Bundles a standalone agent with its dependencies
 * - Creates a portable .tar.gz or .zip archive
 * - Includes manifest with metadata and dependency graph
 * - Supports dry-run to preview what will be bundled
 */

import { Command } from 'commander'
import chalk from 'chalk'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as YAML from 'yaml'
import { createWriteStream } from 'fs'
import archiver from 'archiver'
import { Parser } from '../../runtime/parser.js'

interface BundleManifest {
  version: string
  type: 'ensemble' | 'agent'
  name: string
  description?: string
  createdAt: string
  files: {
    path: string
    type: 'ensemble' | 'agent' | 'prompt' | 'config' | 'handler' | 'other'
    size: number
  }[]
  dependencies: {
    agents?: string[]
    prompts?: string[]
    handlers?: string[]
    configs?: string[]
  }
}

interface BundleOptions {
  output?: string
  format?: 'tar' | 'zip'
  dryRun?: boolean
  includeExamples?: boolean
  agentsDir?: string
  promptsDir?: string
  ensemblesDir?: string
}

interface FileToBundle {
  sourcePath: string
  bundlePath: string
  type: 'ensemble' | 'agent' | 'prompt' | 'config' | 'handler' | 'other'
}

/**
 * Resolve a path reference from YAML (e.g., ./prompts/system.md)
 */
function resolvePath(basePath: string, referencePath: string): string {
  if (path.isAbsolute(referencePath)) {
    return referencePath
  }
  return path.resolve(path.dirname(basePath), referencePath)
}

/**
 * Extract file references from an agent config
 */
function extractAgentDependencies(
  agentPath: string,
  agentConfig: Record<string, unknown>
): { prompts: string[]; handlers: string[]; configs: string[] } {
  const prompts: string[] = []
  const handlers: string[] = []
  const configs: string[] = []

  const config = agentConfig.config as Record<string, unknown> | undefined

  if (config) {
    // Check for prompt file references
    if (typeof config.systemPrompt === 'string' && config.systemPrompt.startsWith('./')) {
      prompts.push(resolvePath(agentPath, config.systemPrompt))
    }
    if (typeof config.promptFile === 'string') {
      prompts.push(resolvePath(agentPath, config.promptFile))
    }
    if (typeof config.prompt === 'string' && config.prompt.startsWith('./')) {
      prompts.push(resolvePath(agentPath, config.prompt))
    }

    // Check for handler file references
    if (typeof config.handler === 'string' && config.handler.startsWith('./')) {
      handlers.push(resolvePath(agentPath, config.handler))
    }
    if (typeof config.script === 'string' && config.script.startsWith('./')) {
      handlers.push(resolvePath(agentPath, config.script))
    }

    // Check for config file references
    if (typeof config.configFile === 'string') {
      configs.push(resolvePath(agentPath, config.configFile))
    }
  }

  // Check for template references
  if (typeof agentConfig.template === 'string' && agentConfig.template.startsWith('./')) {
    prompts.push(resolvePath(agentPath, agentConfig.template))
  }

  return { prompts, handlers, configs }
}

/**
 * Find agent file by name in agents directory
 * Supports both YAML (.yaml, .yml) and TypeScript (.ts) agent files
 */
async function findAgentFile(agentName: string, agentsDir: string): Promise<string | null> {
  const extensions = ['.yaml', '.yml', '.ts']

  for (const ext of extensions) {
    // Try direct name match
    const directPath = path.join(agentsDir, `${agentName}${ext}`)
    try {
      await fs.access(directPath)
      return directPath
    } catch {
      // Try in subdirectory with agent.yaml/agent.ts pattern
      const subPath = path.join(agentsDir, agentName, `agent${ext}`)
      try {
        await fs.access(subPath)
        return subPath
      } catch {
        // Try in subdirectory with agentName pattern
        const subPath2 = path.join(agentsDir, agentName, `${agentName}${ext}`)
        try {
          await fs.access(subPath2)
          return subPath2
        } catch {
          // Continue searching
        }
      }
    }
  }

  return null
}

/**
 * Bundle an ensemble with all its dependencies
 */
async function bundleEnsemble(
  ensemblePath: string,
  options: BundleOptions
): Promise<{ files: FileToBundle[]; manifest: BundleManifest }> {
  const files: FileToBundle[] = []
  const agentNames: string[] = []
  const promptFiles: string[] = []
  const handlerFiles: string[] = []
  const configFiles: string[] = []

  // Read and parse ensemble
  const ensembleContent = await fs.readFile(ensemblePath, 'utf-8')
  const ensembleConfig = YAML.parse(ensembleContent, {
    mapAsMap: false,
    logLevel: 'silent',
  }) as Record<string, unknown>

  // Validate ensemble
  const parsedEnsemble = Parser.parseEnsemble(ensembleContent)

  const ensembleName = parsedEnsemble.name
  const agentsDir = path.resolve(process.cwd(), options.agentsDir || 'agents')

  // Add ensemble file
  files.push({
    sourcePath: ensemblePath,
    bundlePath: `ensembles/${path.basename(ensemblePath)}`,
    type: 'ensemble',
  })

  // Extract agent references from flow
  const flow = ensembleConfig.flow as Array<Record<string, unknown>> | undefined
  if (flow) {
    for (const step of flow) {
      if (typeof step.agent === 'string' && !agentNames.includes(step.agent)) {
        agentNames.push(step.agent)
      }
      // Handle nested steps in parallel, branch, etc.
      extractNestedAgents(step, agentNames)
    }
  }

  // Handle inline agents
  const inlineAgents = ensembleConfig.agents as Array<Record<string, unknown>> | undefined
  if (inlineAgents) {
    for (const agent of inlineAgents) {
      if (typeof agent.name === 'string') {
        // Inline agent - extract its dependencies
        const deps = extractAgentDependencies(ensemblePath, agent)
        promptFiles.push(...deps.prompts)
        handlerFiles.push(...deps.handlers)
        configFiles.push(...deps.configs)
      }
    }
  }

  // Find and bundle referenced agents
  for (const agentName of agentNames) {
    const agentPath = await findAgentFile(agentName, agentsDir)
    if (agentPath) {
      files.push({
        sourcePath: agentPath,
        bundlePath: `agents/${path.basename(agentPath)}`,
        type: 'agent',
      })

      // Parse agent and extract its dependencies
      const agentContent = await fs.readFile(agentPath, 'utf-8')
      const agentConfig = YAML.parse(agentContent, {
        mapAsMap: false,
        logLevel: 'silent',
      }) as Record<string, unknown>
      const deps = extractAgentDependencies(agentPath, agentConfig)
      promptFiles.push(...deps.prompts)
      handlerFiles.push(...deps.handlers)
      configFiles.push(...deps.configs)
    }
  }

  // Add prompt files
  for (const promptPath of [...new Set(promptFiles)]) {
    try {
      await fs.access(promptPath)
      files.push({
        sourcePath: promptPath,
        bundlePath: `prompts/${path.basename(promptPath)}`,
        type: 'prompt',
      })
    } catch {
      // Prompt file doesn't exist, skip
    }
  }

  // Add handler files
  for (const handlerPath of [...new Set(handlerFiles)]) {
    try {
      await fs.access(handlerPath)
      files.push({
        sourcePath: handlerPath,
        bundlePath: `handlers/${path.basename(handlerPath)}`,
        type: 'handler',
      })
    } catch {
      // Handler file doesn't exist, skip
    }
  }

  // Add config files
  for (const configPath of [...new Set(configFiles)]) {
    try {
      await fs.access(configPath)
      files.push({
        sourcePath: configPath,
        bundlePath: `configs/${path.basename(configPath)}`,
        type: 'config',
      })
    } catch {
      // Config file doesn't exist, skip
    }
  }

  // Create manifest
  const manifest: BundleManifest = {
    version: '1.0.0',
    type: 'ensemble',
    name: ensembleName,
    description: parsedEnsemble.description,
    createdAt: new Date().toISOString(),
    files: await Promise.all(
      files.map(async (f) => {
        const stats = await fs.stat(f.sourcePath)
        return {
          path: f.bundlePath,
          type: f.type,
          size: stats.size,
        }
      })
    ),
    dependencies: {
      agents: agentNames,
      prompts: promptFiles.map((p) => path.basename(p)),
      handlers: handlerFiles.map((h) => path.basename(h)),
      configs: configFiles.map((c) => path.basename(c)),
    },
  }

  return { files, manifest }
}

/**
 * Extract agent names from nested flow steps
 */
function extractNestedAgents(step: Record<string, unknown>, agentNames: string[]): void {
  // Parallel steps
  if (Array.isArray(step.steps)) {
    for (const nestedStep of step.steps as Array<Record<string, unknown>>) {
      if (typeof nestedStep.agent === 'string' && !agentNames.includes(nestedStep.agent)) {
        agentNames.push(nestedStep.agent)
      }
      extractNestedAgents(nestedStep, agentNames)
    }
  }

  // Branch then/else
  if (Array.isArray(step.then)) {
    for (const nestedStep of step.then as Array<Record<string, unknown>>) {
      if (typeof nestedStep.agent === 'string' && !agentNames.includes(nestedStep.agent)) {
        agentNames.push(nestedStep.agent)
      }
      extractNestedAgents(nestedStep, agentNames)
    }
  }
  if (Array.isArray(step.else)) {
    for (const nestedStep of step.else as Array<Record<string, unknown>>) {
      if (typeof nestedStep.agent === 'string' && !agentNames.includes(nestedStep.agent)) {
        agentNames.push(nestedStep.agent)
      }
      extractNestedAgents(nestedStep, agentNames)
    }
  }

  // Try/catch/finally
  if (Array.isArray(step.catch)) {
    for (const nestedStep of step.catch as Array<Record<string, unknown>>) {
      if (typeof nestedStep.agent === 'string' && !agentNames.includes(nestedStep.agent)) {
        agentNames.push(nestedStep.agent)
      }
      extractNestedAgents(nestedStep, agentNames)
    }
  }
  if (Array.isArray(step.finally)) {
    for (const nestedStep of step.finally as Array<Record<string, unknown>>) {
      if (typeof nestedStep.agent === 'string' && !agentNames.includes(nestedStep.agent)) {
        agentNames.push(nestedStep.agent)
      }
      extractNestedAgents(nestedStep, agentNames)
    }
  }

  // Switch cases
  if (step.cases && typeof step.cases === 'object') {
    for (const caseSteps of Object.values(step.cases) as Array<Array<Record<string, unknown>>>) {
      if (Array.isArray(caseSteps)) {
        for (const nestedStep of caseSteps) {
          if (typeof nestedStep.agent === 'string' && !agentNames.includes(nestedStep.agent)) {
            agentNames.push(nestedStep.agent)
          }
          extractNestedAgents(nestedStep, agentNames)
        }
      }
    }
  }
  if (Array.isArray(step.default)) {
    for (const nestedStep of step.default as Array<Record<string, unknown>>) {
      if (typeof nestedStep.agent === 'string' && !agentNames.includes(nestedStep.agent)) {
        agentNames.push(nestedStep.agent)
      }
      extractNestedAgents(nestedStep, agentNames)
    }
  }

  // Foreach/map-reduce step
  if (step.step && typeof step.step === 'object') {
    const nestedStep = step.step as Record<string, unknown>
    if (typeof nestedStep.agent === 'string' && !agentNames.includes(nestedStep.agent)) {
      agentNames.push(nestedStep.agent)
    }
    extractNestedAgents(nestedStep, agentNames)
  }
  if (step.map && typeof step.map === 'object') {
    const nestedStep = step.map as Record<string, unknown>
    if (typeof nestedStep.agent === 'string' && !agentNames.includes(nestedStep.agent)) {
      agentNames.push(nestedStep.agent)
    }
  }
  if (step.reduce && typeof step.reduce === 'object') {
    const nestedStep = step.reduce as Record<string, unknown>
    if (typeof nestedStep.agent === 'string' && !agentNames.includes(nestedStep.agent)) {
      agentNames.push(nestedStep.agent)
    }
  }
}

/**
 * Bundle a standalone agent with its dependencies
 */
async function bundleAgent(
  agentPath: string,
  _options: BundleOptions
): Promise<{ files: FileToBundle[]; manifest: BundleManifest }> {
  const files: FileToBundle[] = []

  // Read and parse agent
  const agentContent = await fs.readFile(agentPath, 'utf-8')
  const agentConfig = YAML.parse(agentContent, { mapAsMap: false, logLevel: 'silent' }) as Record<
    string,
    unknown
  >

  // Validate agent
  const parsedAgent = Parser.parseAgent(agentContent)

  const agentName = parsedAgent.name

  // Add agent file
  files.push({
    sourcePath: agentPath,
    bundlePath: `agents/${path.basename(agentPath)}`,
    type: 'agent',
  })

  // Extract dependencies
  const deps = extractAgentDependencies(agentPath, agentConfig)

  // Add prompt files
  for (const promptPath of [...new Set(deps.prompts)]) {
    try {
      await fs.access(promptPath)
      files.push({
        sourcePath: promptPath,
        bundlePath: `prompts/${path.basename(promptPath)}`,
        type: 'prompt',
      })
    } catch {
      // Prompt file doesn't exist, skip
    }
  }

  // Add handler files
  for (const handlerPath of [...new Set(deps.handlers)]) {
    try {
      await fs.access(handlerPath)
      files.push({
        sourcePath: handlerPath,
        bundlePath: `handlers/${path.basename(handlerPath)}`,
        type: 'handler',
      })
    } catch {
      // Handler file doesn't exist, skip
    }
  }

  // Add config files
  for (const configPath of [...new Set(deps.configs)]) {
    try {
      await fs.access(configPath)
      files.push({
        sourcePath: configPath,
        bundlePath: `configs/${path.basename(configPath)}`,
        type: 'config',
      })
    } catch {
      // Config file doesn't exist, skip
    }
  }

  // Create manifest
  const manifest: BundleManifest = {
    version: '1.0.0',
    type: 'agent',
    name: agentName,
    description: parsedAgent.description,
    createdAt: new Date().toISOString(),
    files: await Promise.all(
      files.map(async (f) => {
        const stats = await fs.stat(f.sourcePath)
        return {
          path: f.bundlePath,
          type: f.type,
          size: stats.size,
        }
      })
    ),
    dependencies: {
      prompts: deps.prompts.map((p) => path.basename(p)),
      handlers: deps.handlers.map((h) => path.basename(h)),
      configs: deps.configs.map((c) => path.basename(c)),
    },
  }

  return { files, manifest }
}

/**
 * Create the bundle archive
 */
async function createArchive(
  files: FileToBundle[],
  manifest: BundleManifest,
  outputPath: string,
  format: 'tar' | 'zip'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath)
    const archive = archiver(format === 'tar' ? 'tar' : 'zip', {
      gzip: format === 'tar',
      zlib: { level: 9 },
    })

    output.on('close', () => resolve())
    archive.on('error', reject)

    archive.pipe(output)

    // Add manifest
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' })

    // Add all files
    for (const file of files) {
      archive.file(file.sourcePath, { name: file.bundlePath })
    }

    archive.finalize()
  })
}

export function createBundleCommand(): Command {
  const bundle = new Command('bundle')

  bundle
    .description('Bundle an ensemble or agent with all dependencies')
    .argument('<path>', 'Path to ensemble or agent YAML file')
    .option('-o, --output <path>', 'Output file path (default: <name>.bundle.tar.gz)')
    .option('--format <format>', 'Archive format: tar or zip', 'tar')
    .option('--dry-run', 'Preview what would be bundled without creating archive')
    .option('--agents-dir <dir>', 'Agents directory', 'agents')
    .option('--prompts-dir <dir>', 'Prompts directory', 'prompts')
    .option('--ensembles-dir <dir>', 'Ensembles directory', 'ensembles')
    .action(async (inputPath: string, options: BundleOptions) => {
      try {
        const resolvedPath = path.resolve(process.cwd(), inputPath)

        // Check if file exists
        try {
          await fs.access(resolvedPath)
        } catch {
          console.error(chalk.red('Error:'), `File not found: ${inputPath}`)
          process.exit(1)
        }

        // Read file to determine type
        const content = await fs.readFile(resolvedPath, 'utf-8')
        const parsed = YAML.parse(content, { mapAsMap: false, logLevel: 'silent' }) as Record<
          string,
          unknown
        >

        // Determine if it's an ensemble or agent
        const isEnsemble = 'flow' in parsed || 'agents' in parsed || 'trigger' in parsed
        const isAgent = 'operation' in parsed

        if (!isEnsemble && !isAgent) {
          console.error(
            chalk.red('Error:'),
            'File does not appear to be a valid ensemble or agent YAML'
          )
          process.exit(1)
        }

        console.log('')
        console.log(
          chalk.bold(`Bundling ${isEnsemble ? 'ensemble' : 'agent'}: ${parsed.name || 'unknown'}`)
        )
        console.log(chalk.dim('─'.repeat(50)))

        // Bundle based on type
        const { files, manifest } = isEnsemble
          ? await bundleEnsemble(resolvedPath, options)
          : await bundleAgent(resolvedPath, options)

        // Display what will be bundled
        console.log('')
        console.log(chalk.bold('Files to bundle:'))
        for (const file of files) {
          const typeIcon = {
            ensemble: '📦',
            agent: '🤖',
            prompt: '📝',
            handler: '⚙️',
            config: '🔧',
            other: '📄',
          }[file.type]
          console.log(`  ${typeIcon} ${file.bundlePath}`)
          console.log(chalk.dim(`     ← ${path.relative(process.cwd(), file.sourcePath)}`))
        }

        // Display dependencies
        console.log('')
        console.log(chalk.bold('Dependencies:'))
        if (manifest.dependencies.agents?.length) {
          console.log(`  Agents: ${manifest.dependencies.agents.join(', ')}`)
        }
        if (manifest.dependencies.prompts?.length) {
          console.log(`  Prompts: ${manifest.dependencies.prompts.join(', ')}`)
        }
        if (manifest.dependencies.handlers?.length) {
          console.log(`  Handlers: ${manifest.dependencies.handlers.join(', ')}`)
        }
        if (manifest.dependencies.configs?.length) {
          console.log(`  Configs: ${manifest.dependencies.configs.join(', ')}`)
        }
        if (
          !manifest.dependencies.agents?.length &&
          !manifest.dependencies.prompts?.length &&
          !manifest.dependencies.handlers?.length &&
          !manifest.dependencies.configs?.length
        ) {
          console.log(chalk.dim('  (no external dependencies)'))
        }

        if (options.dryRun) {
          console.log('')
          console.log(chalk.yellow('Dry run - no archive created'))
          console.log('')
          return
        }

        // Create output path
        const ext = options.format === 'tar' ? '.tar.gz' : '.zip'
        const outputPath =
          options.output || path.join(process.cwd(), `${manifest.name}.bundle${ext}`)

        // Create archive
        console.log('')
        console.log(chalk.dim('Creating archive...'))
        await createArchive(files, manifest, outputPath, options.format || 'tar')

        const stats = await fs.stat(outputPath)
        const sizeKB = (stats.size / 1024).toFixed(1)

        console.log('')
        console.log(chalk.green('✓'), `Bundle created: ${path.relative(process.cwd(), outputPath)}`)
        console.log(chalk.dim(`  Size: ${sizeKB} KB`))
        console.log(chalk.dim(`  Files: ${files.length}`))
        console.log('')
        console.log(chalk.dim('To import this bundle:'))
        console.log(chalk.dim(`  conductor import ${path.basename(outputPath)}`))
        console.log('')
      } catch (error) {
        console.error(chalk.red('Error:'), (error as Error).message)
        process.exit(1)
      }
    })

  return bundle
}
