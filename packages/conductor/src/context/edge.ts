/**
 * Edge Context
 *
 * Network and infrastructure information from Cloudflare's edge.
 * Includes datacenter location, ASN info, protocol details, and TLS information.
 *
 * Separate from LocationContext (which is about geographic location).
 * EdgeContext is about *how* the request arrived - network path, protocols, etc.
 */

import type { CloudflareRequestCF } from './location.js'

/**
 * Known cloud provider ASNs
 * Used to detect requests originating from cloud infrastructure
 */
const CLOUD_PROVIDER_ASNS: Record<number, string> = {
  // Amazon Web Services
  16509: 'AWS',
  14618: 'AWS',
  // Google Cloud Platform
  15169: 'Google Cloud',
  396982: 'Google Cloud',
  // Microsoft Azure
  8075: 'Microsoft Azure',
  8068: 'Microsoft',
  // DigitalOcean
  14061: 'DigitalOcean',
  // Cloudflare
  13335: 'Cloudflare',
  // Oracle Cloud
  31898: 'Oracle Cloud',
  // IBM Cloud
  36351: 'IBM Cloud',
  // Alibaba Cloud
  45102: 'Alibaba Cloud',
  // Linode/Akamai
  63949: 'Linode',
  // Vultr
  20473: 'Vultr',
  // Hetzner
  24940: 'Hetzner',
  // OVH
  16276: 'OVH',
}

/**
 * Known VPN/proxy provider ASNs
 * Used to detect requests from VPN services
 */
const VPN_PROVIDER_ASNS: Record<number, string> = {
  // NordVPN
  212238: 'NordVPN',
  // ExpressVPN
  394711: 'ExpressVPN',
  // Private Internet Access
  19969: 'PIA',
  // Mullvad
  198120: 'Mullvad',
  // ProtonVPN (shares with ProtonMail)
  62371: 'ProtonVPN',
  // Various hosting providers commonly used by VPNs
  9009: 'M247', // VPN hosting provider
  45102: 'Alibaba Cloud', // Often used by VPNs in Asia
}

/**
 * Cloudflare datacenter code to city name mapping
 * Common colos - this is not exhaustive
 */
const COLO_NAMES: Record<string, string> = {
  // North America
  ATL: 'Atlanta',
  BOS: 'Boston',
  ORD: 'Chicago',
  DFW: 'Dallas',
  DEN: 'Denver',
  IAD: 'Washington DC',
  LAX: 'Los Angeles',
  MCI: 'Kansas City',
  MIA: 'Miami',
  MSP: 'Minneapolis',
  EWR: 'Newark',
  JFK: 'New York',
  PHX: 'Phoenix',
  PDX: 'Portland',
  SJC: 'San Jose',
  SEA: 'Seattle',
  SFO: 'San Francisco',
  YYZ: 'Toronto',
  YVR: 'Vancouver',
  YUL: 'Montreal',

  // Europe
  AMS: 'Amsterdam',
  TXL: 'Berlin',
  BRU: 'Brussels',
  CPH: 'Copenhagen',
  DUB: 'Dublin',
  DUS: 'Düsseldorf',
  FRA: 'Frankfurt',
  HAM: 'Hamburg',
  HEL: 'Helsinki',
  LIS: 'Lisbon',
  LHR: 'London',
  MAD: 'Madrid',
  MAN: 'Manchester',
  MRS: 'Marseille',
  MXP: 'Milan',
  MUC: 'Munich',
  OSL: 'Oslo',
  CDG: 'Paris',
  PRG: 'Prague',
  FCO: 'Rome',
  ARN: 'Stockholm',
  VIE: 'Vienna',
  WAW: 'Warsaw',
  ZRH: 'Zurich',

  // Asia Pacific
  BKK: 'Bangkok',
  HKG: 'Hong Kong',
  CGK: 'Jakarta',
  KUL: 'Kuala Lumpur',
  MNL: 'Manila',
  BOM: 'Mumbai',
  DEL: 'New Delhi',
  KIX: 'Osaka',
  ICN: 'Seoul',
  SIN: 'Singapore',
  SYD: 'Sydney',
  TPE: 'Taipei',
  NRT: 'Tokyo',
  MEL: 'Melbourne',
  AKL: 'Auckland',

  // Middle East / Africa
  DXB: 'Dubai',
  TLV: 'Tel Aviv',
  JNB: 'Johannesburg',
  CPT: 'Cape Town',
  CAI: 'Cairo',

  // South America
  GRU: 'São Paulo',
  GIG: 'Rio de Janeiro',
  EZE: 'Buenos Aires',
  SCL: 'Santiago',
  BOG: 'Bogotá',
  LIM: 'Lima',
}

