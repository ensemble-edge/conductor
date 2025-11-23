import type { Plugin } from 'vite';
import { globSync } from 'glob';
import path from 'path';
import fs from 'fs';

const VIRTUAL_MODULE_ID = 'virtual:conductor-ensembles';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

export interface EnsembleDiscoveryOptions {
  /**
   * Directory to search for ensemble YAML files
   * @default 'ensembles'
   */
  ensemblesDir?: string;

  /**
   * File extension for ensemble config files
   * @default '.yaml'
   */
  fileExtension?: string;
}

export function ensembleDiscoveryPlugin(options: EnsembleDiscoveryOptions = {}): Plugin {
  const ensemblesDir = options.ensemblesDir || 'ensembles';
  const fileExtension = options.fileExtension || '.yaml';

  let root: string;

  return {
    name: 'conductor:ensemble-discovery',

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
        const code = generateEnsemblesModule(root, ensemblesDir, fileExtension);
        return code;
      }
    },

    // Hot reload support for development
    handleHotUpdate({ file, server }) {
      if (file.includes(ensemblesDir) && file.endsWith(fileExtension)) {
        const module = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
        if (module) {
          server.moduleGraph.invalidateModule(module);
          return [module];
        }
      }
    },
  };
}

function generateEnsemblesModule(
  root: string,
  ensemblesDir: string,
  fileExtension: string
): string {
  const ensemblesDirPath = path.resolve(root, ensemblesDir);

  // Check if ensembles directory exists
  if (!fs.existsSync(ensemblesDirPath)) {
    console.warn(`[conductor:ensemble-discovery] Directory not found: ${ensemblesDirPath}`);
    return `
export const ensembles = [];
export const ensemblesMap = new Map();
`;
  }

  // Find all YAML files in ensembles directory
  const ensembleFiles = globSync(`**/*${fileExtension}`, {
    cwd: ensemblesDirPath,
  });

  console.log(
    `[conductor:ensemble-discovery] Found ${ensembleFiles.length} ensemble files in ${ensemblesDir}/`
  );

  const ensembleEntries: string[] = [];
  const mapEntries: string[] = [];

  for (const ensembleFile of ensembleFiles) {
    const ensembleFilePath = path.resolve(ensemblesDirPath, ensembleFile);
    const ensembleName = path.basename(ensembleFile, fileExtension);

    // Read YAML content
    const yamlContent = fs.readFileSync(ensembleFilePath, 'utf-8');

    // Base64 encode YAML content to handle emojis and special characters
    const yamlBase64 = Buffer.from(yamlContent, 'utf-8').toString('base64');

    // Generate ensemble entry
    const ensembleEntry = `
  {
    name: ${JSON.stringify(ensembleName)},
    config: atob(${JSON.stringify(yamlBase64)}),
  }`;

    ensembleEntries.push(ensembleEntry);

    // Generate map entry
    const mapEntry = `
  [${JSON.stringify(ensembleName)}, {
    name: ${JSON.stringify(ensembleName)},
    config: atob(${JSON.stringify(yamlBase64)}),
  }]`;

    mapEntries.push(mapEntry);
  }

  // Generate the module code
  const code = `
/**
 * Array of all discovered ensembles
 * Each ensemble includes:
 * - name: Ensemble identifier (from filename)
 * - config: Raw YAML content as string
 */
export const ensembles = [${ensembleEntries.join(',')}
];

/**
 * Map of ensemble name to ensemble definition
 * Useful for O(1) lookups by name
 */
export const ensemblesMap = new Map([${mapEntries.join(',')}
]);
`;

  return code;
}
