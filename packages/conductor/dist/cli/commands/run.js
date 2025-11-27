/**
 * Run Command
 *
 * Run CLI-triggered ensembles by command name.
 * Ensembles with `trigger: [{ type: cli, command: <name> }]` can be run via CLI.
 *
 * Usage:
 *   conductor run <command>              - Run a CLI-triggered ensemble
 *   conductor run <command> --opt value  - Pass options to the ensemble
 *   conductor run --list                 - List all available CLI commands
 *
 * Example ensemble with CLI trigger:
 *   trigger:
 *     - type: cli
 *       command: docs-generate
 *       description: Generate documentation
 *       options:
 *         - name: format
 *           type: string
 *           default: html
 *         - name: output
 *           type: string
 *           required: true
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { getCLIManager } from '../../runtime/cli-manager.js';
import { LocalLoader } from '../local-loader.js';
export function createRunCommand() {
    const run = new Command('run')
        .description('Run CLI-triggered ensembles')
        .argument('[command]', 'Command name to run')
        .option('--list', 'List all available CLI commands')
        .option('-v, --verbose', 'Show detailed output')
        .option('--json', 'Output result as JSON')
        .allowUnknownOption(true) // Allow dynamic options from ensemble CLI triggers
        .action(async (command, options, cmd) => {
        try {
            // Create local loader for filesystem access
            const loader = new LocalLoader();
            // Check if ensembles directory exists
            const ensemblesDir = loader.getEnsemblesDir();
            if (!(await loader.directoryExists(ensemblesDir))) {
                if (!options.json) {
                    console.log(chalk.yellow(`No ensembles directory found at ${ensemblesDir}`));
                    console.log('');
                    console.log(chalk.dim('Create ensembles with CLI triggers:'));
                    console.log(chalk.dim('  mkdir -p catalog/ensembles'));
                    console.log(chalk.dim('  # Add ensemble YAML files with CLI triggers'));
                    console.log('');
                }
                else {
                    console.log(JSON.stringify({ error: 'No ensembles directory found' }));
                }
                process.exit(1);
            }
            // Load ensembles with CLI triggers
            const ensembles = await loader.loadCLIEnsembles();
            if (ensembles.length === 0) {
                if (!options.json) {
                    console.log(chalk.yellow('No ensembles with CLI triggers found.'));
                    console.log('');
                    console.log(chalk.dim('Add a CLI trigger to an ensemble:'));
                    console.log(chalk.dim('  trigger:'));
                    console.log(chalk.dim('    - type: cli'));
                    console.log(chalk.dim('      command: my-command'));
                    console.log(chalk.dim('      description: My custom command'));
                    console.log('');
                }
                else {
                    console.log(JSON.stringify({ error: 'No CLI triggers found' }));
                }
                return;
            }
            // Register ensembles with CLI manager
            const cliManager = getCLIManager();
            cliManager.registerAll(ensembles);
            // Handle --list option
            if (options.list || !command) {
                const commands = cliManager.listCommands();
                if (options.json) {
                    console.log(JSON.stringify({ commands }, null, 2));
                    return;
                }
                console.log('');
                console.log(chalk.bold('Available CLI commands:'));
                console.log(chalk.dim('─'.repeat(50)));
                console.log('');
                if (commands.length === 0) {
                    console.log(chalk.dim('No CLI commands registered'));
                }
                else {
                    for (const cmd of commands) {
                        console.log(`  ${chalk.cyan(cmd.command)}`);
                        if (cmd.description) {
                            console.log(`    ${chalk.dim(cmd.description)}`);
                        }
                        console.log(chalk.dim(`    → ensemble: ${cmd.ensembleName}`));
                        if (cmd.options.length > 0) {
                            console.log(chalk.dim('    Options:'));
                            for (const opt of cmd.options) {
                                const required = opt.required ? chalk.red('*') : '';
                                const defaultVal = opt.default !== undefined ? ` (default: ${opt.default})` : '';
                                console.log(chalk.dim(`      --${opt.name}${required} [${opt.type || 'string'}]${defaultVal}`));
                                if (opt.description) {
                                    console.log(chalk.dim(`        ${opt.description}`));
                                }
                            }
                        }
                        console.log('');
                    }
                }
                console.log(chalk.dim('Usage: conductor run <command> [options]'));
                console.log('');
                return;
            }
            // Check if command exists
            if (!cliManager.hasCommand(command)) {
                const available = cliManager.listCommands().map((c) => c.command);
                if (options.json) {
                    console.log(JSON.stringify({
                        error: `Command not found: ${command}`,
                        availableCommands: available,
                    }));
                }
                else {
                    console.error(chalk.red('Error:'), `Command not found: ${command}`);
                    console.log('');
                    if (available.length > 0) {
                        console.log(chalk.dim('Available commands:'));
                        for (const cmd of available) {
                            console.log(chalk.dim(`  • ${cmd}`));
                        }
                    }
                    console.log('');
                }
                process.exit(1);
            }
            // Parse options from command line args
            // Commander puts unknown options in the _unknown array
            const rawArgs = cmd.args.slice(1); // Skip the command name
            const parsedOptions = parseCommandOptions(rawArgs);
            // Get command metadata for validation
            const metadata = cliManager.getCommandMetadata(command);
            if (options.verbose && !options.json) {
                console.log('');
                console.log(chalk.bold(`Running: ${command}`));
                console.log(chalk.dim(`Ensemble: ${metadata?.ensembleName}`));
                console.log(chalk.dim(`Options: ${JSON.stringify(parsedOptions)}`));
                console.log(chalk.dim('─'.repeat(50)));
                console.log('');
            }
            // Create minimal env and ctx for local execution
            const env = createLocalEnv();
            const ctx = createLocalContext();
            // Run the command
            const result = await cliManager.runCommand(command, parsedOptions, env, ctx);
            if (options.json) {
                console.log(JSON.stringify(result, null, 2));
            }
            else {
                console.log('');
                if (result.success) {
                    console.log(chalk.green('✓'), chalk.bold(`${result.command} completed`));
                    console.log(chalk.dim(`  Duration: ${result.duration}ms`));
                    console.log(chalk.dim(`  Ensemble: ${result.ensemble}`));
                    if (result.output !== undefined) {
                        console.log('');
                        console.log(chalk.bold('Output:'));
                        console.log(JSON.stringify(result.output, null, 2));
                    }
                }
                else {
                    console.log(chalk.red('✗'), chalk.bold(`${result.command} failed`));
                    console.log(chalk.red(`  Error: ${result.error}`));
                    console.log(chalk.dim(`  Duration: ${result.duration}ms`));
                    process.exit(1);
                }
                console.log('');
            }
            process.exit(result.success ? 0 : 1);
        }
        catch (error) {
            if (options.json) {
                console.log(JSON.stringify({ error: error.message }));
            }
            else {
                console.error(chalk.red('Error:'), error.message);
            }
            process.exit(1);
        }
    });
    return run;
}
/**
 * Parse command options from raw args
 * Handles --key value and --key=value formats
 */
