/**
 * TestRepo - Helper for creating isolated test environments
 *
 * Similar to edgit's TestGitRepo but for Conductor projects.
 * Creates temporary directories with ensemble/member definitions for testing.
 */

import { mkdtemp, rm, writeFile, readFile, access, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import type { EnsembleConfig, MemberConfig } from '../../src/runtime/parser';
import YAML from 'yaml';

export class TestRepo {
	constructor(public path: string) {}

	/**
	 * Create a new test repository in a temporary directory
	 */
	static async create(): Promise<TestRepo> {
		const tempDir = await mkdtemp(join(tmpdir(), 'conductor-test-'));
		return new TestRepo(tempDir);
	}

	/**
	 * Write a file to the repository
	 */
	async writeFile(relativePath: string, content: string): Promise<void> {
		const fullPath = join(this.path, relativePath);

		// Ensure directory exists
		await mkdir(dirname(fullPath), { recursive: true });

		await writeFile(fullPath, content, 'utf-8');
	}

	/**
	 * Write an ensemble configuration as YAML
	 */
	async writeEnsemble(name: string, config: EnsembleConfig): Promise<void> {
		const yamlContent = YAML.stringify(config);
		await this.writeFile(`ensembles/${name}.yaml`, yamlContent);
	}

	/**
	 * Write a member configuration as YAML
	 */
	async writeMember(name: string, config: MemberConfig): Promise<void> {
		const yamlContent = YAML.stringify(config);
		await this.writeFile(`members/${name}.yaml`, yamlContent);
	}

	/**
	 * Write conductor.config.ts
	 */
	async writeConfig(config: Record<string, unknown>): Promise<void> {
		const configContent = `export default ${JSON.stringify(config, null, 2)}`;
		await this.writeFile('conductor.config.ts', configContent);
	}

	/**
	 * Read a file from the repository
	 */
	async readFile(relativePath: string): Promise<string> {
		const fullPath = join(this.path, relativePath);
		return await readFile(fullPath, 'utf-8');
	}

	/**
	 * Read and parse a JSON file
	 */
	async readJSON<T = unknown>(relativePath: string): Promise<T> {
		const content = await this.readFile(relativePath);
		return JSON.parse(content) as T;
	}

	/**
	 * Read and parse a YAML file
	 */
	async readYAML<T = unknown>(relativePath: string): Promise<T> {
		const content = await this.readFile(relativePath);
		return YAML.parse(content) as T;
	}

	/**
	 * Check if a file exists
	 */
	async fileExists(relativePath: string): Promise<boolean> {
		try {
			const fullPath = join(this.path, relativePath);
			await access(fullPath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Get full path for a relative path
	 */
	resolve(relativePath: string): string {
		return join(this.path, relativePath);
	}

	/**
	 * Clean up the temporary repository
	 */
	async cleanup(): Promise<void> {
		try {
			await rm(this.path, { recursive: true, force: true });
		} catch (error) {
			// Ignore cleanup errors
			console.warn(`Failed to cleanup test repo ${this.path}:`, error);
		}
	}
}
