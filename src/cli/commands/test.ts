/**
 * Test Command - Run tests for Conductor projects
 */

import { Command } from 'commander'
import chalk from 'chalk'
import { spawn } from 'child_process'
import { loadConfig } from '../../config'

export function createTestCommand(): Command {
  const test = new Command('test')
    .description('Run tests for your Conductor project')
    .argument('[path]', 'Test file or directory to run')
    .option('--watch', 'Run tests in watch mode')
    .option('--coverage', 'Generate coverage report')
    .option('--ui', 'Open Vitest UI')
    .option('--reporter <type>', 'Test reporter: default, verbose, dot, json')
    .action(
      async (
        testPath: string | undefined,
        options: {
          watch?: boolean
          coverage?: boolean
          ui?: boolean
          reporter?: string
        }
      ) => {
        const projectPath = process.cwd()

        try {
          // Load config for test settings
          const configResult = await loadConfig(projectPath)
          const config = configResult.success ? configResult.value : undefined

          // Build vitest command
          const args = ['vitest']

          // Add test path if specified
          if (testPath) {
            args.push(testPath)
          }

          // Add options
          if (options.watch) {
            args.push('--watch')
          }

          if (options.coverage) {
            args.push('--coverage')
          }

          if (options.ui) {
            args.push('--ui')
          }

          if (options.reporter) {
            args.push('--reporter', options.reporter)
          }

          // Apply config settings
          if (config?.testing?.timeout) {
            args.push('--testTimeout', String(config.testing.timeout))
          }

          if (config?.testing?.globals) {
            args.push('--globals')
          }

          // Show what we're running
          console.log('')
          console.log(chalk.bold('🧪 Running Tests...'))
          console.log(chalk.dim(`Command: npx ${args.join(' ')}`))
          console.log('')

          // Run vitest
          const vitestProcess = spawn('npx', args, {
            stdio: 'inherit',
            shell: true,
            cwd: projectPath,
          })

          // Handle exit
          vitestProcess.on('exit', (code) => {
            process.exit(code || 0)
          })

          // Handle errors
          vitestProcess.on('error', (error) => {
            console.error('')
            console.error(chalk.red('✗ Failed to run tests'))
            console.error('')
            console.error(chalk.dim(error.message))
            console.error('')
            console.error(chalk.dim('Make sure vitest is installed: npm install -D vitest'))
            console.error('')
            process.exit(1)
          })
        } catch (error) {
          console.error('')
          console.error(chalk.red('✗ Test command failed'))
          console.error('')
          console.error(chalk.dim((error as Error).message))
          console.error('')
          process.exit(1)
        }
      }
    )

  return test
}
