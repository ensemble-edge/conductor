/**
 * Platform Data Loader - Single Source of Truth
 *
 * Eliminates duplication across CLI commands by providing a shared
 * utility for loading platform data (AI providers, capabilities).
 */

const fs = require('fs');
const path = require('path');

/**
 * Platform Data Loader with caching
 */
class PlatformDataLoader {
	constructor(options = {}) {
		this.conductorPath = options.conductorPath || this.findConductorPath();
		this.ttl = options.ttl || 60000; // 1 minute default cache TTL
		this.cache = new Map();
	}

	/**
	 * Find the conductor package path
	 */
	findConductorPath() {
		try {
			return path.dirname(require.resolve('@ensemble-edge/conductor/package.json'));
		} catch (error) {
			// Fallback for development
			return path.join(__dirname, '../..');
		}
	}

	/**
	 * Load platform data with caching
	 * @param {string} platform - Platform name (e.g., 'cloudflare')
	 * @returns {Object} Platform data including models and capabilities
	 */
	load(platform) {
		const cacheKey = `platform:${platform}`;
		const cached = this.getFromCache(cacheKey);

		if (cached) {
			return cached;
		}

		const data = this.loadPlatformData(platform);
		this.setInCache(cacheKey, data);
		return data;
	}

	/**
	 * Load platform data from disk
	 * @param {string} platform - Platform name
	 * @returns {Object} Platform data
	 */
	loadPlatformData(platform) {
		try {
			// Load AI provider data
			const aiProvidersPath = path.join(this.conductorPath, 'catalog/ai');
			const models = this.loadAllProviders(aiProvidersPath);

			if (!models) {
				throw new Error(`Could not load AI provider data from ${aiProvidersPath}`);
			}

			// Load cloud platform capabilities
			const capabilities = this.loadCapabilities(platform);

			return { models, capabilities };
		} catch (error) {
			throw new Error(`Failed to load platform data for "${platform}": ${error.message}`);
		}
	}

	/**
	 * Load all AI providers from catalog
	 * @param {string} aiProvidersPath - Path to AI providers catalog
	 * @returns {Object} Providers data with version and models
	 */
	loadAllProviders(aiProvidersPath) {
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
			console.error(`Error loading providers: ${error.message}`);
			return null;
		}
	}

	/**
	 * Load platform capabilities
	 * @param {string} platform - Platform name
	 * @returns {Object} Platform capabilities
	 */
	loadCapabilities(platform) {
		try {
			const cloudPlatformPath = path.join(this.conductorPath, 'catalog/cloud', platform);
			let capabilities = {};

			if (fs.existsSync(cloudPlatformPath)) {
				const capabilitiesFile = path.join(cloudPlatformPath, 'capabilities.json');

				if (fs.existsSync(capabilitiesFile)) {
					capabilities = JSON.parse(fs.readFileSync(capabilitiesFile, 'utf-8'));
				}
			}

			return capabilities;
		} catch (error) {
			console.warn(`Warning: Could not load capabilities for ${platform}: ${error.message}`);
			return {};
		}
	}

	/**
	 * Get item from cache
	 * @param {string} key - Cache key
	 * @returns {any} Cached value or null if expired/missing
	 */
	getFromCache(key) {
		const entry = this.cache.get(key);

		if (!entry) {
			return null;
		}

		const isExpired = Date.now() - entry.timestamp > this.ttl;

		if (isExpired) {
			this.cache.delete(key);
			return null;
		}

		return entry.data;
	}

	/**
	 * Set item in cache
	 * @param {string} key - Cache key
	 * @param {any} data - Data to cache
	 */
	setInCache(key, data) {
		this.cache.set(key, {
			data,
			timestamp: Date.now()
		});
	}

	/**
	 * Clear cache
	 */
	clearCache() {
		this.cache.clear();
	}

	/**
	 * Get cache statistics
	 * @returns {Object} Cache stats
	 */
	getCacheStats() {
		return {
			size: this.cache.size,
			keys: Array.from(this.cache.keys())
		};
	}
}

/**
 * Singleton instance for CLI commands
 */
let sharedLoader = null;

/**
 * Get or create the shared platform loader
 * @param {Object} options - Loader options
 * @returns {PlatformDataLoader} Shared loader instance
 */
function getLoader(options = {}) {
	if (!sharedLoader) {
		sharedLoader = new PlatformDataLoader(options);
	}
	return sharedLoader;
}

/**
 * Load platform data (convenience function)
 * @param {string} platform - Platform name
 * @param {Object} options - Loader options
 * @returns {Object} Platform data
 */
function loadPlatformData(platform, options = {}) {
	const loader = getLoader(options);
	return loader.load(platform);
}

/**
 * Clear the shared cache
 */
function clearCache() {
	if (sharedLoader) {
		sharedLoader.clearCache();
	}
}

module.exports = {
	PlatformDataLoader,
	getLoader,
	loadPlatformData,
	clearCache
};
