/**
 * Validate Command - Validate and auto-fix YAML ensembles and agents
 *
 * Features:
 * - Validates ensemble and agent YAML files against schemas
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
 * Auto-fix functions for common issues
 */
const autoFixes = {
  /**
   * Fix output: $agent-name to output: { result: ${agent-name.output} }
   */
  async fixOutputSyntax(
    filePath: string,
    content: string,
    agentName: string
  ): Promise<string> {
    const pattern = new RegExp(`^output:\\s*\\$${agentName}\\s*$`, 'm')
    return content.replace(
      pattern,
      `output:\n  result: \${${agentName}.output}`
    )
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
    const flowYaml = agentNames
      .map((name) => `  - agent: ${name}`)
      .join('\n')

    // Find position after agents section or at end
    const agentsMatch = content.match(/^agents:[\s\S]*?(?=^[a-z]|\Z)/m)
    if (agentsMatch) {
      const insertPos = (agentsMatch.index || 0) + agentsMatch[0].length
      return (
        content.slice(0, insertPos) +
        `\nflow:\n${flowYaml}\n` +
        content.slice(insertPos)
      )
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
    return content.replace(
      /^(\s*)(\w+):\s+({{[^}]+}})\s*$/gm,
      '$1$2: "$3"'
    )
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
      modifiedContent = await autoFixes.fixOutputSyntax(
        filePath,
        modifiedContent,
        agentName
      )
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
        },
      ],
      fixed: false,
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
 * Format validation results for display
 */
function formatResults(
  results: ValidationResult[],
  options: ValidateOptions
): void {
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

    const statusIcon = result.valid
      ? chalk.green('✓')
      : chalk.red('✗')
    const fixedBadge = result.fixed ? chalk.yellow(' [FIXED]') : ''

    console.log(`${statusIcon} ${path.relative(process.cwd(), result.file)}${fixedBadge}`)

    for (const error of result.errors) {
      const severity =
        error.severity === 'error' ? chalk.red('ERROR') : chalk.yellow('WARN')
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
    console.log(
      chalk.dim('Run with --fix to automatically fix fixable issues')
    )
  }

  console.log('')
}

export function createValidateCommand(): Command {
  const validate = new Command('validate')

  validate
    .description('Validate ensemble and agent YAML files')
    .argument(
      '[paths...]',
      'Files or directories to validate (default: ensembles/ and agents/)'
    )
    .option('--fix', 'Automatically fix fixable issues')
    .option('-q, --quiet', 'Only show errors')
    .option('--format <format>', 'Output format: text or json', 'text')
    .option(
      '--ensembles-dir <dir>',
      'Ensembles directory',
      'ensembles'
    )
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

          // Find ensemble files
          try {
            const ensembleFiles = await glob('**/*.{yaml,yml}', {
              cwd: ensemblesDir,
              absolute: true,
            })
            filesToValidate.push(
              ...ensembleFiles.map((f) => ({ path: f, type: 'ensemble' as const }))
            )
          } catch {
            // Directory doesn't exist
          }

          // Find agent files
          try {
            const agentFiles = await glob('**/*.{yaml,yml}', {
              cwd: agentsDir,
              absolute: true,
            })
            filesToValidate.push(
              ...agentFiles.map((f) => ({ path: f, type: 'agent' as const }))
            )
          } catch {
            // Directory doesn't exist
          }
        } else {
          // Validate specified paths
          for (const p of paths) {
            const resolved = path.resolve(process.cwd(), p)
            const stat = await fs.stat(resolved)

            if (stat.isDirectory()) {
              const files = await glob('**/*.{yaml,yml}', {
                cwd: resolved,
                absolute: true,
              })
              // Determine type based on directory name
              const isAgentsDir =
                p.includes('agent') || resolved.includes('/agents/')
              filesToValidate.push(
                ...files.map((f) => ({
                  path: f,
                  type: isAgentsDir ? ('agent' as const) : ('ensemble' as const),
                }))
              )
            } else {
              // Single file - determine type from content or path
              const isAgent =
                p.includes('agent') ||
                resolved.includes('/agents/')
              filesToValidate.push({
                path: resolved,
                type: isAgent ? 'agent' : 'ensemble',
              })
            }
          }
        }

        if (filesToValidate.length === 0) {
          console.log(chalk.yellow('No YAML files found to validate'))
          console.log('')
          console.log(chalk.dim('Make sure you have:'))
          console.log(chalk.dim('  - ensembles/*.yaml'))
          console.log(chalk.dim('  - agents/*.yaml'))
          console.log('')
          return
        }

        // Validate all files
        if (!options.quiet) {
          console.log('')
          console.log(chalk.bold(`Validating ${filesToValidate.length} file(s)...`))
        }

        for (const file of filesToValidate) {
          const result =
            file.type === 'ensemble'
              ? await validateEnsemble(file.path, options)
              : await validateAgent(file.path, options)
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
