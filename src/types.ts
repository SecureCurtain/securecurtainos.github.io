// jb7572_2026-08-24: OS Type Definitions & Architecture Interfaces
export interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  children?: TreeNode[];
  content?: string;
  language?: string;
  description?: string;
  isCustom?: boolean;
  sizeBytes?: number;
}

// jb7572_2026-08-24: Static code analysis result contract for kernel placement & 3-Rule Audit
export interface AnalysisResult {
  filename: string;
  suggestedFilename: string;
  agreesWithFilename: boolean;
  filenameReason: string;
  recommendedPath: string;
  folderCategory: 'boot' | 'kernel_header' | 'kernel_source' | 'subsystem' | 'root_script' | 'custom';
  architecturalExplanation: string;
  detectedType: string;
  tags: string[];

  // 🛡️ 3 GOLDEN RULES AUDIT EVALUATION
  audit: {
    rule1_realLifeSystem: {
      viable: boolean;
      score: number; // 0 - 100
      abiStandard: string;
      hardwareRequirements: string[];
      findings: string[];
    };
    rule2_security: {
      secure: boolean;
      score: number; // 0 - 100
      privilegeLevel: 'Ring 0 (Supervisor)' | 'Ring 3 (Unprivileged)' | 'UEFI Pre-Boot' | 'Build Tooling';
      mitigationsPassed: string[];
      riskAnalysis: string[];
    };
    rule3_enhancements: {
      efficiencyRating: 'Ultra-High (Direct ASM / Zero-Copy)' | 'Optimal (Linear Overhead)' | 'High (Scalable)';
      optimizations: string[];
      cleanlinessNotes: string[];
    };
  };
}

// jb7572_2026-08-24: Production System Module source interface definition
export interface SystemModuleSource {
  id: string;
  title: string;
  suggestedName: string;
  language: string;
  description: string;
  code: string;
}

// jb7572_2026-08-24: Backward compatibility alias for sampleCodeSnippets
export type SampleCode = SystemModuleSource;

// jb7572_2026-08-24: Process status and descriptor models for Task Manager & btop
export type ProcessStatus = 'RUNNING' | 'SLEEPING' | 'WAIT_IO' | 'ZOMBIE' | 'STOPPED';
export type ProcessPriority = 'REALTIME' | 'HIGH' | 'NORMAL' | 'LOW' | 'IDLE';
export type ProcessCategory = 'KERNEL' | 'DRIVER' | 'SUBSYSTEM' | 'DAEMON' | 'USER_APP';

export interface OSProcess {
  pid: number;
  ppid: number;
  name: string;
  commandLine: string;
  user: string;
  cpuPercent: number;
  memBytes: number;
  memFormatted: string;
  diskReadKb: number;
  diskWriteKb: number;
  netRxKb: number;
  netTxKb: number;
  status: ProcessStatus;
  threads: number;
  priority: ProcessPriority;
  category: ProcessCategory;
  uptimeSeconds: number;
}

// jb7572_2026-08-24: Real-time hardware telemetry and performance counter snapshot
export interface SystemMetrics {
  cpuTotalPercent: number;
  cpuCores: number[];
  memTotalBytes: number;
  memUsedBytes: number;
  memFreeBytes: number;
  diskActivePercent: number;
  diskReadRateKb: number;
  diskWriteRateKb: number;
  netRxRateKb: number;
  netTxRateKb: number;
  uptimeSeconds: number;
  processCount: number;
  threadCount: number;
  handlesCount: number;
}

export interface MetricHistoryPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

// jb7572_2026-08-24: Utilities Cockpit Category Identifiers
export type CockpitCategoryId = 
  | 'OVERVIEW_HUD'
  | 'DEVICE_MANAGER'
  | 'LAUNCHPAD'
  | 'SYSTEM_PERFORMANCE' 
  | 'MEMORY_DEBUGGER'
  | 'STORAGE_FILESYSTEM' 
  | 'NETWORK_SECURITY' 
  | 'USER_MANAGEMENT'
  | 'SYSTEM_CONFIGURATION' 
  | 'AUDITING_LOGS' 
  | 'PACKAGE_POOLS' 
  | 'SEARCH_NAVIGATION'
  | 'SOUND_SYSTEM'
  | 'ARCHITECTURE_HANDBOOK'
  | 'DECOMMISSION'
  | 'FEEDBACK_BUGS';

