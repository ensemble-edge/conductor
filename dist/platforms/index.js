/**
 * Platform Adapters
 *
 * Provides platform-specific functionality for different deployment targets
 */
// Base platform types and interfaces
export * from './base/index.js';
// Platform adapters
export { CloudflarePlatform, createCloudfarePlatform } from './cloudflare/index.js';
// Note: createCloudfarePlatform requires modelsData and capabilitiesData parameters
// CLI commands load these from the platforms/ directory in the npm package
