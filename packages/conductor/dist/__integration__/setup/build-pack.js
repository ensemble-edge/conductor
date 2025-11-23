/**
 * Build and pack Conductor locally for integration testing
 */
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { access, mkdir, rename, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const execAsync = promisify(exec);
// Get the directory of this file, then go up to conductor package root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONDUCTOR_DIR = join(__dirname, '../../../'); // From src/__integration__/setup to root
const CACHE_DIR = join(CONDUCTOR_DIR, '.integration-cache');
/**
 * Check if a file exists
 */
async function exists(path) {
    try {
        await access(path);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Get package version from package.json
 */
async function getPackageVersion() {
    const pkgPath = join(CONDUCTOR_DIR, 'package.json');
    const content = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);
    return pkg.version;
}
// Simple lock to prevent parallel builds
let buildLock = null;
/**
 * Build and pack Conductor into a tarball
 *
 * @returns Path to the tarball
 */
export async function buildAndPackConductor() {
    console.log('📦 Building and packing Conductor...');
    const version = await getPackageVersion();
    const tarballName = `ensemble-edge-conductor-${version}.tgz`;
    const cachedTarball = join(CACHE_DIR, tarballName);
    // Check if already cached
    if (await exists(cachedTarball)) {
        console.log(`✅ Using cached tarball: ${tarballName}`);
        return cachedTarball;
    }
    // If another test is already building, wait for it
    if (buildLock) {
        console.log('⏳ Waiting for ongoing build...');
        return await buildLock;
    }
    // Start the build and store the promise
    buildLock = (async () => {
        console.log('🔨 Building Conductor...');
        const buildStart = Date.now();
        try {
            // Build the package
            await execAsync('pnpm build', {
                cwd: CONDUCTOR_DIR,
                env: { ...process.env, NODE_ENV: 'production' }
            });
            const buildTime = Date.now() - buildStart;
            console.log(`✅ Build completed in ${buildTime}ms`);
            // Pack into tarball
            console.log('📦 Packing tarball...');
            const { stdout } = await execAsync('pnpm pack', {
                cwd: CONDUCTOR_DIR
            });
            // Extract tarball filename from output
            const lines = stdout.trim().split('\n');
            const tarballLine = lines[lines.length - 1];
            const generatedTarball = join(CONDUCTOR_DIR, tarballLine.trim());
            // Create cache directory
            await mkdir(CACHE_DIR, { recursive: true });
            // Move to cache (check if it already exists first in case of race condition)
            if (!(await exists(cachedTarball))) {
                await rename(generatedTarball, cachedTarball);
            }
            console.log(`✅ Tarball cached: ${tarballName}`);
            return cachedTarball;
        }
        catch (error) {
            console.error('❌ Build/pack failed:', error);
            throw error;
        }
        finally {
            buildLock = null;
        }
    })();
    return await buildLock;
}
/**
 * Clear the cache (useful for forcing rebuild)
 */
export async function clearCache() {
    const { rm } = await import('node:fs/promises');
    if (await exists(CACHE_DIR)) {
        await rm(CACHE_DIR, { recursive: true, force: true });
        console.log('🗑️  Cache cleared');
    }
}
