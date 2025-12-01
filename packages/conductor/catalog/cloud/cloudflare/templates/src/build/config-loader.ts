/**
 * Build-Time Configuration Loader
 *
 * Loads conductor.config.json from the project root at build time.
 * Used by Vite plugins to read discovery configuration.
 *
 * This is a Node.js module (build-time only, not bundled for Workers).
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  DiscoveryConfig,
  AgentDiscoveryConfig,
  EnsembleDiscoveryConfig,
  DocsDiscoveryConfig,
  ScriptsDiscoveryConfig,
} from '../../../../../src/config/discovery.js';
import {
  DEFAULT_AGENT_DISCOVERY,
  DEFAULT_ENSEMBLE_DISCOVERY,
  DEFAULT_DOCS_DISCOVERY,
  DEFAULT_SCRIPTS_DISCOVERY,
  mergeDiscoveryConfig,
} from '../../../../../src/config/discovery.js';

/**
 * Config file names to look for (in order of preference)
 */
const CONFIG_FILE_NAMES = ['conductor.config.json', 'conductor.json', '.conductorrc.json'];

/**
 * Cached config by root directory
 */
const configCache = new Map<string, DiscoveryConfig>();

/**
 * Load conductor.config.json from a directory
 *
 * @param root - Project root directory
 * @returns Discovery configuration (merged with defaults)
 */
export function loadDiscoveryConfig(root: string): DiscoveryConfig {
  // Check cache first
  const cached = configCache.get(root);
  if (cached) {
    return cached;
  }

  // Try to find and load config file
  let rawConfig: { discovery?: Partial<DiscoveryConfig> } | null = null;

  for (const configFileName of CONFIG_FILE_NAMES) {
    const configPath = path.resolve(root, configFileName);
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        rawConfig = JSON.parse(content);
        console.log(`[conductor] Loaded config from ${configFileName}`);
        break;
      } catch (error) {
        console.warn(`[conductor] Failed to parse ${configFileName}:`, error);
      }
    }
  }

  // Merge with defaults
  const config = mergeDiscoveryConfig(rawConfig?.discovery);

  // Cache the result
  configCache.set(root, config);

  return config;
}

/**
 * Get agent discovery config from project root
 */
export function getAgentDiscoveryConfig(root: string): AgentDiscoveryConfig {
  const config = loadDiscoveryConfig(root);
  return config.agents || DEFAULT_AGENT_DISCOVERY;
}

/**
 * Get ensemble discovery config from project root
 */
export function getEnsembleDiscoveryConfig(root: string): EnsembleDiscoveryConfig {
  const config = loadDiscoveryConfig(root);
  return config.ensembles || DEFAULT_ENSEMBLE_DISCOVERY;
}

/**
 * Get docs discovery config from project root
 */
export function getDocsDiscoveryConfig(root: string): DocsDiscoveryConfig {
  const config = loadDiscoveryConfig(root);
  return config.docs || DEFAULT_DOCS_DISCOVERY;
}

/**
 * Get scripts discovery config from project root
 */
export function getScriptsDiscoveryConfig(root: string): ScriptsDiscoveryConfig {
  const config = loadDiscoveryConfig(root);
  return config.scripts || DEFAULT_SCRIPTS_DISCOVERY;
}

/**
 * Clear the config cache (useful for testing)
 */
export function clearConfigCache(): void {
  configCache.clear();
}

/**
 * Convert patterns array to glob pattern string
 */
export function patternsToGlob(patterns: string[]): string {
  if (patterns.length === 1) {
    return patterns[0];
  }
  // For file extension patterns like ["**/*.yaml", "**/*.yml"],
  // we need to handle them differently
  // Extract just the extensions and create a combined pattern
  return `{${patterns.join(',')}}`;
}

/**
 * Convert exclude dirs to glob ignore patterns
 */
export function excludeDirsToIgnore(excludeDirs: string[]): string[] {
  return excludeDirs.map((dir) => `${dir}/**`);
}

// Re-export defaults for convenience
export {
  DEFAULT_AGENT_DISCOVERY,
  DEFAULT_ENSEMBLE_DISCOVERY,
  DEFAULT_DOCS_DISCOVERY,
  DEFAULT_SCRIPTS_DISCOVERY,
};
