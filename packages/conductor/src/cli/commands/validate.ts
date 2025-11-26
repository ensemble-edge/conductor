/**
 * Validate Command - Validate and auto-fix YAML and TypeScript ensembles and agents
 *
 * Features:
 * - Validates ensemble and agent YAML files against schemas
 * - Validates TypeScript ensemble and agent files by importing them
 * - Reports detailed errors with file locations
 * - Suggests fixes for common issues
 * - Auto-fixes errors with --fix flag
 */

import { Command } from 'commander'
import chalk from 'chalk'
import * as fs from 'fs/promises'
import * as path from 'path'
import { glob } from 'glob'
import * as YAML from 'yaml'
import { Parser } from '../../runtime/parser.js'
import { z } from 'zod'
import { isEnsemble, type Ensemble } from '../../primitives/ensemble.js'
import { pathToFileURL } from 'url'

interface ValidationError {
  file: string
  line?: number
  column?: number
  message: string
  severity: 'error' | 'warning'
  fixable: boolean
  fix?: () => Promise<void>
  suggestion?: string
}

interface ValidationResult {
  file: string
  valid: boolean
  errors: ValidationError[]
  fixed: boolean
}

interface ValidateOptions {
  fix?: boolean
  quiet?: boolean
  format?: 'text' | 'json'
  ensemblesDir?: string
  agentsDir?: string
}

/**
 * Agent-specific config properties that should be nested under config:
 * If these appear at root level of an agent definition, it's an error
 */
const AGENT_CONFIG_PROPERTIES: Record<string, string[]> = {
  html: ['template', 'renderOptions', 'cookieSecret', 'defaultCookieOptions'],
  queue: ['queue', 'mode', 'deliveryMode', 'consumer', 'retry', 'dlq', 'contentType'],
  form: ['fields', 'submitUrl', 'method', 'validation', 'submitButton', 'resetButton'],
  pdf: ['template', 'renderOptions', 'puppeteer', 'pageOptions'],
  docs: ['source', 'format', 'outputPath', 'title', 'toc', 'theme'],
  email: ['provider', 'rateLimit', 'retries', 'batchSize'],
  sms: ['provider', 'rateLimit', 'retries'],
  storage: ['backend', 'operation', 'binding', 'prefix'],
  data: ['source', 'transform', 'output'],
  scoring: ['criteria', 'weights', 'threshold'],
}

/**
 * Check if an inline agent config has flat properties that should be nested
 * Returns list of properties that are incorrectly at root level
 */
function detectFlatConfigProperties(agent: Record<string, unknown>, operation: string): string[] {
  const configProps = AGENT_CONFIG_PROPERTIES[operation]
  if (!configProps) return []

  const flatProps: string[] = []
  for (const prop of configProps) {
    // If property exists at root level and agent doesn't have config: wrapper, it's wrong
    if (prop in agent && !agent.config) {
      flatProps.push(prop)
    }
    // Also check if property exists at root AND in config (duplicate)
    if (
      prop in agent &&
      agent.config &&
      typeof agent.config === 'object' &&
      prop in (agent.config as Record<string, unknown>)
    ) {
      flatProps.push(`${prop} (duplicated in root and config)`)
    }
  }

  return flatProps
}

/**
 * Auto-fix functions for common issues
 */
