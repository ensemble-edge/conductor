/**
 * Validate Command
 *
 * Validates YAML syntax and member references in ensembles
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

async function validate(options) {
	console.log('\n🔍 Validating Conductor project...\n');

	const cwd = process.cwd();
	const membersDir = path.join(cwd, 'members');
	const ensemblesDir = path.join(cwd, 'ensembles');

	let hasErrors = false;
	const errors = [];
	const warnings = [];

	// Check if directories exist
	if (!fs.existsSync(membersDir)) {
		errors.push('Members directory not found: members/');
		hasErrors = true;
	}

	if (!fs.existsSync(ensemblesDir)) {
		warnings.push('Ensembles directory not found: ensembles/');
	}

	// Validate members
	const members = new Map();
	if (fs.existsSync(membersDir)) {
		console.log('📋 Validating members...');

		const memberDirs = fs.readdirSync(membersDir, { withFileTypes: true })
			.filter(d => d.isDirectory())
			.map(d => d.name);

		for (const memberName of memberDirs) {
			const memberYamlPath = path.join(membersDir, memberName, 'member.yaml');
			const memberImplPath = path.join(membersDir, memberName, 'index.ts');

			// Check member.yaml exists
			if (!fs.existsSync(memberYamlPath)) {
				errors.push(`Member "${memberName}" missing member.yaml`);
				hasErrors = true;
				continue;
			}

			// Parse member.yaml
			try {
				const yamlContent = fs.readFileSync(memberYamlPath, 'utf-8');
				const memberConfig = YAML.parse(yamlContent);

				// Validate required fields
				if (!memberConfig.name) {
					errors.push(`Member "${memberName}" missing 'name' field`);
					hasErrors = true;
				}

				if (!memberConfig.type) {
					errors.push(`Member "${memberName}" missing 'type' field`);
					hasErrors = true;
				} else {
					const validTypes = ['Function', 'Think', 'Data', 'API', 'MCP', 'Scoring'];
					if (!validTypes.includes(memberConfig.type)) {
						errors.push(`Member "${memberName}" has invalid type: ${memberConfig.type}`);
						hasErrors = true;
					}
				}

				members.set(memberConfig.name || memberName, memberConfig);
				console.log(`  ✓ ${memberName}`);

			} catch (error) {
				errors.push(`Member "${memberName}" has invalid YAML: ${error.message}`);
				hasErrors = true;
			}

			// Check implementation exists
			if (!fs.existsSync(memberImplPath)) {
				warnings.push(`Member "${memberName}" missing index.ts implementation`);
			}
		}
	}

	// Validate ensembles
	if (fs.existsSync(ensemblesDir)) {
		console.log('\n📋 Validating ensembles...');

		const ensembleFiles = fs.readdirSync(ensemblesDir)
			.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

		for (const ensembleFile of ensembleFiles) {
			const ensemblePath = path.join(ensemblesDir, ensembleFile);

			try {
				const yamlContent = fs.readFileSync(ensemblePath, 'utf-8');
				const ensembleConfig = YAML.parse(yamlContent);

				// Validate required fields
				if (!ensembleConfig.name) {
					errors.push(`Ensemble "${ensembleFile}" missing 'name' field`);
					hasErrors = true;
				}

				if (!ensembleConfig.flow || !Array.isArray(ensembleConfig.flow)) {
					errors.push(`Ensemble "${ensembleFile}" missing or invalid 'flow' field`);
					hasErrors = true;
				} else {
					// Validate member references
					for (const step of ensembleConfig.flow) {
						if (!step.member) {
							errors.push(`Ensemble "${ensembleFile}" has flow step without 'member' field`);
							hasErrors = true;
						} else if (!members.has(step.member)) {
							errors.push(`Ensemble "${ensembleFile}" references unknown member: ${step.member}`);
							hasErrors = true;
						}
					}
				}

				console.log(`  ✓ ${ensembleFile}`);

			} catch (error) {
				errors.push(`Ensemble "${ensembleFile}" has invalid YAML: ${error.message}`);
				hasErrors = true;
			}
		}
	}

	// Report results
	console.log('\n' + '='.repeat(50));

	if (warnings.length > 0) {
		console.log('\n⚠️  Warnings:');
		warnings.forEach(w => console.log(`  - ${w}`));
	}

	if (errors.length > 0) {
		console.log('\n❌ Errors:');
		errors.forEach(e => console.log(`  - ${e}`));
		console.log('\n');
		process.exit(1);
	}

	if (warnings.length === 0) {
		console.log('\n✅ All validations passed!\n');
	} else {
		console.log('\n✅ Validation passed with warnings\n');
	}
}

module.exports = { validate };