export type CockpitUtilityId = 
  | 'task_manager' 
  | 'resource_monitor' 
  | 'perf_monitor' 
  | 'btop_tui' 
  | 'memory_inspector'
  | 'disassembler_gdb'
  | 'diskmgmt' 
  | 'gparted' 
  | 'storage_sense' 
  | 'ncdu' 
  | 'firewall' 
  | 'net_connections' 
  | 'user_accounts'
  | 'socket_inspector' 
  | 'regedit' 
  | 'services' 
  | 'task_scheduler' 
  | 'env_vars' 
  | 'device_manager' 
  | 'event_viewer' 
  | 'journalctl' 
  | 'reliability_monitor'
  | 'package_pool' 
  | 'optional_features' 
  | 'indexer_search' 
  | 'ripgrep'
  | 'architecture_guide'
  | 'decommission'
  | 'bug_reporter'
  | 'user_ideas';

// jb7572_2026-08-24: Network & Security Architecture Types
export type WifiGeneration = 'WiFi 4' | 'WiFi 5' | 'WiFi 6' | 'WiFi 6E' | 'WiFi 7' | 'WiFi 8';
export type WifiSecurityType = 'WPA4-Quantum' | 'WPA3' | 'WPA2' | 'OWE' | 'WEP' | 'OPEN';
export type WifiFrequencyBand = '2.4GHz' | '5GHz' | '6GHz' | '60GHz' | 'Multi-Band MLO' | 'Sub-THz';

export interface WifiNetworkProfile {
  id: string;
  ssid: string;
  bssid: string;
  security: WifiSecurityType;
  isSecured: boolean;
  password?: string;
  ipMode: 'DHCP' | 'STATIC';
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  primaryDns: string;
  secondaryDns: string;
  networkType: 'PRIVATE' | 'PUBLIC'; // Private (trusted, discovery on) vs Public (isolated, stealth)
  signalStrength: number; // 0 - 100%
  frequency: WifiFrequencyBand;
  channel: number;
  channelWidthMHz?: 20 | 40 | 80 | 160 | 320;
  generation?: WifiGeneration;
  mloEnabled?: boolean; // Multi-Link Operation (Wi-Fi 7 / 8)
  isHidden?: boolean; // Hidden non-broadcasting SSID detected via probe/beacon frame analysis
  unmaskedSsid?: string; // Resolved SSID after admin/probe handshake
  autoConnect: boolean;
  saved: boolean;
  connected: boolean;
  lastConnected?: string;
}

export type VpnProtocol = 'WIREGUARD' | 'OPENVPN' | 'IPSEC_IKEV2' | 'STEALTH_HYSTERIA2';
export type VpnStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface VpnServerProfile {
  id: string;
  name: string;
  protocol: VpnProtocol;
  endpoint: string;
  location: string;
  countryCode: string;
  pingMs: number;
  quantumResistant: boolean;
  cipher: string;
  loadPercent: number;
  isCustom?: boolean;
}

export interface VpnConfig {
  activeProfileId: string | null;
  status: VpnStatus;
  killSwitch: boolean;
  dnsLeakProtection: boolean;
  splitTunneling: boolean;
  splitTunnelExcludedIps: string[];
  autoConnectOnUntrustedWifi: boolean;
  activeTunnel?: {
    profileId: string;
    serverName: string;
    protocol: VpnProtocol;
    endpoint: string;
    assignedIp: string;
    virtualInterface: string;
    connectedSince: string;
    bytesSent: number;
    bytesReceived: number;
    latencyMs: number;
    cipher: string;
    publicKey?: string;
    handshakeSecAgo: number;
  };
}

export interface NetworkInterface {
  name: string;
  driver: string;
  mac: string;
  ipv4: string;
  netmask: string;
  gateway: string;
  dns: string[];
  ipv6: string;
  mtu: number;
  state: 'UP' | 'DOWN';
  type: 'ETHERNET' | 'WIRELESS' | 'LOOPBACK';
  speedMbps: number;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
  rxErrors: number;
  txErrors: number;
  isDhcp: boolean;
}

export type FirewallDirection = 'INBOUND' | 'OUTBOUND';
export type FirewallAction = 'ALLOW' | 'BLOCK' | 'DROP';
export type FirewallProtocol = 'TCP' | 'UDP' | 'ICMP' | 'ALL';
export type FirewallZone = 'PUBLIC' | 'TRUSTED' | 'DMZ';

