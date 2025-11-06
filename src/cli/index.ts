/**
 * Conductor CLI
 *
 * Command-line interface for Conductor.
 */

import { Command } from 'commander'
import chalk from 'chalk'
import { createInitCommand } from './commands/init.js'
import { createExecCommand } from './commands/exec.js'
import { createMembersCommand } from './commands/members.js'
import { createDocsCommand } from './commands/docs.js'
import { createTestCommand } from './commands/test.js'
import { createLogsCommand } from './commands/logs.js'
import { createStateCommand } from './commands/state.js'
import { createReplayCommand } from './commands/replay.js'
import { createHistoryCommand } from './commands/history.js'

// Version is injected at build time by esbuild
declare const __CONDUCTOR_VERSION__: string
const version = __CONDUCTOR_VERSION__

const program = new Command()

program
  .name('conductor')
  .description('Conductor - Agentic workflow orchestration for Cloudflare Workers')
  .version(version)
  .addHelpText(
    'before',
    `
${chalk.bold.cyan('Getting Started:')}

  ${chalk.bold('Create new project:')}
    ${chalk.cyan('conductor init my-new-project')}
    ${chalk.dim('cd my-new-project')}
    ${chalk.dim('npm install')}

  ${chalk.bold('Initialize existing project:')}
    ${chalk.cyan('conductor init .')}
    ${chalk.dim('npm install')}

${chalk.dim('Documentation:')} ${chalk.cyan('https://docs.ensemble-edge.com/conductor')}
`
  )

// Add commands
program.addCommand(createInitCommand())
program.addCommand(createExecCommand())
program.addCommand(createMembersCommand())
program.addCommand(createDocsCommand())

// Testing & Debugging commands
program.addCommand(createTestCommand())
program.addCommand(createHistoryCommand())
program.addCommand(createLogsCommand())
program.addCommand(createStateCommand())
program.addCommand(createReplayCommand())

// Health check command
program
  .command('health')
  .description('Check API health')
  .option('--api-url <url>', 'API URL (default: from CONDUCTOR_API_URL env)')
  .action(async (options: { apiUrl?: string }) => {
    try {
      const apiUrl = options.apiUrl || process.env.CONDUCTOR_API_URL

      if (!apiUrl) {
        console.error(
          chalk.red('Error: API URL not configured. Set CONDUCTOR_API_URL or use --api-url')
        )
        process.exit(1)
      }

      const response = await fetch(`${apiUrl}/health`)
      const data = (await response.json()) as {
        status: string
        version: string
        checks: Record<string, boolean>
      }

      console.log('')
      console.log(chalk.bold('API Health:'))
      console.log('')
      console.log(
        `Status: ${data.status === 'healthy' ? chalk.green(data.status) : chalk.yellow(data.status)}`
      )
      console.log(`Version: ${data.version}`)
      console.log('')
      console.log(chalk.bold('Checks:'))
      Object.entries(data.checks).forEach(([key, value]) => {
        const status = value ? chalk.green('✓') : chalk.red('✗')
        console.log(`  ${status} ${key}`)
      })
      console.log('')
    } catch (error) {
      console.error(chalk.red('Error:'), (error as Error).message)
      process.exit(1)
    }
  })

// Config command
program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    console.log('')
    console.log(chalk.bold('Configuration:'))
    console.log('')
    console.log(`API URL: ${process.env.CONDUCTOR_API_URL || chalk.dim('not set')}`)
    console.log(
      `API Key: ${process.env.CONDUCTOR_API_KEY ? chalk.green('set') : chalk.dim('not set')}`
    )
    console.log('')
    console.log(chalk.dim('Set via environment variables:'))
    console.log(chalk.dim('  export CONDUCTOR_API_URL=https://api.conductor.dev'))
    console.log(chalk.dim('  export CONDUCTOR_API_KEY=your-api-key'))
    console.log('')
  })

// Parse arguments
program.parse(process.argv)