const autoFixes = {
  /**
   * Fix output: $agent-name to output: { result: ${agent-name.output} }
   */
  async fixOutputSyntax(filePath: string, content: string, agentName: string): Promise<string> {
    const pattern = new RegExp(`^output:\\s*\\$${agentName}\\s*$`, 'm')
    return content.replace(pattern, `output:\n  result: \${${agentName}.output}`)
  },

  /**
   * Fix inputs: to input: (schema field name)
   */
  async fixInputsToInput(content: string): Promise<string> {
    // Replace top-level inputs: with input:
    return content.replace(/^inputs:/gm, 'input:')
  },

  /**
   * Fix outputs: to output: (schema field name)
   */
  async fixOutputsToOutput(content: string): Promise<string> {
    return content.replace(/^outputs:/gm, 'output:')
  },

  /**
   * Add missing flow field for ensembles with agents but no flow
   */
  async addMissingFlow(content: string, agentNames: string[]): Promise<string> {
    // Check if flow already exists
    if (/^flow:/m.test(content)) {
      return content
    }

    // Generate flow from agent names
    const flowYaml = agentNames.map((name) => `  - agent: ${name}`).join('\n')

    // Find position after agents section or at end
    const agentsMatch = content.match(/^agents:[\s\S]*?(?=^[a-z]|\Z)/m)
    if (agentsMatch) {
      const insertPos = (agentsMatch.index || 0) + agentsMatch[0].length
      return content.slice(0, insertPos) + `\nflow:\n${flowYaml}\n` + content.slice(insertPos)
    }

    // Append at end
    return content + `\nflow:\n${flowYaml}\n`
  },

  /**
   * Fix YAML indentation issues
   */
  async fixIndentation(content: string): Promise<string> {
    // Parse and re-serialize to fix indentation
    try {
      const parsed = YAML.parse(content, { mapAsMap: false, logLevel: 'silent' })
      return YAML.stringify(parsed, { indent: 2 })
    } catch {
      return content // Can't fix if can't parse
    }
  },

  /**
   * Fix unquoted Handlebars expressions that YAML interprets as flow mappings
   * e.g., `title: {{title}}` becomes `title: "{{title}}"`
   */
  async fixUnquotedHandlebars(content: string): Promise<string> {
    // Match lines like `key: {{value}}` where the Handlebars is not quoted
    // This pattern finds: word: {{something}} (not already quoted)
    return content.replace(/^(\s*)(\w+):\s+({{[^}]+}})\s*$/gm, '$1$2: "$3"')
  },
}

/**
 * Validate a single ensemble file
 */
