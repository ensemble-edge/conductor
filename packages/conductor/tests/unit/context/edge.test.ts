/**
 * Edge Context Tests
 *
 * Tests for the EdgeContext creation and helper methods
 */

import { describe, it, expect } from 'vitest'
import { createEdgeContext, createDefaultEdgeContext } from '../../../src/context/edge'
import type { CloudflareRequestCF } from '../../../src/context/location'

describe('EdgeContext', () => {
  describe('createEdgeContext', () => {
    it('should create context with full CF data', () => {
      const cf: CloudflareRequestCF = {
        colo: 'DFW',
        asn: 7922,
        asOrganization: 'Comcast Cable Communications, LLC',
        httpProtocol: 'HTTP/2',
        tlsVersion: 'TLSv1.3',
        tlsCipher: 'AEAD-AES128-GCM-SHA256',
        clientAcceptEncoding: 'gzip, deflate, br',
      }

      const edge = createEdgeContext(cf)

      expect(edge.colo).toBe('DFW')
      expect(edge.coloName).toBe('Dallas')
      expect(edge.asn).toBe(7922)
      expect(edge.asOrganization).toBe('Comcast Cable Communications, LLC')
      expect(edge.httpProtocol).toBe('HTTP/2')
      expect(edge.tlsVersion).toBe('TLSv1.3')
      expect(edge.tlsCipher).toBe('AEAD-AES128-GCM-SHA256')
      expect(edge.clientAcceptEncoding).toBe('gzip, deflate, br')
    })

    it('should handle undefined CF data with defaults', () => {
      const edge = createEdgeContext(undefined)

      expect(edge.colo).toBe('XXX')
      expect(edge.coloName).toBe('XXX')
      expect(edge.asn).toBe(0)
      expect(edge.asOrganization).toBe('')
      expect(edge.httpProtocol).toBe('HTTP/1.1')
      expect(edge.tlsVersion).toBe('')
      expect(edge.tlsCipher).toBe('')
    })

    it('should map known colo codes to city names', () => {
      const testCases = [
        { colo: 'LHR', expected: 'London' },
        { colo: 'SFO', expected: 'San Francisco' },
        { colo: 'NRT', expected: 'Tokyo' },
        { colo: 'SIN', expected: 'Singapore' },
        { colo: 'FRA', expected: 'Frankfurt' },
        { colo: 'SYD', expected: 'Sydney' },
      ]

      for (const { colo, expected } of testCases) {
        const edge = createEdgeContext({ colo })
        expect(edge.coloName).toBe(expected)
      }
    })

    it('should return colo code for unknown colos', () => {
      const edge = createEdgeContext({ colo: 'XYZ' })
      expect(edge.coloName).toBe('XYZ')
    })
  })

  describe('createDefaultEdgeContext', () => {
    it('should create context with safe defaults', () => {
      const edge = createDefaultEdgeContext()

      expect(edge.colo).toBe('XXX')
      expect(edge.asn).toBe(0)
      expect(edge.httpProtocol).toBe('HTTP/1.1')
    })
  })

  describe('isFromCloudProvider', () => {
    it('should detect AWS', () => {
      const edge = createEdgeContext({ asn: 16509 })
      expect(edge.isFromCloudProvider()).toBe(true)
      expect(edge.getCloudProvider()).toBe('AWS')
    })

    it('should detect Google Cloud', () => {
      const edge = createEdgeContext({ asn: 15169 })
      expect(edge.isFromCloudProvider()).toBe(true)
      expect(edge.getCloudProvider()).toBe('Google Cloud')
    })

    it('should detect Microsoft Azure', () => {
      const edge = createEdgeContext({ asn: 8075 })
      expect(edge.isFromCloudProvider()).toBe(true)
      expect(edge.getCloudProvider()).toBe('Microsoft Azure')
    })

    it('should detect DigitalOcean', () => {
      const edge = createEdgeContext({ asn: 14061 })
      expect(edge.isFromCloudProvider()).toBe(true)
      expect(edge.getCloudProvider()).toBe('DigitalOcean')
    })

    it('should detect Cloudflare', () => {
      const edge = createEdgeContext({ asn: 13335 })
      expect(edge.isFromCloudProvider()).toBe(true)
      expect(edge.getCloudProvider()).toBe('Cloudflare')
    })

    it('should return false for regular ISP', () => {
      const edge = createEdgeContext({ asn: 7922, asOrganization: 'Comcast' })
      expect(edge.isFromCloudProvider()).toBe(false)
      expect(edge.getCloudProvider()).toBe(null)
    })

    it('should return false for unknown ASN', () => {
      const edge = createEdgeContext({ asn: 99999 })
      expect(edge.isFromCloudProvider()).toBe(false)
      expect(edge.getCloudProvider()).toBe(null)
    })
  })

  describe('isFromVPN', () => {
    it('should detect known VPN provider ASN', () => {
      const edge = createEdgeContext({ asn: 212238 })
      expect(edge.isFromVPN()).toBe(true)
      expect(edge.getVPNProvider()).toBe('NordVPN')
    })

    it('should detect Mullvad', () => {
      const edge = createEdgeContext({ asn: 198120 })
      expect(edge.isFromVPN()).toBe(true)
      expect(edge.getVPNProvider()).toBe('Mullvad')
    })

    it('should return false for regular ISP', () => {
      const edge = createEdgeContext({ asn: 7922 })
      expect(edge.isFromVPN()).toBe(false)
      expect(edge.getVPNProvider()).toBe(null)
    })
  })

  describe('isHTTP2OrHigher', () => {
    it('should return true for HTTP/2', () => {
      const edge = createEdgeContext({ httpProtocol: 'HTTP/2' })
      expect(edge.isHTTP2OrHigher()).toBe(true)
    })

    it('should return true for HTTP/3', () => {
      const edge = createEdgeContext({ httpProtocol: 'HTTP/3' })
      expect(edge.isHTTP2OrHigher()).toBe(true)
    })

    it('should return false for HTTP/1.1', () => {
      const edge = createEdgeContext({ httpProtocol: 'HTTP/1.1' })
      expect(edge.isHTTP2OrHigher()).toBe(false)
    })

    it('should return false for HTTP/1.0', () => {
      const edge = createEdgeContext({ httpProtocol: 'HTTP/1.0' })
      expect(edge.isHTTP2OrHigher()).toBe(false)
    })
  })

  describe('isHTTP3', () => {
    it('should return true for HTTP/3', () => {
      const edge = createEdgeContext({ httpProtocol: 'HTTP/3' })
      expect(edge.isHTTP3()).toBe(true)
    })

    it('should return false for HTTP/2', () => {
      const edge = createEdgeContext({ httpProtocol: 'HTTP/2' })
      expect(edge.isHTTP3()).toBe(false)
    })
  })

  describe('isModernTLS', () => {
    it('should return true for TLSv1.3', () => {
      const edge = createEdgeContext({ tlsVersion: 'TLSv1.3' })
      expect(edge.isModernTLS()).toBe(true)
    })

    it('should return true for TLSv1.2', () => {
      const edge = createEdgeContext({ tlsVersion: 'TLSv1.2' })
      expect(edge.isModernTLS()).toBe(true)
    })

    it('should return false for TLSv1.1', () => {
      const edge = createEdgeContext({ tlsVersion: 'TLSv1.1' })
      expect(edge.isModernTLS()).toBe(false)
    })

    it('should return false for TLSv1.0', () => {
      const edge = createEdgeContext({ tlsVersion: 'TLSv1.0' })
      expect(edge.isModernTLS()).toBe(false)
    })

    it('should return false for empty TLS version', () => {
      const edge = createEdgeContext({ tlsVersion: '' })
      expect(edge.isModernTLS()).toBe(false)
    })
  })
})
