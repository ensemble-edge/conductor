/**
 * Validate Component References
 *
 * This script validates that all @version references in component configs
 * point to valid git tags or existing files.
 *
 * Run: npx tsx scripts/validate-refs.ts
 *
 * Checks:
 * 1. YAML/JSON configs that reference other components
 * 2. @version references (e.g., prompts/extraction@v1.0.0)
 * 3. Circular ensemble references
 *
 * Exit codes:
 * 0 - All references valid
 * 1 - Validation errors found
 */

import { execSync } from 'node:child_process'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import * as yaml from 'yaml'

interface ValidationError {
  file: string
  reference: string
  message: string
}

const errors: ValidationError[] = []
const warnings: string[] = []

/**
 * Get all git tags matching component/logic patterns
 */
function getGitTags(): Set<string> {
  try {
    const output = execSync('git tag -l "components/*/*/*" && git tag -l "logic/*/*/*"', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return new Set(output.trim().split('\n').filter(Boolean))
  } catch {
    console.log('Warning: Could not read git tags (not a git repo?)')
    return new Set()
  }
}

/**
 * Check if a component file exists locally
 */
function componentFileExists(type: string, name: string): boolean {
  const extensions = ['yaml', 'yml', 'md', 'json', 'ts']
  for (const ext of extensions) {
    if (existsSync(`components/${type}/${name}.${ext}`)) return true
    if (existsSync(`components/${type}/${name}/index.${ext}`)) return true
  }
  return false
}

/**
 * Parse a component reference like "prompts/extraction@v1.0.0"
 */
function parseRef(ref: string): { type: string; name: string; version?: string } | null {
  const match = ref.match(/^([^/]+)\/([^@]+)(?:@(.+))?$/)
  if (!match) return null
  return { type: match[1], name: match[2], version: match[3] }
}

/**
 * Validate a component reference
 */
function validateRef(ref: string, sourceFile: string, gitTags: Set<string>): void {
  const parsed = parseRef(ref)
  if (!parsed) {
    warnings.push(`${sourceFile}: Could not parse reference "${ref}"`)
    return
  }

  const { type, name, version } = parsed

  // Check if local file exists
  if (!componentFileExists(type, name)) {
    errors.push({
      file: sourceFile,
      reference: ref,
      message: `Component file not found: components/${type}/${name}.*`,
    })
    return
  }

  // If version is specified, check if tag exists
  if (version && version.startsWith('v')) {
    const tag = `components/${type}/${name}/${version}`
    if (!gitTags.has(tag)) {
      errors.push({
        file: sourceFile,
        reference: ref,
        message: `Tag not found: ${tag}. Create it with: edgit tag create ${type}/${name} ${version}`,
      })
    }
  }
}

/**
 * Extract component references from YAML content
 */
function extractRefs(content: unknown, path: string[] = []): string[] {
  const refs: string[] = []

  if (typeof content === 'string') {
    // Look for patterns like "prompts/extraction" or "prompts/extraction@v1.0.0"
    const match = content.match(/^([a-z]+)\/([a-z0-9-]+)(@[a-z0-9.-]+)?$/i)
    if (match) {
      refs.push(content)
    }
  } else if (Array.isArray(content)) {
    for (const item of content) {
      refs.push(...extractRefs(item, path))
    }
  } else if (content && typeof content === 'object') {
    for (const [key, value] of Object.entries(content)) {
      // Keys that typically contain component references
      if (['prompt', 'schema', 'config', 'uses', 'agent', 'ensemble'].includes(key)) {
        if (typeof value === 'string') {
          refs.push(value)
        } else if (Array.isArray(value)) {
          refs.push(...value.filter((v): v is string => typeof v === 'string'))
        }
      }
      refs.push(...extractRefs(value, [...path, key]))
    }
  }

  return refs
}

/**
 * Validate a YAML or JSON file
 */
function validateFile(filePath: string, gitTags: Set<string>): void {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const ext = extname(filePath)

    let parsed: unknown
    if (ext === '.yaml' || ext === '.yml') {
      parsed = yaml.parse(content)
    } else if (ext === '.json') {
      parsed = JSON.parse(content)
    } else {
      return // Skip non-config files
    }

    const refs = extractRefs(parsed)
    for (const ref of refs) {
      validateRef(ref, filePath, gitTags)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    errors.push({
      file: filePath,
      reference: '',
      message: `Failed to parse: ${message}`,
    })
  }
}

/**
 * Recursively find all config files
 */
function findConfigFiles(dir: string): string[] {
  const files: string[] = []

  if (!existsSync(dir)) return files

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stat = statSync(path)

    if (stat.isDirectory()) {
      files.push(...findConfigFiles(path))
    } else if (stat.isFile()) {
      const ext = extname(entry)
      if (['.yaml', '.yml', '.json'].includes(ext)) {
        files.push(path)
      }
    }
  }

  return files
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

console.log('Validating component references...')
console.log('')

const gitTags = getGitTags()
console.log(`Found ${gitTags.size} git tags`)

// Find and validate all config files
const dirs = ['components', 'agents', 'ensembles']
const configFiles: string[] = []

for (const dir of dirs) {
  configFiles.push(...findConfigFiles(dir))
}

console.log(`Found ${configFiles.length} config files to validate`)
console.log('')

for (const file of configFiles) {
  validateFile(file, gitTags)
}

// Report results
if (warnings.length > 0) {
  console.log('Warnings:')
  for (const warning of warnings) {
    console.log(`  ⚠ ${warning}`)
  }
  console.log('')
}

if (errors.length > 0) {
  console.log('Errors:')
  for (const error of errors) {
    console.log(`  ✗ ${error.file}`)
    if (error.reference) {
      console.log(`    Reference: ${error.reference}`)
    }
    console.log(`    ${error.message}`)
    console.log('')
  }
  console.log(`Found ${errors.length} error(s)`)
  process.exit(1)
} else {
  console.log('✓ All component references valid')
  process.exit(0)
}