async function validateEnsemble(
  filePath: string,
  options: ValidateOptions
): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  let content: string
  let fixed = false

  try {
    content = await fs.readFile(filePath, 'utf-8')
  } catch (error) {
    return {
      file: filePath,
      valid: false,
      errors: [
        {
          file: filePath,
          message: `Cannot read file: ${(error as Error).message}`,
          severity: 'error',
          fixable: false,
        },
      ],
      fixed: false,
    }
  }

  // Check for YAML syntax errors first
  try {
    YAML.parse(content, { mapAsMap: false, logLevel: 'silent' })
  } catch (error) {
    const yamlError = error as YAML.YAMLParseError
    return {
      file: filePath,
      valid: false,
      errors: [
        {
          file: filePath,
          line: yamlError.linePos?.[0]?.line,
          column: yamlError.linePos?.[0]?.col,
          message: `YAML syntax error: ${yamlError.message}`,
          severity: 'error',
          fixable: false,
          suggestion: 'Check YAML indentation and syntax',
        },
      ],
      fixed: false,
    }
  }

  // Check for common fixable issues before schema validation
  let modifiedContent = content

  // Check for inputs: instead of input:
  if (/^inputs:/m.test(content)) {
    errors.push({
      file: filePath,
      message: 'Found "inputs:" - should be "input:"',
      severity: 'warning',
      fixable: true,
      suggestion: 'Rename "inputs:" to "input:"',
    })

    if (options.fix) {
      modifiedContent = await autoFixes.fixInputsToInput(modifiedContent)
      fixed = true
    }
  }

  // Check for outputs: instead of output:
  if (/^outputs:/m.test(content)) {
    errors.push({
      file: filePath,
      message: 'Found "outputs:" - should be "output:"',
      severity: 'warning',
      fixable: true,
      suggestion: 'Rename "outputs:" to "output:"',
    })

    if (options.fix) {
      modifiedContent = await autoFixes.fixOutputsToOutput(modifiedContent)
      fixed = true
    }
  }

  // Check for old-style output: $agent-name syntax
  const outputMatch = content.match(/^output:\s*\$([a-zA-Z0-9_-]+)\s*$/m)
  if (outputMatch) {
    const agentName = outputMatch[1]
    errors.push({
      file: filePath,
      message: `Invalid output syntax: "output: $${agentName}" - must be an object`,
      severity: 'error',
      fixable: true,
      suggestion: `Change to:\noutput:\n  result: \${${agentName}.output}`,
    })

    if (options.fix) {
      modifiedContent = await autoFixes.fixOutputSyntax(filePath, modifiedContent, agentName)
      fixed = true
    }
  }

  // Check for unquoted Handlebars expressions (e.g., title: {{title}})
  // YAML interprets {{...}} as a flow mapping, causing parse warnings
  // Only check actual YAML key-value pairs, not content inside multi-line strings
  const lines = content.split('\n')
  let inMultilineString = false
  let multilineIndent = 0
  const unquotedHandlebarsLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Check if we're entering a multi-line string block (template: |, code: |, etc.)
    if (/^\w+:\s*[|>]/.test(trimmed)) {
      inMultilineString = true
      multilineIndent = line.search(/\S/)
      continue
    }

    // Check if we're exiting a multi-line string block
    if (inMultilineString) {
      const currentIndent = line.search(/\S/)
      if (currentIndent !== -1 && currentIndent <= multilineIndent && trimmed !== '') {
        inMultilineString = false
      } else {
        continue // Skip lines inside multi-line strings
      }
    }

    // Check for unquoted Handlebars in actual YAML key-value pairs
    if (/^\s*\w+:\s+{{[^}]+}}\s*$/.test(line) && !line.includes('"') && !line.includes("'")) {
      unquotedHandlebarsLines.push(trimmed)
    }
  }

  if (unquotedHandlebarsLines.length > 0) {
    for (const match of unquotedHandlebarsLines) {
      errors.push({
        file: filePath,
        message: `Unquoted Handlebars expression: "${match}" - YAML interprets {{}} as a flow mapping`,
        severity: 'warning',
        fixable: true,
        suggestion: 'Quote Handlebars expressions: title: "{{title}}"',
      })
    }

    if (options.fix) {
      modifiedContent = await autoFixes.fixUnquotedHandlebars(modifiedContent)
      fixed = true
    }
  }

  // Write fixed content if changes were made
  if (fixed && modifiedContent !== content) {
    await fs.writeFile(filePath, modifiedContent, 'utf-8')
    content = modifiedContent
  }

  // Check for inline code in code operation agents (not supported in Cloudflare Workers)
  const parsed = YAML.parse(modifiedContent, { mapAsMap: false, logLevel: 'silent' })
  if (parsed.agents && Array.isArray(parsed.agents)) {
    for (const agent of parsed.agents) {
      // Check for flat config pattern (agent-specific properties at root level instead of nested in config:)
      if (agent.operation && typeof agent.operation === 'string') {
        const flatProps = detectFlatConfigProperties(agent, agent.operation)
        if (flatProps.length > 0) {
          const propsStr = flatProps.join(', ')
          errors.push({
            file: filePath,
            message: `Agent "${agent.name || 'unnamed'}": Found flat config properties at root level: ${propsStr}. These should be nested under "config:".`,
            severity: 'error',
            fixable: false,
            suggestion: `Move operation-specific properties under "config:":\n\nagents:\n  - name: ${agent.name || 'my-agent'}\n    operation: ${agent.operation}\n    config:\n      ${flatProps[0]}: ... # Move properties here`,
          })
        }
      }

      if (agent.operation === 'code' && agent.config) {
        // Check for inline code (not allowed)
        if (typeof agent.config.code === 'string') {
          errors.push({
            file: filePath,
            message: `Agent "${agent.name}": Inline code is not supported in Cloudflare Workers. Use config.script instead.`,
            severity: 'error',
            fixable: false,
            suggestion: `Move the inline code to a script file (e.g., scripts/${agent.name}.ts) and reference it with:\n  config:\n    script: scripts/${agent.name}`,
          })
        }

        // Check for function reference (not allowed)
        if (typeof agent.config.function === 'string') {
          errors.push({
            file: filePath,
            message: `Agent "${agent.name}": config.function is deprecated. Use config.script instead.`,
            severity: 'error',
            fixable: false,
            suggestion: `Replace config.function with config.script pointing to a bundled script file`,
          })
        }

        // Check that script is provided (required for code operations)
        if (!agent.config.code && !agent.config.script && !agent.config.handler) {
          errors.push({
            file: filePath,
            message: `Agent "${agent.name}": Code operation requires config.script to reference a bundled script`,
            severity: 'error',
            fixable: false,
            suggestion: `Add config.script with a reference to your script:\n  config:\n    script: scripts/your-script`,
          })
        }
      }
    }
  }

  // Now validate against schema
  try {
    Parser.parseEnsemble(content)
  } catch (error) {
    const errorMessage = (error as Error).message

    // Parse Zod validation errors for better messages
    if (error instanceof z.ZodError) {
      for (const issue of error.issues) {
        errors.push({
          file: filePath,
          message: `${issue.path.join('.')}: ${issue.message}`,
          severity: 'error',
          fixable: false,
        })
      }
    } else {
      errors.push({
        file: filePath,
        message: errorMessage,
        severity: 'error',
        fixable: false,
      })
    }
  }

  return {
    file: filePath,
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
    fixed,
  }
}

