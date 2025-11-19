import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ensembleDiscoveryPlugin } from '../vite-plugin-ensemble-discovery'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

describe('ensembleDiscoveryPlugin', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ensemble-discovery-test-'))
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should create plugin with correct name', () => {
    const plugin = ensembleDiscoveryPlugin()
    expect(plugin.name).toBe('conductor:ensemble-discovery')
  })

  it('should resolve virtual module ID', () => {
    const plugin = ensembleDiscoveryPlugin()
    const resolved = plugin.resolveId?.('virtual:conductor-ensembles')
    expect(resolved).toBe('\0virtual:conductor-ensembles')
  })

  it('should generate empty module when ensembles directory does not exist', () => {
    const plugin = ensembleDiscoveryPlugin({ ensemblesDir: 'nonexistent' })
    const config = { root: tempDir }
    plugin.configResolved?.(config)

    const code = plugin.load?.('\0virtual:conductor-ensembles')
    expect(code).toContain('export const ensembles = []')
    expect(code).toContain('export const ensemblesMap = new Map()')
  })

  it('should discover ensembles with YAML files', () => {
    const ensemblesDir = path.join(tempDir, 'ensembles')
    fs.mkdirSync(ensemblesDir, { recursive: true })

    const yamlContent = `name: workflow
description: A test workflow
flow:
  - step: greet`
    fs.writeFileSync(path.join(ensemblesDir, 'workflow.yaml'), yamlContent)

    const plugin = ensembleDiscoveryPlugin()
    const config = { root: tempDir }
    plugin.configResolved?.(config)

    const code = plugin.load?.('\0virtual:conductor-ensembles') as string
    expect(code).toContain(`name: "workflow"`)
    expect(code).toContain('name: workflow')
    expect(code).toContain('description: A test workflow')
  })

  it('should support nested ensemble directories', () => {
    const ensemblesDir = path.join(tempDir, 'ensembles')
    const nestedDir = path.join(ensemblesDir, 'workflows', 'user')
    fs.mkdirSync(nestedDir, { recursive: true })

    fs.writeFileSync(path.join(nestedDir, 'onboarding.yaml'), 'name: onboarding')

    const plugin = ensembleDiscoveryPlugin()
    const config = { root: tempDir }
    plugin.configResolved?.(config)

    const code = plugin.load?.('\0virtual:conductor-ensembles') as string
    expect(code).toContain('onboarding')
  })

  it('should handle multiple ensembles', () => {
    const ensemblesDir = path.join(tempDir, 'ensembles')
    fs.mkdirSync(ensemblesDir, { recursive: true })

    const ensembles = ['workflow1', 'workflow2', 'workflow3']
    for (const name of ensembles) {
      fs.writeFileSync(path.join(ensemblesDir, `${name}.yaml`), `name: ${name}`)
    }

    const plugin = ensembleDiscoveryPlugin()
    const config = { root: tempDir }
    plugin.configResolved?.(config)

    const code = plugin.load?.('\0virtual:conductor-ensembles') as string
    expect(code).toContain('workflow1')
    expect(code).toContain('workflow2')
    expect(code).toContain('workflow3')
  })

  it('should support custom file extensions', () => {
    const ensemblesDir = path.join(tempDir, 'ensembles')
    fs.mkdirSync(ensemblesDir, { recursive: true })

    fs.writeFileSync(path.join(ensemblesDir, 'workflow.yml'), 'name: workflow')

    const plugin = ensembleDiscoveryPlugin({ fileExtension: '.yml' })
    const config = { root: tempDir }
    plugin.configResolved?.(config)

    const code = plugin.load?.('\0virtual:conductor-ensembles') as string
    expect(code).toContain('name: workflow')
  })
})
