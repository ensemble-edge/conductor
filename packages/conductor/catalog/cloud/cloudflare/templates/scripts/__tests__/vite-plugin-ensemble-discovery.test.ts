import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ensembleDiscoveryPlugin } from '../vite-plugin-ensemble-discovery'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

// Helper to call plugin hooks that might be functions or objects with handler
function callHook<T extends (...args: any[]) => any>(
  hook: T | { handler: T } | undefined,
  ...args: Parameters<T>
): ReturnType<T> | undefined {
  if (!hook) return undefined
  if (typeof hook === 'function') return hook(...args)
  return (hook as { handler: T }).handler(...args)
}

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
    const resolved = callHook(plugin.resolveId as any, 'virtual:conductor-ensembles')
    expect(resolved).toBe('\0virtual:conductor-ensembles')
  })

  it('should generate empty module when ensembles directory does not exist', () => {
    const plugin = ensembleDiscoveryPlugin({ ensemblesDir: 'nonexistent' })
    const config = { root: tempDir }
    callHook(plugin.configResolved as any, config)

    const code = callHook(plugin.load as any, '\0virtual:conductor-ensembles')
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
    callHook(plugin.configResolved as any, config)

    const code = callHook(plugin.load as any, '\0virtual:conductor-ensembles') as string
    expect(code).toContain(`name: "workflow"`)
    expect(code).toContain('config: atob(')
    expect(code).toContain('export const ensembles = [')
  })

  it('should support nested ensemble directories', () => {
    const ensemblesDir = path.join(tempDir, 'ensembles')
    const nestedDir = path.join(ensemblesDir, 'workflows', 'user')
    fs.mkdirSync(nestedDir, { recursive: true })

    fs.writeFileSync(path.join(nestedDir, 'onboarding.yaml'), 'name: onboarding')

    const plugin = ensembleDiscoveryPlugin()
    const config = { root: tempDir }
    callHook(plugin.configResolved as any, config)

    const code = callHook(plugin.load as any, '\0virtual:conductor-ensembles') as string
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
    callHook(plugin.configResolved as any, config)

    const code = callHook(plugin.load as any, '\0virtual:conductor-ensembles') as string
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
    callHook(plugin.configResolved as any, config)

    const code = callHook(plugin.load as any, '\0virtual:conductor-ensembles') as string
    expect(code).toContain('name: "workflow"')
    expect(code).toContain('config: atob(')
  })
})
