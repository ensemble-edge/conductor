import type { Plugin } from 'vite';
import { globSync } from 'glob';
import path from 'path';
import fs from 'fs';

const VIRTUAL_MODULE_ID = 'virtual:conductor-agents';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

export interface AgentDiscoveryOptions {
  /**
   * Directory to search for agent files (YAML and TypeScript)
   * @default 'agents'
   */
  agentsDir?: string;

  /**
   * File extensions for agent config files
   * @default ['.yaml', '.yml']
   */
  fileExtensions?: string[];

  /**
   * @deprecated Use fileExtensions instead
   * File extension for agent config files
   * @default '.yaml'
   */
  fileExtension?: string;

  /**
   * Directories to exclude from discovery
   * @default ['generate-docs']
   */
  excludeDirs?: string[];
}

export function agentDiscoveryPlugin(options: AgentDiscoveryOptions = {}): Plugin {
  const agentsDir = options.agentsDir || 'agents';
  // Support both old single extension and new multiple extensions
  const fileExtensions = options.fileExtensions ||
    (options.fileExtension ? [options.fileExtension] : ['.yaml', '.yml']);
  const excludeDirs = options.excludeDirs || ['generate-docs'];

  let root: string;

  return {
    name: 'conductor:agent-discovery',

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
        const code = generateAgentsModule(root, agentsDir, fileExtensions, excludeDirs);
        return code;
      }
    },

    // Hot reload support for development
    handleHotUpdate({ file, server }) {
      const matchesExtension = fileExtensions.some(ext => file.endsWith(ext)) || file.endsWith('.ts');
      if (file.includes(agentsDir) && matchesExtension) {
        const module = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
        if (module) {
          server.moduleGraph.invalidateModule(module);
          return [module];
        }
      }
    },
  };
}

function generateAgentsModule(
  root: string,
  agentsDir: string,
  fileExtensions: string[],
  excludeDirs: string[]
): string {
  const agentsDirPath = path.resolve(root, agentsDir);

  // Check if agents directory exists
  if (!fs.existsSync(agentsDirPath)) {
    console.warn(`[conductor:agent-discovery] Directory not found: ${agentsDirPath}`);
    return `
export const agents = [];
export const agentsMap = new Map();
`;
  }

  // Build glob pattern for all extensions
  const extPattern = fileExtensions.length === 1
    ? `**/*${fileExtensions[0]}`
    : `**/*{${fileExtensions.join(',')}}`;

  // Find all agent config files
  const agentFiles = globSync(extPattern, {
    cwd: agentsDirPath,
    ignore: excludeDirs.map((dir) => `${dir}/**`),
  });

  console.log(`[conductor:agent-discovery] Found ${agentFiles.length} agent files in ${agentsDir}/`);

  const imports: string[] = [];
  const agentEntries: string[] = [];
  const mapEntries: string[] = [];

  for (const agentFile of agentFiles) {
    const agentFilePath = path.resolve(agentsDirPath, agentFile);
    const agentDir = path.dirname(agentFilePath);
    const ext = path.extname(agentFile);

    // Get agent name from the parent directory, not the filename
    // For "text-processor/agent.yaml" we want "text-processor"
    // For "examples/hello/agent.yaml" we want "examples/hello"
    const relativeDir = path.relative(agentsDirPath, agentDir);
    const agentName = relativeDir || path.basename(agentFile, ext);

    // Read YAML content
    const yamlContent = fs.readFileSync(agentFilePath, 'utf-8');

    // Check if handler file exists
    const handlerPath = path.join(agentDir, 'index.ts');
    const handlerExists = fs.existsSync(handlerPath);

    // Use the full relative path for unique variable names
    const handlerVarName = `handler_${agentName.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // Import handler if exists
    if (handlerExists) {
      const relativePath = path.relative(root, handlerPath);
      // Normalize to forward slashes for ESM (path.relative uses OS separators)
      const normalizedPath = relativePath.replace(/\\/g, '/');
      // Ensure path starts with ./ for proper module resolution
      const importPath = normalizedPath.startsWith('.') ? normalizedPath : `./${normalizedPath}`;
      imports.push(`import * as ${handlerVarName} from '${importPath}';`);
    }

    // Base64 encode YAML content to handle emojis and special characters
    const yamlBase64 = Buffer.from(yamlContent, 'utf-8').toString('base64');

    // Generate agent entry
    const agentEntry = `
  {
    name: ${JSON.stringify(agentName)},
    config: atob(${JSON.stringify(yamlBase64)}),
    ${handlerExists ? `handler: () => Promise.resolve(${handlerVarName}.default || ${handlerVarName}),` : ''}
  }`;

    agentEntries.push(agentEntry);

    // Generate map entry
    const mapEntry = `
  [${JSON.stringify(agentName)}, {
    name: ${JSON.stringify(agentName)},
    config: atob(${JSON.stringify(yamlBase64)}),
    ${handlerExists ? `handler: () => Promise.resolve(${handlerVarName}.default || ${handlerVarName}),` : ''}
  }]`;

    mapEntries.push(mapEntry);
  }

  // Generate the module code
  const code = `
${imports.join('\n')}

/**
 * Array of all discovered agents
 * Each agent includes:
 * - name: Agent identifier (from filename)
 * - config: Raw YAML content as string
 * - handler: Optional function that returns the handler module
 */
export const agents = [${agentEntries.join(',')}
];

/**
 * Map of agent name to agent definition
 * Useful for O(1) lookups by name
 */
export const agentsMap = new Map([${mapEntries.join(',')}
]);
`;

  return code;
}