// HIPS & Anti-Malware Detection Engine Types
export type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type ThreatEngine = 'HIPS' | 'ANTI_MALWARE' | 'BEHAVIORAL_MONITOR' | 'ROOTKIT_HUNTER' | 'YARA_CORE';
export type ThreatAction = 'QUARANTINED' | 'DELETED' | 'SENT_FOR_STUDY' | 'BLOCKED' | 'FLAGGED_FOR_REVIEW';
export type ThreatVector = 
  | 'MEMORY_INJECTION' 
  | 'BYOVD_KERNEL_EXPLOIT' 
  | 'RANSOMWARE_ENCRYPTION' 
  | 'TROJAN_BACKDOOR' 
  | 'UNAUTHORIZED_RING0_HOOK' 
  | 'PROCESS_HOLLOWING' 
  | 'MACRO_DROPPER' 
  | 'LATERAL_MOVEMENT' 
  | 'CRYPTO_MINER';

export interface ExtractedStringItem {
  stringVal: string;
  type: 'C2_IP' | 'API_IMPORT' | 'REG_KEY' | 'MUTEX' | 'URL' | 'SHELLCODE' | 'SUSPICIOUS_CMD';
  offset: string;
}

export interface HexDumpLine {
  offset: string;
  hex: string;
  ascii: string;
}

export interface SandboxSyscallTrace {
  id: string;
  timestamp: string;
  syscall: string;
  arguments: string;
  returnVal: string;
  status: 'BLOCKED_BY_HIPS' | 'INTERCEPTED' | 'MONITORED';
  riskScore: number;
}

export interface QuarantinedObject {
  id: string;
  threatId: string;
  originalFileName: string;
  originalPath: string;
  quarantinedAt: string;
  fileSizeBytes: number;
  sha256: string;
  md5: string;
  entropy: number;
  architecture: 'x86_64 ELF' | 'PE32+ Executable' | 'Kernel Sys Module (.sys)' | 'PowerShell Script' | 'Mach-O 64-bit' | 'Rust Native Binary';
  threatSeverity: ThreatSeverity;
  detectionVector: ThreatVector;
  threatName: string;
  isSandboxed: boolean;
  status: 'ISOLATED' | 'STUDYING' | 'DISASSEMBLED' | 'PURGED';
  decompiledCode: {
    c_pseudocode: string;
    assembly_x86: string;
    extracted_strings: ExtractedStringItem[];
    hex_dump: HexDumpLine[];
    yara_rule_generated: string;
    behavioralAnalysis: string;
  };
  sandboxTrace: SandboxSyscallTrace[];
}

export interface DetectedThreatObject {
  id: string;
  name: string;
  vector: ThreatVector;
  engine: ThreatEngine;
  severity: ThreatSeverity;
  targetPath: string;
  processId?: number;
  processName?: string;
  sha256: string;
  detectedAt: string;
  description: string;
  behavioralTrace: string[];
  currentAction: ThreatAction;
  suggestedAction: ThreatAction;
  quarantinedVaultId?: string;
  actionTimestamp?: string;
}

export interface HipsEngineStatus {
  realTimeShield: boolean;
  hipsKernelInterceptor: boolean;
  heuristicAiShield: boolean;
  byovdDriverGuard: boolean;
  ransomwareTrap: boolean;
  networkIntrusionFilter: boolean;
  threatsBlockedCount: number;
  quarantinedCount: number;
  activeScansCount: number;
  engineVersion: string;
  lastSignatureUpdate: string;
}

export interface FirewallRule {
  id: string;
  name: string;
  direction: FirewallDirection;
  action: FirewallAction;
  protocol: FirewallProtocol;
  portRange: string;
  source: string;
  destination: string;
  zone: FirewallZone;
  enabled: boolean;
  hits: number;
  description: string;
}

export interface SocketEntry {
  id: string;
  proto: 'TCP' | 'UDP' | 'RAW';
  localAddress: string;
  localPort: number;
  foreignAddress: string;
  foreignPort: number | null;
  state: 'LISTEN' | 'ESTABLISHED' | 'TIME_WAIT' | 'CLOSE_WAIT' | 'SYN_SENT' | 'UNCONN';
  pid: number;
  processName: string;
  service: string;
}

export interface PingHop {
  hop: number;
  host: string;
  ip: string;
  rttMs: number;
}

// jb7572_2026-08-24: Category 4 - System Configuration & Automation Types
export type ServiceStatus = 'RUNNING' | 'STOPPED' | 'FAILED';
export type ServiceStartup = 'AUTO' | 'MANUAL' | 'DISABLED';

export interface ServiceUnit {
  id: string;
  name: string;
  displayName: string;
  description: string;
  status: ServiceStatus;
  startup: ServiceStartup;
  pid: number | null;
  memoryMb: number;
  cpuPercent: number;
  execPath: string;
  dependencies: string[];
  subsystem: 'CORE' | 'NETWORK' | 'DISPLAY' | 'SECURITY' | 'STORAGE';
}

