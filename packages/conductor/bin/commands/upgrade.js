/**
 * Upgrade Command
 *
 * Helps migrate Conductor projects to newer versions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { glob } = require('glob');
const YAML = require('yaml');
const chalk = require('chalk');

async function upgrade(options) {
	console.log('\n🔄 Upgrading Conductor...\n');

	const cwd = process.cwd();
	const packageJsonPath = path.join(cwd, 'package.json');

	// Check if we're in a conductor project
	if (!fs.existsSync(packageJsonPath)) {
		console.error('❌ Not in a Node.js project (no package.json found)');
		process.exit(1);
	}

	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
	const currentVersion = packageJson.dependencies?.['@ensemble-edge/conductor'];

	if (!currentVersion) {
		console.error('❌ Conductor not found in dependencies');
		process.exit(1);
	}

	console.log(`Current version: ${currentVersion}`);

	// Check for latest version
	console.log('\n📡 Checking for updates...');

	let latestVersion;
	try {
		const npmView = execSync('npm view @ensemble-edge/conductor version', {
			encoding: 'utf-8'
		}).trim();
		latestVersion = npmView;
	} catch (error) {
		console.error('❌ Failed to check for updates');
		console.error('   Make sure you have internet connection');
		process.exit(1);
	}

	console.log(`Latest version: ${latestVersion}`);

	// Check if already up to date
	const currentClean = currentVersion.replace(/[\^~]/, '');
	if (currentClean === latestVersion) {
		console.log('\n✅ Already up to date!\n');
		return;
	}

	// Confirm upgrade
	if (!options.yes) {
		console.log('\n⚠️  This will update Conductor to the latest version');
		console.log('   Review the changelog before upgrading:');
		console.log('   https://github.com/ensemble-edge/conductor/releases\n');

		// In a real implementation, you'd prompt for confirmation
		// For now, we'll just show what would happen
		console.log('Run with --yes to proceed automatically\n');
		return;
	}

	// Perform upgrade
	console.log('\n📦 Installing latest version...');
	try {
		execSync('npm install @ensemble-edge/conductor@latest', {
			cwd,
			stdio: 'inherit'
		});
	} catch (error) {
		console.error('\n❌ Upgrade failed');
		process.exit(1);
	}

	// Run migrations
	console.log('\n🔧 Checking for migrations...');

	const migrations = getMigrationsNeeded(currentClean, latestVersion);

	if (migrations.length === 0) {
		console.log('  No migrations needed');
	} else {
		console.log(`  Found ${migrations.length} migration(s) to apply:\n`);

		for (const migration of migrations) {
			console.log(`  - ${migration.name}`);

			try {
				await runMigration(migration, cwd);
				console.log(`    ✓ Applied`);
			} catch (error) {
				console.error(`    ✗ Failed: ${error.message}`);
			}
		}
	}

	// Check configuration
	console.log('\n🔍 Verifying configuration...');

	const configIssues = checkConfiguration(cwd);

	if (configIssues.length > 0) {
		console.log('\n⚠️  Manual steps required:\n');
		configIssues.forEach((issue, i) => {
			console.log(`  ${i + 1}. ${issue}`);
		});
		console.log('');
	}

	// Check member models for deprecations
	await checkMemberModels(cwd);

	console.log('\n✅ Upgrade complete!\n');
	console.log('Next steps:');
	console.log('  1. Review changes in your project');
	console.log('  2. Test with: npm run dev');
	console.log('  3. Commit changes\n');
}

function getMigrationsNeeded(fromVersion, toVersion) {
	// This would be populated based on actual version migrations
	// For now, return empty array
	const migrations = [];

	// Example migration structure:
	// migrations.push({
	//   name: 'Update member.yaml schema',
	//   from: '0.0.1',
	//   to: '0.1.0',
	//   run: async (cwd) => { /* migration logic */ }
	// });

	return migrations;
}

async function runMigration(migration, cwd) {
	if (migration.run) {
		await migration.run(cwd);
	}
}

