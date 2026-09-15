// jb7572_2026-08-24: Network & Security Subsystem Architecture Service
import { 
  NetworkInterface, 
  FirewallRule, 
  SocketEntry, 
  PingHop,
  DnsRecordEntry,
  DnsLookupResult,
  CapturedPacket,
  GeoIpTrafficNode,
  WifiNetworkProfile,
  WifiGeneration,
  WifiSecurityType,
  WifiFrequencyBand,
  VpnProtocol,
  VpnStatus,
  VpnServerProfile,
  VpnConfig
} from '../types';

const STORAGE_KEY_WIFI_PROFILES = 'k_os_saved_wifi_profiles_v3';
const STORAGE_KEY_VPN_CONFIG = 'k_os_vpn_config_v3';
const STORAGE_KEY_VPN_SERVERS = 'k_os_vpn_servers_v3';

const initialWifiProfiles: WifiNetworkProfile[] = [
  {
    id: 'wifi_profile_1',
    ssid: 'MissionControl-Secure-8G',
    bssid: 'a4:bb:6d:88:99:01',
    security: 'WPA4-Quantum',
    isSecured: true,
    ipMode: 'DHCP',
    ipAddress: '192.168.50.75',
    subnetMask: '255.255.255.0',
    gateway: '192.168.50.1',
    primaryDns: '1.1.1.1',
    secondaryDns: '1.0.0.1',
    networkType: 'PRIVATE',
    signalStrength: 98,
    frequency: 'Sub-THz',
    channel: 165,
    channelWidthMHz: 320,
    generation: 'WiFi 8',
    mloEnabled: true,
    isHidden: false,
    autoConnect: true,
    saved: true,
    connected: true,
    lastConnected: 'Just now'
  },
  {
    id: 'wifi_profile_2',
    ssid: 'AeroLab-EHT-Mesh-7',
    bssid: '58:cb:52:12:44:19',
    security: 'WPA3',
    isSecured: true,
    ipMode: 'DHCP',
    ipAddress: '192.168.100.42',
    subnetMask: '255.255.255.0',
    gateway: '192.168.100.1',
    primaryDns: '1.1.1.1',
    secondaryDns: '8.8.8.8',
    networkType: 'PRIVATE',
    signalStrength: 91,
    frequency: 'Multi-Band MLO',
    channel: 69,
    channelWidthMHz: 320,
    generation: 'WiFi 7',
    mloEnabled: true,
    isHidden: false,
    autoConnect: true,
    saved: true,
    connected: false,
    lastConnected: 'Yesterday at 14:22'
  },
  {
    id: 'wifi_profile_3',
    ssid: 'Pixel-Pro-FieldHotspot',
    bssid: '72:1a:89:ef:33:04',
    security: 'WPA2',
    isSecured: true,
    ipMode: 'STATIC',
    ipAddress: '192.168.43.150',
    subnetMask: '255.255.255.0',
    gateway: '192.168.43.1',
    primaryDns: '8.8.8.8',
    secondaryDns: '8.8.4.4',
    networkType: 'PRIVATE',
    signalStrength: 90,
    frequency: '5GHz',
    channel: 48,
    channelWidthMHz: 160,
    generation: 'WiFi 6E',
    autoConnect: false,
    saved: true,
    connected: false,
    lastConnected: '3 days ago'
  },
  {
    id: 'wifi_profile_4',
    ssid: 'Downtown-CoffeeLab-Guest',
    bssid: '3c:84:6a:5b:99:cd',
    security: 'OPEN',
    isSecured: false,
    ipMode: 'DHCP',
    ipAddress: '10.0.0.88',
    subnetMask: '255.255.0.0',
    gateway: '10.0.0.1',
    primaryDns: '9.9.9.9',
    secondaryDns: '149.112.112.112',
    networkType: 'PUBLIC',
    signalStrength: 68,
    frequency: '2.4GHz',
    channel: 6,
    channelWidthMHz: 40,
    generation: 'WiFi 5',
    autoConnect: false,
    saved: true,
    connected: false,
    lastConnected: 'Last week'
  },
  {
    id: 'wifi_profile_5',
    ssid: 'Corporate-Enterprise-VLAN',
    bssid: 'e0:d5:5e:11:22:33',
    security: 'WPA3',
    isSecured: true,
    ipMode: 'STATIC',
    ipAddress: '172.16.10.45',
    subnetMask: '255.255.0.0',
    gateway: '172.16.0.1',
    primaryDns: '1.1.1.1',
    secondaryDns: '9.9.9.9',
    networkType: 'PRIVATE',
    signalStrength: 75,
    frequency: '6GHz',
    channel: 149,
    channelWidthMHz: 160,
    generation: 'WiFi 6E',
    autoConnect: true,
    saved: true,
    connected: false,
    lastConnected: '2 weeks ago'
  }
];

const nearbyDiscoveredAps: WifiNetworkProfile[] = [
  {
    id: 'scan_ap_hidden_1',
    ssid: '[Hidden Non-Broadcasting AP]',
    bssid: 'c8:d7:19:66:33:bb',
    security: 'WPA4-Quantum',
    isSecured: true,
    ipMode: 'DHCP',
    ipAddress: '192.168.88.50',
    subnetMask: '255.255.255.0',
    gateway: '192.168.88.1',
    primaryDns: '1.1.1.1',
    secondaryDns: '1.0.0.1',
    networkType: 'PRIVATE',
    signalStrength: 88,
    frequency: 'Sub-THz',
    channel: 177,
    channelWidthMHz: 320,
    generation: 'WiFi 8',
    mloEnabled: true,
    isHidden: true,
    unmaskedSsid: '',
    autoConnect: false,
    saved: false,
    connected: false
  },
  {
    id: 'scan_ap_hidden_2',
    ssid: '[Hidden Stealth Infrastructure]',
    bssid: '02:ff:8a:99:bc:41',
    security: 'WPA3',
    isSecured: true,
    ipMode: 'DHCP',
    ipAddress: '10.99.1.5',
    subnetMask: '255.255.0.0',
    gateway: '10.99.0.1',
    primaryDns: '9.9.9.9',
    secondaryDns: '1.1.1.1',
    networkType: 'PRIVATE',
    signalStrength: 76,
    frequency: 'Multi-Band MLO',
    channel: 132,
    channelWidthMHz: 320,
    generation: 'WiFi 7',
    mloEnabled: true,
    isHidden: true,
    unmaskedSsid: '',
    autoConnect: false,
    saved: false,
    connected: false
  },
  {
    id: 'scan_ap_1',
    ssid: 'CityAirport-Free-Public',
    bssid: '00:14:22:01:23:45',
    security: 'OPEN',
    isSecured: false,
    ipMode: 'DHCP',
    ipAddress: '10.128.4.19',
    subnetMask: '255.255.0.0',
    gateway: '10.128.0.1',
    primaryDns: '8.8.8.8',
    secondaryDns: '8.8.4.4',
    networkType: 'PUBLIC',
    signalStrength: 52,
    frequency: '2.4GHz',
    channel: 11,
    channelWidthMHz: 20,
    generation: 'WiFi 4',
    autoConnect: false,
    saved: false,
    connected: false
  },
  {
    id: 'scan_ap_2',
    ssid: 'Tesla-Supercharger-Node-88',
    bssid: '4c:5e:0c:9a:11:88',
    security: 'WPA2',
    isSecured: true,
    ipMode: 'DHCP',
    ipAddress: '192.168.12.90',
    subnetMask: '255.255.255.0',
    gateway: '192.168.12.1',
    primaryDns: '1.1.1.1',
    secondaryDns: '1.0.0.1',
    networkType: 'PUBLIC',
    signalStrength: 64,
    frequency: '5GHz',
    channel: 44,
    channelWidthMHz: 80,
    generation: 'WiFi 5',
    autoConnect: false,
    saved: false,
    connected: false
  },
  {
    id: 'scan_ap_3',
    ssid: 'NextGen-EHT-Wi-Fi7-Tower',
    bssid: '9c:c9:eb:44:88:12',
    security: 'WPA3',
    isSecured: true,
    ipMode: 'DHCP',
    ipAddress: '192.168.1.180',
    subnetMask: '255.255.255.0',
    gateway: '192.168.1.1',
    primaryDns: '1.1.1.1',
    secondaryDns: '8.8.8.8',
    networkType: 'PRIVATE',
    signalStrength: 89,
    frequency: '6GHz',
    channel: 100,
    channelWidthMHz: 320,
    generation: 'WiFi 7',
    mloEnabled: true,
    autoConnect: false,
    saved: false,
    connected: false
  }
];