export type RegistryHive = 'HKLM' | 'HKCU' | 'HKCR' | 'HKU' | 'KCONFIG';
export type RegistryValueType = 'REG_SZ' | 'REG_DWORD' | 'REG_MULTI_SZ' | 'REG_BINARY' | 'BOOL';

export interface RegistryEntry {
  id: string;
  hive: RegistryHive;
  keyPath: string;
  valueName: string;
  valueType: RegistryValueType;
  value: string | number | boolean;
  description: string;
  isKernelTunable: boolean;
}

export type TaskTriggerType = 'CRON' | 'AT_BOOT' | 'INTERVAL' | 'ON_EVENT';

export interface ScheduledTask {
  id: string;
  name: string;
  command: string;
  triggerType: TaskTriggerType;
  scheduleExpr: string; // e.g. "0 */6 * * *" or "Every 30m"
  nextRun: string;
  lastRun: string;
  lastExitCode: number;
  status: 'READY' | 'RUNNING' | 'DISABLED';
  enabled: boolean;
  runCount: number;
  description: string;
}

export interface EnvVariable {
  key: string;
  value: string;
  scope: 'SYSTEM' | 'USER' | 'KERNEL_SYSCTL';
  isReadOnly: boolean;
  description: string;
}

// jb7572_2026-08-24: Category 5 - Logs, Hardware & Auditing Types
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'AUDIT';
export type LogSubsystem = 'KERNEL' | 'AUTH' | 'STORAGE' | 'NETWORK' | 'SYSTEMD' | 'DRIVERS';

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  subsystem: LogSubsystem;
  source: string;
  pid: number | null;
  message: string;
  rawRecord?: string;
}

export type HardwareCategory = 'CPU' | 'GPU' | 'STORAGE_NVME' | 'NETWORK_NIC' | 'USB_CONTROLLER' | 'AUDIO' | 'MEMORY' | 'BUS';

export interface DriverOption {
  driverName: string;
  provider: 'Microkernel Native' | 'Driver VMM (Linux)' | 'Fallback Generic' | 'Vendor Proprietary' | 'VFIO Passthrough';
  version: string;
  source: string;
  description: string;
  isRecommended?: boolean;
}

export interface HardwareDevice {
  id: string;
  name: string;
  category: HardwareCategory;
  busAddress: string; // e.g. "0000:00:02.0"
  vendor: string;
  vendorId?: string; // e.g. "0x8086"
  deviceId?: string; // e.g. "0x9a49"
  subsystemId?: string;
  deviceModel: string;
  driver: string;
  driverProvider?: 'Microkernel Native' | 'Driver VMM (Linux)' | 'Fallback Generic' | 'Vendor Proprietary' | 'VFIO Passthrough';
  driverVersion?: string;
  driverLoadedAt?: string;
  availableDrivers?: DriverOption[];
  status: 'OK' | 'WARNING' | 'DISABLED';
  irq: number | string;
  memoryRange: string;
  powerState: 'D0 (Active)' | 'D1' | 'D2' | 'D3 (Low Power)';
  firmwareVersion?: string;
  linkSpeed?: string; // e.g. "PCIe Gen 4 x4 (16.0 GT/s)"
  capabilities?: string[];
  specs?: Record<string, string>;
}

export interface HardwareSensorData {
  cpuPackageTempC: number;
  cpuCoresTempC: number[];
  gpuTempC: number;
  nvmeTempC: number;
  fanSpeedRpm: number;
  fanSpeedPercent: number;
  cpuPowerWatts: number;
  totalSystemWatts: number;
  voltageVCore: number;
  voltage12V: number;
  voltage5V: number;
  voltage3V3: number;
  batteryPercent: number;
  batteryHealthPercent: number;
  batteryStatus: 'CHARGING' | 'DISCHARGING' | 'AC_CONNECTED';
}

export interface ReliabilityAuditSummary {
  systemUptimeSeconds: number;
  reliabilityScore: number; // 0 - 10.0 scale
  totalKernelPanics: number;
  totalAppCrashes: number;
  cleanReboots: number;
  uncleanShutdowns: number;
  lastBootDurationSec: number;
  microkernelInitTimeMs: number;
  driversInitTimeMs: number;
  userspaceInitTimeMs: number;
}

