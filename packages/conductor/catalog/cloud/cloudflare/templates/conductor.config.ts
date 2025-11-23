/**
 * Conductor Configuration
 *
 * Configure your Conductor project settings here.
 */

import type { ConductorConfig } from '@ensemble-edge/conductor';

const config: ConductorConfig = {
	/**
	 * Project information
	 */
	name: 'my-conductor-project',
	version: '1.0.0',

	/**
	 * Routing and authentication configuration
	 */
	routing: {
		// Auto-discover pages from directory structure
		autoDiscover: true,

		// Base path for all routes
		basePath: '',

		// Authentication configuration
		auth: {
			// Type-specific defaults
			defaults: {
				// Pages: Cookie auth with login redirect
				pages: {
					requirement: 'required',
					methods: ['cookie'],
					onFailure: {
						action: 'redirect',
						redirectTo: '/login',
						preserveReturn: true
					},
					rateLimit: {
						requests: 100,
						window: 60,
						keyBy: 'user'
					}
				},

				// APIs: Bearer/API key auth
				api: {
					requirement: 'required',
					methods: ['bearer', 'apiKey'],
					rateLimit: {
						requests: 1000,
						window: 60,
						keyBy: 'apiKey'
					}
				},

				// Webhooks: Custom signature validation
				webhooks: {
					requirement: 'required',
					methods: ['custom'],
					rateLimit: {
						requests: 100,
						window: 60,
						keyBy: 'ip'
					}
				},

				// Forms: Optional auth with rate limiting
				forms: {
					requirement: 'optional',
					methods: ['cookie'],
					rateLimit: {
						requests: 10,
						window: 300,
						keyBy: 'ip'
					}
				},

				// Docs: Optional auth (shows Try It button when authenticated)
				docs: {
					requirement: 'optional',
					methods: ['bearer', 'apiKey']
				}
			},

			// Path-based rules (override defaults)
			rules: [
				// Public pages
				{ pattern: '/', auth: { requirement: 'public' } },
				{ pattern: '/login', auth: { requirement: 'public' } },
				{ pattern: '/signup', auth: { requirement: 'public' } },
				{ pattern: '/pricing', auth: { requirement: 'public' } },

				// Public API endpoints
				{
					pattern: '/api/v1/public/*',
					auth: {
						requirement: 'public',
						rateLimit: { requests: 100, window: 60, keyBy: 'ip' }
					}
				},

				// Admin pages
				{
					pattern: '/admin/*',
					auth: {
						requirement: 'required',
						methods: ['cookie'],
						roles: ['admin'],
						onFailure: { action: 'page', page: 'error-403' }
					},
					priority: 10
				},

				// Admin API
				{
					pattern: '/api/v1/admin/*',
					auth: {
						requirement: 'required',
						methods: ['bearer'],
						roles: ['admin']
					},
					priority: 10
				},

				// Stripe webhooks
				{
					pattern: '/webhooks/stripe*',
					auth: {
						requirement: 'required',
						methods: ['custom'],
						customValidator: 'stripe-signature'
					}
				},

				// GitHub webhooks
				{
					pattern: '/webhooks/github*',
					auth: {
						requirement: 'required',
						methods: ['custom'],
						customValidator: 'github-signature'
					}
				}
			]
		}
	}

	/**
	 * Documentation generation settings
	 * NOTE: Docs configuration is not yet integrated with the routing ConductorConfig type.
	 * This section is commented out until the types are merged.
	 */
	// docs: {
	// 	useAI: true,
	// 	aiAgent: 'docs-writer',
	// 	format: 'yaml' as 'yaml' | 'json',
	// 	includeExamples: true,
	// 	includeSecurity: true,
	// 	cache: {
	// 		enabled: true,
	// 		ttl: 3600 // 1 hour
	// 	}
	// }

	/**
	 * Testing configuration
	 * NOTE: Testing configuration is not yet integrated with the routing ConductorConfig type.
	 * This section is commented out until the types are merged.
	 */
	// testing: {
	// 	coverage: {
	// 		lines: 70,
	// 		functions: 70,
	// 		branches: 65,
	// 		statements: 70
	// 	}
	// }

	/**
	 * Observability configuration
	 * NOTE: Observability configuration is not yet integrated with the routing ConductorConfig type.
	 * This section is commented out until the types are merged.
	 */
	// observability: {
	// 	logging: true,
	// 	logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error',
	// 	metrics: true
	// }
};

export default config;