const initialVpnServers: VpnServerProfile[] = [
  {
    id: 'vpn_server_1',
    name: 'Reykjavik Zero-Log Citadel',
    protocol: 'WIREGUARD',
    endpoint: 'is-reyk-wg01.vpn.securecurtain.io:51820',
    location: 'Reykjavik, Iceland (Tier-4 Subterranean)',
    countryCode: 'IS',
    pingMs: 16,
    quantumResistant: true,
    cipher: 'ChaCha20-Poly1305 + Kyber-1024 Post-Quantum',
    loadPercent: 21
  },
  {
    id: 'vpn_server_2',
    name: 'Zurich Alpine Privacy Vault',
    protocol: 'WIREGUARD',
    endpoint: 'ch-zur-wg02.vpn.securecurtain.io:51820',
    location: 'Zurich, Switzerland (Non-14 Eyes Sovereign)',
    countryCode: 'CH',
    pingMs: 22,
    quantumResistant: true,
    cipher: 'ChaCha20-Poly1305 + Kyber-1024 Post-Quantum',
    loadPercent: 34
  },
  {
    id: 'vpn_server_3',
    name: 'Tokyo Stealth QUIC Tunnel',
    protocol: 'STEALTH_HYSTERIA2',
    endpoint: 'jp-tyo-hys01.vpn.securecurtain.io:443',
    location: 'Tokyo, Japan (Anti-Censorship Cloaked)',
    countryCode: 'JP',
    pingMs: 64,
    quantumResistant: true,
    cipher: 'QUIC / TLS 1.3 Obfuscated ChaCha20',
    loadPercent: 42
  },
  {
    id: 'vpn_server_4',
    name: 'Frankfurt DE-CIX Core',
    protocol: 'OPENVPN',
    endpoint: 'de-fra-ovpn01.vpn.securecurtain.io:1194',
    location: 'Frankfurt, Germany (European IX Node)',
    countryCode: 'DE',
    pingMs: 28,
    quantumResistant: false,
    cipher: 'AES-256-GCM / DHE-4096 / TLS 1.3',
    loadPercent: 49
  },
  {
    id: 'vpn_server_5',
    name: 'Washington D.C. Federal Node',
    protocol: 'IPSEC_IKEV2',
    endpoint: 'us-dc-ipsec01.vpn.securecurtain.io:500',
    location: 'Washington D.C., USA (East Coast)',
    countryCode: 'US',
    pingMs: 44,
    quantumResistant: true,
    cipher: 'IPsec StrongSwan AES-256-GCM / SHA-512',
    loadPercent: 58
  },
  {
    id: 'vpn_server_6',
    name: 'Private Intranet Mesh Node',
    protocol: 'WIREGUARD',
    endpoint: '10.88.0.1:51820',
    location: 'Local SecureCurtain P2P Mesh Ring',
    countryCode: 'LAN',
    pingMs: 2,
    quantumResistant: true,
    cipher: 'WireGuard Zero-Copy Linux Kernel Socket',
    loadPercent: 9
  }
];

const initialVpnConfig: VpnConfig = {
  activeProfileId: 'vpn_server_1',
  status: 'DISCONNECTED',
  killSwitch: true,
  dnsLeakProtection: true,
  splitTunneling: false,
  splitTunnelExcludedIps: ['192.168.1.0/24', '10.0.0.0/8'],
  autoConnectOnUntrustedWifi: true
};


// jb7572_2026-08-24: Default Network Interfaces representing physical PCIe & virtual devices
const initialInterfaces: NetworkInterface[] = [
  {
    name: 'eth0',
    driver: 'Intel e1000 PCIe (Ring 0 lwIP Stack)',
    mac: '52:54:00:12:34:56',
    ipv4: '192.168.1.140',
    netmask: '255.255.255.0',
    gateway: '192.168.1.1',
    dns: ['1.1.1.1', '8.8.8.8'],
    ipv6: 'fe80::5054:ff:fe12:3456/64',
    mtu: 1500,
    state: 'UP',
    type: 'ETHERNET',
    speedMbps: 1000,
    rxBytes: 48291040,
    txBytes: 19842100,
    rxPackets: 45210,
    txPackets: 28400,
    rxErrors: 0,
    txErrors: 0,
    isDhcp: true
  },
  {
    name: 'wlan0',
    driver: 'Intel Wi-Fi 6E AX210 160MHz (mac80211)',
    mac: 'a4:bb:6d:88:99:aa',
    ipv4: '192.168.50.75',
    netmask: '255.255.255.0',
    gateway: '192.168.50.1',
    dns: ['1.1.1.1', '9.9.9.9'],
    ipv6: '2600:1700:8490:1000::14/64',
    mtu: 1500,
    state: 'UP',
    type: 'WIRELESS',
    speedMbps: 1200,
    rxBytes: 12849100,
    txBytes: 4920100,
    rxPackets: 14200,
    txPackets: 8100,
    rxErrors: 2,
    txErrors: 0,
    isDhcp: true
  },
  {
    name: 'lo',
    driver: 'Virtual Kernel Loopback Interface',
    mac: '00:00:00:00:00:00',
    ipv4: '127.0.0.1',
    netmask: '255.0.0.0',
    gateway: '0.0.0.0',
    dns: [],
    ipv6: '::1/128',
    mtu: 65536,
    state: 'UP',
    type: 'LOOPBACK',
    speedMbps: 10000,
    rxBytes: 89400200,
    txBytes: 89400200,
    rxPackets: 94200,
    txPackets: 94200,
    rxErrors: 0,
    txErrors: 0,
    isDhcp: false
  }
];

