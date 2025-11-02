#!/usr/bin/env node

/**
 * Check Configuration Command
 *
 * Validates member configurations against platform data
 * - Model IDs against platform model lists
 * - Deprecation status
 * - Platform bindings and requirements
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const YAML = require('yaml');
const chalk = require('chalk');

async function checkConfig(options = {}) {
	console.log(chalk.blue('\n🔍 Checking configuration...\n'));

	const cwd = process.cwd();
	const platform = options.platform || 'cloudflare';

	// Load platform data
	const platformData = loadPlatformData(platform);
	if (!platformData) {
		console.error(chalk.red(`\n❌ Could not load platform data for "${platform}"\n`));
		process.exit(1);
	}

	console.log(chalk.gray(`Platform: ${platform}`));
	console.log(chalk.gray(`Data version: ${platformData.models.version}`));
	console.log(chalk.gray(`Last updated: ${platformData.models.lastUpdated}\n`));

	let totalIssues = 0;

	// 1. Check members
	const memberIssues = await checkMembers(cwd, platformData);
	totalIssues += memberIssues;

	// 2. Check ensembles
	const ensembleIssues = await checkEnsembles(cwd);
	totalIssues += ensembleIssues;

	// 3. Check platform config
	const platformIssues = await checkPlatformConfig(cwd, platform);
	totalIssues += platformIssues;

	// Summary
	if (totalIssues === 0) {
		console.log(chalk.green('\n✅ Configuration check complete - no issues found!\n'));
	} else {
		console.log(chalk.yellow(`\n⚠️  Configuration check complete - found ${totalIssues} issue(s)\n`));
		console.log(chalk.gray('Run `conductor upgrade` to update platform data'));
		console.log(chalk.gray('Review and update your member configurations as needed\n'));
	}
}

function loadPlatformData(platform) {
	try {
		const conductorPath = path.dirname(require.resolve('@ensemble-edge/conductor/package.json'));

		// Load AI provider data from catalog
		const aiProvidersPath = path.join(conductorPath, 'catalog/ai');
		if (!fs.existsSync(aiProvidersPath)) {
			return null;
		}

		const models = loadAllProviders(aiProvidersPath);
		if (!models) {
			return null;
		}

		// Load cloud platform capabilities
		const cloudPlatformPath = path.join(conductorPath, 'catalog/cloud', platform);
		let capabilities = {};

		if (fs.existsSync(cloudPlatformPath)) {
			const capabilitiesFile = path.join(cloudPlatformPath, 'capabilities.json');
			if (fs.existsSync(capabilitiesFile)) {
				capabilities = JSON.parse(fs.readFileSync(capabilitiesFile, 'utf-8'));
			}
		}

		return { models, capabilities };
	} catch (error) {
		console.error(chalk.red(`Error loading platform data: ${error.message}`));
		return null;
	}
}

function loadAllProviders(aiProvidersPath) {
	try {
		const manifestPath = path.join(aiProvidersPath, 'manifest.json');
		if (!fs.existsSync(manifestPath)) {
			return null;
		}

		const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
		const providers = {};
		let lastUpdated = manifest.lastUpdated || new Date().toISOString();

		// Load each provider's model catalog
		for (const [providerId, providerInfo] of Object.entries(manifest.providers)) {
			const providerFile = path.join(aiProvidersPath, `${providerId}.json`);

			if (fs.existsSync(providerFile)) {
				const providerData = JSON.parse(fs.readFileSync(providerFile, 'utf-8'));
				providers[providerId] = {
					name: providerData.name,
					description: providerData.description,
					models: providerData.models || []
				};

				// Track most recent update
				if (providerData.lastUpdated && providerData.lastUpdated > lastUpdated) {
					lastUpdated = providerData.lastUpdated;
				}
			}
		}

		return {
			version: manifest.version,
			lastUpdated,
			providers
		};
	} catch (error) {
		console.error(chalk.red(`Error loading providers: ${error.message}`));
		return null;
	}
}

async function checkMembers(cwd, platformData) {
	console.log(chalk.bold('1. Checking members...\n'));

	const memberFiles = await glob('members/*/member.yaml', { cwd });

	if (memberFiles.length === 0) {
		console.log(chalk.gray('   No members found\n'));
		return 0;
	}

	let issueCount = 0;
	const modelData = platformData.models;

	for (const file of memberFiles) {
		const filePath = path.join(cwd, file);
		const content = fs.readFileSync(filePath, 'utf-8');
		const config = YAML.parse(content);

		// Check Think members
		if (config.type === 'Think' && config.config?.model) {
			const model = findModel(modelData, config.config.model);

			if (!model) {
				console.log(chalk.yellow(`   ⚠ ${file}`));
				console.log(chalk.gray(`     Unknown model: "${config.config.model}"`));
				console.log(chalk.gray(`     This may be a custom model or typo\n`));
				issueCount++;
			} else if (model.status === 'deprecated') {
				console.log(chalk.red(`   ✗ ${file}`));
				console.log(chalk.gray(`     Member: ${config.name}`));
				console.log(chalk.red(`     Model "${config.config.model}" is deprecated`));

				if (model.deprecatedReason) {
					console.log(chalk.gray(`     Reason: ${model.deprecatedReason}`));
				}

				if (model.endOfLife) {
					const daysUntilEOL = Math.floor(
						(new Date(model.endOfLife) - new Date()) / (1000 * 60 * 60 * 24)
					);

					if (daysUntilEOL > 0) {
						console.log(chalk.yellow(`     End of life in ${daysUntilEOL} days (${model.endOfLife})`));
					} else {
						console.log(chalk.red(`     End of life: ${model.endOfLife} (EXPIRED)`));
					}
				}

				if (model.replacementModel) {
					console.log(chalk.green(`     → Use "${model.replacementModel}" instead`));
				}

				console.log();
				issueCount++;
			} else {
				// Model is valid and active
				const provider = getProviderForModel(modelData, config.config.model);
				console.log(chalk.green(`   ✓ ${file}`));
				console.log(chalk.gray(`     Model: ${config.config.model} (${provider})\n`));
			}
		}
	}

	if (issueCount === 0 && memberFiles.length > 0) {
		console.log(chalk.green('   All members are valid!\n'));
	}

	return issueCount;
}

