/**
 * Init Command - Initialize a new Conductor project
 */

import { Command } from 'commander'
import chalk from 'chalk'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'

export function createInitCommand(): Command {
  const init = new Command('init')

  init
    .description(
      'Initialize a new Conductor project (use "." for current dir or "my-project" for new)'
    )
    .argument('[directory]', 'Project directory (default: current directory)', '.')
    .option('--template <name>', 'Template to use (cloudflare)', 'cloudflare')
    .option('--force', 'Overwrite existing files')
    .option('--no-examples', 'Skip example files (only include minimal starter files)')
    .action(async (directory: string, options: { template: string; force?: boolean; examples?: boolean }) => {
      try {
        console.log('')
        console.log(chalk.bold('🎯 Initializing Conductor project...'))
        console.log('')

        const targetDir = path.resolve(process.cwd(), directory)

        // Check if directory exists and what's in it
        let directoryExists = false
        let isConductorProject = false
        let hasFiles = false

        try {
          const files = await fs.readdir(targetDir)
          directoryExists = true
          hasFiles = files.length > 0

          // Check for Conductor project markers
          const conductorMarkers = [
            'conductor.config.ts',
            'conductor.config.js',
            'ensembles',
            'members',
          ]

          for (const marker of conductorMarkers) {
            try {
              await fs.access(path.join(targetDir, marker))
              isConductorProject = true
              break
            } catch {
              // Marker doesn't exist
            }
          }
        } catch (error) {
          // Directory doesn't exist, create it
          await fs.mkdir(targetDir, { recursive: true })
        }

        // Handle existing Conductor project
        if (isConductorProject && !options.force) {
          console.error(chalk.yellow('⚠ Detected existing Conductor project'))
          console.error('')
          console.error(chalk.dim('This directory appears to already have Conductor files.'))
          console.error(chalk.dim('Initializing will overwrite:'))
          console.error(chalk.dim('  - conductor.config.ts'))
          console.error(chalk.dim('  - ensembles/'))
          console.error(chalk.dim('  - members/'))
          console.error(chalk.dim('  - prompts/'))
          console.error(chalk.dim('  - configs/'))
          console.error(chalk.dim('  - tests/'))
          console.error('')
          console.error(chalk.dim('Use --force to overwrite existing Conductor files'))
          console.error('')
          process.exit(1)
        }

        // Handle non-empty directory that's not a Conductor project
        if (hasFiles && !isConductorProject && !options.force) {
          console.error(chalk.yellow('⚠ Directory is not empty'))
          console.error('')
          console.error(chalk.dim('This directory contains files but is not a Conductor project.'))
          console.error(
            chalk.dim('Initializing will add Conductor structure alongside existing files.')
          )
          console.error('')
          console.error(chalk.dim('Use --force to proceed'))
          console.error('')
          process.exit(1)
        }

        // Determine template path
        // The catalog directory is at the package root
        // When installed: node_modules/@ensemble-edge/conductor/catalog
        // When in development: conductor/catalog

        // Find package root by looking for package.json
        let packageRoot = process.cwd()
        let currentDir = fileURLToPath(import.meta.url)

        // Walk up the directory tree to find package.json
        while (currentDir !== path.dirname(currentDir)) {
          currentDir = path.dirname(currentDir)
          try {
            const pkgPath = path.join(currentDir, 'package.json')
            await fs.access(pkgPath)
            const pkgContent = await fs.readFile(pkgPath, 'utf-8')
            const pkg = JSON.parse(pkgContent)
            if (pkg.name === '@ensemble-edge/conductor') {
              packageRoot = currentDir
              break
            }
          } catch {
            // Continue searching
          }
        }

        const templatePath = path.join(
          packageRoot,
          'catalog',
          'cloud',
          options.template,
          'templates'
        )

        try {
          await fs.access(templatePath)
        } catch {
          console.error(chalk.red(`Error: Template '${options.template}' not found`))
          console.error('')
          console.error(chalk.dim(`Searched at: ${templatePath}`))
          console.error(chalk.dim('Available templates:'))
          console.error(chalk.dim('  - cloudflare (default)'))
          console.error('')
          process.exit(1)
        }

        console.log(chalk.cyan(`Template: ${options.template}`))
        console.log(chalk.cyan(`Target: ${targetDir}`))
        console.log(chalk.cyan(`Examples: ${options.examples !== false ? 'included' : 'excluded'}`))
        console.log('')

        // Copy template files
        await copyDirectory(templatePath, targetDir, options.force || false, options.examples !== false)

        console.log(chalk.green('✓ Project initialized successfully'))
        console.log('')

        // Show next steps
        console.log(chalk.bold('Next steps:'))
        console.log('')
        if (directory !== '.') {
          console.log(chalk.dim(`  1. cd ${directory}`))
        }
        console.log(chalk.dim(`  ${directory !== '.' ? '2' : '1'}. npm install`))
        console.log(chalk.dim(`  ${directory !== '.' ? '3' : '2'}. Review the generated files:`))
        console.log(chalk.dim('     - ensembles/    : Your workflows'))
        console.log(chalk.dim('     - members/      : AI members, functions, and agents'))
        console.log(chalk.dim('     - prompts/      : Prompt templates'))
        console.log(chalk.dim('     - configs/      : Configuration files'))
        console.log(
          chalk.dim(
            `  ${directory !== '.' ? '4' : '3'}. npx wrangler dev  : Start local development`
          )
        )
        console.log('')
        console.log(chalk.dim('Documentation: https://docs.ensemble-edge.com/conductor'))
        console.log('')
      } catch (error) {
        console.error('')
        console.error(chalk.red('✗ Failed to initialize project'))
        console.error('')
        console.error(chalk.dim((error as Error).message))
        if ((error as Error).stack) {
          console.error(chalk.dim((error as Error).stack))
        }
        console.error('')
        process.exit(1)
      }
    })

  return init
}

/**
 * Recursively copy a directory
 */
async function copyDirectory(src: string, dest: string, force: boolean, includeExamples: boolean = true): Promise<void> {
  await fs.mkdir(dest, { recursive: true })

  const entries = await fs.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    // Skip examples directory if --no-examples flag is set
    if (!includeExamples && entry.name === 'examples' && entry.isDirectory()) {
      console.log(chalk.dim(`  ⊘ Skipping ${path.relative(dest, destPath)} (--no-examples)`))
      continue
    }

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath, force, includeExamples)
    } else {
      // Check if file exists
      if (!force) {
        try {
          await fs.access(destPath)
          console.log(chalk.yellow(`  ⊘ Skipping ${entry.name} (already exists)`))
          continue
        } catch {
          // File doesn't exist, continue with copy
        }
      }

      await fs.copyFile(srcPath, destPath)
      console.log(chalk.dim(`  ✓ Created ${path.relative(dest, destPath)}`))
    }
  }
}
