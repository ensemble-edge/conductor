/**
 * Build and pack Conductor locally for integration testing
 *
 * Uses file-based locking to prevent parallel builds across vitest workers.
 */
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { access, mkdir, rename, readFile, writeFile, unlink, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const execAsync = promisify(exec);
// Get the directory of this file, then go up to conductor package root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONDUCTOR_DIR = join(__dirname, '../../../'); // From src/__integration__/setup to root
const CACHE_DIR = join(CONDUCTOR_DIR, '.integration-cache');
const LOCK_FILE = join(CACHE_DIR, '.build.lock');
const LOCK_TIMEOUT_MS = 120000; // 2 minutes - max time to wait for another build
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
/**
 * Acquire a file-based lock for building
 * Returns true if lock was acquired, false if should wait
 */
async function tryAcquireLock() {
    try {
        // Ensure cache directory exists
        await mkdir(CACHE_DIR, { recursive: true });
        // Check if lock file exists and is stale (older than timeout)
        if (await exists(LOCK_FILE)) {
            const lockStat = await stat(LOCK_FILE);
            const lockAge = Date.now() - lockStat.mtimeMs;
            if (lockAge > LOCK_TIMEOUT_MS) {
                // Lock is stale, remove it
                console.log('🔓 Removing stale build lock...');
                await unlink(LOCK_FILE);
            }
            else {
                // Lock is active, another process is building
                return false;
            }
        }
        // Try to create the lock file (atomic operation)
        await writeFile(LOCK_FILE, `${process.pid}:${Date.now()}`, { flag: 'wx' });
        return true;
    }
    catch (error) {
        // EEXIST means another process created the lock first
        if (error.code === 'EEXIST') {
            return false;
        }
        throw error;
    }
}
/**
 * Release the build lock
 */
async function releaseLock() {
    try {
        await unlink(LOCK_FILE);
    }
    catch {
        // Ignore errors when releasing lock
    }
}
/**
 * Wait for another build to complete by polling for the tarball
 */
async function waitForBuild(tarballPath, maxWaitMs = LOCK_TIMEOUT_MS) {
    const startTime = Date.now();
    const pollInterval = 500; // Check every 500ms
    while (Date.now() - startTime < maxWaitMs) {
        // Check if tarball now exists
        if (await exists(tarballPath)) {
            return;
        }
        // Check if lock was released (build might have failed)
        if (!(await exists(LOCK_FILE))) {
            // Lock released but no tarball - try to acquire and build ourselves
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Timeout waiting for build after ${maxWaitMs}ms`);
}
/**
 * Build and pack Conductor into a tarball
 *
 * Uses file-based locking to ensure only one build happens at a time,
 * even when vitest runs tests in parallel across worker processes.
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
    // Try to acquire the build lock
    const gotLock = await tryAcquireLock();
    if (!gotLock) {
        // Another process is building, wait for it
        console.log('⏳ Waiting for another build to complete...');
        await waitForBuild(cachedTarball);
        // Check if tarball now exists
        if (await exists(cachedTarball)) {
            console.log(`✅ Using tarball from parallel build: ${tarballName}`);
            return cachedTarball;
        }
        // Tarball still doesn't exist, try to acquire lock and build
        const retryLock = await tryAcquireLock();
        if (!retryLock) {
            throw new Error('Failed to acquire build lock after waiting');
        }
    }
    // We have the lock, perform the build
    try {
        // Double-check cache (another process might have just finished)
        if (await exists(cachedTarball)) {
            console.log(`✅ Using cached tarball: ${tarballName}`);
            return cachedTarball;
        }
        console.log('🔨 Building Conductor...');
        const buildStart = Date.now();
        // Build the package
        await execAsync('pnpm build', {
            cwd: CONDUCTOR_DIR,
            env: { ...process.env, NODE_ENV: 'production' },
        });
        const buildTime = Date.now() - buildStart;
        console.log(`✅ Build completed in ${buildTime}ms`);
        // Pack into tarball
        console.log('📦 Packing tarball...');
        const { stdout } = await execAsync('pnpm pack', {
            cwd: CONDUCTOR_DIR,
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
        await releaseLock();
    }
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
