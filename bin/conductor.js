#!/usr/bin/env node

/**
 * Conductor CLI
 *
 * Main entry point for the conductor command-line tool
 */

const { program } = require('commander');
const { init } = require('./commands/init');
const { addMember } = require('./commands/add-member');
const { validate } = require('./commands/validate');
const { upgrade } = require('./commands/upgrade');
const { checkConfig } = require('./commands/check-config');
const pkg = require('../package.json');

program
	.name('conductor')
	.description('Edge-native orchestration for AI members')
	.version(pkg.version);

// Init command
program
	.command('init <project-name>')
	.description('Create a new Conductor project')
	.option('--no-install', 'Skip npm install')
	.option('--no-git', 'Skip git initialization')
	.option('--template <name>', 'Use a specific template', 'default')
	.action(init);

// Add member command
program
	.command('add member <member-name>')
	.description('Add a new member to the project')
	.option('-t, --type <type>', 'Member type (Function, Think, Data, API)', 'Function')
	.option('-d, --description <desc>', 'Member description')
	.option('--with-prompt', 'Create prompt.md file for Think members (Edgit-ready)')
	.action(addMember);

// Validate command
program
	.command('validate')
	.description('Validate YAML files and member references')
	.action(validate);

// Upgrade command
program
	.command('upgrade')
	.description('Upgrade Conductor to the latest version')
	.option('-y, --yes', 'Skip confirmation prompt')
	.action(upgrade);

// Check config command
program
	.command('check-config')
	.description('Check configuration for deprecated models and issues')
	.option('-p, --platform <platform>', 'Target platform', 'cloudflare')
	.action(checkConfig);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
	program.outputHelp();
}
