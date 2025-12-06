/**
 * Edge Context
 *
 * Network and infrastructure information from Cloudflare's edge.
 * Includes datacenter location, ASN info, protocol details, and TLS information.
 *
 * Separate from LocationContext (which is about geographic location).
 * EdgeContext is about *how* the request arrived - network path, protocols, etc.
 */
/**
 * Known cloud provider ASNs
 * Used to detect requests originating from cloud infrastructure
 */
const CLOUD_PROVIDER_ASNS = {
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
};
/**
 * Known VPN/proxy provider ASNs
 * Used to detect requests from VPN services
 */
const VPN_PROVIDER_ASNS = {
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
};
/**
 * Cloudflare datacenter code to city name mapping
 * Common colos - this is not exhaustive
 */
const COLO_NAMES = {
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
};
/**
 * Create an EdgeContext from Cloudflare's request.cf data
 *
 * @param cf - Cloudflare's request.cf object
 * @returns EdgeContext with network and infrastructure info
 */
export function createEdgeContext(cf) {
    const colo = cf?.colo || 'XXX';
    const asn = cf?.asn || 0;
    const asOrganization = cf?.asOrganization || '';
    const httpProtocol = cf?.httpProtocol || 'HTTP/1.1';
    const tlsVersion = cf?.tlsVersion || '';
    const tlsCipher = cf?.tlsCipher || '';
    const clientAcceptEncoding = cf?.clientAcceptEncoding || '';
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
        isFromCloudProvider() {
            return asn in CLOUD_PROVIDER_ASNS;
        },
        getCloudProvider() {
            return CLOUD_PROVIDER_ASNS[asn] || null;
        },
        isFromVPN() {
            return asn in VPN_PROVIDER_ASNS;
        },
        getVPNProvider() {
            return VPN_PROVIDER_ASNS[asn] || null;
        },
        isHTTP2OrHigher() {
            return httpProtocol.includes('HTTP/2') || httpProtocol.includes('HTTP/3');
        },
        isHTTP3() {
            return httpProtocol.includes('HTTP/3');
        },
        isModernTLS() {
            return tlsVersion.includes('TLSv1.2') || tlsVersion.includes('TLSv1.3');
        },
    };
}
/**
 * Create a default/empty EdgeContext for testing
 */
export function createDefaultEdgeContext() {
    return createEdgeContext(undefined);
}
