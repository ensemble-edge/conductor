/**
 * Conductor SDK Usage Examples
 *
 * Shows how to use the type-safe TypeScript SDK.
 */

import { createClient, createMemberHelpers, ConductorError } from '../src/sdk';

// ==================== Basic Usage ====================

async function basicExample() {
	// Create client
	const client = createClient({
		baseUrl: 'https://api.conductor.dev',
		apiKey: 'your-api-key',
		timeout: 30000
	});

	try {
		// Execute fetch agent
		const result = await client.execute({
			agent: 'fetch',
			input: {
				url: 'https://api.github.com/users/octocat'
			}
		});

		if (result.success) {
			console.log('Status:', result.data.statusCode);
			console.log('Body:', result.data.body);
			console.log('Duration:', result.metadata.duration, 'ms');
		}
	} catch (error) {
		if (error instanceof ConductorError) {
			console.error('Error:', error.code, error.message);
			console.error('Request ID:', error.requestId);
		}
	}
}

// ==================== Type-Safe Agent Helpers ====================

async function typeSafeExample() {
	const client = createClient({
		baseUrl: 'https://api.conductor.dev',
		apiKey: 'your-api-key'
	});

	const agents = createMemberHelpers(client);

	// Fetch with type safety
	const fetchResult = await agents.fetch(
		{
			url: 'https://api.example.com/data',
			method: 'GET',
			headers: { Authorization: 'Bearer token' }
		},
		{
			timeout: 5000,
			maxRetries: 3
		}
	);

	if (fetchResult.success) {
		// TypeScript knows the shape of data
		console.log('Status:', fetchResult.data.statusCode);
		console.log('Attempt:', fetchResult.data.attempt);
	}

	// Scrape with type safety
	const scrapeResult = await agents.scrape(
		{ url: 'https://example.com' },
		{ strategy: 'balanced' }
	);

	if (scrapeResult.success) {
		console.log('HTML length:', scrapeResult.data.html.length);
		console.log('Tier used:', scrapeResult.data.tier);
		console.log('Bot protection:', scrapeResult.data.botProtection?.detected);
	}

	// Validate with type safety
	const validateResult = await agents.validate(
		{
			content: 'The product is great!',
			evalType: 'nlp',
			reference: 'The product is excellent!'
		},
		{
			threshold: 0.7,
			metrics: ['bleu', 'rouge']
		}
	);

	if (validateResult.success) {
		console.log('Passed:', validateResult.data.passed);
		console.log('Score:', validateResult.data.score);
		console.log('Scores:', validateResult.data.scores);
	}

	// RAG with type safety
	const ragIndexResult = await agents.ragIndex(
		'This is important content to index',
		'my-namespace',
		{ chunkSize: 500, chunkStrategy: 'semantic' }
	);

	if (ragIndexResult.success) {
		console.log('Indexed:', ragIndexResult.data.indexed);
		console.log('Chunks:', ragIndexResult.data.chunks);
	}

	const ragSearchResult = await agents.ragSearch(
		'important content',
		'my-namespace',
		{ topK: 5, minScore: 0.7 }
	);

	if (ragSearchResult.success) {
		console.log('Results:', ragSearchResult.data.count);
		ragSearchResult.data.results.forEach((r) => {
			console.log('- Content:', r.content.substring(0, 50));
			console.log('  Score:', r.score);
		});
	}

	// HITL with type safety
	const hitlRequestResult = await agents.hitlRequest(
		{ action: 'approve-purchase', amount: 1000, vendor: 'Acme Corp' },
		{ notificationMethod: 'slack', slackChannel: '#approvals' }
	);

	if (hitlRequestResult.success) {
		console.log('Approval ID:', hitlRequestResult.data.approvalId);
		console.log('Status:', hitlRequestResult.data.status);

		// Later, respond to approval
		const approvalId = hitlRequestResult.data.approvalId;
		const hitlRespondResult = await agents.hitlRespond(approvalId, true, 'Approved by manager');

		if (hitlRespondResult.success) {
			console.log('Approval processed:', hitlRespondResult.data.approved);
		}
	}
}

// ==================== Agent Discovery ====================

async function discoveryExample() {
	const client = createClient({
		baseUrl: 'https://api.conductor.dev',
		apiKey: 'your-api-key'
	});

	// List all agents
	const agents = await client.listMembers();
	console.log('Available agents:');
	agents.forEach((m) => {
		console.log(`- ${m.name} (${m.type}) - ${m.description}`);
	});

	// Get agent details
	const fetchMember = await client.getAgent('fetch');
	console.log('Fetch agent:');
	console.log('- Name:', fetchMember.name);
	console.log('- Version:', fetchMember.version);
	console.log('- Config schema:', fetchMember.config?.schema);
	console.log('- Input schema:', fetchMember.input?.schema);
	console.log('- Examples:', fetchMember.input?.examples);
}

// ==================== Health Checks ====================

async function healthExample() {
	const client = createClient({
		baseUrl: 'https://api.conductor.dev'
		// No API key needed for health checks
	});

	// Check health
	const health = await client.health();
	console.log('Health status:', health.status);
	console.log('Version:', health.version);
	console.log('Database:', health.checks.database);
	console.log('Cache:', health.checks.cache);

	// Check ready
	const ready = await client.ready();
	console.log('Ready:', ready);

	// Check alive
	const alive = await client.alive();
	console.log('Alive:', alive);
}

// ==================== Error Handling ====================

async function errorHandlingExample() {
	const client = createClient({
		baseUrl: 'https://api.conductor.dev',
		apiKey: 'your-api-key'
	});

	try {
		await client.execute({
			agent: 'invalid-agent',
			input: {}
		});
	} catch (error) {
		if (error instanceof ConductorError) {
			console.error('Error code:', error.code);
			console.error('Message:', error.message);
			console.error('Details:', error.details);
			console.error('Request ID:', error.requestId);

			// Handle specific errors
			switch (error.code) {
				case 'MemberNotFound':
					console.log('Agent does not exist');
					break;
				case 'ValidationError':
					console.log('Invalid input:', error.details);
					break;
				case 'TimeoutError':
					console.log('Request timed out');
					break;
				case 'NetworkError':
					console.log('Network issue:', error.message);
					break;
				default:
					console.log('Unknown error:', error.code);
			}
		}
	}
}

// Run examples
if (require.main === module) {
	console.log('=== Basic Example ===');
	basicExample().catch(console.error);

	console.log('\n=== Type-Safe Example ===');
	typeSafeExample().catch(console.error);

	console.log('\n=== Discovery Example ===');
	discoveryExample().catch(console.error);

	console.log('\n=== Health Example ===');
	healthExample().catch(console.error);

	console.log('\n=== Error Handling Example ===');
	errorHandlingExample().catch(console.error);
}