// jb7572_2026-08-24: Default Stateful Packet Filter Rules
const initialRules: FirewallRule[] = [
  {
    id: 'rule_1',
    name: 'Allow SSH Secure Shell Remote',
    direction: 'INBOUND',
    action: 'ALLOW',
    protocol: 'TCP',
    portRange: '22',
    source: '0.0.0.0/0',
    destination: '192.168.1.140',
    zone: 'TRUSTED',
    enabled: true,
    hits: 142,
    description: 'Enables Ring 0 remote debugging and shell access over SSH port 22'
  },
  {
    id: 'rule_2',
    name: 'Allow HTTP / HTTPS Web Traffic',
    direction: 'INBOUND',
    action: 'ALLOW',
    protocol: 'TCP',
    portRange: '80, 443',
    source: '0.0.0.0/0',
    destination: '192.168.1.140',
    zone: 'PUBLIC',
    enabled: true,
    hits: 1845,
    description: 'Inbound web server and SSL termination traffic'
  },
  {
    id: 'rule_3',
    name: 'Allow Cockpit GUI Server (Port 8080)',
    direction: 'INBOUND',
    action: 'ALLOW',
    protocol: 'TCP',
    portRange: '8080',
    source: '192.168.1.0/24',
    destination: '192.168.1.140',
    zone: 'TRUSTED',
    enabled: true,
    hits: 890,
    description: 'Access to the Cockpit real-time management dashboard'
  },
  {
    id: 'rule_4',
    name: 'Allow ICMP Echo Request (Ping)',
    direction: 'INBOUND',
    action: 'ALLOW',
    protocol: 'ICMP',
    portRange: 'ANY',
    source: '0.0.0.0/0',
    destination: '192.168.1.140',
    zone: 'PUBLIC',
    enabled: true,
    hits: 56,
    description: 'Responds to ICMP echo diagnostics packets'
  },
  {
    id: 'rule_5',
    name: 'Block Insecure Telnet / RSH',
    direction: 'INBOUND',
    action: 'DROP',
    protocol: 'TCP',
    portRange: '23, 514',
    source: '0.0.0.0/0',
    destination: '192.168.1.140',
    zone: 'PUBLIC',
    enabled: true,
    hits: 8,
    description: 'Automatically drop unencrypted legacy terminal ports'
  },
  {
    id: 'rule_6',
    name: 'Block SMB / NetBIOS Probes (Port 445, 139)',
    direction: 'INBOUND',
    action: 'DROP',
    protocol: 'TCP',
    portRange: '137-139, 445',
    source: '0.0.0.0/0',
    destination: '192.168.1.140',
    zone: 'PUBLIC',
    enabled: true,
    hits: 34,
    description: 'Prevent unauthorized Windows SMB broadcast discovery across public networks'
  },
  {
    id: 'rule_7',
    name: 'Allow All Outbound Network Traffic',
    direction: 'OUTBOUND',
    action: 'ALLOW',
    protocol: 'ALL',
    portRange: 'ANY',
    source: '192.168.1.140',
    destination: '0.0.0.0/0',
    zone: 'PUBLIC',
    enabled: true,
    hits: 12490,
    description: 'Stateful outbound connections for web, DNS, and updates'
  }
];

// jb7572_2026-08-24: Default Active Sockets table (ss -tulpn / netstat)
const initialSockets: SocketEntry[] = [
  {
    id: 'sock_1',
    proto: 'TCP',
    localAddress: '0.0.0.0',
    localPort: 22,
    foreignAddress: '0.0.0.0',
    foreignPort: null,
    state: 'LISTEN',
    pid: 1,
    processName: 'systemd_init',
    service: 'OpenSSH Server'
  },
  {
    id: 'sock_2',
    proto: 'TCP',
    localAddress: '127.0.0.1',
    localPort: 6000,
    foreignAddress: '0.0.0.0',
    foreignPort: null,
    state: 'LISTEN',
    pid: 310,
    processName: 'wayland_compositor_server',
    service: 'Wayland Compositor Display'
  },
  {
    id: 'sock_3',
    proto: 'TCP',
    localAddress: '0.0.0.0',
    localPort: 8080,
    foreignAddress: '0.0.0.0',
    foreignPort: null,
    state: 'LISTEN',
    pid: 620,
    processName: 'utilities_cockpit.elf',
    service: 'Cockpit Subsystem Engine'
  },
  {
    id: 'sock_4',
    proto: 'TCP',
    localAddress: '192.168.1.140',
    localPort: 54322,
    foreignAddress: '142.250.190.46',
    foreignPort: 443,
    state: 'ESTABLISHED',
    pid: 620,
    processName: 'utilities_cockpit.elf',
    service: 'HTTPS Telemetry Stream'
  },
  {
    id: 'sock_5',
    proto: 'TCP',
    localAddress: '192.168.1.140',
    localPort: 49152,
    foreignAddress: '1.1.1.1',
    foreignPort: 853,
    state: 'ESTABLISHED',
    pid: 135,
    processName: 'e1000_net_stack',
    service: 'DNS-over-TLS (Cloudflare)'
  },
  {
    id: 'sock_6',
    proto: 'UDP',
    localAddress: '0.0.0.0',
    localPort: 68,
    foreignAddress: '0.0.0.0',
    foreignPort: null,
    state: 'UNCONN',
    pid: 135,
    processName: 'e1000_net_stack',
    service: 'DHCP Client (lwIP)'
  },
  {
    id: 'sock_7',
    proto: 'UDP',
    localAddress: '127.0.0.1',
    localPort: 5353,
    foreignAddress: '0.0.0.0',
    foreignPort: null,
    state: 'UNCONN',
    pid: 135,
    processName: 'e1000_net_stack',
    service: 'mDNS / ZeroConf Resolver'
  },
  {
    id: 'sock_8',
    proto: 'TCP',
    localAddress: '192.168.1.140',
    localPort: 51204,
    foreignAddress: '192.168.1.1',
    foreignPort: 80,
    state: 'TIME_WAIT',
    pid: 135,
    processName: 'e1000_net_stack',
    service: 'Gateway Probe'
  }
];

class NetworkSecurityService {
  private interfaces: NetworkInterface[] = JSON.parse(JSON.stringify(initialInterfaces));
  private firewallRules: FirewallRule[] = JSON.parse(JSON.stringify(initialRules));
  private sockets: SocketEntry[] = JSON.parse(JSON.stringify(initialSockets));
  private firewallEnabled: boolean = true;
  private currentZone: 'PUBLIC' | 'TRUSTED' | 'DMZ' = 'TRUSTED';
  private wifiProfiles: WifiNetworkProfile[] = [];
  private scannedAps: WifiNetworkProfile[] = JSON.parse(JSON.stringify(nearbyDiscoveredAps));
  private vpnConfig: VpnConfig = JSON.parse(JSON.stringify(initialVpnConfig));
  private vpnServers: VpnServerProfile[] = JSON.parse(JSON.stringify(initialVpnServers));

  constructor() {
    this.loadWifiProfiles();
    this.loadVpnConfig();
    this.loadVpnServers();
  }

