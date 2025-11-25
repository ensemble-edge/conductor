/**
 * Import Command - Import bundled ensembles or agents into a project
 *
 * Features:
 * - Extracts .tar.gz or .zip bundles
 * - Validates bundle manifest
 * - Places files in correct directories
 * - Handles file conflicts with --force or --skip options
 * - Shows diff preview for conflicting files
 */
import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream } from 'fs';
import { createGunzip } from 'zlib';
import { extract as tarExtract } from 'tar';
import * as unzipper from 'unzipper';
/**
 * Extract files from a tar.gz archive
 */
async function extractTarGz(archivePath) {
    const files = [];
    const tempDir = path.join(path.dirname(archivePath), `.temp-extract-${Date.now()}`);
    try {
        await fs.mkdir(tempDir, { recursive: true });
        // Extract to temp directory
        await new Promise((resolve, reject) => {
            createReadStream(archivePath)
                .pipe(createGunzip())
                .pipe(tarExtract({ cwd: tempDir }))
                .on('finish', resolve)
                .on('error', reject);
        });
        // Read all extracted files
        async function readDir(dir, basePath = '') {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.join(basePath, entry.name);
                if (entry.isDirectory()) {
                    await readDir(fullPath, relativePath);
                }
                else {
                    const content = await fs.readFile(fullPath);
                    files.push({ path: relativePath, content });
                }
            }
        }
        await readDir(tempDir);
        return files;
    }
    finally {
        // Cleanup temp directory
        await fs.rm(tempDir, { recursive: true, force: true });
    }
}
/**
 * Extract files from a zip archive
 */
async function extractZip(archivePath) {
    const files = [];
    const directory = await unzipper.Open.file(archivePath);
    for (const file of directory.files) {
        if (file.type === 'File') {
            const content = await file.buffer();
            files.push({ path: file.path, content });
        }
    }
    return files;
}
/**
 * Detect archive format from file extension or magic bytes
 */
async function detectFormat(archivePath) {
    // Check extension first
    if (archivePath.endsWith('.tar.gz') || archivePath.endsWith('.tgz')) {
        return 'tar';
    }
    if (archivePath.endsWith('.zip')) {
        return 'zip';
    }
    // Check magic bytes
    const handle = await fs.open(archivePath, 'r');
    const buffer = Buffer.alloc(4);
    await handle.read(buffer, 0, 4, 0);
    await handle.close();
    // ZIP magic bytes: PK (0x50 0x4B)
    if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
        return 'zip';
    }
    // Assume tar.gz for gzip magic bytes (0x1f 0x8b)
    if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
        return 'tar';
    }
    // Default to tar
    return 'tar';
}
/**
 * Map bundle path to target path
 */
function mapBundlePathToTarget(bundlePath, options) {
    const targetDir = options.targetDir || process.cwd();
    const segments = bundlePath.split('/');
    const dir = segments[0];
    const fileName = segments.slice(1).join('/');
    switch (dir) {
        case 'ensembles':
            return path.join(targetDir, options.ensemblesDir || 'ensembles', fileName);
        case 'agents':
            return path.join(targetDir, options.agentsDir || 'agents', fileName);
        case 'prompts':
            return path.join(targetDir, options.promptsDir || 'prompts', fileName);
        case 'handlers':
            return path.join(targetDir, options.handlersDir || 'handlers', fileName);
        case 'configs':
            return path.join(targetDir, options.configsDir || 'configs', fileName);
        default:
            return path.join(targetDir, bundlePath);
    }
}
/**
 * Check if a file already exists and is different
 */