/**
 * Validate a single agent file
 */
async function validateAgent(
  filePath: string,
  options: ValidateOptions
): Promise<ValidationResult> {
  const errors: ValidationError[] = []

  let content: string
  try {
    content = await fs.readFile(filePath, 'utf-8')
  } catch (error) {
    return {
      file: filePath,
      valid: false,
      errors: [
        {
          file: filePath,
          message: `Cannot read file: ${(error as Error).message}`,
          severity: 'error',
          fixable: false,
        },
      ],
      fixed: false,
    }
  }

  // Check for YAML syntax errors
  let parsed: Record<string, unknown>
  try {
    parsed = YAML.parse(content, { mapAsMap: false, logLevel: 'silent' })
  } catch (error) {
    const yamlError = error as YAML.YAMLParseError
    return {
      file: filePath,
      valid: false,
      errors: [
        {
          file: filePath,
          line: yamlError.linePos?.[0]?.line,
          column: yamlError.linePos?.[0]?.col,
          message: `YAML syntax error: ${yamlError.message}`,
          severity: 'error',
          fixable: false,
        },
      ],
      fixed: false,
    }
  }

  // Check for flat config pattern (agent-specific properties at root level instead of nested in config:)
  if (parsed.operation && typeof parsed.operation === 'string') {
    const flatProps = detectFlatConfigProperties(parsed, parsed.operation)
    if (flatProps.length > 0) {
      const propsStr = flatProps.join(', ')
      errors.push({
        file: filePath,
        message: `Found flat config properties at root level: ${propsStr}. These should be nested under "config:".`,
        severity: 'error',
        fixable: false,
        suggestion: `Move operation-specific properties under "config:":\n\nname: ${parsed.name || 'my-agent'}\noperation: ${parsed.operation}\nconfig:\n  ${flatProps[0]}: ... # Move properties here`,
      })
    }
  }

  // Validate against schema
  try {
    Parser.parseAgent(content)
  } catch (error) {
    const errorMessage = (error as Error).message

    if (error instanceof z.ZodError) {
      for (const issue of error.issues) {
        errors.push({
          file: filePath,
          message: `${issue.path.join('.')}: ${issue.message}`,
          severity: 'error',
          fixable: false,
        })
      }
    } else {
      errors.push({
        file: filePath,
        message: errorMessage,
        severity: 'error',
        fixable: false,
      })
    }
  }

  return {
    file: filePath,
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
    fixed: false,
  }
}

/**
 * Validate a TypeScript ensemble file
 *
 * TypeScript ensembles are validated by dynamically importing them
 * and checking that they export a valid Ensemble instance.
 */
async function validateTypeScriptEnsemble(
  filePath: string,
  _options: ValidateOptions
): Promise<ValidationResult> {
  const errors: ValidationError[] = []

  try {
    // Check file exists
    await fs.access(filePath)
  } catch (error) {
    return {
      file: filePath,
      valid: false,
      errors: [
        {
          file: filePath,
          message: `Cannot read file: ${(error as Error).message}`,
          severity: 'error',
          fixable: false,
        },
      ],
      fixed: false,
    }
  }

  try {
    // Dynamically import the TypeScript file
    // Use pathToFileURL to handle Windows paths and special characters
    const fileUrl = pathToFileURL(filePath).href
    const module = await import(fileUrl)

    // Check for default export
    if (!module.default) {
      errors.push({
        file: filePath,
        message: 'TypeScript ensemble must have a default export',
        severity: 'error',
        fixable: false,
        suggestion: 'Add "export default createEnsemble({ ... })" to your file',
      })
      return {
        file: filePath,
        valid: false,
        errors,
        fixed: false,
      }
    }

    const exported = module.default

    // Check if it's a valid Ensemble instance
    if (!isEnsemble(exported)) {
      // Check if it looks like a config object that should be wrapped
      if (typeof exported === 'object' && exported !== null && 'name' in exported) {
        errors.push({
          file: filePath,
          message: 'Default export is a config object, not an Ensemble instance',
          severity: 'error',
          fixable: false,
          suggestion:
            'Wrap your config with createEnsemble(): export default createEnsemble({ ... })',
        })
      } else {
        errors.push({
          file: filePath,
          message: `Default export is not a valid Ensemble (got ${typeof exported})`,
          severity: 'error',
          fixable: false,
          suggestion:
            'Use createEnsemble() to create your ensemble: export default createEnsemble({ ... })',
        })
      }
      return {
        file: filePath,
        valid: false,
        errors,
        fixed: false,
      }
    }

    // Validate the ensemble has required fields
    const ensemble = exported as Ensemble

    if (!ensemble.name) {
      errors.push({
        file: filePath,
        message: 'Ensemble is missing required "name" field',
        severity: 'error',
        fixable: false,
      })
    }

    // Check for steps - either static steps (via .flow getter) or dynamic (via isDynamic flag)
    const hasStaticSteps = ensemble.flow && ensemble.flow.length > 0
    const hasDynamicSteps = ensemble.isDynamic

    if (!hasStaticSteps && !hasDynamicSteps) {
      errors.push({
        file: filePath,
        message: 'Ensemble has no steps defined',
        severity: 'warning',
        fixable: false,
        suggestion: 'Add steps to your ensemble using step(), parallel(), branch(), etc.',
      })
    }

    // Check for common issues in static steps
    if (hasStaticSteps) {
      const steps = ensemble.flow
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        if (!step) {
          errors.push({
            file: filePath,
            message: `Step ${i + 1} is undefined or null`,
            severity: 'error',
            fixable: false,
          })
        }
      }
    }
  } catch (error) {
    const errorMessage = (error as Error).message
    const errorStack = (error as Error).stack || ''

    // Try to extract line number from stack trace
    const lineMatch = errorStack.match(new RegExp(`${path.basename(filePath)}:(\\d+):(\\d+)`))
    const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined
    const column = lineMatch ? parseInt(lineMatch[2], 10) : undefined

    errors.push({
      file: filePath,
      line,
      column,
      message: `Import/execution error: ${errorMessage}`,
      severity: 'error',
      fixable: false,
      suggestion: 'Check for syntax errors or missing imports in your TypeScript file',
    })
  }

  return {
    file: filePath,
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
    fixed: false,
  }
}

