/**
 * Build Command
 *
 * Run build triggers for ensembles.
 * Ensembles with `trigger: [{ type: build }]` will be executed at build time.
 *
 * Usage:
 *   conductor build              - Run all build triggers
 *   conductor build --filter docs - Run only 'docs' ensemble
 *   conductor build --dry-run    - Show what would run without executing
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { getBuildManager } from '../../runtime/build-manager.js';
import { LocalLoader } from '../local-loader.js';
export function createBuildCommand() {
    const build = new Command('build')
        .description('Run build triggers for ensembles')
        .option('-f, --filter <names>', 'Only run specific ensembles (comma-separated)')
        .option('--dry-run', 'Show what would run without executing')
        .option('-v, --verbose', 'Show detailed output')
        .action(async (options) => {
        try {
            console.log('');
            console.log(chalk.bold('🔨 Running build triggers'));
            console.log(chalk.dim('─'.repeat(50)));
            console.log('');
            // Create local loader for filesystem access
            const loader = new LocalLoader();
            // Check if ensembles directory exists
            const ensemblesDir = loader.getEnsemblesDir();
            if (!(await loader.directoryExists(ensemblesDir))) {
                console.log(chalk.yellow(`No ensembles directory found at ${ensemblesDir}`));
                console.log('');
                console.log(chalk.dim('Create ensembles with build triggers:'));
                console.log(chalk.dim('  mkdir -p catalog/ensembles'));
                console.log(chalk.dim('  # Add ensemble YAML files with build triggers'));
                console.log('');
                return;
            }
            // Load ensembles with build triggers
            const ensembles = await loader.loadBuildEnsembles();
            if (ensembles.length === 0) {
                console.log(chalk.yellow('No ensembles with build triggers found.'));
                console.log('');
                console.log(chalk.dim('Add a build trigger to an ensemble:'));
                console.log(chalk.dim('  trigger:'));
                console.log(chalk.dim('    - type: build'));
                console.log(chalk.dim('      output: ./dist/docs'));
                console.log('');
                return;
            }
            // Register ensembles with build manager
            const buildManager = getBuildManager();
            buildManager.registerAll(ensembles);
            // Parse filter
            const filter = options.filter ? options.filter.split(',').map((s) => s.trim()) : undefined;
            if (options.verbose || options.dryRun) {
                console.log(chalk.bold('Build ensembles found:'));
                for (const ensemble of buildManager.listBuildEnsembles()) {
                    console.log(`  • ${chalk.cyan(ensemble.ensembleName)}`);
                    for (const trigger of ensemble.triggers) {
                        console.log(chalk.dim(`    output: ${trigger.output || '(none)'}`));
                    }
                }
                console.log('');
            }
            if (options.dryRun) {
                console.log(chalk.yellow('Dry run - no ensembles executed'));
                console.log('');
                return;
            }
            // Create minimal env and ctx for local execution
            const env = createLocalEnv();
            const ctx = createLocalContext();
            // Run build triggers
            const results = await buildManager.runBuildTriggers(env, ctx, {
                filter,
                dryRun: false,
            });
            // Display results
            console.log('');
            console.log(chalk.bold('Results:'));
            console.log('');
            for (const result of results) {
                if (result.success) {
                    console.log(chalk.green('✓'), chalk.bold(result.ensemble));
                    console.log(chalk.dim(`  Duration: ${result.duration}ms`));
                    if (result.outputPath) {
                        console.log(chalk.dim(`  Output: ${result.outputPath}`));
                    }
                }
                else {
                    console.log(chalk.red('✗'), chalk.bold(result.ensemble));
                    console.log(chalk.red(`  Error: ${result.error}`));
                }
                console.log('');
            }
            // Summary
            const successful = results.filter((r) => r.success).length;
            const failed = results.filter((r) => !r.success).length;
            console.log(chalk.dim('─'.repeat(50)));
            if (failed === 0) {
                console.log(chalk.green(`✓ ${successful} build trigger(s) completed successfully`));
            }
            else {
                console.log(chalk.yellow(`${successful} succeeded, ${chalk.red(failed + ' failed')}`));
                process.exit(1);
            }
            console.log('');
        }
        catch (error) {
            console.error(chalk.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return build;
}
/**
 * Create minimal env for local execution
 */
function createLocalEnv() {
    // Return process.env as Env (CLI runs in Node.js, not Workers)
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
