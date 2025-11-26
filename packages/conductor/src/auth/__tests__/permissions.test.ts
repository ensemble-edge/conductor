/**
 * Permission Utilities Tests
 *
 * Tests for the industry-standard permission checking system with wildcard support.
 */

import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getMissingPermissions,
  isValidPermissionFormat,
  parsePermission,
  buildPermission,
  normalizePermission,
} from '../permissions.js'

describe('Permission Utilities', () => {
  describe('hasPermission', () => {
    describe('exact matching', () => {
      it('should return true for exact permission match', () => {
        expect(
          hasPermission(['ensemble:invoice-pdf:execute'], 'ensemble:invoice-pdf:execute')
        ).toBe(true)
      })

      it('should return false for non-matching permission', () => {
        expect(hasPermission(['ensemble:invoice-pdf:execute'], 'ensemble:receipt:execute')).toBe(
          false
        )
      })

      it('should return true when no permission is required', () => {
        expect(hasPermission([], '')).toBe(true)
      })

      it('should return false when user has no permissions', () => {
        expect(hasPermission([], 'ensemble:test:execute')).toBe(false)
      })
    })

    describe('superuser wildcard (*)', () => {
      it('should match everything with superuser wildcard', () => {
        expect(hasPermission(['*'], 'ensemble:any:execute')).toBe(true)
        expect(hasPermission(['*'], 'agent:http:execute')).toBe(true)
        expect(hasPermission(['*'], 'admin:users:delete')).toBe(true)
      })

      it('should match superuser among other permissions', () => {
        expect(hasPermission(['read:only', '*'], 'admin:delete')).toBe(true)
      })
    })

    describe('category wildcard (resource:*)', () => {
      it('should match all permissions in a category', () => {
        expect(hasPermission(['ensemble:*'], 'ensemble:invoice-pdf:execute')).toBe(true)
        expect(hasPermission(['ensemble:*'], 'ensemble:receipt:read')).toBe(true)
      })

      it('should not match permissions in other categories', () => {
        expect(hasPermission(['ensemble:*'], 'agent:http:execute')).toBe(false)
      })
    })

    describe('action wildcard (resource:*:action)', () => {
      it('should match any name with specific action', () => {
        expect(hasPermission(['ensemble:*:execute'], 'ensemble:invoice-pdf:execute')).toBe(true)
        expect(hasPermission(['ensemble:*:execute'], 'ensemble:receipt:execute')).toBe(true)
      })

      it('should not match different actions', () => {
        expect(hasPermission(['ensemble:*:execute'], 'ensemble:invoice-pdf:read')).toBe(false)
      })

      it('should work for agent resources', () => {
        expect(hasPermission(['agent:*:execute'], 'agent:http:execute')).toBe(true)
        expect(hasPermission(['agent:*:execute'], 'agent:think:execute')).toBe(true)
      })
    })

    describe('pattern matching with glob wildcards', () => {
      it('should match prefix patterns', () => {
        expect(
          hasPermission(['ensemble:billing-*:execute'], 'ensemble:billing-invoice:execute')
        ).toBe(true)
        expect(
          hasPermission(['ensemble:billing-*:execute'], 'ensemble:billing-receipt:execute')
        ).toBe(true)
      })

      it('should not match non-matching patterns', () => {
        expect(
          hasPermission(['ensemble:billing-*:execute'], 'ensemble:shipping-invoice:execute')
        ).toBe(false)
      })

      it('should match suffix patterns', () => {
        expect(hasPermission(['ensemble:*-pdf:execute'], 'ensemble:invoice-pdf:execute')).toBe(true)
        expect(hasPermission(['ensemble:*-pdf:execute'], 'ensemble:report-pdf:execute')).toBe(true)
      })

      it('should match middle patterns', () => {
        expect(
          hasPermission(['ensemble:report-*-v2:execute'], 'ensemble:report-monthly-v2:execute')
        ).toBe(true)
      })
    })

    describe('multiple user permissions', () => {
      it('should return true if any permission matches', () => {
        const userPerms = [
          'ensemble:invoice:read',
          'ensemble:invoice:execute',
          'agent:http:execute',
        ]
        expect(hasPermission(userPerms, 'ensemble:invoice:execute')).toBe(true)
      })

      it('should return false if no permission matches', () => {
        const userPerms = ['ensemble:invoice:read', 'agent:http:execute']
        expect(hasPermission(userPerms, 'ensemble:invoice:delete')).toBe(false)
      })
    })
  })

  describe('hasAnyPermission', () => {
    it('should return true if user has any of the required permissions', () => {
      const userPerms = ['ensemble:invoice:execute']
      const required = ['ensemble:invoice:execute', 'ensemble:receipt:execute']
      expect(hasAnyPermission(userPerms, required)).toBe(true)
    })

    it('should return false if user has none of the required permissions', () => {
      const userPerms = ['ensemble:other:execute']
      const required = ['ensemble:invoice:execute', 'ensemble:receipt:execute']
      expect(hasAnyPermission(userPerms, required)).toBe(false)
    })

    it('should work with wildcards', () => {
      const userPerms = ['ensemble:*:execute']
      const required = ['ensemble:invoice:execute', 'agent:http:execute']
      expect(hasAnyPermission(userPerms, required)).toBe(true)
    })
  })

  describe('hasAllPermissions', () => {
    it('should return true if user has all required permissions', () => {
      const userPerms = ['ensemble:invoice:execute', 'ensemble:receipt:execute']
      const required = ['ensemble:invoice:execute', 'ensemble:receipt:execute']
      expect(hasAllPermissions(userPerms, required)).toBe(true)
    })

    it('should return false if user is missing any permission', () => {
      const userPerms = ['ensemble:invoice:execute']
      const required = ['ensemble:invoice:execute', 'ensemble:receipt:execute']
      expect(hasAllPermissions(userPerms, required)).toBe(false)
    })

    it('should work with wildcard that covers all', () => {
      const userPerms = ['ensemble:*:execute']
      const required = ['ensemble:invoice:execute', 'ensemble:receipt:execute']
      expect(hasAllPermissions(userPerms, required)).toBe(true)
    })

    it('should fail with wildcard that does not cover all', () => {
      const userPerms = ['ensemble:*:execute']
      const required = ['ensemble:invoice:execute', 'agent:http:execute']
      expect(hasAllPermissions(userPerms, required)).toBe(false)
    })
  })

  describe('getMissingPermissions', () => {
    it('should return empty array when user has all permissions', () => {
      const userPerms = ['ensemble:invoice:execute', 'ensemble:receipt:execute']
      const required = ['ensemble:invoice:execute']
      expect(getMissingPermissions(userPerms, required)).toEqual([])
    })

    it('should return missing permissions', () => {
      const userPerms = ['ensemble:invoice:execute']
      const required = [
        'ensemble:invoice:execute',
        'ensemble:receipt:execute',
        'agent:http:execute',
      ]
      expect(getMissingPermissions(userPerms, required)).toEqual([
        'ensemble:receipt:execute',
        'agent:http:execute',
      ])
    })

    it('should account for wildcards', () => {
      const userPerms = ['ensemble:*:execute']
      const required = ['ensemble:invoice:execute', 'agent:http:execute']
      expect(getMissingPermissions(userPerms, required)).toEqual(['agent:http:execute'])
    })
  })

  describe('isValidPermissionFormat', () => {
    it('should accept superuser wildcard', () => {
      expect(isValidPermissionFormat('*')).toBe(true)
    })

    it('should accept two-part category wildcards', () => {
      expect(isValidPermissionFormat('ensemble:*')).toBe(true)
      expect(isValidPermissionFormat('agent:*')).toBe(true)
    })

    it('should accept three-part permissions', () => {
      expect(isValidPermissionFormat('ensemble:invoice:execute')).toBe(true)
      expect(isValidPermissionFormat('agent:http:read')).toBe(true)
      expect(isValidPermissionFormat('ensemble:*:execute')).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(isValidPermissionFormat('')).toBe(false)
      expect(isValidPermissionFormat('single')).toBe(false)
      expect(isValidPermissionFormat('a:b:c:d')).toBe(false)
      expect(isValidPermissionFormat(':empty:parts')).toBe(false)
      expect(isValidPermissionFormat('empty::parts')).toBe(false)
    })
  })

  describe('parsePermission', () => {
    it('should parse superuser wildcard', () => {
      expect(parsePermission('*')).toEqual({ resource: '*', name: '*', action: '*' })
    })

    it('should parse two-part permissions', () => {
      expect(parsePermission('ensemble:*')).toEqual({
        resource: 'ensemble',
        name: '*',
        action: '*',
      })
    })

    it('should parse three-part permissions', () => {
      expect(parsePermission('ensemble:invoice:execute')).toEqual({
        resource: 'ensemble',
        name: 'invoice',
        action: 'execute',
      })
    })

    it('should return null for invalid permissions', () => {
      expect(parsePermission('invalid')).toBe(null)
      expect(parsePermission('a:b:c:d')).toBe(null)
    })
  })

  describe('buildPermission', () => {
    it('should build permission string with default action', () => {
      expect(buildPermission('ensemble', 'invoice')).toBe('ensemble:invoice:execute')
    })

    it('should build permission string with custom action', () => {
      expect(buildPermission('agent', 'http', 'read')).toBe('agent:http:read')
    })
  })

  describe('normalizePermission', () => {
    it('should lowercase and trim', () => {
      expect(normalizePermission('  ENSEMBLE:Invoice:EXECUTE  ')).toBe('ensemble:invoice:execute')
    })
  })
})