function parseCommandOptions(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const eqIndex = arg.indexOf('=');
            if (eqIndex !== -1) {
                // --key=value format
                const key = arg.slice(2, eqIndex);
                const value = arg.slice(eqIndex + 1);
                options[key] = parseValue(value);
            }
            else {
                // --key value format
                const key = arg.slice(2);
                const nextArg = args[i + 1];
                if (nextArg && !nextArg.startsWith('--')) {
                    options[key] = parseValue(nextArg);
                    i++; // Skip the value in next iteration
                }
                else {
                    // Boolean flag
                    options[key] = true;
                }
            }
        }
        else if (arg.startsWith('-') && arg.length === 2) {
            // Short option -k value
            const key = arg.slice(1);
            const nextArg = args[i + 1];
            if (nextArg && !nextArg.startsWith('-')) {
                options[key] = parseValue(nextArg);
                i++;
            }
            else {
                options[key] = true;
            }
        }
    }
    return options;
}
/**
 * Parse a string value to its appropriate type
 */
function parseValue(value) {
    // Boolean
    if (value === 'true')
        return true;
    if (value === 'false')
        return false;
    // Number
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '')
        return num;
    // String
    return value;
}
/**
 * Create minimal env for local execution
 */
function createLocalEnv() {
    return process.env;
}
/**
 * Create minimal execution context for local execution
 */
function createLocalContext() {
    return {
        waitUntil: (_promise) => { },
        passThroughOnException: () => { },
    };
}