// jb7572_2026-08-24: Category 6 - Package Delivery & Features Types
export type PackageCategory = 
  | 'SYSTEM_CORE' 
  | 'DEVELOPMENT' 
  | 'NETWORKING' 
  | 'SECURITY' 
  | 'UTILITIES' 
  | 'GRAPHICS'
  | 'PRODUCTIVITY'
  | 'MULTIMEDIA'
  | 'WEB_BROWSER'
  | 'GAMING_COMPAT';

export type InstallerBackend = 'pacman' | 'yay' | 'apt' | 'winget';

export interface ConfiguredRepository {
  id: string;
  name: string;
  backend: InstallerBackend;
  url: string;
  branchOrSuite: string;
  components: string[];
  isEnabled: boolean;
  isCustom: boolean;
  latencyMs: number;
  status: 'ONLINE' | 'SYNCED' | 'CHECKING' | 'OFFLINE';
  lastUpdated: string;
  description: string;
  keyringPath?: string;
}

export interface SystemPackage {
  id: string;
  name: string;
  category: PackageCategory;
  version: string;
  installedVersion: string | null;
  status: 'INSTALLED' | 'UPGRADABLE' | 'AVAILABLE';
  sizeBytes: number;
  maintainer: string;
  description: string;
  sha256: string;
  dependencies: string[];
  repoSource: string;
  originInstaller?: InstallerBackend;
  installedFiles?: string[];
  upstreamUrl?: string;
  license?: string;
  architecture?: string;
  packager?: string;
}

export interface OptionalOsFeature {
  id: string;
  name: string;
  category: 'SUBSYSTEM' | 'VIRTUALIZATION' | 'DEVELOPER' | 'DIAGNOSTICS';
  description: string;
  enabled: boolean;
  requiresReboot: boolean;
  payloadSizeBytes: number;
}

// jb7572_2026-08-24: Category 7 - Search & Indexing Types
export type FileTypeCategory = 'SOURCE' | 'CONFIG' | 'LOG' | 'BINARY' | 'DOCUMENT' | 'HEADER';

export interface IndexedFileRecord {
  id: string;
  path: string;
  name: string;
  fileType: FileTypeCategory;
  sizeBytes: number;
  modifiedAt: string;
  lineCount: number;
  content: string;
  permissions: string;
}

export interface LineMatch {
  lineNumber: number;
  lineContent: string;
  highlightStart: number;
  highlightEnd: number;
}

export interface SearchResultItem {
  file: IndexedFileRecord;
  matches: LineMatch[];
  matchType: 'FILENAME' | 'CONTENT';
  score: number;
}

export interface IndexCatalogStats {
  totalFiles: number;
  totalSizeBytes: number;
  totalLines: number;
  lastRebuilt: string;
  status: 'ACTIVE' | 'PAUSED' | 'INDEXING';
  indexedPaths: string[];
}

// jb7572_2026-08-24: Unified Overview & Health HUD Types
export interface SubsystemHealthBadge {
  id: string;
  name: string;
  categoryKey: string;
  status: 'HEALTHY' | 'WARNING' | 'ALERT' | 'STANDBY';
  metric: string;
  detail: string;
}

export interface SystemIncident {
  id: string;
  timestamp: string;
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  subsystem: string;
  message: string;
  actionCommand?: string;
  resolved?: boolean;
}

export interface HealthHUDMetrics {
  cpuUsagePercent: number;
  memoryUsedPercent: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  thermalMaxC: number;
  storageUsedPercent: number;
  networkThroughputMbps: number;
  firewallBlockedCount: number;
  activeProcesses: number;
  runningDaemons: number;
  upgradablePackagesCount: number;
  indexedFilesCount: number;
  bootTimeSeconds: number;
  uptimeFormatted: string;
}

// jb7572_2026-08-24: Category / Item 2 - Process Virtual Memory, Hex & Disassembler Types
export interface ProcessMemorySection {
  name: string; // e.g. .text, .rodata, .data, .bss, [heap], [stack], [ipc_shared]
  startAddr: string;
  endAddr: string;
  sizeBytes: number;
  permissions: 'r-xp' | 'r--p' | 'rw-p' | 'rwxp' | 'rw-s';
  mappingFile?: string;
}

export interface DisassemblyInstruction {
  address: string;
  rawHex: string;
  mnemonic: string;
  operands: string;
  comment?: string;
}

export interface CpuRegistersSnapshot {
  rip: string;
  rsp: string;
  rbp: string;
  rax: string;
  rbx: string;
  rcx: string;
  rdx: string;
  rsi: string;
  rdi: string;
  r8: string;
  r9: string;
  r10: string;
  r11: string;
  r12: string;
  r13: string;
  r14: string;
  r15: string;
  rflags: string;
  cr0: string;
  cr3: string;
  cr4: string;
}