/**
 * Edge context for network/infrastructure information
 *
 * Provides information about how the request arrived:
 * - Which Cloudflare datacenter handled it
 * - Network provider (ASN) information
 * - Protocol details (HTTP version, TLS)
 *
 * @example
 * ```typescript
 * export default async function myAgent(ctx: AgentExecutionContext) {
 *   const { edge } = ctx;
 *
 *   // Check for cloud provider traffic
 *   if (edge.isFromCloudProvider()) {
 *     // Apply stricter rate limiting for potential bots
 *   }
 *
 *   // Log edge location for debugging
 *   console.log(`Served from ${edge.coloName} (${edge.colo})`);
 *
 *   // Check protocol
 *   if (edge.isHTTP2OrHigher()) {
 *     // Can use HTTP/2+ features
 *   }
 * }
 * ```
 */
export interface EdgeContext {
  // ─────────────────────────────────────────────────────────────
  // Data Center
  // ─────────────────────────────────────────────────────────────

  /** Cloudflare datacenter code (e.g., "DFW", "LHR") */
  colo: string

  /** Human-readable datacenter city name (e.g., "Dallas", "London") */
  coloName: string

  // ─────────────────────────────────────────────────────────────
  // Network
  // ─────────────────────────────────────────────────────────────

  /** Autonomous System Number of the request origin */
  asn: number

  /** Organization name for the ASN (e.g., "Google Cloud", "Comcast") */
  asOrganization: string

  // ─────────────────────────────────────────────────────────────
  // Protocol
  // ─────────────────────────────────────────────────────────────

  /** HTTP protocol version (e.g., "HTTP/2", "HTTP/3") */
  httpProtocol: string

  /** TLS version (e.g., "TLSv1.3") */
  tlsVersion: string

  /** TLS cipher suite used */
  tlsCipher: string

  // ─────────────────────────────────────────────────────────────
  // Client
  // ─────────────────────────────────────────────────────────────

  /** Original Accept-Encoding header from client */
  clientAcceptEncoding: string

  // ─────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Check if request originated from a known cloud provider
   *
   * Useful for detecting potential automated traffic (bots, scrapers, CI/CD)
   *
   * @returns True if ASN matches a known cloud provider
   */
  isFromCloudProvider(): boolean

  /**
   * Get cloud provider name if request is from one
   *
   * @returns Provider name (e.g., "AWS", "Google Cloud") or null
   */
  getCloudProvider(): string | null

  /**
   * Check if request originated from a known VPN provider
   *
   * Note: This is based on ASN and is not foolproof.
   * Many VPNs use residential or cloud IPs that won't be detected.
   *
   * @returns True if ASN matches a known VPN provider
   */
  isFromVPN(): boolean

  /**
   * Get VPN provider name if request is from one
   *
   * @returns Provider name or null
   */
  getVPNProvider(): string | null

  /**
   * Check if connection uses HTTP/2 or higher
   *
   * @returns True if HTTP/2, HTTP/3, etc.
   */
  isHTTP2OrHigher(): boolean

  /**
   * Check if connection uses HTTP/3 (QUIC)
   *
   * @returns True if HTTP/3
   */
  isHTTP3(): boolean

  /**
   * Check if connection uses modern TLS (1.2+)
   *
   * @returns True if TLSv1.2 or TLSv1.3
   */
  isModernTLS(): boolean
}

/**
 * Create an EdgeContext from Cloudflare's request.cf data
 *
 * @param cf - Cloudflare's request.cf object
 * @returns EdgeContext with network and infrastructure info
 */
export function createEdgeContext(cf: CloudflareRequestCF | undefined): EdgeContext {
  const colo = cf?.colo || 'XXX'
  const asn = cf?.asn || 0
  const asOrganization = cf?.asOrganization || ''
  const httpProtocol = cf?.httpProtocol || 'HTTP/1.1'
  const tlsVersion = cf?.tlsVersion || ''
  const tlsCipher = cf?.tlsCipher || ''
  const clientAcceptEncoding = cf?.clientAcceptEncoding || ''

  return {
    // Data center
    colo,
    coloName: COLO_NAMES[colo] || colo,

    // Network
    asn,
    asOrganization,

    // Protocol
    httpProtocol,
    tlsVersion,
    tlsCipher,

    // Client
    clientAcceptEncoding,

    // Methods
    isFromCloudProvider(): boolean {
      return asn in CLOUD_PROVIDER_ASNS
    },

    getCloudProvider(): string | null {
      return CLOUD_PROVIDER_ASNS[asn] || null
    },

    isFromVPN(): boolean {
      return asn in VPN_PROVIDER_ASNS
    },

    getVPNProvider(): string | null {
      return VPN_PROVIDER_ASNS[asn] || null
    },

    isHTTP2OrHigher(): boolean {
      return httpProtocol.includes('HTTP/2') || httpProtocol.includes('HTTP/3')
    },

    isHTTP3(): boolean {
      return httpProtocol.includes('HTTP/3')
    },

    isModernTLS(): boolean {
      return tlsVersion.includes('TLSv1.2') || tlsVersion.includes('TLSv1.3')
    },
  }
}

/**
 * Create a default/empty EdgeContext for testing
 */
export function createDefaultEdgeContext(): EdgeContext {
  return createEdgeContext(undefined)
}
