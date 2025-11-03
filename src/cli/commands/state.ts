/**
 * State Command - Inspect execution state snapshots
 */

import { Command } from 'commander'
import chalk from 'chalk'
import { ExecutionHistory } from '../../storage/execution-history'
import { loadConfig } from '../../config'

export function createStateCommand(): Command {
  const state = new Command('state')
    .description('Inspect state snapshots for a specific execution')
    .argument('<execution-id>', 'Execution ID to view state for')
    .option('--step <name>', 'Filter by step name')
    .option('--latest', 'Show only the latest state snapshot')
    .option('--json', 'Output as JSON')
    .action(
      async (
        executionId: string,
        options: {
          step?: string
          latest?: boolean
          json?: boolean
        }
      ) => {
        const projectPath = process.cwd()

        try {
          // Load config for storage path
          const configResult = await loadConfig(projectPath)
          const storagePath = configResult.success
            ? configResult.value.storage?.path
            : './.conductor'

          const history = new ExecutionHistory(`${storagePath}/history`)

          // Get execution record
          const record = await history.get(executionId)

          if (!record) {
            console.error('')
            console.error(chalk.red(`✗ Execution not found: ${executionId}`))
            console.error('')
            console.error(chalk.dim('Use `conductor history` to list available executions'))
            console.error('')
            process.exit(1)
          }

          // Get state snapshots
          let snapshots = record.stateSnapshots || []

          // Filter by step
          if (options.step) {
            snapshots = snapshots.filter((snapshot) => snapshot.stepName === options.step)
          }

          // Get latest only
          if (options.latest && snapshots.length > 0) {
            snapshots = [snapshots[snapshots.length - 1]]
          }

          if (options.json) {
            // JSON output
            console.log(JSON.stringify({ executionId, snapshots }, null, 2))
          } else {
            // Pretty output
            console.log('')
            console.log(chalk.bold(`🔍 State for execution: ${executionId}`))
            console.log('')
            console.log(chalk.dim(`Ensemble: ${record.name}`))
            console.log(
              chalk.dim(
                `Status: ${record.status === 'success' ? chalk.green(record.status) : chalk.red(record.status)}`
              )
            )
            console.log(chalk.dim(`Duration: ${record.duration}ms`))
            console.log('')

            if (snapshots.length === 0) {
              console.log(chalk.dim('No state snapshots found'))
              if (options.step || options.latest) {
                console.log(chalk.dim('Try removing filters to see all snapshots'))
              }
              console.log('')
              return
            }

            // Print snapshots
            snapshots.forEach((snapshot, index) => {
              const timestamp = new Date(snapshot.timestamp).toLocaleTimeString()
              console.log(chalk.bold(`Snapshot ${index + 1} - ${snapshot.stepName}`))
              console.log(chalk.dim(`  Time: ${timestamp}`))
              console.log('')

              // Print state variables
              if (snapshot.state && Object.keys(snapshot.state).length > 0) {
                console.log(chalk.cyan('  State:'))
                Object.entries(snapshot.state).forEach(([key, value]) => {
                  const valueStr =
                    typeof value === 'object'
                      ? JSON.stringify(value, null, 2)
                          .split('\n')
                          .map((line, i) => (i === 0 ? line : `    ${line}`))
                          .join('\n')
                      : String(value)
                  console.log(`    ${chalk.yellow(key)}: ${valueStr}`)
                })
              } else {
                console.log(chalk.dim('  No state variables'))
              }

              console.log('')
            })
          }
        } catch (error) {
          console.error('')
          console.error(chalk.red('✗ Failed to retrieve state'))
          console.error('')
          console.error(chalk.dim((error as Error).message))
          console.error('')
          process.exit(1)
        }
      }
    )

  return state
}