export interface ProcessMemoryDetail {
  pid: number;
  name: string;
  status: 'RUNNING' | 'SLEEPING' | 'STOPPED';
  pageTableRootCR3: string;
  sections: ProcessMemorySection[];
  registers: CpuRegistersSnapshot;
  instructions: DisassemblyInstruction[];
  hexDump: {
    offset: string;
    hexBytes: string[];
    ascii: string;
  }[];
}

// jb7572_2026-08-24: Category / Item 3 - Storage Benchmark & Filesystem Integrity Types
export interface StorageBenchmarkResult {
  device: string;
  testProfile: 'PEAK_PERFORMANCE' | 'REAL_WORLD' | 'IOPS_STRESS';
  seqReadMbPerSec: number;
  seqWriteMbPerSec: number;
  rand4kReadIops: number;
  rand4kWriteIops: number;
  rand4kReadLatencyMs: number;
  rand4kWriteLatencyMs: number;
  queueDepth: number;
  testBlockSize: string;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED';
}

export interface FsckBlockSector {
  id: number;
  status: 'GOOD' | 'CORRUPTED' | 'REPAIRED' | 'SCANNING';
}

export interface FsckIntegrityReport {
  partitionDevice: string;
  mountPoint: string;
  fileSystem: string;
  isClean: boolean;
  checkedInodes: number;
  nonContiguousFiles: number;
  checkedBlocks: number;
  fragmentationPercent: number;
  pass1_inodesStatus: string;
  pass2_dirStructureStatus: string;
  pass3_connectivityStatus: string;
  pass4_refCountsStatus: string;
  pass5_groupSummaryStatus: string;
  badBlocksFound: number;
  repairedBlocks: number;
  journalReplayStatus: string;
  lastCheckedDate: string;
}

