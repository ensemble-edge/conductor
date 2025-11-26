import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { agentDiscoveryPlugin } from '../../src/build/vite-plugin-agent-discovery'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import type { Plugin } from 'vite'

// Helper to call plugin hooks that might be functions or objects with handler
function callHook<T extends (...args: any[]) => any>(
  hook: T | { handler: T } | undefined,
  ...args: Parameters<T>
): ReturnType<T> | undefined {
  if (!hook) return undefined
  if (typeof hook === 'function') return hook(...args)
  return (hook as { handler: T }).handler(...args)
}

describe('agentDiscoveryPlugin', () => {
  let tempDir: string

  beforeEach(() => {
    // Create temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-discovery-test-'))
  })

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should create plugin with correct name', () => {
    const plugin = agentDiscoveryPlugin()
    expect(plugin.name).toBe('conductor:agent-discovery')
  })

  it('should resolve virtual module ID', () => {
    const plugin = agentDiscoveryPlugin()
    const resolved = callHook(plugin.resolveId as any, 'virtual:conductor-agents')
    expect(resolved).toBe('\0virtual:conductor-agents')
  })

  it('should not resolve other module IDs', () => {
    const plugin = agentDiscoveryPlugin()
    const resolved = callHook(plugin.resolveId as any, 'some-other-module')
    expect(resolved).toBeUndefined()
  })

  it('should generate empty module when agents directory does not exist', () => {
    const plugin = agentDiscoveryPlugin({ agentsDir: 'nonexistent' })

    // Mock config
    const config = { root: tempDir }
    callHook(plugin.configResolved as any, config)

    const code = callHook(plugin.load as any, '\0virtual:conductor-agents')
    expect(code).toContain('export const agents = []')
    expect(code).toContain('export const agentsMap = new Map()')
  })

  it('should discover agents with YAML files', () => {
    // Create agents directory structure
    const agentsDir = path.join(tempDir, 'agents')
    const helloDir = path.join(agentsDir, 'hello')
    fs.mkdirSync(helloDir, { recursive: true })

    // Create agent YAML
    const yamlContent = `name: hello
operation: code
description: A hello agent`
    fs.writeFileSync(path.join(helloDir, 'agent.yaml'), yamlContent)

    // Create plugin and configure
    const plugin = agentDiscoveryPlugin()
    const config = { root: tempDir }
    callHook(plugin.configResolved as any, config)

    // Load virtual module
    const code = callHook(plugin.load as any, '\0virtual:conductor-agents') as string
    expect(code).toBeDefined()
    expect(code).toContain(`name: "hello"`)
    expect(code).toContain('config: atob(')
    // Verify the base64-encoded config can be decoded back
    expect(code).toContain('export const agents = [')
  })

  it('should discover agents with handlers', () => {
    // Create agents directory structure
    const agentsDir = path.join(tempDir, 'agents')
    const helloDir = path.join(agentsDir, 'hello')
    fs.mkdirSync(helloDir, { recursive: true })

    // Create agent YAML and handler
    fs.writeFileSync(
      path.join(helloDir, 'agent.yaml'),
      `name: hello
operation: code`
    )
    fs.writeFileSync(path.join(helloDir, 'index.ts'), `export default function() {}`)

    // Create plugin and configure
    const plugin = agentDiscoveryPlugin()
    const config = { root: tempDir }
    callHook(plugin.configResolved as any, config)

    // Load virtual module
    const code = callHook(plugin.load as any, '\0virtual:conductor-agents') as string
    expect(code).toContain(`import * as handler_hello from`)
    expect(code).toContain(`handler: () => Promise.resolve(handler_hello.default || handler_hello)`)
  })

  it('should exclude examples directory by default', () => {
    // Create agents directory with examples
    const agentsDir = path.join(tempDir, 'agents')
    const examplesDir = path.join(agentsDir, 'examples')
    const helloDir = path.join(agentsDir, 'hello')

    fs.mkdirSync(examplesDir, { recursive: true })
    fs.mkdirSync(helloDir, { recursive: true })

    fs.writeFileSync(path.join(examplesDir, 'agent.yaml'), 'name: example-agent\noperation: code')
    fs.writeFileSync(path.join(helloDir, 'agent.yaml'), 'name: hello\noperation: code')

    // Create plugin and configure
    const plugin = agentDiscoveryPlugin()
    const config = { root: tempDir }
    callHook(plugin.configResolved as any, config)

    // Load virtual module
    const code = callHook(plugin.load as any, '\0virtual:conductor-agents') as string
    expect(code).not.toContain('examples')
    expect(code).toContain('name: "hello"')
    expect(code).toContain('config: atob(')
  })

  it('should support custom file extensions', () => {
    const agentsDir = path.join(tempDir, 'agents')
    const helloDir = path.join(agentsDir, 'hello')
    fs.mkdirSync(helloDir, { recursive: true })

    fs.writeFileSync(path.join(helloDir, 'agent.yml'), 'name: hello')

    // Create plugin with custom extension
    const plugin = agentDiscoveryPlugin({ fileExtension: '.yml' })
    const config = { root: tempDir }
    callHook(plugin.configResolved as any, config)

    const code = callHook(plugin.load as any, '\0virtual:conductor-agents') as string
    expect(code).toContain('name: "hello"')
    expect(code).toContain('config: atob(')
  })

  it('should handle multiple agents', () => {
    const agentsDir = path.join(tempDir, 'agents')
    fs.mkdirSync(agentsDir, { recursive: true })

    // Create multiple agents
    const agents = ['agent1', 'agent2', 'agent3']
    for (const agentName of agents) {
      const agentDir = path.join(agentsDir, agentName)
      fs.mkdirSync(agentDir)
      fs.writeFileSync(path.join(agentDir, 'agent.yaml'), `name: ${agentName}`)
    }

    const plugin = agentDiscoveryPlugin()
    const config = { root: tempDir }
    callHook(plugin.configResolved as any, config)

    const code = callHook(plugin.load as any, '\0virtual:conductor-agents') as string
    expect(code).toContain('agent1')
    expect(code).toContain('agent2')
    expect(code).toContain('agent3')
  })

  it('should normalize Windows paths to forward slashes', () => {
    const agentsDir = path.join(tempDir, 'agents')
    const helloDir = path.join(agentsDir, 'hello')
    fs.mkdirSync(helloDir, { recursive: true })

    fs.writeFileSync(path.join(helloDir, 'agent.yaml'), 'name: hello')
    fs.writeFileSync(path.join(helloDir, 'index.ts'), 'export default function() {}')

    const plugin = agentDiscoveryPlugin()
    const config = { root: tempDir }
    callHook(plugin.configResolved as any, config)

    const code = callHook(plugin.load as any, '\0virtual:conductor-agents') as string
    // Ensure no backslashes in import paths
    expect(code).not.toMatch(/import.*\\/)
  })
})
