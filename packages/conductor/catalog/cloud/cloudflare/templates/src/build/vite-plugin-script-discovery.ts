/**
 * Vite Plugin: Auto-Discovery of Scripts
 *
 * Scans scripts/ directory for TypeScript files and automatically generates
 * imports and registration code via virtual module.
 *
 * This enables the `script://` URI pattern for referencing reusable code
 * in ensembles without using `new Function()` (which is blocked in Workers).
 *
 * Example:
 *   scripts/transforms/csv.ts → script://transforms/csv
 *   scripts/validators/email.ts → script://validators/email
 *   scripts/health-check.ts → script://health-check
 */

import type { Plugin } from 'vite';
import { globSync } from 'glob';
import path from 'path';
import fs from 'fs';

const VIRTUAL_MODULE_ID = 'virtual:conductor-scripts';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

export interface ScriptDiscoveryOptions {
  /**
   * Directory to search for script files
   * @default 'scripts'
   */
  scriptsDir?: string;

  /**
   * File extension for script files
   * @default '.ts'
   */
  fileExtension?: string;

  /**
   * Directories to exclude from discovery
   * @default []
   */
  excludeDirs?: string[];
}

export function scriptDiscoveryPlugin(options: ScriptDiscoveryOptions = {}): Plugin {
  const scriptsDir = options.scriptsDir || 'scripts';
  const fileExtension = options.fileExtension || '.ts';
  const excludeDirs = options.excludeDirs || [];

  let root: string;

  return {
    name: 'conductor:script-discovery',

    configResolved(config) {
      root = config.root;
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const code = generateScriptsModule(root, scriptsDir, fileExtension, excludeDirs);
        return code;
      }
    },

    // Hot reload support for development
    handleHotUpdate({ file, server }) {
      const scriptsDirPath = path.resolve(root, scriptsDir);
      if (file.startsWith(scriptsDirPath) && file.endsWith(fileExtension)) {
        const module = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
        if (module) {
          server.moduleGraph.invalidateModule(module);
          return [module];
        }
      }
    },
  };
}

function generateScriptsModule(
  root: string,
  scriptsDir: string,
  fileExtension: string,
  excludeDirs: string[]
): string {
  const scriptsDirPath = path.resolve(root, scriptsDir);

  // Check if scripts directory exists
  if (!fs.existsSync(scriptsDirPath)) {
    // Scripts directory is optional - don't warn, just return empty module
    return `
/**
 * No scripts directory found.
 * Create a scripts/ directory with .ts files to use script:// URIs in ensembles.
 */
export const scripts = [];
export const scriptsMap = new Map();
`;
  }

  // Find all TypeScript files in scripts directory
  const scriptFiles = globSync(`**/*${fileExtension}`, {
    cwd: scriptsDirPath,
    ignore: [
      ...excludeDirs.map((dir) => `${dir}/**`),
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/__tests__/**',
    ],
  });

  if (scriptFiles.length === 0) {
    return `
/**
 * No script files found in ${scriptsDir}/.
 * Add .ts files with default exports to use script:// URIs in ensembles.
 */
export const scripts = [];
export const scriptsMap = new Map();
`;
  }

  console.log(`[conductor:script-discovery] Found ${scriptFiles.length} script files in ${scriptsDir}/`);

  const imports: string[] = [];
  const scriptEntries: string[] = [];
  const mapEntries: string[] = [];

  for (const scriptFile of scriptFiles) {
    const scriptFilePath = path.resolve(scriptsDirPath, scriptFile);

    // Generate script name from file path (without extension)
    // For "transforms/csv.ts" we want "transforms/csv"
    // For "health-check.ts" we want "health-check"
    const scriptName = scriptFile.replace(new RegExp(`${fileExtension}$`), '');

    // Generate safe variable name for import
    const varName = `script_${scriptName.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // Generate import path
    const relativePath = path.relative(root, scriptFilePath);
    // Normalize to forward slashes for ESM (path.relative uses OS separators)
    const normalizedPath = relativePath.replace(/\\/g, '/');
    // Ensure path starts with ./ for proper module resolution
    const importPath = normalizedPath.startsWith('.') ? normalizedPath : `./${normalizedPath}`;

    imports.push(`import ${varName} from '${importPath}';`);

    // Generate script entry
    const scriptEntry = `
  {
    name: ${JSON.stringify(scriptName)},
    handler: ${varName},
  }`;

    scriptEntries.push(scriptEntry);

    // Generate map entry
    const mapEntry = `[${JSON.stringify(scriptName)}, ${varName}]`;
    mapEntries.push(mapEntry);
  }

  // Generate the module code
  const code = `
${imports.join('\n')}

/**
 * Array of all discovered scripts
 * Each script includes:
 * - name: Script identifier (from file path, e.g., "transforms/csv")
 * - handler: The default export function from the script file
 */
export const scripts = [${scriptEntries.join(',')}
];

/**
 * Map of script name to handler function
 * Used for O(1) lookups by script:// URI
 *
 * Usage in ensembles:
 *   config:
 *     script: "script://transforms/csv"
 *
 * At runtime, resolves to scriptsMap.get("transforms/csv")
 */
export const scriptsMap = new Map([
  ${mapEntries.join(',\n  ')}
]);
`;

  return code;
}
