/**
 * History Command - List past executions
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { ExecutionHistory } from '../../storage/execution-history';
import { loadConfig } from '../../config';
export function createHistoryCommand() {
    const history = new Command('history')
        .description('List past execution history')
        .option('--limit <number>', 'Limit number of results', '20')
        .option('--type <type>', 'Filter by type: ensemble or member')
        .option('--status <status>', 'Filter by status: success or failure')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const projectPath = process.cwd();
        try {
            // Load config for storage path
            const configResult = await loadConfig(projectPath);
            const storagePath = configResult.success
                ? configResult.value.storage?.path
                : './.conductor';
            const historyManager = new ExecutionHistory(`${storagePath}/history`);
            // List executions with filters
            const records = await historyManager.list({
                limit: parseInt(options.limit, 10),
                type: options.type,
                status: options.status,
            });
            if (options.json) {
                console.log(JSON.stringify({ records }, null, 2));
            }
            else {
                console.log('');
                console.log(chalk.bold('📜 Execution History'));
                console.log('');
                if (records.length === 0) {
                    console.log(chalk.dim('No executions found'));
                    if (options.type || options.status) {
                        console.log(chalk.dim('Try removing filters to see all executions'));
                    }
                    console.log('');
                    return;
                }
                // Print table header
                const idWidth = 36;
                const nameWidth = 25;
                const typeWidth = 10;
                const statusWidth = 10;
                const durationWidth = 10;
                const timeWidth = 20;
                console.log(chalk.dim('ID'.padEnd(idWidth) +
                    'Name'.padEnd(nameWidth) +
                    'Type'.padEnd(typeWidth) +
                    'Status'.padEnd(statusWidth) +
                    'Duration'.padEnd(durationWidth) +
                    'Time'));
                console.log(chalk.dim('─'.repeat(idWidth + nameWidth + typeWidth + statusWidth + durationWidth + timeWidth)));
                // Print records
                records.forEach((record) => {
                    const id = record.id.padEnd(idWidth);
                    const name = (record.name.length > nameWidth - 3
                        ? record.name.substring(0, nameWidth - 3) + '...'
                        : record.name).padEnd(nameWidth);
                    const type = record.type.padEnd(typeWidth);
                    const status = (record.status === 'success' ? chalk.green(record.status) : chalk.red(record.status)).padEnd(statusWidth + 9); // +9 for color codes
                    const duration = `${record.duration}ms`.padEnd(durationWidth);
                    const time = new Date(record.startTime).toLocaleString();
                    console.log(`${chalk.dim(id)}${name}${chalk.dim(type)}${status}${chalk.dim(duration)}${chalk.dim(time)}`);
                });
                console.log('');
                console.log(chalk.dim(`Showing ${records.length} execution${records.length !== 1 ? 's' : ''}`));
                console.log('');
                console.log(chalk.dim('Commands:'));
                console.log(chalk.dim('  conductor logs <id>    - View execution logs'));
                console.log(chalk.dim('  conductor state <id>   - Inspect execution state'));
                console.log(chalk.dim('  conductor replay <id>  - Replay execution'));
                console.log('');
            }
        }
        catch (error) {
            console.error('');
            console.error(chalk.red('✗ Failed to retrieve history'));
            console.error('');
            console.error(chalk.dim(error.message));
            console.error('');
            process.exit(1);
        }
    });
    return history;
}
