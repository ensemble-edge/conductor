/**
 * Replay Command - Replay past executions for debugging
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { ExecutionHistory } from '../../storage/execution-history.js';
import { loadConfig } from '../../config/index.js';
export function createReplayCommand() {
    const replay = new Command('replay')
        .description('Replay a past execution for debugging')
        .argument('<execution-id>', 'Execution ID to replay')
        .option('--step-by-step', 'Pause after each step (press Enter to continue)')
        .option('--from-step <name>', 'Start replay from a specific step')
        .option('--show-state', 'Show state after each step')
        .option('--json', 'Output as JSON')
        .action(async (executionId, options) => {
        const projectPath = process.cwd();
        try {
            // Load config for storage path
            const configResult = await loadConfig(projectPath);
            const storagePath = configResult.success
                ? configResult.value.storage?.path
                : './.conductor';
            const history = new ExecutionHistory(`${storagePath}/history`);
            // Get execution record
            const record = await history.get(executionId);
            if (!record) {
                console.error('');
                console.error(chalk.red(`✗ Execution not found: ${executionId}`));
                console.error('');
                console.error(chalk.dim('Use `conductor history` to list available executions'));
                console.error('');
                process.exit(1);
            }
            if (record.type !== 'ensemble') {
                console.error('');
                console.error(chalk.red('✗ Can only replay ensemble executions'));
                console.error('');
                console.error(chalk.dim('Agent executions cannot be replayed independently'));
                console.error('');
                process.exit(1);
            }
            if (!options.json) {
                console.log('');
                console.log(chalk.bold(`🔄 Replaying execution: ${executionId}`));
                console.log('');
                console.log(chalk.dim(`Ensemble: ${record.name}`));
                console.log(chalk.dim(`Original status: ${record.status === 'success' ? chalk.green(record.status) : chalk.red(record.status)}`));
                console.log(chalk.dim(`Original duration: ${record.duration}ms`));
                console.log('');
                if (options.stepByStep) {
                    console.log(chalk.yellow('⏸  Step-by-step mode enabled (press Enter to continue each step)'));
                    console.log('');
                }
            }
            // Display execution details step-by-step
            if (options.json) {
                console.log(JSON.stringify({
                    executionId,
                    record: {
                        name: record.name,
                        type: record.type,
                        status: record.status,
                        duration: record.duration,
                        input: record.input,
                        output: record.output,
                        error: record.error,
                        steps: record.steps,
                        stateSnapshots: record.stateSnapshots,
                    },
                }, null, 2));
            }
            else {
                // Show execution flow step by step
                console.log(chalk.bold('📋 Input:'));
                console.log(JSON.stringify(record.input, null, 2));
                console.log('');
                if (record.steps && record.steps.length > 0) {
                    console.log(chalk.bold('🔄 Execution Steps:'));
                    console.log('');
                    // Determine starting point
                    let startIndex = 0;
                    if (options.fromStep) {
                        const stepIndex = record.steps.findIndex((s) => s.name === options.fromStep);
                        if (stepIndex === -1) {
                            console.log(chalk.yellow(`⚠ Step "${options.fromStep}" not found, showing all steps`));
                            console.log('');
                        }
                        else {
                            startIndex = stepIndex;
                            console.log(chalk.cyan(`⏭  Starting from step: ${options.fromStep}`));
                            console.log('');
                        }
                    }
                    // Display steps
                    for (let i = startIndex; i < record.steps.length; i++) {
                        const step = record.steps[i];
                        const statusIcon = step.status === 'success'
                            ? chalk.green('✓')
                            : step.status === 'failure'
                                ? chalk.red('✗')
                                : chalk.yellow('⊘');
                        console.log(`${statusIcon} Step ${i + 1}: ${chalk.bold(step.name)}`);
                        console.log(chalk.dim(`  Duration: ${step.duration}ms`));
                        if (step.output !== undefined && options.showState) {
                            console.log(chalk.dim('  Output:'));
                            console.log(chalk.dim(`    ${JSON.stringify(step.output)}`));
                        }
                        if (step.error) {
                            console.log(chalk.red(`  Error: ${step.error}`));
                        }
                        console.log('');
                        // Show state snapshot if available and requested
                        if (options.showState && record.stateSnapshots) {
                            const snapshot = record.stateSnapshots.find((s) => s.stepIndex === i);
                            if (snapshot && Object.keys(snapshot.state).length > 0) {
                                console.log(chalk.cyan('  State:'));
                                Object.entries(snapshot.state).forEach(([key, value]) => {
                                    console.log(chalk.dim(`    ${key}: ${JSON.stringify(value)}`));
                                });
                                console.log('');
                            }
                        }
                        // Pause if step-by-step mode
                        if (options.stepByStep && i < record.steps.length - 1) {
                            await new Promise((resolve) => {
                                console.log(chalk.yellow('Press Enter to continue...'));
                                process.stdin.once('data', () => resolve());
                            });
                        }
                    }
                }
                console.log(chalk.bold('📊 Final Result:'));
                console.log('');
                console.log(`  Status: ${record.status === 'success' ? chalk.green(record.status) : chalk.red(record.status)}`);
                console.log(chalk.dim(`  Duration: ${record.duration}ms`));
                console.log('');
                if (record.output !== undefined) {
                    console.log(chalk.bold('Output:'));
                    console.log(JSON.stringify(record.output, null, 2));
                }
                if (record.error) {
                    console.log(chalk.bold('Error:'));
                    console.log(chalk.red(record.error.message));
                }
                console.log('');
            }
        }
        catch (error) {
            console.error('');
            console.error(chalk.red('✗ Failed to replay execution'));
            console.error('');
            console.error(chalk.dim(error.message));
            console.error('');
            process.exit(1);
        }
    });
    return replay;
}
