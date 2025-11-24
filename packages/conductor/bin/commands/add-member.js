/**
 * Add Member Command
 *
 * Scaffolds a new member in the current project
 */

const fs = require('fs');
const path = require('path');

async function addMember(memberName, options) {
	console.log(`\n🎭 Adding member: ${memberName}\n`);

	const cwd = process.cwd();
	const membersDir = path.join(cwd, 'members');
	const memberDir = path.join(membersDir, memberName);

	// Check if we're in a conductor project
	const packageJsonPath = path.join(cwd, 'package.json');
	if (!fs.existsSync(packageJsonPath)) {
		console.error('❌ Not in a Node.js project (no package.json found)');
		console.log('   Run this command from your project root\n');
		process.exit(1);
	}

	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
	if (!packageJson.dependencies?.['@ensemble-edge/conductor']) {
		console.error('❌ Conductor not found in dependencies');
		console.log('   Install it first: pnpm install @ensemble-edge/conductor\n');
		process.exit(1);
	}

	// Check if member already exists
	if (fs.existsSync(memberDir)) {
		console.error(`❌ Member "${memberName}" already exists`);
		process.exit(1);
	}

	// Create members directory if it doesn't exist
	if (!fs.existsSync(membersDir)) {
		fs.mkdirSync(membersDir, { recursive: true });
	}

	// Create member directory
	fs.mkdirSync(memberDir, { recursive: true });

	// Determine member type
	const type = options.type || 'Function';
	const validTypes = ['Function', 'Think', 'Data', 'API'];

	if (!validTypes.includes(type)) {
		console.error(`❌ Invalid member type: ${type}`);
		console.log(`   Valid types: ${validTypes.join(', ')}\n`);
		process.exit(1);
	}

	// Generate member.yaml
	const memberYaml = generateMemberYaml(memberName, type, options);
	fs.writeFileSync(path.join(memberDir, 'member.yaml'), memberYaml);

	// Generate implementation file
	const implCode = generateImplementation(memberName, type, options);
	fs.writeFileSync(path.join(memberDir, 'index.ts'), implCode);

	console.log('✓ Created member.yaml');
	console.log('✓ Created index.ts');

	// Create prompt file if requested
	if (options.withPrompt && type === 'Think') {
		const promptContent = generatePromptTemplate(memberName);
		fs.writeFileSync(path.join(memberDir, 'prompt.md'), promptContent);
		console.log('✓ Created prompt.md');
	}

	console.log(`\n✨ Member "${memberName}" created!\n`);
	console.log('Next steps:');
	console.log(`  1. Edit members/${memberName}/member.yaml to configure`);
	console.log(`  2. Edit members/${memberName}/index.ts to implement logic`);

	if (options.withPrompt && type === 'Think') {
		console.log(`  3. Edit members/${memberName}/prompt.md to define your prompt`);
		console.log(`  4. Register prompt with Edgit: edgit component publish members/${memberName}/prompt.md`);
		console.log(`  5. Register member in src/index.ts\n`);
	} else {
		console.log(`  3. Register in src/index.ts\n`);
	}
}

function generateMemberYaml(name, type, options) {
	const description = options.description || `${type} member for ${name}`;

	let yaml = `name: ${name}
type: ${type}
description: ${description}

schema:
  input:
    # Define your input schema
`;

	if (type === 'Think') {
		yaml += `    prompt: string
  output:
    content: string

config:
  model: gpt-4
  provider: openai
  temperature: 0.7
  maxTokens: 2000
`;
	} else if (type === 'Data') {
		yaml += `    key: string
  output:
    value: any
    found: boolean

config:
  storage: kv
  operation: get
  binding: CACHE
`;
	} else if (type === 'API') {
		yaml += `    url: string
  output:
    data: object

config:
  method: GET
  timeout: 5000
`;
	} else {
		yaml += `    value: any
  output:
    result: any
`;
	}

	return yaml;
}

function generateImplementation(name, type, options = {}) {
	if (type === 'Function') {
		return `/**
 * ${name} Member
 *
 * Function member implementation
 */

import { createFunctionMember } from '@ensemble-edge/conductor/sdk';

export default createFunctionMember({
  async handler({ input, state, env }) {
    // Your implementation here

    return {
      result: \`Processed: \${input.value}\`
    };
  }
});
`;
	}

	if (type === 'Think') {
		if (options.withPrompt) {
			// Template with Edgit integration
			return `/**
 * ${name} Member
 *
 * Think member implementation (AI reasoning with Edgit prompt)
 */

import { createThinkMember, loadComponent } from '@ensemble-edge/conductor/sdk';

export default createThinkMember({
  async handler({ input, state, env }) {
    // Load versioned prompt from Edgit
    const prompt = await loadComponent('${name}-prompt@latest', env);

    // TODO: Use prompt with AI reasoning
    // const response = await callAI(prompt, input);

    return {
      content: 'AI response here',
      confidence: 0.95
    };
  }
});
`;
		} else {
			// Standard template without Edgit
			return `/**
 * ${name} Member
 *
 * Think member implementation (AI reasoning)
 */

import { createThinkMember } from '@ensemble-edge/conductor/sdk';

export default createThinkMember({
  async handler({ input, state, env }) {
    // AI reasoning logic
    // Config from member.yaml will be used

    return {
      content: 'AI response here',
      confidence: 0.95
    };
  }
});
`;
		}
	}

	if (type === 'Data') {
		return `/**
 * ${name} Member
 *
 * Data member implementation (KV/D1/R2 operations)
 */

import { createDataMember } from '@ensemble-edge/conductor/sdk';

export default createDataMember({
  async handler({ input, state, env }) {
    // Data operations
    // Storage config from member.yaml

    const value = await env.CACHE.get(input.key);

    return {
      value,
      found: !!value
    };
  }
});
`;
	}

	if (type === 'API') {
		return `/**
 * ${name} Member
 *
 * API member implementation (HTTP requests)
 */

import { createAPIMember } from '@ensemble-edge/conductor/sdk';

export default createAPIMember({
  async handler({ input, state, env }) {
    // HTTP request logic
    // Config from member.yaml

    const response = await fetch(input.url);
    const data = await response.json();

    return {
      data
    };
  }
});
`;
	}

	return `export default async function ${name}({ input }) {
  return { result: 'Not implemented' };
}
`;
}

function generatePromptTemplate(name) {
	return `# ${name} Prompt

## Context
This prompt is used by the ${name} member for AI reasoning.

## Instructions

You are an AI assistant helping with [describe the task].

Given the following input:
- [Input parameter 1]: [Description]
- [Input parameter 2]: [Description]

Your task is to:
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Output Format

Return your response in the following format:
\`\`\`json
{
  "content": "Your analysis here",
  "confidence": 0.95
}
\`\`\`

## Examples

### Example 1
Input: [Example input]
Output: [Example output]

### Example 2
Input: [Example input]
Output: [Example output]

## Notes
- [Any additional context or constraints]
- [Tips for better results]
`;
}

module.exports = { addMember };