async function checkEnsembles(cwd) {
	console.log(chalk.bold('2. Checking ensembles...\n'));

	const ensembleFiles = await glob('ensembles/*.yaml', { cwd });

	if (ensembleFiles.length === 0) {
		console.log(chalk.gray('   No ensembles found\n'));
		return 0;
	}

	for (const file of ensembleFiles) {
		try {
			const filePath = path.join(cwd, file);
			const content = fs.readFileSync(filePath, 'utf-8');
			const config = YAML.parse(content);

			console.log(chalk.green(`   ✓ ${file}`));
			console.log(chalk.gray(`     Ensemble: ${config.name || 'unnamed'}\n`));
		} catch (error) {
			console.log(chalk.red(`   ✗ ${file}`));
			console.log(chalk.gray(`     Error: ${error.message}\n`));
			return 1;
		}
	}

	return 0;
}

async function checkPlatformConfig(cwd, platform) {
	console.log(chalk.bold('3. Checking platform configuration...\n'));

	if (platform === 'cloudflare') {
		const wranglerPath = path.join(cwd, 'wrangler.toml');

		if (!fs.existsSync(wranglerPath)) {
			console.log(chalk.red('   ✗ wrangler.toml not found'));
			console.log(chalk.gray('     Create wrangler.toml for Cloudflare Workers\n'));
			return 1;
		}

		console.log(chalk.green('   ✓ wrangler.toml found\n'));
	}

	return 0;
}

function findModel(modelData, modelId) {
	for (const provider of Object.values(modelData.providers)) {
		const model = provider.models.find((m) => m.id === modelId);
		if (model) return model;
	}
	return null;
}

function getProviderForModel(modelData, modelId) {
	for (const [providerName, providerData] of Object.entries(modelData.providers)) {
		const model = providerData.models.find((m) => m.id === modelId);
		if (model) return providerName;
	}
	return 'unknown';
}

// Export for use in other commands
module.exports = { checkConfig };

// Run if called directly
if (require.main === module) {
	checkConfig().catch((error) => {
		console.error(chalk.red('Error checking config:'), error);
		process.exit(1);
	});
}
