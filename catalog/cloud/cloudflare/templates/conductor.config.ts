/**
 * Conductor Configuration
 *
 * Configure your Conductor project settings here.
 */

export default {
	/**
	 * Documentation generation settings
	 */
	docs: {
		/**
		 * Use AI to enhance documentation
		 * When true, `conductor docs generate` will use the docs-writer member
		 * to create production-quality API documentation.
		 *
		 * Set to false for basic auto-generated docs (faster but less detailed).
		 */
		useAI: true,

		/**
		 * AI member to use for documentation enhancement
		 */
		aiMember: 'docs-writer',

		/**
		 * Output format (yaml or json)
		 */
		format: 'yaml' as 'yaml' | 'json',

		/**
		 * Include examples in generated documentation
		 */
		includeExamples: true,

		/**
		 * Include security schemes in documentation
		 */
		includeSecurity: true
	},

	/**
	 * Testing configuration
	 */
	testing: {
		/**
		 * Coverage thresholds
		 */
		coverage: {
			lines: 70,
			functions: 70,
			branches: 65,
			statements: 70
		}
	},

	/**
	 * Observability configuration
	 */
	observability: {
		/**
		 * Enable structured logging
		 */
		logging: true,

		/**
		 * Log level (debug, info, warn, error)
		 */
		logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error',

		/**
		 * Enable Analytics Engine metrics
		 */
		metrics: true
	}
};
