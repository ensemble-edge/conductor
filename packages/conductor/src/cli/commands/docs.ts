/**
 * Docs Command - Generate OpenAPI documentation
 */

import { Command } from 'commander'
import chalk from 'chalk'
import { OpenAPIGenerator } from '../openapi-generator.js'
import { loadConfig } from '../../config/index.js'
import * as fs from 'fs/promises'
import * as path from 'path'
import YAML from 'yaml'

export function createDocsCommand(): Command {
  const docs = new Command('docs')

  docs
    .description('Generate OpenAPI documentation for your project')
    .option('--ai', 'Use AI to enhance documentation (requires docs-writer agent)')
    .option('-o, --output <path>', 'Output file path', './openapi.yaml')
    .option('--json', 'Output as JSON instead of YAML')
    .action(async (options: { ai?: boolean; output: string; json?: boolean }) => {
      const projectPath = process.cwd()

      try {
        console.log('')
        console.log(chalk.bold('📚 Generating API Documentation...'))
        console.log('')

        // Check for conductor.config.ts to determine AI default
        const useAI = await shouldUseAI(projectPath, options.ai)

        if (useAI) {
          console.log(chalk.cyan('🤖 AI-powered documentation mode enabled'))
          console.log('')
        }

        // Generate OpenAPI spec
        const generator = new OpenAPIGenerator(projectPath)
        const spec = await generator.generate({
          projectPath,
          useAI,
          aiAgent: 'docs-writer',
        })

        // Determine output format
        const outputPath = options.output
        const isJson = options.json || outputPath.endsWith('.json')

        // Save spec
        const content = isJson ? JSON.stringify(spec, null, 2) : YAML.stringify(spec)

        await fs.writeFile(outputPath, content, 'utf-8')

        console.log(chalk.green('✓ Documentation generated successfully'))
        console.log('')
        console.log(`Output: ${chalk.bold(outputPath)}`)
        console.log('')

        // Print stats
        const pathCount = Object.keys(spec.paths).length
        const tagCount = spec.tags?.length || 0

        console.log(chalk.dim(`  ${pathCount} API endpoint${pathCount !== 1 ? 's' : ''}`))
        console.log(chalk.dim(`  ${tagCount} tag${tagCount !== 1 ? 's' : ''}`))
        console.log('')

        console.log(chalk.dim('Next steps:'))
        console.log(chalk.dim(`  • View your docs: ${outputPath}`))
        console.log(chalk.dim('  • Host docs: conductor docs serve (coming soon)'))
        console.log(chalk.dim('  • Publish to cloud: conductor docs publish (coming soon)'))
        console.log('')
      } catch (error) {
        console.error('')
        console.error(chalk.red('✗ Failed to generate documentation'))
        console.error('')
        console.error(chalk.dim((error as Error).message))
        console.error('')
        process.exit(1)
      }
    })

  // Validate command
  docs
    .command('validate')
    .description('Validate OpenAPI specification')
    .argument('[file]', 'OpenAPI spec file', './openapi.yaml')
    .action(async (file: string) => {
      try {
        console.log('')
        console.log(chalk.bold('🔍 Validating OpenAPI specification...'))
        console.log('')

        const content = await fs.readFile(file, 'utf-8')
        const spec = file.endsWith('.json')
          ? JSON.parse(content)
          : YAML.parse(content, { mapAsMap: false, logLevel: 'silent' })

        // Basic validation
        const errors: string[] = []

        if (!spec.openapi) {
          errors.push('Missing openapi version')
        }

        if (!spec.info) {
          errors.push('Missing info section')
        }

        if (!spec.paths || Object.keys(spec.paths).length === 0) {
          errors.push('No paths defined')
        }

        if (errors.length > 0) {
          console.log(chalk.red('✗ Validation failed'))
          console.log('')
          errors.forEach((err) => console.log(chalk.red(`  • ${err}`)))
          console.log('')
          process.exit(1)
        }

        console.log(chalk.green('✓ Specification is valid'))
        console.log('')
        console.log(chalk.dim(`  OpenAPI ${spec.openapi}`))
        console.log(chalk.dim(`  ${Object.keys(spec.paths).length} endpoints`))
        console.log('')
      } catch (error) {
        console.error('')
        console.error(chalk.red('✗ Validation failed'))
        console.error('')
        console.error(chalk.dim((error as Error).message))
        console.error('')
        process.exit(1)
      }
    })

  return docs
}

/**
 * Check if AI mode should be used based on config
 */
async function shouldUseAI(projectPath: string, cliOption?: boolean): Promise<boolean> {
  // CLI option takes precedence
  if (cliOption !== undefined) {
    return cliOption
  }

  // Load config with proper loader
  const configResult = await loadConfig(projectPath)

  if (configResult.success) {
    return configResult.value.docs?.useAI ?? false
  }

  // Default to false if config can't be loaded
  return false
}
