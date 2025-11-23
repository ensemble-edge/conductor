#!/usr/bin/env node
/**
 * Build script for CLI
 *
 * Bundles the CLI into a single executable file.
 */

import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version from package.json
const packageJson = JSON.parse(readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
const version = packageJson.version || '0.0.0';

async function build() {
	try {
		await esbuild.build({
			entryPoints: [path.join(__dirname, '../src/cli/index.ts')],
			bundle: true,
			platform: 'node',
			target: 'node20',
			format: 'esm',
			outfile: path.join(__dirname, '../dist/cli.js'),
			banner: {
				js: '#!/usr/bin/env node\n',
			},
			external: [
				// Don't bundle these, they should be installed as dependencies
				'chalk',
				'commander',
				'yaml'
			],
			define: {
				// Inject version at build time
				__CONDUCTOR_VERSION__: JSON.stringify(version),
			},
			sourcemap: false,
			minify: false,
		});

		console.log('✓ CLI bundled successfully to dist/cli.js');
	} catch (error) {
		console.error('Build failed:', error);
		process.exit(1);
	}
}

build();
