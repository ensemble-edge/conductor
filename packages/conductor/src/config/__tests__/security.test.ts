/**
 * Security Configuration Tests
 *
 * Tests for the security configuration module.
 * The security module is stateless - all functions take config as a parameter.
 */

import { describe, it, expect } from 'vitest'
import {
  createSecurityConfig,
  isAuthRequired,
  isDirectAgentExecutionAllowed,
  isAutoPermissionsEnabled,
  getRequiredPermission,
  isProductionEnvironment,
  getProductionEnvironments,
  DEFAULT_SECURITY_CONFIG,
} from '../security.js'

describe('Security Configuration', () => {
  describe('DEFAULT_SECURITY_CONFIG', () => {
    it('should have secure defaults', () => {
      expect(DEFAULT_SECURITY_CONFIG.requireAuth).toBe(true)
      expect(DEFAULT_SECURITY_CONFIG.allowDirectAgentExecution).toBe(true)
      expect(DEFAULT_SECURITY_CONFIG.autoPermissions).toBe(false)
      expect(DEFAULT_SECURITY_CONFIG.productionEnvironments).toEqual(['production', 'prod'])
    })
  })

  describe('createSecurityConfig', () => {
    it('should return defaults when called with no args', () => {
      const config = createSecurityConfig()
      expect(config).toEqual(DEFAULT_SECURITY_CONFIG)
    })

    it('should merge with defaults', () => {
      const config = createSecurityConfig({ requireAuth: false })
      expect(config.requireAuth).toBe(false)
      expect(config.allowDirectAgentExecution).toBe(true) // default
      expect(config.autoPermissions).toBe(false) // default
    })

    it('should allow full override', () => {
      const config = createSecurityConfig({
        requireAuth: false,
        allowDirectAgentExecution: false,
        autoPermissions: true,
        productionEnvironments: ['live', 'main'],
      })
      expect(config.requireAuth).toBe(false)
      expect(config.allowDirectAgentExecution).toBe(false)
      expect(config.autoPermissions).toBe(true)
      expect(config.productionEnvironments).toEqual(['live', 'main'])
    })
  })

  describe('isAuthRequired', () => {
    it('should return true when requireAuth is true', () => {
      const config = createSecurityConfig({ requireAuth: true })
      expect(isAuthRequired(config)).toBe(true)
    })

    it('should return false when requireAuth is false', () => {
      const config = createSecurityConfig({ requireAuth: false })
      expect(isAuthRequired(config)).toBe(false)
    })
  })

  describe('isDirectAgentExecutionAllowed', () => {
    it('should return true when allowDirectAgentExecution is true', () => {
      const config = createSecurityConfig({ allowDirectAgentExecution: true })
      expect(isDirectAgentExecutionAllowed(config)).toBe(true)
    })

    it('should return false when allowDirectAgentExecution is false', () => {
      const config = createSecurityConfig({ allowDirectAgentExecution: false })
      expect(isDirectAgentExecutionAllowed(config)).toBe(false)
    })
  })

  describe('isAutoPermissionsEnabled', () => {
    it('should return false by default', () => {
      const config = createSecurityConfig()
      expect(isAutoPermissionsEnabled(config)).toBe(false)
    })

    it('should return true when configured', () => {
      const config = createSecurityConfig({ autoPermissions: true })
      expect(isAutoPermissionsEnabled(config)).toBe(true)
    })
  })

  describe('getRequiredPermission', () => {
    describe('with autoPermissions disabled', () => {
      const config = createSecurityConfig({ autoPermissions: false })

      it('should return null for ensembles', () => {
        expect(getRequiredPermission(config, 'ensemble', 'invoice-pdf')).toBeNull()
      })

      it('should return null for agents', () => {
        expect(getRequiredPermission(config, 'agent', 'http')).toBeNull()
      })
    })

    describe('with autoPermissions enabled', () => {
      const config = createSecurityConfig({ autoPermissions: true })

      it('should return permission for ensembles', () => {
        expect(getRequiredPermission(config, 'ensemble', 'invoice-pdf')).toBe(
          'ensemble:invoice-pdf:execute'
        )
      })

      it('should return permission for agents', () => {
        expect(getRequiredPermission(config, 'agent', 'http')).toBe('agent:http:execute')
      })

      it('should handle special characters in names', () => {
        expect(getRequiredPermission(config, 'ensemble', 'billing-invoice-v2')).toBe(
          'ensemble:billing-invoice-v2:execute'
        )
      })

      it('should support custom actions', () => {
        expect(getRequiredPermission(config, 'ensemble', 'data-sync', 'read')).toBe(
          'ensemble:data-sync:read'
        )
      })
    })
  })

  describe('isProductionEnvironment', () => {
    const defaultConfig = createSecurityConfig()

    it('should return true when environment is undefined (secure by default)', () => {
      expect(isProductionEnvironment(defaultConfig, undefined)).toBe(true)
    })

    it('should return true for "production"', () => {
      expect(isProductionEnvironment(defaultConfig, 'production')).toBe(true)
    })

    it('should return true for "prod"', () => {
      expect(isProductionEnvironment(defaultConfig, 'prod')).toBe(true)
    })

    it('should return true for case variations', () => {
      expect(isProductionEnvironment(defaultConfig, 'PRODUCTION')).toBe(true)
      expect(isProductionEnvironment(defaultConfig, 'Prod')).toBe(true)
    })

    it('should return false for non-production environments', () => {
      expect(isProductionEnvironment(defaultConfig, 'development')).toBe(false)
      expect(isProductionEnvironment(defaultConfig, 'staging')).toBe(false)
      expect(isProductionEnvironment(defaultConfig, 'test')).toBe(false)
    })

    it('should use custom productionEnvironments', () => {
      const config = createSecurityConfig({
        productionEnvironments: ['live', 'main'],
      })
      expect(isProductionEnvironment(config, 'live')).toBe(true)
      expect(isProductionEnvironment(config, 'main')).toBe(true)
      expect(isProductionEnvironment(config, 'production')).toBe(false) // not in custom list
    })
  })

  describe('getProductionEnvironments', () => {
    it('should return default production environments', () => {
      const config = createSecurityConfig()
      expect(getProductionEnvironments(config)).toEqual(['production', 'prod'])
    })

    it('should return custom production environments', () => {
      const config = createSecurityConfig({
        productionEnvironments: ['live', 'main', 'release'],
      })
      expect(getProductionEnvironments(config)).toEqual(['live', 'main', 'release'])
    })
  })
})
