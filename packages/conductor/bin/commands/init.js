/**
 * Init Command
 *
 * Creates a new Conductor project from template
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function init(projectName, options) {
	console.log(`\n🎭 Creating Conductor project: ${projectName}\n`);

	const projectPath = path.resolve(process.cwd(), projectName);

	// Check if directory already exists
	if (fs.existsSync(projectPath)) {
		console.error(`❌ Directory ${projectName} already exists`);
		process.exit(1);
	}

	try {
		// Create project directory
		fs.mkdirSync(projectPath, { recursive: true });

		// Copy template
		console.log('📁 Creating project structure...');
		const templatePath = path.join(__dirname, '../../catalog/cloud/cloudflare/templates');
		copyDirectory(templatePath, projectPath);

		// Update package.json with project name
		const packageJsonPath = path.join(projectPath, 'package.json');
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
		packageJson.name = projectName;
		fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

		// Install dependencies
		if (options.install !== false) {
			console.log('\n📦 Installing dependencies...');
			console.log('   This may take a minute...\n');

			try {
				execSync('npm install', {
					cwd: projectPath,
					stdio: 'inherit'
				});
			} catch (error) {
				console.warn('\n⚠️  npm install failed. You can run it manually later.');
			}

			// Check for edgit
			console.log('\n🔍 Checking for Edgit...');
			try {
				execSync('npx edgit --version', {
					cwd: projectPath,
					stdio: 'pipe'
				});
				console.log('✓ Edgit is available');

				// Initialize edgit
				console.log('\n🎯 Initializing Edgit...');
				execSync('npx edgit init', {
					cwd: projectPath,
					stdio: 'inherit'
				});
			} catch (error) {
				console.log('\n⚠️  Edgit not found. Install it with:');
				console.log('   npm install @ensemble-edge/edgit\n');
			}
		}

		// Initialize git
		if (options.git !== false) {
			console.log('\n📝 Initializing git repository...');
			try {
				execSync('git init', {
					cwd: projectPath,
					stdio: 'pipe'
				});
				execSync('git add .', {
					cwd: projectPath,
					stdio: 'pipe'
				});
				execSync('git commit -m "Initial commit from conductor init"', {
					cwd: projectPath,
					stdio: 'pipe'
				});
				console.log('✓ Git repository initialized');
			} catch (error) {
				console.warn('⚠️  Git initialization failed (may not have git installed)');
			}
		}

		// Success message
		console.log('\n✨ Project created successfully!\n');
		console.log('Next steps:');
		console.log(`  cd ${projectName}`);
		console.log('  pnpm run dev\n');
		console.log('Then visit http://localhost:8787\n');
		console.log('📚 Docs: https://github.com/ensemble-edge/conductor\n');

	} catch (error) {
		console.error('\n❌ Failed to create project:');
		console.error(error.message);

		// Cleanup on failure
		if (fs.existsSync(projectPath)) {
			fs.rmSync(projectPath, { recursive: true, force: true });
		}

		process.exit(1);
	}
}

/**
 * Recursively copy directory
 */
function copyDirectory(src, dest) {
	fs.mkdirSync(dest, { recursive: true });

	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			copyDirectory(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

module.exports = { init };