  private loadWifiProfiles(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WIFI_PROFILES);
      if (saved) {
        this.wifiProfiles = JSON.parse(saved);
      } else {
        this.wifiProfiles = JSON.parse(JSON.stringify(initialWifiProfiles));
        this.persistWifiProfiles();
      }
    } catch {
      this.wifiProfiles = JSON.parse(JSON.stringify(initialWifiProfiles));
    }
  }

  private persistWifiProfiles(): void {
    try {
      localStorage.setItem(STORAGE_KEY_WIFI_PROFILES, JSON.stringify(this.wifiProfiles));
    } catch {
      // Ignore storage errors in sandbox
    }
  }

  private loadVpnConfig(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VPN_CONFIG);
      if (saved) {
        this.vpnConfig = JSON.parse(saved);
      } else {
        this.vpnConfig = JSON.parse(JSON.stringify(initialVpnConfig));
        this.persistVpnConfig();
      }
    } catch {
      this.vpnConfig = JSON.parse(JSON.stringify(initialVpnConfig));
    }
  }

  private persistVpnConfig(): void {
    try {
      localStorage.setItem(STORAGE_KEY_VPN_CONFIG, JSON.stringify(this.vpnConfig));
    } catch {
      // Ignore storage errors
    }
  }

  private loadVpnServers(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VPN_SERVERS);
      if (saved) {
        this.vpnServers = JSON.parse(saved);
      } else {
        this.vpnServers = JSON.parse(JSON.stringify(initialVpnServers));
        this.persistVpnServers();
      }
    } catch {
      this.vpnServers = JSON.parse(JSON.stringify(initialVpnServers));
    }
  }

  private persistVpnServers(): void {
    try {
      localStorage.setItem(STORAGE_KEY_VPN_SERVERS, JSON.stringify(this.vpnServers));
    } catch {
      // Ignore storage errors
    }
  }

  // ==========================================
  // Wi-Fi & Mobile Network Profiles Management
  // ==========================================
  public getWifiProfiles(): WifiNetworkProfile[] {
    return [...this.wifiProfiles];
  }

  public getConnectedWifiProfile(): WifiNetworkProfile | null {
    return this.wifiProfiles.find(p => p.connected) || null;
  }

  public scanWifiNetworks(): WifiNetworkProfile[] {
    // Generate fresh RSSI and channels for realism
    const saved = this.wifiProfiles;
    const discovered = this.scannedAps.map(ap => ({
      ...ap,
      signalStrength: Math.min(99, Math.max(30, ap.signalStrength + Math.floor(Math.random() * 7) - 3))
    }));
    return [...saved, ...discovered];
  }

  public unmaskHiddenSsid(profileId: string, revealedSsid: string): { success: boolean; message: string; profile?: WifiNetworkProfile } {
    if (!revealedSsid || !revealedSsid.trim()) {
      return { success: false, message: 'Please enter a valid SSID name for the hidden network.' };
    }
    const cleanSsid = revealedSsid.trim();

    // Check in scanned APs
    let target = this.scannedAps.find(p => p.id === profileId);
    if (target) {
      target.unmaskedSsid = cleanSsid;
      target.ssid = cleanSsid;
      target.isHidden = false;
    }

    // Check in saved profiles
    let savedTarget = this.wifiProfiles.find(p => p.id === profileId);
    if (savedTarget) {
      savedTarget.unmaskedSsid = cleanSsid;
      savedTarget.ssid = cleanSsid;
      savedTarget.isHidden = false;
      this.persistWifiProfiles();
    }

    const resolved = target || savedTarget;
    return {
      success: true,
      message: `Hidden Access Point BSSID associated with SSID "${cleanSsid}". Frame probe matched.`,
      profile: resolved ? { ...resolved } : undefined
    };
  }

  public isUntrustedNetworkConnected(): boolean {
    const active = this.getConnectedWifiProfile();
    if (!active) return false;
    return active.networkType === 'PUBLIC' || !active.isSecured || active.security === 'OPEN';
  }

  public connectToWifi(profileId: string, password?: string): { success: boolean; message: string; activeProfile?: WifiNetworkProfile } {
    // Check in saved profiles first
    let target = this.wifiProfiles.find(p => p.id === profileId);
    
    // If from scanned list, adopt into saved profiles
    if (!target) {
      const scanned = this.scannedAps.find(p => p.id === profileId);
      if (scanned) {
        target = {
          ...scanned,
          id: `wifi_saved_${Date.now()}`,
          password: password || '',
          saved: true,
          connected: false
        };
        this.wifiProfiles.push(target);
      }
    }

    if (!target) {
      return { success: false, message: 'Wi-Fi Access Point profile not found.' };
    }

    if (target.isSecured && !target.password && !password) {
      return { success: false, message: 'WPA/WPA2/WPA3 network requires a security passphrase.' };
    }

    if (password) {
      target.password = password;
    }

    // Disconnect others
    this.wifiProfiles.forEach(p => {
      p.connected = false;
    });

    target.connected = true;
    target.lastConnected = 'Just now';
    target.saved = true;

    // Update wireless interface (wlan0) properties to reflect this profile
    const wlan = this.interfaces.find(i => i.type === 'WIRELESS');
    if (wlan) {
      wlan.state = 'UP';
      wlan.ipv4 = target.ipAddress || (target.ipMode === 'DHCP' ? '192.168.50.75' : target.ipAddress);
      wlan.netmask = target.subnetMask || '255.255.255.0';
      wlan.gateway = target.gateway || '192.168.50.1';
      wlan.dns = [target.primaryDns || '1.1.1.1', target.secondaryDns || '8.8.8.8'];
      wlan.isDhcp = target.ipMode === 'DHCP';
    }

    // Set firewall zone matching network type
    this.currentZone = target.networkType === 'PUBLIC' ? 'PUBLIC' : 'TRUSTED';

    this.persistWifiProfiles();

    return {
      success: true,
      message: `Successfully authenticated & associated with "${target.ssid}" [${target.security} - ${target.networkType} profile].`,
      activeProfile: { ...target }
    };
  }

  public disconnectWifi(): { success: boolean; message: string } {
    let disconnectedSsid = 'Wi-Fi';
    this.wifiProfiles.forEach(p => {
      if (p.connected) {
        disconnectedSsid = p.ssid;
        p.connected = false;
      }
    });

    const wlan = this.interfaces.find(i => i.type === 'WIRELESS');
    if (wlan) {
      wlan.state = 'DOWN';
    }

    this.persistWifiProfiles();

    return {
      success: true,
      message: `Disconnected from wireless network "${disconnectedSsid}". Radio interface set to idle.`
    };
  }

  public saveWifiProfile(profile: WifiNetworkProfile): { success: boolean; message: string; profile: WifiNetworkProfile } {
    const existingIndex = this.wifiProfiles.findIndex(p => p.id === profile.id || p.ssid === profile.ssid);
    let finalProfile: WifiNetworkProfile;

    if (existingIndex >= 0) {
      this.wifiProfiles[existingIndex] = { ...this.wifiProfiles[existingIndex], ...profile, saved: true };
      finalProfile = this.wifiProfiles[existingIndex];
    } else {
      finalProfile = {
        ...profile,
        id: profile.id || `wifi_profile_${Date.now()}`,
        saved: true
      };
      this.wifiProfiles.push(finalProfile);
    }

    // If active profile was updated, synchronize interface
    if (finalProfile.connected) {
      const wlan = this.interfaces.find(i => i.type === 'WIRELESS');
      if (wlan) {
        wlan.ipv4 = finalProfile.ipAddress;
        wlan.netmask = finalProfile.subnetMask;
        wlan.gateway = finalProfile.gateway;
        wlan.dns = [finalProfile.primaryDns, finalProfile.secondaryDns].filter(Boolean);
        wlan.isDhcp = finalProfile.ipMode === 'DHCP';
      }
      this.currentZone = finalProfile.networkType === 'PUBLIC' ? 'PUBLIC' : 'TRUSTED';
    }

    this.persistWifiProfiles();

    return {
      success: true,
      message: `Network profile "${finalProfile.ssid}" saved successfully. Configuration persisted across sessions.`,
      profile: finalProfile
    };
  }

  public deleteWifiProfile(profileId: string): { success: boolean; message: string } {
    const target = this.wifiProfiles.find(p => p.id === profileId);
    if (!target) {
      return { success: false, message: 'Network profile not found.' };
    }

    const wasConnected = target.connected;
    this.wifiProfiles = this.wifiProfiles.filter(p => p.id !== profileId);
    
    if (wasConnected) {
      this.disconnectWifi();
    }

    this.persistWifiProfiles();

    return {
      success: true,
      message: `Removed network profile "${target.ssid}" from saved connections.`
    };
  }

  public toggleProfileAutoConnect(profileId: string): { success: boolean; message: string; autoConnect: boolean } {
    const target = this.wifiProfiles.find(p => p.id === profileId);
    if (!target) {
      return { success: false, message: 'Network profile not found.', autoConnect: false };
    }

    target.autoConnect = !target.autoConnect;
    this.persistWifiProfiles();

    return {
      success: true,
      message: `Auto-connect for "${target.ssid}" is now ${target.autoConnect ? 'ENABLED' : 'DISABLED'}.`,
      autoConnect: target.autoConnect
    };
  }

  // ==========================================
  // VPN Configuration & Tunnel Management
  // ==========================================
  public getVpnConfig(): VpnConfig {
    return { ...this.vpnConfig };
  }

  public getVpnServerProfiles(): VpnServerProfile[] {
    return [...this.vpnServers];
  }

  public connectVpn(serverId?: string): { success: boolean; message: string; config: VpnConfig } {
    const targetServerId = serverId || this.vpnConfig.activeProfileId || this.vpnServers[0]?.id;
    const server = this.vpnServers.find(s => s.id === targetServerId) || this.vpnServers[0];

    if (!server) {
      return {
        success: false,
        message: 'No VPN endpoint server profile selected or available.',
        config: this.vpnConfig
      };
    }

    this.vpnConfig.activeProfileId = server.id;
    this.vpnConfig.status = 'CONNECTED';
    this.vpnConfig.activeTunnel = {
      profileId: server.id,
      serverName: server.name,
      protocol: server.protocol,
      endpoint: server.endpoint,
      assignedIp: '10.64.0.42/32',
      virtualInterface: server.protocol === 'WIREGUARD' ? 'wg0' : 'tun0',
      connectedSince: new Date().toLocaleTimeString(),
      bytesSent: 1420800,
      bytesReceived: 8940200,
      latencyMs: server.pingMs,
      cipher: server.cipher,
      publicKey: 'kOs_WireGuard_Pub_88A9eF01bC43...',
      handshakeSecAgo: 4
    };

    // Ensure virtual VPN interface is represented in the kernel interfaces list
    const existingTun = this.interfaces.find(i => i.name === 'wg0' || i.name === 'tun0');
    if (existingTun) {
      existingTun.state = 'UP';
      existingTun.ipv4 = '10.64.0.42';
      existingTun.netmask = '255.255.255.255';
    } else {
      this.interfaces.push({
        name: 'wg0',
        driver: 'WireGuard Kernel Zero-Copy Crypto Engine',
        mac: '00:00:00:00:00:00',
        ipv4: '10.64.0.42',
        netmask: '255.255.255.255',
        gateway: '10.64.0.1',
        dns: ['10.64.0.1', '1.1.1.1'],
        ipv6: 'fd00:dead:beef::42/128',
        mtu: 1420,
        state: 'UP',
        type: 'ETHERNET',
        speedMbps: 2500,
        rxBytes: 8940200,
        txBytes: 1420800,
        rxPackets: 9400,
        txPackets: 3200,
        rxErrors: 0,
        txErrors: 0,
        isDhcp: false
      });
    }

    this.persistVpnConfig();

    return {
      success: true,
      message: `Established secure ${server.protocol} tunnel to "${server.name}" [${server.location}]. Quantum-resistant encryption active.`,
      config: { ...this.vpnConfig }
    };
  }

  public disconnectVpn(): { success: boolean; message: string; config: VpnConfig } {
    const serverName = this.vpnConfig.activeTunnel?.serverName || 'VPN';
    this.vpnConfig.status = 'DISCONNECTED';
    this.vpnConfig.activeTunnel = undefined;

    const tun = this.interfaces.find(i => i.name === 'wg0' || i.name === 'tun0');
    if (tun) {
      tun.state = 'DOWN';
    }

    this.persistVpnConfig();

    return {
      success: true,
      message: `Disconnected from ${serverName}. Traffic reverted to physical interface defaults.`,
      config: { ...this.vpnConfig }
    };
  }

  public toggleVpnKillSwitch(): boolean {
    this.vpnConfig.killSwitch = !this.vpnConfig.killSwitch;
    this.persistVpnConfig();
    return this.vpnConfig.killSwitch;
  }

  public toggleVpnDnsLeakProtection(): boolean {
    this.vpnConfig.dnsLeakProtection = !this.vpnConfig.dnsLeakProtection;
    this.persistVpnConfig();
    return this.vpnConfig.dnsLeakProtection;
  }

  public toggleVpnSplitTunneling(): boolean {
    this.vpnConfig.splitTunneling = !this.vpnConfig.splitTunneling;
    this.persistVpnConfig();
    return this.vpnConfig.splitTunneling;
  }

  public toggleAutoConnectOnUntrustedWifi(): boolean {
    this.vpnConfig.autoConnectOnUntrustedWifi = !this.vpnConfig.autoConnectOnUntrustedWifi;
    this.persistVpnConfig();
    return this.vpnConfig.autoConnectOnUntrustedWifi;
  }

  public addCustomVpnServer(server: Partial<VpnServerProfile>): { success: boolean; message: string; server?: VpnServerProfile } {
    if (!server.name || !server.endpoint) {
      return { success: false, message: 'Server Name and Endpoint are required.' };
    }
    const newServer: VpnServerProfile = {
      id: `vpn_custom_${Date.now()}`,
      name: server.name,
      protocol: server.protocol || 'WIREGUARD',
      endpoint: server.endpoint,
      location: server.location || 'Custom Endpoint',
      countryCode: server.countryCode || 'LOC',
      pingMs: server.pingMs || 25,
      quantumResistant: server.quantumResistant ?? true,
      cipher: server.cipher || 'ChaCha20-Poly1305 / Noise Protocol',
      loadPercent: 15,
      isCustom: true
    };
    this.vpnServers.push(newServer);
    this.persistVpnServers();
    return { success: true, message: `Custom VPN server "${newServer.name}" added successfully.`, server: newServer };
  }

  public deleteCustomVpnServer(serverId: string): { success: boolean; message: string } {
    const target = this.vpnServers.find(s => s.id === serverId);
    if (!target) {
      return { success: false, message: 'Server profile not found.' };
    }
    if (this.vpnConfig.activeProfileId === serverId && this.vpnConfig.status === 'CONNECTED') {
      this.disconnectVpn();
    }
    this.vpnServers = this.vpnServers.filter(s => s.id !== serverId);
    this.persistVpnServers();
    return { success: true, message: `VPN server profile "${target.name}" removed.` };
  }

  // jb7572_2026-08-24: Interfaces Operations
  public getInterfaces(): NetworkInterface[] {
    return [...this.interfaces];
  }

  public toggleInterfaceState(name: string): { success: boolean; message: string; newState?: 'UP' | 'DOWN' } {
    const iface = this.interfaces.find(i => i.name === name);
    if (!iface) {
      return { success: false, message: `Interface "${name}" not found.` };
    }
    iface.state = iface.state === 'UP' ? 'DOWN' : 'UP';
    return {
      success: true,
      message: `Interface ${iface.name} state transitioned to ${iface.state}.`,
      newState: iface.state
    };
  }

  public updateInterfaceConfig(
    name: string, 
    updates: Partial<Pick<NetworkInterface, 'ipv4' | 'netmask' | 'gateway' | 'dns' | 'mtu' | 'isDhcp'>>
  ): { success: boolean; message: string } {
    const iface = this.interfaces.find(i => i.name === name);
    if (!iface) {
      return { success: false, message: `Interface "${name}" not found.` };
    }
    Object.assign(iface, updates);
    return {
      success: true,
      message: `Updated IP configuration and DNS routes for ${name}.`
    };
  }

  // jb7572_2026-08-24: Firewall Operations
  public getFirewallRules(): FirewallRule[] {
    return [...this.firewallRules];
  }

  public isFirewallActive(): boolean {
    return this.firewallEnabled;
  }

  public toggleFirewallMaster(): { success: boolean; active: boolean; message: string } {
    this.firewallEnabled = !this.firewallEnabled;
    return {
      success: true,
      active: this.firewallEnabled,
      message: `Advanced Packet Filter Firewall is now ${this.firewallEnabled ? 'ACTIVE (ENFORCING)' : 'DISABLED (PERMISSIVE)'}.`
    };
  }

  public getCurrentZone(): 'PUBLIC' | 'TRUSTED' | 'DMZ' {
    return this.currentZone;
  }

  public setZone(zone: 'PUBLIC' | 'TRUSTED' | 'DMZ'): void {
    this.currentZone = zone;
  }

  public toggleRule(id: string): { success: boolean; message: string; enabled?: boolean } {
    const rule = this.firewallRules.find(r => r.id === id);
    if (!rule) {
      return { success: false, message: `Rule #${id} not found.` };
    }
    rule.enabled = !rule.enabled;
    return {
      success: true,
      message: `Rule "${rule.name}" is now ${rule.enabled ? 'ENABLED' : 'DISABLED'}.`,
      enabled: rule.enabled
    };
  }

  public addFirewallRule(rule: Omit<FirewallRule, 'id' | 'hits'>): { success: boolean; message: string; rule: FirewallRule } {
    const newRule: FirewallRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      hits: 0
    };
    this.firewallRules.unshift(newRule);
    return {
      success: true,
      message: `Firewall packet rule "${newRule.name}" appended to chain.`,
      rule: newRule
    };
  }

  public deleteFirewallRule(id: string): { success: boolean; message: string } {
    const idx = this.firewallRules.findIndex(r => r.id === id);
    if (idx === -1) {
      return { success: false, message: `Rule #${id} not found.` };
    }
    const removed = this.firewallRules.splice(idx, 1)[0];
    return {
      success: true,
      message: `Removed firewall rule "${removed.name}".`
    };
  }

  public resetFirewallRules(): void {
    this.firewallRules = JSON.parse(JSON.stringify(initialRules));
  }

  // jb7572_2026-08-24: Socket Inspector Operations
  public getSockets(): SocketEntry[] {
    return [...this.sockets];
  }

  // jb7572_2026-08-24: Diagnostics (Ping & Traceroute simulator)
  public runPing(host: string, count: number = 4): { host: string; ip: string; logs: string[]; avgMs: number; lossPercent: number } {
    const targetHost = host.trim() || '1.1.1.1';
    let ip = targetHost;
    if (targetHost.includes('google.com')) ip = '142.250.190.46';
    else if (targetHost.includes('cloudflare.com') || targetHost === '1.1.1.1') ip = '1.1.1.1';
    else if (targetHost.includes('gateway') || targetHost === '192.168.1.1') ip = '192.168.1.1';
    else if (targetHost.includes('localhost') || targetHost === '127.0.0.1') ip = '127.0.0.1';

    const logs: string[] = [
      `PING ${targetHost} (${ip}) 56(84) bytes of data.`
    ];

    let totalRtt = 0;
    const baseRtt = ip.startsWith('127.') ? 0.08 : ip.startsWith('192.168.') ? 0.85 : 14.2;

    for (let seq = 1; seq <= count; seq++) {
      const jitter = +(Math.random() * 2.5 - 1.2).toFixed(2);
      const rtt = Math.max(0.05, +(baseRtt + jitter).toFixed(2));
      totalRtt += rtt;
      logs.push(`64 bytes from ${ip}: icmp_seq=${seq} ttl=64 time=${rtt} ms`);
    }

    const avgMs = +(totalRtt / count).toFixed(2);
    logs.push(`--- ${targetHost} ping statistics ---`);
    logs.push(`${count} packets transmitted, ${count} received, 0% packet loss, time ${count * 1000}ms`);
    logs.push(`rtt min/avg/max/mdev = ${(avgMs * 0.9).toFixed(2)}/${avgMs}/${(avgMs * 1.15).toFixed(2)}/0.45 ms`);

    return {
      host: targetHost,
      ip,
      logs,
      avgMs,
      lossPercent: 0
    };
  }

  public runTraceroute(host: string): { host: string; ip: string; hops: PingHop[]; logs: string[] } {
    const target = host.trim() || '1.1.1.1';
    const hops: PingHop[] = [
      { hop: 1, host: 'gateway.local', ip: '192.168.1.1', rttMs: 0.85 },
      { hop: 2, host: 'isp-node-10.core.net', ip: '10.240.0.1', rttMs: 4.12 },
      { hop: 3, host: 'backbone-peer-01.transit.net', ip: '172.16.4.18', rttMs: 9.60 },
      { hop: 4, host: target.includes('1.1.1.1') ? 'one.one.one.one' : target, ip: target.includes('1.1.1.1') ? '1.1.1.1' : '142.250.190.46', rttMs: 14.85 }
    ];

    const logs = [
      `traceroute to ${target} (30 hops max, 60 byte packets)`,
      ` 1  gateway.local (192.168.1.1)  0.852 ms  0.784 ms  0.891 ms`,
      ` 2  isp-node-10.core.net (10.240.0.1)  4.120 ms  4.050 ms  4.180 ms`,
      ` 3  backbone-peer-01.transit.net (172.16.4.18)  9.602 ms  9.540 ms  9.712 ms`,
      ` 4  ${target} (${hops[3].ip})  14.850 ms  14.790 ms  14.920 ms`
    ];

    return {
      host: target,
      ip: hops[3].ip,
      hops,
      logs
    };
  }

  // ==========================================
  // jb7572_2026-08-24: Category / Item 4 - DNS Resolver Engine (dig, nslookup, host)
  // ==========================================
  private dnsDatabase: Record<string, DnsRecordEntry[]> = {
    'google.com': [
      { type: 'A', name: 'google.com', value: '142.250.190.46', ttl: 300 },
      { type: 'AAAA', name: 'google.com', value: '2607:f8b0:4004:800::200e', ttl: 300 },
      { type: 'MX', name: 'google.com', value: 'smtp.google.com', ttl: 3600, priority: 10 },
      { type: 'TXT', name: 'google.com', value: 'v=spf1 include:_spf.google.com ~all', ttl: 3600 },
      { type: 'NS', name: 'google.com', value: 'ns1.google.com', ttl: 86400 }
    ],
    'cloudflare.com': [
      { type: 'A', name: 'cloudflare.com', value: '104.16.132.229', ttl: 300 },
      { type: 'AAAA', name: 'cloudflare.com', value: '2606:4700::6810:84e5', ttl: 300 },
      { type: 'MX', name: 'cloudflare.com', value: 'mx.cloudflare.net', ttl: 3600, priority: 10 },
      { type: 'TXT', name: 'cloudflare.com', value: 'v=spf1 ip4:199.27.128.0/21 ~all', ttl: 3600 },
      { type: 'NS', name: 'cloudflare.com', value: 'ns3.cloudflare.com', ttl: 86400 }
    ],
    'github.com': [
      { type: 'A', name: 'github.com', value: '140.82.121.4', ttl: 60 },
      { type: 'AAAA', name: 'github.com', value: '2606:50c0:8000::153', ttl: 60 },
      { type: 'MX', name: 'github.com', value: 'aspmx.l.google.com', ttl: 3600, priority: 1 },
      { type: 'TXT', name: 'github.com', value: 'MS=ms61405379; v=spf1 include:mailgun.org ~all', ttl: 3600 },
      { type: 'NS', name: 'github.com', value: 'dns1.p08.nsone.net', ttl: 86400 }
    ],
    'kernel.org': [
      { type: 'A', name: 'kernel.org', value: '139.178.84.217', ttl: 300 },
      { type: 'AAAA', name: 'kernel.org', value: '2604:1380:40e1:4700::1', ttl: 300 },
      { type: 'MX', name: 'kernel.org', value: 'mail.kernel.org', ttl: 3600, priority: 10 },
      { type: 'TXT', name: 'kernel.org', value: 'v=spf1 mx ~all', ttl: 3600 },
      { type: 'NS', name: 'kernel.org', value: 'ns1.kernel.org', ttl: 86400 }
    ]
  };

  public resolveDns(domainQuery: string, server: string = '1.1.1.1 (Cloudflare)'): DnsLookupResult {
    const rawDomain = domainQuery.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const startTime = performance.now();
    const records = this.dnsDatabase[rawDomain] || [
      { type: 'A', name: rawDomain, value: `198.51.100.${Math.floor(Math.random() * 200 + 10)}`, ttl: 300 },
      { type: 'AAAA', name: rawDomain, value: `2001:db8:85a3::${Math.floor(Math.random() * 9000 + 1000)}`, ttl: 300 },
      { type: 'TXT', name: rawDomain, value: 'v=spf1 ~all', ttl: 3600 },
      { type: 'NS', name: rawDomain, value: `ns1.${rawDomain}`, ttl: 86400 }
    ];

    const queryTimeMs = +(Math.random() * 8 + 4).toFixed(1);

    return {
      domain: rawDomain,
      serverUsed: server,
      queryTimeMs,
      status: 'NOERROR',
      records
    };
  }

  // ==========================================
  // jb7572_2026-08-24: Category / Item 4 - Packet Capture / Sniffer Engine (tcpdump / wireshark)
  // ==========================================
  private capturedPackets: CapturedPacket[] = [
    {
      id: 1,
      timestamp: '22:07:42.102',
      protocol: 'TLS',
      src: '192.168.1.140',
      dst: '142.250.190.46',
      srcPort: 54322,
      dstPort: 443,
      lengthBytes: 512,
      info: 'Application Data (TLSv1.3 Encrypted Handshake Payload)',
      hexDump: '17 03 03 01 fc 00 00 00 00 00 00 00 01 a4 7b 9c d3 e1 0f 4a',
      asciiDump: '.............{...J'
    },
    {
      id: 2,
      timestamp: '22:07:42.128',
      protocol: 'DNS',
      src: '192.168.1.140',
      dst: '1.1.1.1',
      srcPort: 49152,
      dstPort: 53,
      lengthBytes: 74,
      info: 'Standard query 0x8a12 A registry.npmjs.org',
      hexDump: '8a 12 01 00 00 01 00 00 00 00 00 00 08 72 65 67 69 73 74 72',
      asciiDump: '.............registr'
    },
    {
      id: 3,
      timestamp: '22:07:42.140',
      protocol: 'DNS',
      src: '1.1.1.1',
      dst: '192.168.1.140',
      srcPort: 53,
      dstPort: 49152,
      lengthBytes: 118,
      info: 'Standard query response 0x8a12 A 104.16.16.35 A 104.16.17.35',
      hexDump: '8a 12 81 80 00 01 00 02 00 00 00 00 08 72 65 67 69 73 74 72',
      asciiDump: '.............registr'
    },
    {
      id: 4,
      timestamp: '22:07:42.180',
      protocol: 'TCP',
      src: '192.168.1.140',
      dst: '104.16.16.35',
      srcPort: 51290,
      dstPort: 443,
      lengthBytes: 66,
      info: '51290 → 443 [SYN] Seq=0 Win=64240 Len=0 MSS=1460 SACK_PERM=1',
      hexDump: '45 00 00 40 4a 12 40 00 40 06 b2 a1 c0 a8 01 8c 68 10 10 23',
      asciiDump: 'E..@J.@.@.......h..#'
    },
    {
      id: 5,
      timestamp: '22:07:42.195',
      protocol: 'TCP',
      src: '104.16.16.35',
      dst: '192.168.1.140',
      srcPort: 443,
      dstPort: 51290,
      lengthBytes: 66,
      info: '443 → 51290 [SYN, ACK] Seq=0 Ack=1 Win=65535 Len=0 MSS=1436',
      hexDump: '45 00 00 40 00 00 40 00 37 06 05 b4 68 10 10 23 c0 a8 01 8c',
      asciiDump: 'E..@..@.7...h..#....'
    },
    {
      id: 6,
      timestamp: '22:07:42.210',
      protocol: 'ICMP',
      src: '192.168.1.140',
      dst: '192.168.1.1',
      lengthBytes: 84,
      info: 'Echo (ping) request id=0x18a4 seq=1/256 ttl=64',
      hexDump: '08 00 4f 3a 18 a4 00 01 64 b9 10 66 00 00 00 00 1a 2b 3c 4d',
      asciiDump: '..O:....d..f.....+<M'
    },
    {
      id: 7,
      timestamp: '22:07:42.211',
      protocol: 'ICMP',
      src: '192.168.1.1',
      dst: '192.168.1.140',
      lengthBytes: 84,
      info: 'Echo (ping) reply id=0x18a4 seq=1/256 ttl=64 (rtt=0.88ms)',
      hexDump: '00 00 57 3a 18 a4 00 01 64 b9 10 66 00 00 00 00 1a 2b 3c 4d',
      asciiDump: '..W:....d..f.....+<M'
    },
    {
      id: 8,
      timestamp: '22:07:42.240',
      protocol: 'ARP',
      src: '52:54:00:12:34:56',
      dst: 'ff:ff:ff:ff:ff:ff',
      lengthBytes: 42,
      info: 'Who has 192.168.1.1? Tell 192.168.1.140',
      hexDump: '00 01 08 00 06 04 00 01 52 54 00 12 34 56 c0 a8 01 8c 00 00',
      asciiDump: '........RT..4V......'
    }
  ];

  public getCapturedPackets(): CapturedPacket[] {
    return [...this.capturedPackets];
  }

  public clearCapturedPackets(): void {
    this.capturedPackets = [];
  }

  public injectTestPacket(proto: 'TCP' | 'UDP' | 'ICMP' | 'DNS' | 'TLS' | 'ARP'): CapturedPacket {
    const id = this.capturedPackets.length + 1;
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

    let packet: CapturedPacket;
    if (proto === 'DNS') {
      packet = {
        id,
        timestamp,
        protocol: 'DNS',
        src: '192.168.1.140',
        dst: '1.1.1.1',
        srcPort: 53100 + (id % 100),
        dstPort: 53,
        lengthBytes: 82,
        info: `Standard query 0x${Math.floor(Math.random() * 0xffff).toString(16)} A host-${id}.subsystem.lan`,
        hexDump: '4a b1 01 00 00 01 00 00 00 00 00 00 06 73 75 62 73 79 73 74',
        asciiDump: 'J............subsyst'
      };
    } else if (proto === 'ICMP') {
      packet = {
        id,
        timestamp,
        protocol: 'ICMP',
        src: '192.168.1.140',
        dst: '8.8.8.8',
        lengthBytes: 84,
        info: `Echo (ping) request id=0x${id} seq=${id}/256 ttl=64`,
        hexDump: '08 00 3c 1a 00 01 00 01 64 b9 20 11 00 00 00 00 12 34 56 78',
        asciiDump: '..<.....d. ......4Vx'
      };
    } else if (proto === 'TLS') {
      packet = {
        id,
        timestamp,
        protocol: 'TLS',
        src: '192.168.1.140',
        dst: '104.16.132.229',
        srcPort: 58200 + (id % 100),
        dstPort: 443,
        lengthBytes: 1240,
        info: 'Client Hello (TLS 1.3, SNI: cloudflare.com, ALPN: h2,http/1.1)',
        hexDump: '16 03 01 02 00 01 00 01 fc 03 03 a1 b2 c3 d4 e5 f6 07 18 29',
        asciiDump: '....................'
      };
    } else {
      packet = {
        id,
        timestamp,
        protocol: 'TCP',
        src: '192.168.1.140',
        dst: '140.82.121.4',
        srcPort: 51200 + (id % 100),
        dstPort: 443,
        lengthBytes: 66,
        info: `51200 → 443 [ACK] Seq=${id * 100} Ack=${id * 100 + 1} Win=64240`,
        hexDump: '45 00 00 34 8a 12 40 00 40 06 a1 b2 c0 a8 01 8c 8c 52 79 04',
        asciiDump: 'E..4..@.@........Ry.'
      };
    }

    this.capturedPackets.unshift(packet);
    if (this.capturedPackets.length > 200) {
      this.capturedPackets.pop();
    }
    return packet;
  }

  // ==========================================
  // jb7572_2026-08-24: Category / Item 4 - GeoIP Global Node Telemetry
  // ==========================================
  private geoIpNodes: GeoIpTrafficNode[] = [
    {
      ip: '142.250.190.46',
      city: 'Mountain View, CA',
      country: 'United States',
      countryCode: 'US',
      lat: 37.422,
      lng: -122.084,
      org: 'Google LLC (AS15169)',
      activeConnections: 4,
      bandwidthKbps: 420.5,
      threatLevel: 'CLEAN',
      direction: 'OUTBOUND'
    },
    {
      ip: '1.1.1.1',
      city: 'San Francisco, CA',
      country: 'United States',
      countryCode: 'US',
      lat: 37.7749,
      lng: -122.4194,
      org: 'Cloudflare Inc. (AS13335)',
      activeConnections: 2,
      bandwidthKbps: 12.8,
      threatLevel: 'CLEAN',
      direction: 'OUTBOUND'
    },
    {
      ip: '140.82.121.4',
      city: 'Seattle, WA',
      country: 'United States',
      countryCode: 'US',
      lat: 47.6062,
      lng: -122.3321,
      org: 'GitHub, Inc. (AS36459)',
      activeConnections: 1,
      bandwidthKbps: 85.0,
      threatLevel: 'CLEAN',
      direction: 'OUTBOUND'
    },
    {
      ip: '185.199.108.153',
      city: 'Frankfurt',
      country: 'Germany',
      countryCode: 'DE',
      lat: 50.1109,
      lng: 8.6821,
      org: 'Fastly Inc. (AS54113)',
      activeConnections: 2,
      bandwidthKbps: 310.2,
      threatLevel: 'CLEAN',
      direction: 'OUTBOUND'
    },
    {
      ip: '103.245.222.133',
      city: 'Tokyo',
      country: 'Japan',
      countryCode: 'JP',
      lat: 35.6762,
      lng: 139.6503,
      org: 'EdgeCast / Akamai (AS15133)',
      activeConnections: 1,
      bandwidthKbps: 45.4,
      threatLevel: 'CLEAN',
      direction: 'OUTBOUND'
    },
    {
      ip: '198.51.100.77',
      city: 'Bucharest',
      country: 'Romania',
      countryCode: 'RO',
      lat: 44.4268,
      lng: 26.1025,
      org: 'Unknown Hosting ASN',
      activeConnections: 0,
      bandwidthKbps: 0.0,
      threatLevel: 'BLOCKED',
      direction: 'INBOUND'
    },
    {
      ip: '203.0.113.88',
      city: 'Sydney',
      country: 'Australia',
      countryCode: 'AU',
      lat: -33.8688,
      lng: 151.2093,
      org: 'Amazon AWS AP-Southeast (AS16509)',
      activeConnections: 1,
      bandwidthKbps: 64.2,
      threatLevel: 'CLEAN',
      direction: 'OUTBOUND'
    }
  ];

  public getGeoIpNodes(): GeoIpTrafficNode[] {
    return [...this.geoIpNodes];
  }
}

export const networkSecurityService = new NetworkSecurityService();