async function checkConflict(targetPath, newContent) {
    try {
        const existingContent = await fs.readFile(targetPath);
        return {
            exists: true,
            different: !existingContent.equals(newContent),
        };
    }
    catch {
        return { exists: false, different: false };
    }
}
export function createImportCommand() {
    const importCmd = new Command('import');
    importCmd
        .description('Import a bundled ensemble or agent into the project')
        .argument('<bundle>', 'Path to the bundle file (.tar.gz or .zip)')
        .option('-f, --force', 'Overwrite existing files without prompting')
        .option('-s, --skip', 'Skip existing files without prompting')
        .option('--dry-run', 'Preview import without writing files')
        .option('--target-dir <dir>', 'Target directory for import', '.')
        .option('--ensembles-dir <dir>', 'Ensembles directory', 'ensembles')
        .option('--agents-dir <dir>', 'Agents directory', 'agents')
        .option('--prompts-dir <dir>', 'Prompts directory', 'prompts')
        .option('--handlers-dir <dir>', 'Handlers directory', 'handlers')
        .option('--configs-dir <dir>', 'Configs directory', 'configs')
        .action(async (bundlePath, options) => {
        try {
            const resolvedPath = path.resolve(process.cwd(), bundlePath);
            // Check if bundle exists
            try {
                await fs.access(resolvedPath);
            }
            catch {
                console.error(chalk.red('Error:'), `Bundle not found: ${bundlePath}`);
                process.exit(1);
            }
            console.log('');
            console.log(chalk.bold('Importing bundle:'), path.basename(bundlePath));
            console.log(chalk.dim('─'.repeat(50)));
            // Detect format and extract
            const format = await detectFormat(resolvedPath);
            console.log(chalk.dim(`Format: ${format === 'tar' ? 'tar.gz' : 'zip'}`));
            console.log('');
            const files = format === 'tar' ? await extractTarGz(resolvedPath) : await extractZip(resolvedPath);
            // Find and parse manifest
            const manifestFile = files.find((f) => f.path === 'manifest.json');
            if (!manifestFile) {
                console.error(chalk.red('Error:'), 'Bundle is missing manifest.json - invalid bundle');
                process.exit(1);
            }
            const manifest = JSON.parse(manifestFile.content.toString('utf-8'));
            console.log(chalk.bold('Bundle Info:'));
            console.log(`  Type: ${manifest.type}`);
            console.log(`  Name: ${manifest.name}`);
            if (manifest.description) {
                console.log(`  Description: ${manifest.description}`);
            }
            console.log(`  Created: ${new Date(manifest.createdAt).toLocaleString()}`);
            console.log(`  Files: ${manifest.files.length}`);
            console.log('');
            // Process files (excluding manifest)
            const filesToImport = files.filter((f) => f.path !== 'manifest.json');
            const results = [];
            const conflicts = [];
            console.log(chalk.bold('Processing files:'));
            for (const file of filesToImport) {
                const targetPath = mapBundlePathToTarget(file.path, options);
                const { exists, different } = await checkConflict(targetPath, file.content);
                const typeIcon = {
                    ensembles: '📦',
                    agents: '🤖',
                    prompts: '📝',
                    handlers: '⚙️',
                    configs: '🔧',
                }[file.path.split('/')[0]] || '📄';
                if (!exists) {
                    // New file - will be created
                    console.log(`  ${typeIcon} ${chalk.green('+')} ${file.path}`, chalk.dim(`→ ${path.relative(process.cwd(), targetPath)}`));
                    results.push({ path: targetPath, status: 'created' });
                    if (!options.dryRun) {
                        await fs.mkdir(path.dirname(targetPath), { recursive: true });
                        await fs.writeFile(targetPath, file.content);
                    }
                }
                else if (!different) {
                    // Same content - skip
                    console.log(`  ${typeIcon} ${chalk.dim('=')} ${file.path}`, chalk.dim('(unchanged)'));
                    results.push({ path: targetPath, status: 'skipped' });
                }
                else if (options.force) {
                    // Different but force - overwrite
                    console.log(`  ${typeIcon} ${chalk.yellow('!')} ${file.path}`, chalk.yellow('(overwritten)'));
                    results.push({ path: targetPath, status: 'updated' });
                    if (!options.dryRun) {
                        await fs.writeFile(targetPath, file.content);
                    }
                }
                else if (options.skip) {
                    // Different but skip - keep existing
                    console.log(`  ${typeIcon} ${chalk.cyan('-')} ${file.path}`, chalk.cyan('(skipped - exists)'));
                    results.push({ path: targetPath, status: 'skipped' });
                }
                else {
                    // Conflict - needs resolution
                    console.log(`  ${typeIcon} ${chalk.red('?')} ${file.path}`, chalk.red('(conflict)'));
                    conflicts.push({ bundlePath: file.path, targetPath });
                    results.push({ path: targetPath, status: 'conflict' });
                }
            }
            console.log('');
            console.log(chalk.dim('─'.repeat(50)));
            // Summary
            const created = results.filter((r) => r.status === 'created').length;
            const updated = results.filter((r) => r.status === 'updated').length;
            const skipped = results.filter((r) => r.status === 'skipped').length;
            const conflictCount = results.filter((r) => r.status === 'conflict').length;
            console.log('');
            console.log(chalk.bold('Summary:'));
            if (created > 0)
                console.log(`  ${chalk.green('+')} ${created} file(s) created`);
            if (updated > 0)
                console.log(`  ${chalk.yellow('!')} ${updated} file(s) updated`);
            if (skipped > 0)
                console.log(`  ${chalk.dim('=')} ${skipped} file(s) skipped`);
            if (conflictCount > 0) {
                console.log(`  ${chalk.red('?')} ${conflictCount} conflict(s)`);
            }
            if (options.dryRun) {
                console.log('');
                console.log(chalk.yellow('Dry run - no files were written'));
            }
            if (conflicts.length > 0 && !options.dryRun) {
                console.log('');
                console.log(chalk.yellow('Conflicts detected!'));
                console.log(chalk.dim('Re-run with --force to overwrite or --skip to keep existing'));
                console.log('');
                process.exit(1);
            }
            console.log('');
            if (!options.dryRun && conflictCount === 0) {
                console.log(chalk.green('✓'), `Successfully imported ${manifest.type}: ${manifest.name}`);
                console.log('');
            }
        }
        catch (error) {
            console.error(chalk.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return importCmd;
}
