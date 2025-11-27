/**
 * Local File Loader
 *
 * Loads ensembles and agents from the local filesystem for CLI commands.
 * This is used by `conductor build` and `conductor run` commands.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import * as YAML from 'yaml'
import type { EnsembleConfig, AgentConfig } from '../runtime/parser.js'
import { Parser } from '../runtime/parser.js'

/**
 * Default directories for Conductor projects
 */
export const DEFAULT_DIRS = {
  ensembles: 'catalog/ensembles',
  agents: 'catalog/agents',
} as const

/**
 * Local ensemble loader for CLI operations
 */
export class LocalLoader {
  private readonly projectRoot: string
  private readonly ensemblesDir: string
  private readonly agentsDir: string

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd()
    this.ensemblesDir = path.join(this.projectRoot, DEFAULT_DIRS.ensembles)
    this.agentsDir = path.join(this.projectRoot, DEFAULT_DIRS.agents)
  }

  /**
   * Load all ensembles with build triggers
   */
  async loadBuildEnsembles(): Promise<EnsembleConfig[]> {
    const ensembles = await this.loadAllEnsembles()
    return ensembles.filter((e) => e.trigger?.some((t) => t.type === 'build'))
  }

  /**
   * Load all ensembles with CLI triggers
   */
  async loadCLIEnsembles(): Promise<EnsembleConfig[]> {
    const ensembles = await this.loadAllEnsembles()
    return ensembles.filter((e) => e.trigger?.some((t) => t.type === 'cli'))
  }

  /**
   * Load all ensembles with cron/schedule triggers
   */
  async loadScheduledEnsembles(): Promise<EnsembleConfig[]> {
    const ensembles = await this.loadAllEnsembles()
    return ensembles.filter((e) => e.trigger?.some((t) => t.type === 'cron'))
  }

  /**
   * Load all ensembles from the local catalog
   */
  async loadAllEnsembles(): Promise<EnsembleConfig[]> {
    const ensembles: EnsembleConfig[] = []

    try {
      const files = await this.findYamlFiles(this.ensemblesDir)

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8')
          const ensemble = Parser.parseEnsemble(content)
          ensembles.push(ensemble)
        } catch (error) {
          // Skip files that fail to parse
          console.warn(`Warning: Failed to parse ensemble ${file}: ${(error as Error).message}`)
        }
      }
    } catch (error) {
      // Directory might not exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }

    return ensembles
  }

  /**
   * Load a specific ensemble by name
   */
  async loadEnsemble(name: string): Promise<EnsembleConfig | null> {
    // Try different file patterns
    const patterns = [
      path.join(this.ensemblesDir, `${name}.yaml`),
      path.join(this.ensemblesDir, `${name}.yml`),
      path.join(this.ensemblesDir, name, 'ensemble.yaml'),
      path.join(this.ensemblesDir, name, 'ensemble.yml'),
      path.join(this.ensemblesDir, name, `${name}.yaml`),
      path.join(this.ensemblesDir, name, `${name}.yml`),
    ]

    for (const filePath of patterns) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        return Parser.parseEnsemble(content)
      } catch {
        // Try next pattern
      }
    }

    return null
  }

  /**
   * Load all agents from the local catalog
   */
  async loadAllAgents(): Promise<AgentConfig[]> {
    const agents: AgentConfig[] = []

    try {
      const files = await this.findYamlFiles(this.agentsDir)

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8')
          const agent = Parser.parseAgent(content)
          agents.push(agent)
        } catch (error) {
          // Skip files that fail to parse
          console.warn(`Warning: Failed to parse agent ${file}: ${(error as Error).message}`)
        }
      }
    } catch (error) {
      // Directory might not exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }

    return agents
  }

  /**
   * Load a specific agent by name
   */
  async loadAgent(name: string): Promise<AgentConfig | null> {
    // Try different file patterns
    const patterns = [
      path.join(this.agentsDir, `${name}.yaml`),
      path.join(this.agentsDir, `${name}.yml`),
      path.join(this.agentsDir, name, 'agent.yaml'),
      path.join(this.agentsDir, name, 'agent.yml'),
      path.join(this.agentsDir, name, `${name}.yaml`),
      path.join(this.agentsDir, name, `${name}.yml`),
    ]

    for (const filePath of patterns) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        return Parser.parseAgent(content)
      } catch {
        // Try next pattern
      }
    }

    return null
  }

  /**
   * Find all YAML files in a directory recursively
   */
  private async findYamlFiles(dir: string): Promise<string[]> {
    const files: string[] = []

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          // Recurse into subdirectories
          const subFiles = await this.findYamlFiles(fullPath)
          files.push(...subFiles)
        } else if (entry.isFile() && /\.ya?ml$/i.test(entry.name)) {
          files.push(fullPath)
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }

    return files
  }

  /**
   * Check if a directory exists
   */
  async directoryExists(dir: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dir)
      return stats.isDirectory()
    } catch {
      return false
    }
  }

  /**
   * Get the project root path
   */
  getProjectRoot(): string {
    return this.projectRoot
  }

  /**
   * Get the ensembles directory path
   */
  getEnsemblesDir(): string {
    return this.ensemblesDir
  }

  /**
   * Get the agents directory path
   */
  getAgentsDir(): string {
    return this.agentsDir
  }
}