function checkConfiguration(cwd) {
	const issues = [];

	// Check for common configuration issues
	const wranglerPath = path.join(cwd, 'wrangler.toml');
	if (!fs.existsSync(wranglerPath)) {
		issues.push('Create wrangler.toml for Cloudflare Workers configuration');
	}

	const srcPath = path.join(cwd, 'src');
	if (!fs.existsSync(srcPath)) {
		issues.push('Create src/ directory with worker entry point');
	}

	return issues;
}

async function checkMemberModels(cwd) {
	console.log('\n📋 Checking member models...\n');

	// Find all member.yaml files
	const memberFiles = await glob('members/*/member.yaml', { cwd });

	if (memberFiles.length === 0) {
		console.log('  No members found\n');
		return;
	}

	// Load AI provider data from catalog using shared loader
	const { loadPlatformData } = require('../utils/platform-loader');

	let platformData;
	try {
		platformData = loadPlatformData('cloudflare');
	} catch (error) {
		console.log(chalk.yellow(`  ⚠  Could not load platform data: ${error.message}\n`));
		return;
	}

	const modelData = platformData.models;

	console.log(chalk.gray(`  AI providers loaded: ${Object.keys(modelData.providers).join(', ')}`));
	console.log(chalk.gray(`  Last updated: ${modelData.lastUpdated}\n`));

	// Check each member config
	const issues = [];

	for (const file of memberFiles) {
		const filePath = path.join(cwd, file);
		const content = fs.readFileSync(filePath, 'utf-8');
		const config = YAML.parse(content);

		if (config.type === 'Think' && config.config?.model) {
			const modelId = config.config.model;
			const modelInfo = findModel(modelData, modelId);

			if (modelInfo) {
				if (modelInfo.status === 'deprecated') {
					issues.push({
						file,
						member: config.name,
						type: 'deprecation',
						model: modelId,
						...modelInfo
					});
				}
			} else {
				issues.push({
					file,
					member: config.name,
					type: 'unknown',
					model: modelId
				});
			}
		}
	}

	// Report issues
	if (issues.length === 0) {
		console.log(chalk.green('  ✓ All models are up to date!\n'));
		return;
	}

	console.log(chalk.yellow(`  Found ${issues.length} model issue(s):\n`));

	for (const issue of issues) {
		if (issue.type === 'deprecation') {
			console.log(chalk.yellow(`  ⚠ ${issue.file}`));
			console.log(chalk.gray(`    Member: ${issue.member}`));
			console.log(chalk.red(`    Model "${issue.model}" is deprecated`));

			if (issue.deprecatedAt) {
				console.log(chalk.gray(`    Deprecated: ${issue.deprecatedAt}`));
			}

			if (issue.deprecatedReason) {
				console.log(chalk.gray(`    Reason: ${issue.deprecatedReason}`));
			}

			if (issue.endOfLife) {
				const daysUntilEOL = Math.floor(
					(new Date(issue.endOfLife) - new Date()) / (1000 * 60 * 60 * 24)
				);

				if (daysUntilEOL > 0) {
					console.log(chalk.yellow(`    End of life: ${issue.endOfLife} (${daysUntilEOL} days)`));
				} else {
					console.log(chalk.red(`    End of life: ${issue.endOfLife} (EXPIRED)`));
				}
			}

			if (issue.replacementModel) {
				console.log(chalk.green(`    → Recommended: "${issue.replacementModel}"`));
			}

			console.log();
		} else if (issue.type === 'unknown') {
			console.log(chalk.yellow(`  ⚠ ${issue.file}`));
			console.log(chalk.gray(`    Member: ${issue.member}`));
			console.log(chalk.yellow(`    Model "${issue.model}" not found in platform data`));
			console.log(chalk.gray(`    This may be a custom model or typo`));
			console.log();
		}
	}

	// Provide action items
	console.log(chalk.bold('  Recommended actions:'));
	console.log(chalk.gray('  1. Update deprecated models in your member configs'));
	console.log(chalk.gray('  2. Test with the new models'));
	console.log(chalk.gray('  3. Deploy when ready'));
	console.log();
}

function findModel(modelData, modelId) {
	for (const provider of Object.values(modelData.providers)) {
		const model = provider.models.find((m) => m.id === modelId);
		if (model) return model;
	}
	return null;
}

module.exports = { upgrade };
