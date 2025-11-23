#!/usr/bin/env node

/**
 * Cache Warming Script
 *
 * Warms edge cache after deployment by hitting configured routes
 *
 * Usage:
 *   node scripts/warm-cache.js --url https://myapp.com
 *   npm run warm-cache -- --url https://myapp.com
 */

import { glob } from 'glob';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);
const urlIndex = args.indexOf('--url');
const baseUrl = urlIndex !== -1 ? args[urlIndex + 1] : process.env.BASE_URL;

if (!baseUrl) {
	console.error('❌ Error: --url argument or BASE_URL environment variable required');
	console.error('Usage: node scripts/warm-cache.js --url https://myapp.com');
	process.exit(1);
}

console.log('🔥 Conductor Cache Warming');
console.log(`📍 Base URL: ${baseUrl}\n`);

// Find all member YAML files (pages, ensembles, etc.)
const patterns = [
	join(__dirname, '../catalog/cloud/cloudflare/templates/pages/**/*.yaml'),
	join(__dirname, '../catalog/cloud/cloudflare/templates/ensembles/**/*.yaml')
];

const memberFiles = patterns.flatMap(pattern => glob.sync(pattern));

console.log(`📄 Found ${memberFiles.length} member files\n`);

// Extract routes to warm from any member type
const routesToWarm = [];

for (const file of memberFiles) {
	try {
		const content = readFileSync(file, 'utf-8');
		const member = parse(content);

		// Check if cache warming is enabled
		const warming = member.cache?.warming || member.cache?.prewarm;
		if (!member.cache?.enabled || !warming) {
			continue;
		}

		// Extract route (supports both member.route and direct path)
		const path = member.route?.path || member.path || `/${member.name}`;

		// Determine priority
		let priority = 50;
		if (path === '/' || path === '/index') priority = 100;
		if (path.includes('/api/')) priority = 30;
		if (path.includes('/:')) priority = 20;

		// Get member type for logging
		const memberType = member.type || 'page';

		routesToWarm.push({
			path,
			priority,
			name: member.name,
			type: memberType
		});

	} catch (error) {
		console.warn(`⚠️  Warning: Failed to parse ${file}:`, error.message);
	}
}

if (routesToWarm.length === 0) {
	console.log('ℹ️  No routes configured for cache warming');
	console.log('   Add cache.warming: true to member YAML to enable');
	console.log('   Works with any member type: Page, API, Data, etc.');
	process.exit(0);
}

// Sort by priority
routesToWarm.sort((a, b) => b.priority - a.priority);

console.log(`🎯 Warming ${routesToWarm.length} routes:\n`);

// Warm routes
const results = [];
const concurrency = 5;

for (let i = 0; i < routesToWarm.length; i += concurrency) {
	const batch = routesToWarm.slice(i, i + concurrency);

	const batchResults = await Promise.all(
		batch.map(async (route) => {
			const url = new URL(route.path, baseUrl).toString();
			const startTime = Date.now();

			try {
				const response = await fetch(url, {
					headers: {
						'User-Agent': 'Conductor-Cache-Warmer'
					}
				});

				const responseTime = Date.now() - startTime;
				const cacheStatus = response.headers.get('cf-cache-status') || 'unknown';

				return {
					route: route.path,
					name: route.name,
					success: response.ok,
					status: response.status,
					responseTime,
					cacheStatus
				};

			} catch (error) {
				return {
					route: route.path,
					name: route.name,
					success: false,
					error: error.message
				};
			}
		})
	);

	results.push(...batchResults);

	// Print batch results
	for (const result of batchResults) {
		const icon = result.success ? '✅' : '❌';
		const status = result.success ? `${result.status}` : `ERROR`;
		const time = result.responseTime ? `${result.responseTime}ms` : 'N/A';
		const cache = result.cacheStatus || 'N/A';

		console.log(`${icon} ${result.route.padEnd(30)} ${status.padEnd(5)} ${time.padEnd(8)} cache:${cache}`);

		if (result.error) {
			console.log(`   └─ ${result.error}`);
		}
	}
}

// Summary
console.log('\n📊 Cache Warming Summary');
console.log('─'.repeat(50));

const successful = results.filter(r => r.success).length;
const failed = results.filter(r => !r.success).length;
const avgTime = results
	.filter(r => r.responseTime)
	.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

console.log(`✅ Successful: ${successful}/${results.length}`);
console.log(`❌ Failed: ${failed}/${results.length}`);
console.log(`⏱️  Average response time: ${Math.round(avgTime)}ms`);

// Cache status breakdown
const cacheStatuses = {};
for (const result of results) {
	if (result.cacheStatus) {
		cacheStatuses[result.cacheStatus] = (cacheStatuses[result.cacheStatus] || 0) + 1;
	}
}

if (Object.keys(cacheStatuses).length > 0) {
	console.log('\n🗂️  Cache Status:');
	for (const [status, count] of Object.entries(cacheStatuses)) {
		console.log(`   ${status}: ${count}`);
	}
}

console.log('\n✨ Cache warming complete!\n');

// Exit with error code if any failed
process.exit(failed > 0 ? 1 : 0);
