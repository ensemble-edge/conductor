/**
 * Security Configuration Tests
 *
 * Tests for the security configuration module.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  initSecurityConfig,
  getSecurityConfig,
  isAuthRequired,
  isDirectAgentExecutionAllowed,
  isAutoPermissionsEnabled,
  getRequiredPermission,
  DEFAULT_SECURITY_CONFIG,
} from '../security.js'

describe('Security Configuration', () => {
  beforeEach(() => {
    // Reset to defaults before each test
    initSecurityConfig(DEFAULT_SECURITY_CONFIG)
  })

  describe('DEFAULT_SECURITY_CONFIG', () => {
    it('should have secure defaults', () => {
      expect(DEFAULT_SECURITY_CONFIG.requireAuth).toBe(true)
      expect(DEFAULT_SECURITY_CONFIG.allowDirectAgentExecution).toBe(true)
      expect(DEFAULT_SECURITY_CONFIG.autoPermissions).toBe(false)
    })
  })

  describe('initSecurityConfig', () => {
    it('should merge with defaults', () => {
      initSecurityConfig({ requireAuth: false })
      const config = getSecurityConfig()
      expect(config.requireAuth).toBe(false)
      expect(config.allowDirectAgentExecution).toBe(true) // default
      expect(config.autoPermissions).toBe(false) // default
    })

    it('should allow full override', () => {
      initSecurityConfig({
        requireAuth: false,
        allowDirectAgentExecution: false,
        autoPermissions: true,
      })
      const config = getSecurityConfig()
      expect(config.requireAuth).toBe(false)
      expect(config.allowDirectAgentExecution).toBe(false)
      expect(config.autoPermissions).toBe(true)
    })
  })

  describe('getSecurityConfig', () => {
    it('should return current configuration', () => {
      const config = getSecurityConfig()
      expect(config).toHaveProperty('requireAuth')
      expect(config).toHaveProperty('allowDirectAgentExecution')
      expect(config).toHaveProperty('autoPermissions')
    })
  })

  describe('isAuthRequired', () => {
    it('should return true by default', () => {
      expect(isAuthRequired()).toBe(true)
    })

    it('should return false when configured', () => {
      initSecurityConfig({ requireAuth: false })
      expect(isAuthRequired()).toBe(false)
    })
  })

  describe('isDirectAgentExecutionAllowed', () => {
    it('should return true by default', () => {
      expect(isDirectAgentExecutionAllowed()).toBe(true)
    })

    it('should return false when configured', () => {
      initSecurityConfig({ allowDirectAgentExecution: false })
      expect(isDirectAgentExecutionAllowed()).toBe(false)
    })
  })

  describe('isAutoPermissionsEnabled', () => {
    it('should return false by default', () => {
      expect(isAutoPermissionsEnabled()).toBe(false)
    })

    it('should return true when configured', () => {
      initSecurityConfig({ autoPermissions: true })
      expect(isAutoPermissionsEnabled()).toBe(true)
    })
  })

  describe('getRequiredPermission', () => {
    describe('with autoPermissions disabled', () => {
      beforeEach(() => {
        initSecurityConfig({ autoPermissions: false })
      })

      it('should return null for ensembles', () => {
        expect(getRequiredPermission('ensemble', 'invoice-pdf')).toBeNull()
      })

      it('should return null for agents', () => {
        expect(getRequiredPermission('agent', 'http')).toBeNull()
      })
    })

    describe('with autoPermissions enabled', () => {
      beforeEach(() => {
        initSecurityConfig({ autoPermissions: true })
      })

      it('should return permission for ensembles', () => {
        expect(getRequiredPermission('ensemble', 'invoice-pdf')).toBe(
          'ensemble:invoice-pdf:execute'
        )
      })

      it('should return permission for agents', () => {
        expect(getRequiredPermission('agent', 'http')).toBe('agent:http:execute')
      })

      it('should handle special characters in names', () => {
        expect(getRequiredPermission('ensemble', 'billing-invoice-v2')).toBe(
          'ensemble:billing-invoice-v2:execute'
        )
      })
    })
  })
})
