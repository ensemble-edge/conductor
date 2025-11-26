/**
 * Conductor CLI
 *
 * Command-line interface for Conductor.
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { createInitCommand } from './commands/init.js';
import { createExecCommand } from './commands/exec.js';
import { createMembersCommand } from './commands/agents.js';
import { createDocsCommand } from './commands/docs.js';
import { createTestCommand } from './commands/test.js';
import { createLogsCommand } from './commands/logs.js';
import { createStateCommand } from './commands/state.js';
import { createReplayCommand } from './commands/replay.js';
import { createHistoryCommand } from './commands/history.js';
import { createValidateCommand } from './commands/validate.js';
import { createBundleCommand } from './commands/bundle.js';
import { createImportCommand } from './commands/import.js';
import { handleKeysCommand } from './commands/keys.js';
const version = __CONDUCTOR_VERSION__;
const program = new Command();
program
    .name('conductor')
    .description('Conductor - Agentic workflow orchestration for Cloudflare Workers')
    .version(version)
    .addHelpText('before', `
${chalk.bold.cyan('Getting Started:')}

  ${chalk.bold('Create new project:')}
    ${chalk.cyan('conductor init my-new-project')}
    ${chalk.dim('cd my-new-project')}
    ${chalk.dim('npm install')}

  ${chalk.bold('Initialize existing project:')}
    ${chalk.cyan('conductor init .')}
    ${chalk.dim('npm install')}

${chalk.dim('Documentation:')} ${chalk.cyan('https://docs.ensemble-edge.com/conductor')}
`);
// Add commands
program.addCommand(createInitCommand());
program.addCommand(createExecCommand());
program.addCommand(createMembersCommand());
program.addCommand(createDocsCommand());
// Testing & Debugging commands
program.addCommand(createTestCommand());
program.addCommand(createHistoryCommand());
program.addCommand(createLogsCommand());
program.addCommand(createStateCommand());
program.addCommand(createReplayCommand());
// Utility commands
program.addCommand(createValidateCommand());
program.addCommand(createBundleCommand());
program.addCommand(createImportCommand());
// API Key management command
const keysCommand = new Command('keys')
    .description('Manage API keys for authentication')
    .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.cyan('conductor keys generate --name "my-service" --permissions "ensemble:*:execute"')}
  ${chalk.cyan('conductor keys generate --name "admin" --permissions "*" --expires never')}
  ${chalk.cyan('conductor keys list')}
  ${chalk.cyan('conductor keys revoke key_abc123')}
`);
keysCommand
    .command('generate')
    .description('Generate a new API key')
    .requiredOption('--name <name>', 'Human-readable name for the key')
    .option('--permissions <perms>', 'Comma-separated permissions (default: "*")')
    .option('--expires <duration>', 'Expiration (e.g., "30d", "90d", "1y", "never")', '90d')
    .option('--user-id <userId>', 'User/service ID this key belongs to')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
    await handleKeysCommand('generate', options);
});
keysCommand
    .command('list')
    .description('List all API keys')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
    await handleKeysCommand('list', options);
});
keysCommand
    .command('revoke <keyId>')
    .description('Revoke an API key')
    .option('--json', 'Output as JSON')
    .action(async (keyId, options) => {
    await handleKeysCommand('revoke', { keyId, ...options });
});
keysCommand
    .command('info <keyId>')
    .description('Show information about an API key')
    .option('--json', 'Output as JSON')
    .action(async (keyId, options) => {
    await handleKeysCommand('info', { keyId, ...options });
});
keysCommand
    .command('rotate <keyId>')
    .description('Rotate an API key (generate new, keep metadata)')
    .option('--json', 'Output as JSON')
    .action(async (keyId, options) => {
    await handleKeysCommand('rotate', { keyId, ...options });
});
program.addCommand(keysCommand);
// Health check command
program
    .command('health')
    .description('Check API health')
    .option('--api-url <url>', 'API URL (default: from CONDUCTOR_API_URL env)')
    .action(async (options) => {
    try {
        const apiUrl = options.apiUrl || process.env.CONDUCTOR_API_URL;
        if (!apiUrl) {
            console.error(chalk.red('Error: API URL not configured. Set CONDUCTOR_API_URL or use --api-url'));
            process.exit(1);
        }
        const response = await fetch(`${apiUrl}/health`);
        const data = (await response.json());
        console.log('');
        console.log(chalk.bold('API Health:'));
        console.log('');
        console.log(`Status: ${data.status === 'healthy' ? chalk.green(data.status) : chalk.yellow(data.status)}`);
        console.log(`Version: ${data.version}`);
        console.log('');
        console.log(chalk.bold('Checks:'));
        Object.entries(data.checks).forEach(([key, value]) => {
            const status = value ? chalk.green('✓') : chalk.red('✗');
            console.log(`  ${status} ${key}`);
        });
        console.log('');
    }
    catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
    }
});
// Config command
program
    .command('config')
    .description('Show current configuration')
    .action(() => {
    console.log('');
    console.log(chalk.bold('Configuration:'));
    console.log('');
    console.log(`API URL: ${process.env.CONDUCTOR_API_URL || chalk.dim('not set')}`);
    console.log(`API Key: ${process.env.CONDUCTOR_API_KEY ? chalk.green('set') : chalk.dim('not set')}`);
    console.log('');
    console.log(chalk.dim('Set via environment variables:'));
    console.log(chalk.dim('  export CONDUCTOR_API_URL=https://api.conductor.dev'));
    console.log(chalk.dim('  export CONDUCTOR_API_KEY=your-api-key'));
    console.log('');
});
// Parse arguments
program.parse(process.argv);
