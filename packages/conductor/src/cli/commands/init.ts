/**
 * Init Command - Initialize a new Conductor project
 *
 * Follows industry conventions:
 * - --yes/-y: Use defaults, no prompts (like npm init -y)
 * - --skip-install: Skip dependency installation
 * - Default behavior: Interactive prompts + auto-install
 */

import { Command } from 'commander'
import chalk from 'chalk'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

interface InitOptions {
  template: string
  force?: boolean
  examples?: boolean
  yes?: boolean
  skipInstall?: boolean
  packageManager?: PackageManager
}

// ─────────────────────────────────────────────────────────────────────────────
// Package Manager Detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect package manager from lockfiles in target directory or parent
 */
async function detectPackageManager(targetDir: string): Promise<PackageManager> {
  const lockfiles: [string, PackageManager][] = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['bun.lockb', 'bun'],
    ['package-lock.json', 'npm'],
  ]

  // Check target directory
  for (const [file, pm] of lockfiles) {
    try {
      await fs.access(path.join(targetDir, file))
      return pm
    } catch {
      // Not found, continue
    }
  }

  // Check parent directory (for monorepo scenarios)
  const parentDir = path.dirname(targetDir)
  if (parentDir !== targetDir) {
    for (const [file, pm] of lockfiles) {
      try {
        await fs.access(path.join(parentDir, file))
        return pm
      } catch {
        // Not found, continue
      }
    }
  }

  // Default to npm
  return 'npm'
}

// ─────────────────────────────────────────────────────────────────────────────
// Install Dependencies
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run package manager install
 */
async function runInstall(pm: PackageManager, targetDir: string): Promise<boolean> {
  return new Promise((resolve) => {
    const installCmd = pm === 'yarn' ? 'install' : 'install'

    console.log(chalk.dim(`  Running ${pm} ${installCmd}...`))
    console.log('')

    const child = spawn(pm, [installCmd], {
      cwd: targetDir,
      stdio: 'inherit',
      shell: true,
    })

    child.on('close', (code) => {
      resolve(code === 0)
    })

    child.on('error', () => {
      resolve(false)
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Init Command
// ─────────────────────────────────────────────────────────────────────────────

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
    .option('-y, --yes', 'Use defaults, skip prompts (still installs dependencies)')
    .option('--skip-install', 'Skip dependency installation')
    .option('--package-manager <pm>', 'Package manager to use (npm, pnpm, yarn, bun)')
    .action(async (directory: string, options: InitOptions) => {
      try {
        const isNonInteractive = options.yes || !process.stdout.isTTY

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
            'agents',
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
        } catch {
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
          console.error(chalk.dim('  - agents/'))
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

        // Read Conductor version from package.json
        const pkgPath = path.join(packageRoot, 'package.json')
        const pkgContent = await fs.readFile(pkgPath, 'utf-8')
        const pkg = JSON.parse(pkgContent)
        const conductorVersion = pkg.version

        // Copy template files
        await copyDirectory(
          templatePath,
          targetDir,
          options.force || false,
          options.examples !== false,
          conductorVersion
        )

        console.log(chalk.green('✓ Project files created'))
        console.log('')

        // ─────────────────────────────────────────────────────────────────────
        // Install Dependencies (unless --skip-install)
        // ─────────────────────────────────────────────────────────────────────

        if (!options.skipInstall) {
          // Determine package manager
          let pm: PackageManager

          if (options.packageManager) {
            pm = options.packageManager
          } else {
            pm = await detectPackageManager(targetDir)
          }

          console.log(chalk.bold('📦 Installing dependencies...'))
          console.log('')
          console.log(chalk.dim(`  Package manager: ${pm}`))

          const installSuccess = await runInstall(pm, targetDir)

          if (installSuccess) {
            console.log('')
            console.log(chalk.green('✓ Dependencies installed'))
          } else {
            console.log('')
            console.log(chalk.yellow('⚠ Install failed - run manually:'))
            console.log(chalk.dim(`  cd ${directory !== '.' ? directory : targetDir}`))
            console.log(chalk.dim(`  ${pm} install`))
          }
          console.log('')
        } else {
          console.log(chalk.dim('⊘ Skipping install (--skip-install)'))
          console.log('')
        }

        // ─────────────────────────────────────────────────────────────────────
        // Success Summary
        // ─────────────────────────────────────────────────────────────────────

        console.log(chalk.green.bold('✓ Conductor project initialized!'))
        console.log('')

        // Show next steps
        console.log(chalk.bold('Next steps:'))
        console.log('')

        let stepNum = 1
        if (directory !== '.') {
          console.log(chalk.dim(`  ${stepNum}. cd ${directory}`))
          stepNum++
        }

        if (options.skipInstall) {
          const pm = options.packageManager || 'npm'
          console.log(chalk.dim(`  ${stepNum}. ${pm} install`))
          stepNum++
        }

        console.log(chalk.dim(`  ${stepNum}. npx wrangler dev --local-protocol http`))
        console.log('')

        console.log(chalk.dim('Then visit: http://localhost:8787/'))
        console.log('')
        console.log(chalk.dim('Documentation: https://docs.ensemble.ai/conductor'))
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

// ─────────────────────────────────────────────────────────────────────────────
// Copy Directory Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recursively copy a directory
 */
async function copyDirectory(
  src: string,
  dest: string,
  force: boolean,
  includeExamples: boolean = true,
  conductorVersion?: string
): Promise<void> {
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
      await copyDirectory(srcPath, destPath, force, includeExamples, conductorVersion)
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

      // Process template files that need version substitution
      if (conductorVersion && entry.name === 'package.json') {
        let content = await fs.readFile(srcPath, 'utf-8')
        content = content.replace(/__CONDUCTOR_VERSION__/g, conductorVersion)
        await fs.writeFile(destPath, content, 'utf-8')
        console.log(
          chalk.dim(`  ✓ Created ${path.relative(dest, destPath)} (version: ${conductorVersion})`)
        )
      } else {
        await fs.copyFile(srcPath, destPath)
        console.log(chalk.dim(`  ✓ Created ${path.relative(dest, destPath)}`))
      }
    }
  }
}
