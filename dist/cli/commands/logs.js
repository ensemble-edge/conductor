/**
 * Logs Command - View execution logs
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { ExecutionHistory } from '../../storage/execution-history';
import { loadConfig } from '../../config';
export function createLogsCommand() {
    const logs = new Command('logs')
        .description('View logs for a specific execution')
        .argument('<execution-id>', 'Execution ID to view logs for')
        .option('--level <level>', 'Filter by log level: debug, info, warn, error')
        .option('--step <name>', 'Filter by step name')
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
            // Get logs
            let logs = record.logs || [];
            // Filter by level
            if (options.level) {
                logs = logs.filter((log) => log.level === options.level);
            }
            // Filter by step
            if (options.step) {
                logs = logs.filter((log) => log.step === options.step);
            }
            if (options.json) {
                // JSON output
                console.log(JSON.stringify({ executionId, logs }, null, 2));
            }
            else {
                // Pretty output
                console.log('');
                console.log(chalk.bold(`📋 Logs for execution: ${executionId}`));
                console.log('');
                console.log(chalk.dim(`Ensemble: ${record.name}`));
                console.log(chalk.dim(`Status: ${record.status === 'success' ? chalk.green(record.status) : chalk.red(record.status)}`));
                console.log(chalk.dim(`Duration: ${record.duration}ms`));
                console.log('');
                if (logs.length === 0) {
                    console.log(chalk.dim('No logs found'));
                    if (options.level || options.step) {
                        console.log(chalk.dim('Try removing filters to see all logs'));
                    }
                    console.log('');
                    return;
                }
                // Print logs
                logs.forEach((log) => {
                    const timestamp = new Date(log.timestamp).toLocaleTimeString();
                    const levelColor = {
                        debug: chalk.gray,
                        info: chalk.blue,
                        warn: chalk.yellow,
                        error: chalk.red,
                    }[log.level];
                    const level = levelColor(`[${log.level.toUpperCase()}]`);
                    const step = log.step ? chalk.dim(`[${log.step}]`) : '';
                    const time = chalk.dim(timestamp);
                    console.log(`${time} ${level} ${step} ${log.message}`);
                    if (log.context && Object.keys(log.context).length > 0) {
                        console.log(chalk.dim(`  ${JSON.stringify(log.context)}`));
                    }
                });
                console.log('');
            }
        }
        catch (error) {
            console.error('');
            console.error(chalk.red('✗ Failed to retrieve logs'));
            console.error('');
            console.error(chalk.dim(error.message));
            console.error('');
            process.exit(1);
        }
    });
    return logs;
}