/**
 * Format validation results for display
 */
function formatResults(results: ValidationResult[], options: ValidateOptions): void {
  if (options.format === 'json') {
    console.log(JSON.stringify(results, null, 2))
    return
  }

  const totalFiles = results.length
  const validFiles = results.filter((r) => r.valid).length
  const invalidFiles = totalFiles - validFiles
  const fixedFiles = results.filter((r) => r.fixed).length
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)

  console.log('')
  console.log(chalk.bold('Validation Results'))
  console.log(chalk.dim('─'.repeat(50)))
  console.log('')

  for (const result of results) {
    if (result.valid && !result.fixed && options.quiet) {
      continue
    }

    const statusIcon = result.valid ? chalk.green('✓') : chalk.red('✗')
    const fixedBadge = result.fixed ? chalk.yellow(' [FIXED]') : ''

    console.log(`${statusIcon} ${path.relative(process.cwd(), result.file)}${fixedBadge}`)

    for (const error of result.errors) {
      const severity = error.severity === 'error' ? chalk.red('ERROR') : chalk.yellow('WARN')
      const location =
        error.line !== undefined
          ? chalk.dim(`:${error.line}${error.column ? `:${error.column}` : ''}`)
          : ''
      const fixable = error.fixable ? chalk.cyan(' [fixable]') : ''

      console.log(`  ${severity}${location}: ${error.message}${fixable}`)

      if (error.suggestion && !options.quiet) {
        console.log(chalk.dim(`    → ${error.suggestion}`))
      }
    }

    if (result.errors.length > 0) {
      console.log('')
    }
  }

  console.log(chalk.dim('─'.repeat(50)))
  console.log('')
  console.log(
    `${chalk.bold('Summary:')} ${validFiles}/${totalFiles} files valid, ` +
      `${totalErrors} issue${totalErrors !== 1 ? 's' : ''} found` +
      (fixedFiles > 0 ? `, ${fixedFiles} file${fixedFiles !== 1 ? 's' : ''} fixed` : '')
  )

  if (invalidFiles > 0 && !options.fix) {
    console.log('')
    console.log(chalk.dim('Run with --fix to automatically fix fixable issues'))
  }

  console.log('')
}

/**
 * Determine file format from extension
 */
function getFileFormat(filePath: string): 'yaml' | 'typescript' {
  const ext = path.extname(filePath).toLowerCase()
  return ext === '.ts' || ext === '.tsx' ? 'typescript' : 'yaml'
}