// jb7572_2026-08-24: Category / Item 4 - DNS Resolver, Packet Sniffer & GeoIP Traffic Types
export interface DnsRecordEntry {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SOA';
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

export interface DnsLookupResult {
  domain: string;
  serverUsed: string;
  queryTimeMs: number;
  status: 'NOERROR' | 'NXDOMAIN' | 'SERVFAIL';
  records: DnsRecordEntry[];
}

export interface CapturedPacket {
  id: number;
  timestamp: string;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'DNS' | 'TLS' | 'ARP';
  src: string;
  dst: string;
  srcPort?: number;
  dstPort?: number;
  lengthBytes: number;
  info: string;
  hexDump: string;
  asciiDump: string;
}

export interface GeoIpTrafficNode {
  ip: string;
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  org: string;
  activeConnections: number;
  bandwidthKbps: number;
  threatLevel: 'CLEAN' | 'LOW' | 'SUSPICIOUS' | 'BLOCKED';
  direction: 'INBOUND' | 'OUTBOUND';
}

// jb7572_2026-08-24: Category / Item 5 - Sysctl Tunables, TimeDatectl & Power Profile Types
export interface SysctlParam {
  key: string;
  currentValue: number | boolean | string;
  defaultValue: number | boolean | string;
  type: 'number' | 'boolean' | 'string';
  min?: number;
  max?: number;
  unit?: string;
  category: 'VM' | 'NET' | 'FS' | 'KERNEL';
  description: string;
}

export interface TimeDateInfo {
  localTime: string;
  utcTime: string;
  rtcTime: string;
  timeZone: string;
  ntpActive: boolean;
  ntpSynchronized: boolean;
  rtcInLocalTz: boolean;
  ntpServer: string;
  driftPpm: number;
}

export interface PowerProfileInfo {
  activeProfile: 'performance' | 'balanced' | 'power-saver';
  cpuGovernor: 'performance' | 'powersave' | 'schedutil' | 'ondemand';
  turboBoost: boolean;
  currentFreqGhz: number;
  maxFreqGhz: number;
  batteryHealthPercent: number;
  powerDrawWatts: number;
}

// ==========================================
// Encrypted IndexedDB Persistent Vault Types
// ==========================================
export type VaultRecordType = 
  | 'QUARANTINE_ARTIFACT' 
  | 'MEMORY_DUMP' 
  | 'WASM_DISASSEMBLY' 
  | 'YARA_RULESET' 
  | 'STIX_THREAT_INTEL' 
  | 'INCIDENT_REPORT';

export interface EncryptedVaultRecord {
  id: string;
  type: VaultRecordType;
  title: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  sizeBytes: number;
  sha256Hash: string;
  iv: string; // Base64 12-byte initialization vector
  encryptedData: string; // Base64 AES-GCM-256 ciphertext + auth tag
  metadata: {
    originalFileName?: string;
    threatSeverity?: string;
    threatVector?: string;
    detectionEngine?: string;
    arch?: string;
    entropy?: number;
    sha256?: string;
    description?: string;
    author?: string;
    [key: string]: any;
  };
}

export interface DecryptedVaultRecord<T = any> {
  id: string;
  type: VaultRecordType;
  title: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  sizeBytes: number;
  sha256Hash: string;
  metadata: Record<string, any>;
  payload: T;
}

export interface VaultMetadataHeader {
  id: string; // 'vault_config'
  specVersion: '1.0';
  cipher: 'AES-GCM-256';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string; // Base64
  keyVerificationCiphertext: string; // Base64 encrypted check phrase
  keyVerificationIv: string; // Base64
  createdAt: string;
  lastUnlockedAt?: string;
  lastBackupAt?: string;
}

export interface VaultEngineStatus {
  state: 'UNINITIALIZED' | 'LOCKED' | 'UNLOCKED';
  totalRecords: number;
  totalStorageBytes: number;
  indexedDbSupported: boolean;
  webCryptoSupported: boolean;
  cipher: string;
  kdfIterations: number;
  lastUnlockedAt: string | null;
  lastSyncedAt: string | null;
  integrityReport: {
    status: 'VERIFIED' | 'TAMPER_DETECTED' | 'NOT_CHECKED';
    verifiedCount: number;
    corruptedIds: string[];
    lastAuditedAt: string | null;
  };
}

// =========================================================================
// Category / Item 4: Real-Time Syscall Hooking & eBPF Behavioral Sandbox Simulation Types
// =========================================================================

export type EbpfProbeType = 'kprobe' | 'kretprobe' | 'tracepoint' | 'bpf_lsm' | 'xdp';

export interface EbpfProgram {
  id: string;
  name: string;
  section: string;
  targetSyscall: string;
  type: EbpfProbeType;
  status: 'ACTIVE' | 'SUSPENDED' | 'AUDIT_ONLY';
  jitedInstructions: number;
  complexity: number;
  stackDepthBytes: number;
  eventsCount: number;
  blocksCount: number;
  cSource: string;
  description: string;
}

export type SyscallCategory = 
  | 'MEMORY_INJECTION'
  | 'PROCESS_CONTROL'
  | 'FILE_TAMPERING'
  | 'NETWORK_C2'
  | 'KERNEL_DRIVER'
  | 'FILELESS_EXEC'
  | 'CREDENTIAL_ACCESS';

export type SyscallEnforcementAction = 
  | 'ALLOW'
  | 'AUDIT'
  | 'BLOCK_EPERM'
  | 'KILL_SIGKILL'
  | 'ISOLATE_SANDBOX'
  | 'ALERT';

export interface SyscallHookPolicy {
  id: string;
  syscall: string;
  syscallNr: number;
  category: SyscallCategory;
  action: SyscallEnforcementAction;
  enabled: boolean;
  threatSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  triggerCondition: string;
}

export interface SyscallEvent {
  id: string;
  timestamp: string;
  epochMs: number;
  cpu: number;
  pid: number;
  ppid: number;
  comm: string;
  uid: number;
  syscall: string;
  syscallNr: number;
  arguments: string;
  rawArgs: Record<string, any>;
  returnVal: string;
  durationUs: number;
  actionTaken: 'PASSED' | 'AUDIT' | 'INTERCEPTED' | 'BLOCKED_EPERM' | 'KILLED_SIGKILL' | 'ISOLATED';
  threatScore: number;
  mitreTechnique?: string;
  signature?: string;
  ruleMatched?: string;
}

export interface EbpfMapEntry {
  key: string;
  value: string;
  lastUpdated: string;
}

export interface EbpfMap {
  id: string;
  name: string;
  type: 'BPF_MAP_TYPE_HASH' | 'BPF_MAP_TYPE_RINGBUF' | 'BPF_MAP_TYPE_ARRAY' | 'BPF_MAP_TYPE_LRU_HASH';
  keySize: number;
  valueSize: number;
  maxEntries: number;
  currentEntries: number;
  entries: EbpfMapEntry[];
  description: string;
}

export interface SandboxSimulationStep {
  delayMs: number;
  syscall: string;
  syscallNr: number;
  args: string;
  rawArgs: Record<string, any>;
  simulatedReturn: string;
  riskScore: number;
  mitre?: string;
  triggerHeuristic?: string;
}

export interface SandboxSimulationProfile {
  id: string;
  name: string;
  category: 'MALWARE' | 'EXPLOIT' | 'ROOTKIT' | 'RANSOMWARE' | 'BENIGN_SYSADMIN';
  processName: string;
  description: string;
  expectedMitre: string;
  steps: SandboxSimulationStep[];
}

export interface EbpfEngineStats {
  engineStatus: 'RUNNING' | 'PAUSED' | 'DEGRADED';
  activeProbesCount: number;
  totalSyscallsProcessed: number;
  totalBlocksKills: number;
  totalAudited: number;
  ringBufferThroughputMsgSec: number;
  ringBufferDropRate: number;
  averageLatencyUs: number;
  jitCompiler: 'ENABLED (Clang/LLVM 18 eBPF v4 JIT)' | 'DISABLED';
  kernelVersion: string;
  bpfLsmEnabled: boolean;
}

// jb7572_2026-09-03: Bug Reporter, Zero-PII Crash Telemetry & OS User Wishlist Interfaces
export interface BugReportHardwareSnapshot {
  cpuModel: string;
  cpuArch: string;
  cpuCores: number;
  cpuFrequencyGhz: number;
  memoryTotalGb: number;
  memoryFreeGb: number;
  memoryUsagePercent: number;
  mmuPagingMode: string;
  gpuModel: string;
  screenResolution: string;
  colorDepth: number;
  pixelRatio: number;
  storageModel: string;
  storageMirrorSyncPercent: number;
  storagePartitionsCount: number;
  tpmVersion: string;
  tpmStatus: string;
  thermalCpuC: number;
  powerProfile: string;
  pciDevicesCount: number;
}

export interface BugReportSoftwareSnapshot {
  osName: string;
  osVersion: string;
  kernelBuild: string;
  osPersonality: 'linux' | 'windows';
  activeTheme: string;
  windowManager: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  activeProcessesCount: number;
  activeServicesCount: number;
  hipsStatus: string;
  activeShieldsCount: number;
  activeFirewallRulesCount: number;
  backgroundJobsCount: number;
  browserRuntime: string;
}

export interface BugReportCodeContext {
  fileOrModule: string;
  lineNumber?: number;
  columnNumber?: number;
  functionName?: string;
  codeSnippet?: string;
  stackTrace?: string;
  componentStack?: string;
}

export interface PrivacySanitizationVerification {
  noPersonalInfoIncluded: boolean;
  redactedUsernames: boolean;
  redactedEmails: boolean;
  redactedCredentials: boolean;
  redactedPaths: boolean;
  redactedIpAddresses: boolean;
  sanitizationAuditLog: string[];
  sanitizedAt: string;
}

export interface BugReportAttachment {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  content: string;
}

export interface UserIdeaDetails {
  category: 'KERNEL_DRIVERS' | 'COCKPIT_UTILITIES' | 'DESKTOP_UI' | 'SECURITY_HIPS' | 'STORAGE_FILESYSTEM' | 'NETWORKING' | 'TERMINAL_CLI' | 'AUDIO_VISUAL' | 'GENERAL_OS';
  impactLevel: 'NICE_TO_HAVE' | 'ERGONOMIC_POLISH' | 'SIGNIFICANT_IMPROVEMENT' | 'MAJOR_NEW_SUBSYSTEM';
  proposedAddition: string;
  rationale: string;
  affectedArea: string;
}

export interface BugReportTelemetry {
  id: string;
  timestamp: string;
  type: 'BUG_CRASH' | 'RUNTIME_ERROR' | 'MANUAL_REPORT' | 'USER_IDEA' | 'FEATURE_REQUEST';
  title: string;
  description: string;
  recipient: 'securecurtainos.bugs@gmail.com';
  sender: string;
  codeContext?: BugReportCodeContext;
  hardware: BugReportHardwareSnapshot;
  software: BugReportSoftwareSnapshot;
  privacy: PrivacySanitizationVerification;
  userIdea?: UserIdeaDetails;
  status: 'PENDING' | 'TRANSMITTED' | 'FAILED';
  transmittedAt?: string;
  transmissionMethod: 'AUTOMATED_SMTP_GATEWAY' | 'RFC5322_MAILTO_FALLBACK' | 'TELEMETRY_PIPELINE';
  attachments: BugReportAttachment[];
  rawEmailMimePreview: string;
}


