/**
 * UnifiedRouter Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { UnifiedRouter } from '../router.js'
import type { ConductorConfig } from '../config.js'

describe('UnifiedRouter', () => {
  let router: UnifiedRouter
  let mockConfig: ConductorConfig
  let mockEnv: any

  beforeEach(() => {
    mockConfig = {
      routing: {
        auth: {
          defaults: {
            pages: {
              requirement: 'required',
              methods: ['cookie'],
            },
            api: {
              requirement: 'required',
              methods: ['bearer', 'apiKey'],
            },
          },
          rules: [
            { pattern: '/', auth: { requirement: 'public' } },
            { pattern: '/login', auth: { requirement: 'public' } },
          ],
        },
      },
    }

    mockEnv = {}
    router = new UnifiedRouter(mockConfig)
  })

  describe('route registration', () => {
    it('should register a route with explicit path', () => {
      router.register({
        pattern: '/api/users',
        methods: ['GET'],
        operation: 'api',
        agentName: 'users-api',
      })

      const match = router.match('/api/users', 'GET')
      expect(match).not.toBeNull()
      expect(match?.pattern).toBe('/api/users')
    })

    it('should register a route with default path resolution', () => {
      router.register({
        pattern: 'default',
        methods: ['GET'],
        operation: 'page',
        agentName: 'login',
        memberPath: '/pages/login/page.yaml',
      })

      const match = router.match('/login', 'GET')
      expect(match).not.toBeNull()
      expect(match?.pattern).toBe('/login')
    })

    it('should resolve default path for index pages', () => {
      router.register({
        pattern: 'default',
        methods: ['GET'],
        operation: 'page',
        agentName: 'index',
        memberPath: '/pages/index/page.yaml',
      })

      const match = router.match('/', 'GET')
      expect(match).not.toBeNull()
      expect(match?.pattern).toBe('/')
    })

    it('should handle nested paths correctly', () => {
      router.register({
        pattern: 'default',
        methods: ['GET'],
        operation: 'page',
        agentName: 'dashboard',
        memberPath: '/pages/admin/dashboard/page.yaml',
      })

      const match = router.match('/admin/dashboard', 'GET')
      expect(match).not.toBeNull()
      expect(match?.pattern).toBe('/admin/dashboard')
    })
  })

  describe('pattern matching', () => {
    beforeEach(() => {
      router.register({
        pattern: '/api/users/:id',
        methods: ['GET'],
        operation: 'api',
        agentName: 'user-api',
      })

      router.register({
        pattern: '/api/users',
        methods: ['GET', 'POST'],
        operation: 'api',
        agentName: 'users-api',
      })

      router.register({
        pattern: '/static/*',
        methods: ['GET'],
        operation: 'static',
        agentName: 'static-files',
      })
    })

    it('should match exact routes', () => {
      const match = router.match('/api/users', 'GET')
      expect(match).not.toBeNull()
      expect(match?.pattern).toBe('/api/users')
    })

    it('should match dynamic routes with params', () => {
      const match = router.match('/api/users/123', 'GET')
      expect(match).not.toBeNull()
      expect(match?.pattern).toBe('/api/users/:id')
      expect(match?.params).toEqual({ id: '123' })
    })

    it('should match wildcard routes', () => {
      const match = router.match('/static/images/logo.png', 'GET')
      expect(match).not.toBeNull()
      expect(match?.pattern).toBe('/static/*')
    })

    it('should return null for non-matching routes', () => {
      const match = router.match('/nonexistent', 'GET')
      expect(match).toBeNull()
    })

    it('should respect HTTP method', () => {
      const match = router.match('/api/users', 'DELETE')
      expect(match).toBeNull()
    })
  })

  describe('auth config resolution', () => {
    it('should apply public auth for root path', () => {
      router.register({
        pattern: '/',
        methods: ['GET'],
        operation: 'page',
        agentName: 'home',
      })

      const match = router.match('/', 'GET')
      expect(match).not.toBeNull()
      expect(match?.auth.requirement).toBe('public')
    })

    it('should apply type defaults for APIs', () => {
      router.register({
        pattern: '/api/protected',
        methods: ['GET'],
        operation: 'api',
        agentName: 'protected-api',
      })

      const match = router.match('/api/protected', 'GET')
      expect(match).not.toBeNull()
      expect(match?.auth.requirement).toBe('required')
      expect(match?.auth.methods).toEqual(['bearer', 'apiKey'])
    })

    it('should allow agent-specific auth to override defaults', () => {
      router.register({
        pattern: '/api/public',
        methods: ['GET'],
        operation: 'api',
        agentName: 'public-api',
        auth: { requirement: 'public' },
      })

      const match = router.match('/api/public', 'GET')
      expect(match).not.toBeNull()
      expect(match?.auth.requirement).toBe('public')
    })
  })

  describe('priority sorting', () => {
    beforeEach(() => {
      router.register({
        pattern: '/admin/*',
        methods: ['GET'],
        operation: 'page',
        agentName: 'admin',
        priority: 10,
      })

      router.register({
        pattern: '/admin/users',
        methods: ['GET'],
        operation: 'page',
        agentName: 'admin-users',
        priority: 10,
      })

      router.register({
        pattern: '/static/*',
        methods: ['GET'],
        operation: 'static',
        agentName: 'static-files',
        priority: 1,
      })
    })

    it('should match higher priority routes first', () => {
      const match = router.match('/static/test.js', 'GET')
      expect(match).not.toBeNull()
      expect(match?.operation).toBe('static')
    })

    it('should prefer static routes over dynamic within same priority', () => {
      const match = router.match('/admin/users', 'GET')
      expect(match).not.toBeNull()
      expect(match?.pattern).toBe('/admin/users')
      expect(match?.operation).toBe('page')
    })
  })
})
