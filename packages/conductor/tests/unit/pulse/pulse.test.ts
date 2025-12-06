/**
 * Pulse Tests
 *
 * Tests for anonymous usage metrics module.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isPulseEnabled,
  sendPulse,
  initPulse,
  generateProjectId,
  type ProjectStats,
} from '../../../src/pulse/index'
import type { ConductorConfig } from '../../../src/config/types'

describe('Pulse', () => {
  describe('isPulseEnabled', () => {
    it('should be enabled by default', () => {
      const config: ConductorConfig = {}
      const env = {}

      expect(isPulseEnabled(config, env)).toBe(true)
    })

    it('should be disabled when DO_NOT_TRACK=1', () => {
      const config: ConductorConfig = {}
      const env = { DO_NOT_TRACK: '1' }

      expect(isPulseEnabled(config, env)).toBe(false)
    })

    it('should be disabled when CONDUCTOR_PULSE=false', () => {
      const config: ConductorConfig = {}
      const env = { CONDUCTOR_PULSE: 'false' }

      expect(isPulseEnabled(config, env)).toBe(false)
    })

    it('should be disabled when config.cloud.pulse=false', () => {
      const config: ConductorConfig = {
        cloud: { pulse: false },
      }
      const env = {}

      expect(isPulseEnabled(config, env)).toBe(false)
    })

    it('should respect DO_NOT_TRACK over config', () => {
      const config: ConductorConfig = {
        cloud: { pulse: true },
      }
      const env = { DO_NOT_TRACK: '1' }

      expect(isPulseEnabled(config, env)).toBe(false)
    })

    it('should respect CONDUCTOR_PULSE over config', () => {
      const config: ConductorConfig = {
        cloud: { pulse: true },
      }
      const env = { CONDUCTOR_PULSE: 'false' }

      expect(isPulseEnabled(config, env)).toBe(false)
    })

    it('should be enabled when pulse is explicitly true', () => {
      const config: ConductorConfig = {
        cloud: { pulse: true },
      }
      const env = {}

      expect(isPulseEnabled(config, env)).toBe(true)
    })
  })

  describe('generateProjectId', () => {
    it('should generate a valid UUID', () => {
      const id = generateProjectId()

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('should generate unique IDs', () => {
      const id1 = generateProjectId()
      const id2 = generateProjectId()

      expect(id1).not.toBe(id2)
    })
  })

  describe('sendPulse', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
      fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      })
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should auto-generate projectId when not configured', async () => {
      const config: ConductorConfig = {}
      const stats: ProjectStats = {
        componentCount: 5,
        agentCount: 3,
        ensembleCount: 2,
      }

      const result = await sendPulse(config, stats)

      // Should still send with auto-generated ID
      expect(result.sent).toBe(true)
      expect(result.acknowledged).toBe(true)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // Verify payload has a valid UUID
      const [, options] = fetchMock.mock.calls[0]
      const body = JSON.parse(options.body)
      expect(body.pid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('should send pulse with configured projectId', async () => {
      const config: ConductorConfig = {
        cloud: {
          projectId: 'test-project-id-1234',
        },
      }
      const stats: ProjectStats = {
        componentCount: 10,
        agentCount: 5,
        ensembleCount: 3,
      }

      const result = await sendPulse(config, stats)

      expect(result.sent).toBe(true)
      expect(result.acknowledged).toBe(true)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      const [url, options] = fetchMock.mock.calls[0]
      expect(url).toBe('https://pulse.ensemble.ai')
      expect(options.method).toBe('POST')
      expect(options.headers['Content-Type']).toBe('application/json')

      const body = JSON.parse(options.body)
      expect(body.pid).toBe('test-project-id-1234')
      expect(body.e).toBe('server.start')
      expect(body.cc).toBe(10)
      expect(body.ac).toBe(5)
      expect(body.ec).toBe(3)
    })

    it('should handle fetch failure gracefully', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'))

      const config: ConductorConfig = {
        cloud: {
          projectId: 'test-project-id',
        },
      }
      const stats: ProjectStats = {
        componentCount: 1,
        agentCount: 1,
        ensembleCount: 1,
      }

      // Should not throw
      const result = await sendPulse(config, stats)

      expect(result.sent).toBe(true)
      expect(result.acknowledged).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should handle non-ok response', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
      })

      const config: ConductorConfig = {
        cloud: {
          projectId: 'test-project-id',
        },
      }
      const stats: ProjectStats = {
        componentCount: 1,
        agentCount: 1,
        ensembleCount: 1,
      }

      const result = await sendPulse(config, stats)

      expect(result.sent).toBe(true)
      expect(result.acknowledged).toBe(false)
    })

    it('should use waitUntil when ctx is provided', async () => {
      const config: ConductorConfig = {
        cloud: {
          projectId: 'test-project-id',
        },
      }
      const stats: ProjectStats = {
        componentCount: 1,
        agentCount: 1,
        ensembleCount: 1,
      }

      const waitUntilMock = vi.fn()
      const ctx = { waitUntil: waitUntilMock } as unknown as ExecutionContext

      const result = await sendPulse(config, stats, ctx)

      // When ctx is provided, we can't know if acknowledged yet
      expect(result.sent).toBe(true)
      expect(result.acknowledged).toBe(false)
      expect(waitUntilMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('initPulse', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
      fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      })
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should not send if pulse is disabled', async () => {
      const config: ConductorConfig = {
        cloud: {
          projectId: 'test-id',
          pulse: false,
        },
      }
      const env = {}
      const stats: ProjectStats = {
        componentCount: 1,
        agentCount: 1,
        ensembleCount: 1,
      }

      const result = await initPulse(config, env, stats)

      expect(result.sent).toBe(false)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('should send if pulse is enabled', async () => {
      const config: ConductorConfig = {
        cloud: {
          projectId: 'test-id',
          pulse: true,
        },
      }
      const env = {}
      const stats: ProjectStats = {
        componentCount: 1,
        agentCount: 1,
        ensembleCount: 1,
      }

      const result = await initPulse(config, env, stats)

      expect(result.sent).toBe(true)
      expect(fetchMock).toHaveBeenCalled()
    })

    it('should respect DO_NOT_TRACK env', async () => {
      const config: ConductorConfig = {
        cloud: {
          projectId: 'test-id',
          pulse: true,
        },
      }
      const env = { DO_NOT_TRACK: '1' }
      const stats: ProjectStats = {
        componentCount: 1,
        agentCount: 1,
        ensembleCount: 1,
      }

      const result = await initPulse(config, env, stats)

      expect(result.sent).toBe(false)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('should auto-generate projectId for upgraded projects', async () => {
      // Simulate an upgraded project - has pulse enabled but no projectId
      const config: ConductorConfig = {
        cloud: {
          pulse: true,
        },
      }
      const env = {}
      const stats: ProjectStats = {
        componentCount: 5,
        agentCount: 2,
        ensembleCount: 1,
      }

      const result = await initPulse(config, env, stats)

      expect(result.sent).toBe(true)
      expect(fetchMock).toHaveBeenCalled()

      // Verify an auto-generated UUID was used
      const [, options] = fetchMock.mock.calls[0]
      const body = JSON.parse(options.body)
      expect(body.pid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })
  })
})
