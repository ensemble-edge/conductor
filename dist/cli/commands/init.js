/**
 * Init Command - Initialize a new Conductor project
 */
import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export function createInitCommand() {
    const init = new Command('init');
    init
        .description('Initialize a new Conductor project')
        .argument('[directory]', 'Project directory', '.')
        .option('--template <name>', 'Template to use (cloudflare)', 'cloudflare')
        .option('--force', 'Overwrite existing files')
        .action(async (directory, options) => {
        try {
            console.log('');
            console.log(chalk.bold('🎯 Initializing Conductor project...'));
            console.log('');
            const targetDir = path.resolve(process.cwd(), directory);
            // Check if directory exists and is not empty
            try {
                const files = await fs.readdir(targetDir);
                if (files.length > 0 && !options.force) {
                    console.error(chalk.red('Error: Directory is not empty'));
                    console.error('');
                    console.error(chalk.dim('Use --force to overwrite existing files'));
                    console.error('');
                    process.exit(1);
                }
            }
            catch (error) {
                // Directory doesn't exist, create it
                await fs.mkdir(targetDir, { recursive: true });
            }
            // Determine template path
            const templatePath = path.resolve(__dirname, '../../../catalog/cloud', options.template, 'templates');
            // Check if template exists
            try {
                await fs.access(templatePath);
            }
            catch (error) {
                console.error(chalk.red(`Error: Template '${options.template}' not found`));
                console.error('');
                console.error(chalk.dim('Available templates:'));
                console.error(chalk.dim('  - cloudflare (default)'));
                console.error('');
                process.exit(1);
            }
            console.log(chalk.cyan(`Template: ${options.template}`));
            console.log(chalk.cyan(`Target: ${targetDir}`));
            console.log('');
            // Copy template files
            await copyDirectory(templatePath, targetDir, options.force || false);
            console.log(chalk.green('✓ Project initialized successfully'));
            console.log('');
            // Show next steps
            console.log(chalk.bold('Next steps:'));
            console.log('');
            if (directory !== '.') {
                console.log(chalk.dim(`  1. cd ${directory}`));
            }
            console.log(chalk.dim(`  ${directory !== '.' ? '2' : '1'}. npm install`));
            console.log(chalk.dim(`  ${directory !== '.' ? '3' : '2'}. Review the generated files:`));
            console.log(chalk.dim('     - ensembles/    : Your workflows'));
            console.log(chalk.dim('     - members/      : AI members, functions, and agents'));
            console.log(chalk.dim('     - prompts/      : Prompt templates'));
            console.log(chalk.dim('     - configs/      : Configuration files'));
            console.log(chalk.dim(`  ${directory !== '.' ? '4' : '3'}. npx wrangler dev  : Start local development`));
            console.log('');
            console.log(chalk.dim('Documentation: https://docs.ensemble-edge.com/conductor'));
            console.log('');
        }
        catch (error) {
            console.error('');
            console.error(chalk.red('✗ Failed to initialize project'));
            console.error('');
            console.error(chalk.dim(error.message));
            if (error.stack) {
                console.error(chalk.dim(error.stack));
            }
            console.error('');
            process.exit(1);
        }
    });
    return init;
}
/**
 * Recursively copy a directory
 */
async function copyDirectory(src, dest, force) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath, force);
        }
        else {
            // Check if file exists
            if (!force) {
                try {
                    await fs.access(destPath);
                    console.log(chalk.yellow(`  ⊘ Skipping ${entry.name} (already exists)`));
                    continue;
                }
                catch {
                    // File doesn't exist, continue with copy
                }
            }
            await fs.copyFile(srcPath, destPath);
            console.log(chalk.dim(`  ✓ Created ${path.relative(dest, destPath)}`));
        }
    }
}