export function createValidateCommand(): Command {
  const validate = new Command('validate')

  validate
    .description('Validate ensemble and agent files (YAML and TypeScript)')
    .argument('[paths...]', 'Files or directories to validate (default: ensembles/ and agents/)')
    .option('--fix', 'Automatically fix fixable issues (YAML only)')
    .option('-q, --quiet', 'Only show errors')
    .option('--format <format>', 'Output format: text or json', 'text')
    .option('--ensembles-dir <dir>', 'Ensembles directory', 'ensembles')
    .option('--agents-dir <dir>', 'Agents directory', 'agents')
    .action(async (paths: string[], options: ValidateOptions) => {
      try {
        const results: ValidationResult[] = []

        // Determine files to validate
        let filesToValidate: { path: string; type: 'ensemble' | 'agent' }[] = []

        if (paths.length === 0) {
          // Default: validate ensembles/ and agents/ directories
          const ensemblesDir = path.resolve(process.cwd(), options.ensemblesDir || 'ensembles')
          const agentsDir = path.resolve(process.cwd(), options.agentsDir || 'agents')

          // Find ensemble files (YAML and TypeScript)
          try {
            const ensembleFiles = await glob('**/*.{yaml,yml,ts}', {
              cwd: ensemblesDir,
              absolute: true,
              ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
            })
            filesToValidate.push(
              ...ensembleFiles.map((f) => ({ path: f, type: 'ensemble' as const }))
            )
          } catch {
            // Directory doesn't exist
          }

          // Find agent files (YAML and TypeScript)
          try {
            const agentFiles = await glob('**/*.{yaml,yml,ts}', {
              cwd: agentsDir,
              absolute: true,
              ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
            })
            filesToValidate.push(...agentFiles.map((f) => ({ path: f, type: 'agent' as const })))
          } catch {
            // Directory doesn't exist
          }
        } else {
          // Validate specified paths
          for (const p of paths) {
            const resolved = path.resolve(process.cwd(), p)
            const stat = await fs.stat(resolved)

            if (stat.isDirectory()) {
              const files = await glob('**/*.{yaml,yml,ts}', {
                cwd: resolved,
                absolute: true,
                ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
              })
              // Determine type based on directory name
              const isAgentsDir = p.includes('agent') || resolved.includes('/agents/')
              filesToValidate.push(
                ...files.map((f) => ({
                  path: f,
                  type: isAgentsDir ? ('agent' as const) : ('ensemble' as const),
                }))
              )
            } else {
              // Single file - determine type from content or path
              const isAgent = p.includes('agent') || resolved.includes('/agents/')
              filesToValidate.push({
                path: resolved,
                type: isAgent ? 'agent' : 'ensemble',
              })
            }
          }
        }

        if (filesToValidate.length === 0) {
          console.log(chalk.yellow('No files found to validate'))
          console.log('')
          console.log(chalk.dim('Make sure you have:'))
          console.log(chalk.dim('  - ensembles/*.yaml or ensembles/*.ts'))
          console.log(chalk.dim('  - agents/*.yaml or agents/*.ts'))
          console.log('')
          return
        }

        // Validate all files
        if (!options.quiet) {
          console.log('')
          const yamlCount = filesToValidate.filter((f) => getFileFormat(f.path) === 'yaml').length
          const tsCount = filesToValidate.filter(
            (f) => getFileFormat(f.path) === 'typescript'
          ).length
          console.log(
            chalk.bold(`Validating ${filesToValidate.length} file(s)`) +
              chalk.dim(` (${yamlCount} YAML, ${tsCount} TypeScript)...`)
          )
        }

        for (const file of filesToValidate) {
          const format = getFileFormat(file.path)
          let result: ValidationResult

          if (format === 'typescript') {
            // TypeScript files - validate by importing
            if (file.type === 'ensemble') {
              result = await validateTypeScriptEnsemble(file.path, options)
            } else {
              // TODO: Add validateTypeScriptAgent when needed
              // For now, treat agent .ts files as ensembles (they use same validation)
              result = await validateTypeScriptEnsemble(file.path, options)
            }
          } else {
            // YAML files - use schema validation
            result =
              file.type === 'ensemble'
                ? await validateEnsemble(file.path, options)
                : await validateAgent(file.path, options)
          }

          results.push(result)
        }

        // Display results
        formatResults(results, options)

        // Exit with error code if validation failed
        const hasErrors = results.some((r) => !r.valid)
        if (hasErrors) {
          process.exit(1)
        }
      } catch (error) {
        console.error(chalk.red('Error:'), (error as Error).message)
        process.exit(1)
      }
    })

  return validate
}
