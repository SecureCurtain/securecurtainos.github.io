// jb7572_2026-08-24: Category 3 - Network & Security Management Cockpit GUI Suite
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Wifi, 
  Globe, 
  Activity, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Power, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Terminal, 
  Search, 
  Edit3, 
  Sliders, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Lock,
  Zap,
  Layers,
  RadioTower,
  Play,
  Pause,
  Binary,
  MapPin,
  Compass,
  Copy,
  Check,
  Send,
  Eye,
  SlidersHorizontal,
  Flame,
  FileCode,
  HardDrive,
  Bug,
  Code2,
  Key,
  Cpu
} from 'lucide-react';
import { networkSecurityService } from '../../services/networkSecurityService';
import { hipsAntiMalwareService } from '../../services/hipsAntiMalwareService';
import { WifiNetworkManagerGUI } from './WifiNetworkManagerGUI';
import { VpnManagerGUI } from './VpnManagerGUI';
import { HipsAntiMalwareGUI } from './HipsAntiMalwareGUI';
import { QuarantineSandboxGUI } from './QuarantineSandboxGUI';
import { EncryptedVaultGUI } from './EncryptedVaultGUI';
import { EbpfSyscallSandboxGUI } from './EbpfSyscallSandboxGUI';
import { 
  NetworkInterface, 
  FirewallRule, 
  SocketEntry, 
  FirewallDirection, 
  FirewallAction, 
  FirewallProtocol, 
  FirewallZone,
  DnsLookupResult,
  CapturedPacket,
  GeoIpTrafficNode,
  WifiNetworkProfile
} from '../../types';

interface NetworkSecurityGUIProps {
  onRunCliCommand: (cmd: string) => void;
}

export const NetworkSecurityGUI: React.FC<NetworkSecurityGUIProps> = ({ onRunCliCommand }) => {
  // Navigation tabs inside Category 3 (HIPS & Anti-Malware, Quarantine Sandbox, Encrypted Vault, eBPF Sandbox, Wi-Fi & VPN Suite)
  const [activeTab, setActiveTab] = useState<'hips' | 'quarantine' | 'vault' | 'ebpf' | 'firewall' | 'wifi' | 'vpn' | 'interfaces' | 'sockets' | 'dns' | 'sniffer' | 'geoip' | 'diagnostics'>('hips');
  const [quarantineFocusId, setQuarantineFocusId] = useState<string | null>(null);

  // Interfaces state
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [selectedIface, setSelectedIface] = useState<NetworkInterface | null>(null);
  const [isEditingIface, setIsEditingIface] = useState(false);
  const [editIpv4, setEditIpv4] = useState('');
  const [editNetmask, setEditNetmask] = useState('');
  const [editGateway, setEditGateway] = useState('');
  const [editPrimaryDns, setEditPrimaryDns] = useState('');
  const [editSecondaryDns, setEditSecondaryDns] = useState('');
  const [editMtu, setEditMtu] = useState(1500);
  const [editIsDhcp, setEditIsDhcp] = useState(true);

  // Wi-Fi & VPN state for badges
  const [wifiProfileCount, setWifiProfileCount] = useState<number>(() => networkSecurityService.getWifiProfiles().length);
  const [vpnConnected, setVpnConnected] = useState<boolean>(() => networkSecurityService.getVpnConfig().status === 'CONNECTED');
  const [threatCount, setThreatCount] = useState<number>(() => hipsAntiMalwareService.getDetectedThreats().length);
  const [quarantineCount, setQuarantineCount] = useState<number>(() => hipsAntiMalwareService.getQuarantineVault().filter(q => q.status !== 'PURGED').length);

  // Firewall state
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([]);
  const [firewallActive, setFirewallActive] = useState<boolean>(true);
  const [currentZone, setCurrentZone] = useState<'PUBLIC' | 'TRUSTED' | 'DMZ'>('TRUSTED');
  const [ruleFilterDirection, setRuleFilterDirection] = useState<'ALL' | 'INBOUND' | 'OUTBOUND'>('ALL');
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDir, setNewRuleDir] = useState<FirewallDirection>('INBOUND');
  const [newRuleAction, setNewRuleAction] = useState<FirewallAction>('ALLOW');
  const [newRuleProto, setNewRuleProto] = useState<FirewallProtocol>('TCP');
  const [newRulePort, setNewRulePort] = useState('8080');
  const [newRuleSource, setNewRuleSource] = useState('0.0.0.0/0');
  const [newRuleDest, setNewRuleDest] = useState('192.168.1.140');
  const [newRuleZone, setNewRuleZone] = useState<FirewallZone>('TRUSTED');
  const [newRuleDesc, setNewRuleDesc] = useState('');

  // Sockets state
  const [sockets, setSockets] = useState<SocketEntry[]>([]);
  const [socketFilterState, setSocketFilterState] = useState<'ALL' | 'LISTEN' | 'ESTABLISHED'>('ALL');
  const [socketSearch, setSocketSearch] = useState('');

  // DNS Resolver state
  const [dnsQueryDomain, setDnsQueryDomain] = useState('google.com');
  const [dnsServer, setDnsServer] = useState('1.1.1.1 (Cloudflare)');
  const [dnsResult, setDnsResult] = useState<DnsLookupResult | null>(null);
  const [dnsLoading, setDnsLoading] = useState(false);
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);

  // Packet Sniffer state
  const [isSniffing, setIsSniffing] = useState(true);
  const [packets, setPackets] = useState<CapturedPacket[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<CapturedPacket | null>(null);
  const [packetFilterProto, setPacketFilterProto] = useState<string>('ALL');
  const [packetSearchTerm, setPacketSearchTerm] = useState('');

  // GeoIP state
  const [geoNodes, setGeoNodes] = useState<GeoIpTrafficNode[]>([]);
  const [selectedGeoNode, setSelectedGeoNode] = useState<GeoIpTrafficNode | null>(null);
  const [geoDirectionFilter, setGeoDirectionFilter] = useState<'ALL' | 'INBOUND' | 'OUTBOUND'>('ALL');

  // Diagnostics state
  const [diagHost, setDiagHost] = useState('1.1.1.1');
  const [pingRunning, setPingRunning] = useState(false);
  const [pingOutput, setPingOutput] = useState<string[] | null>(null);
  const [traceRunning, setTraceRunning] = useState(false);
  const [traceOutput, setTraceOutput] = useState<string[] | null>(null);

  // Notification feedback banner
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  const showBanner = (msg: string) => {
    setBannerMsg(msg);
    setTimeout(() => setBannerMsg(null), 3500);
  };

  const refreshData = () => {
    setInterfaces(networkSecurityService.getInterfaces());
    setFirewallRules(networkSecurityService.getFirewallRules());
    setFirewallActive(networkSecurityService.isFirewallActive());
    setCurrentZone(networkSecurityService.getCurrentZone());
    setSockets(networkSecurityService.getSockets());
    setPackets(networkSecurityService.getCapturedPackets());
    setGeoNodes(networkSecurityService.getGeoIpNodes());
    setWifiProfileCount(networkSecurityService.getWifiProfiles().length);
    setVpnConnected(networkSecurityService.getVpnConfig().status === 'CONNECTED');
  };

  useEffect(() => {
    refreshData();
    // Default DNS lookup
    const initialDns = networkSecurityService.resolveDns('google.com');
    setDnsResult(initialDns);

    // Auto-select first packet
    const p = networkSecurityService.getCapturedPackets();
    if (p.length > 0) setSelectedPacket(p[0]);

    // Refresh loop
    const timer = setInterval(() => {
      refreshData();
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Live packet stream simulation if sniffing
  useEffect(() => {
    if (!isSniffing) return;
    const interval = setInterval(() => {
      const protos: ('TCP' | 'UDP' | 'ICMP' | 'DNS' | 'TLS')[] = ['TCP', 'TLS', 'DNS', 'ICMP'];
      const pick = protos[Math.floor(Math.random() * protos.length)];
      const newP = networkSecurityService.injectTestPacket(pick);
      setPackets(networkSecurityService.getCapturedPackets());
    }, 4500);
    return () => clearInterval(interval);
  }, [isSniffing]);

  // Interface Handlers
  const handleToggleInterface = (name: string) => {
    const res = networkSecurityService.toggleInterfaceState(name);
    refreshData();
    showBanner(res.message);
    onRunCliCommand(`ip link set dev ${name} ${res.newState === 'UP' ? 'up' : 'down'}`);
  };

  const handleOpenEditIface = (iface: NetworkInterface) => {
    setSelectedIface(iface);
    setEditIpv4(iface.ipv4);
    setEditNetmask(iface.netmask);
    setEditGateway(iface.gateway);
    setEditPrimaryDns(iface.dns[0] || '1.1.1.1');
    setEditSecondaryDns(iface.dns[1] || '8.8.8.8');
    setEditMtu(iface.mtu);
    setEditIsDhcp(iface.isDhcp);
    setIsEditingIface(true);
  };

  const handleSaveIface = () => {
    if (!selectedIface) return;
    const dnsArr = [editPrimaryDns.trim(), editSecondaryDns.trim()].filter(Boolean);
    const res = networkSecurityService.updateInterfaceConfig(selectedIface.name, {
      ipv4: editIpv4,
      netmask: editNetmask,
      gateway: editGateway,
      dns: dnsArr,
      mtu: editMtu,
      isDhcp: editIsDhcp
    });
    setIsEditingIface(false);
    refreshData();
    showBanner(res.message);
    onRunCliCommand(`ip addr add ${editIpv4}/24 dev ${selectedIface.name}`);
  };

  // Firewall Handlers
  const handleToggleFirewallMaster = () => {
    const res = networkSecurityService.toggleFirewallMaster();
    refreshData();
    showBanner(res.message);
    onRunCliCommand(res.active ? 'ufw enable' : 'ufw disable');
  };

  const handleToggleRule = (id: string) => {
    const res = networkSecurityService.toggleRule(id);
    refreshData();
    showBanner(res.message);
  };

  const handleDeleteRule = (id: string) => {
    const res = networkSecurityService.deleteFirewallRule(id);
    refreshData();
    showBanner(res.message);
    onRunCliCommand(`iptables -D INPUT ${id}`);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const res = networkSecurityService.addFirewallRule({
      name: newRuleName.trim(),
      direction: newRuleDir,
      action: newRuleAction,
      protocol: newRuleProto,
      portRange: newRulePort.trim() || 'ANY',
      source: newRuleSource.trim() || '0.0.0.0/0',
      destination: newRuleDest.trim() || '192.168.1.140',
      zone: newRuleZone,
      enabled: true,
      description: newRuleDesc.trim() || 'Custom user firewall rule'
    });

    setIsAddingRule(false);
    setNewRuleName('');
    setNewRuleDesc('');
    refreshData();
    showBanner(res.message);
    onRunCliCommand(`iptables -A ${newRuleDir === 'INBOUND' ? 'INPUT' : 'OUTPUT'} -p ${newRuleProto.toLowerCase()} --dport ${newRulePort} -j ${newRuleAction}`);
  };

  // DNS Resolver Handler
  const handleRunDnsResolve = (domainToQuery?: string) => {
    const target = (domainToQuery || dnsQueryDomain).trim();
    if (!target) return;
    setDnsLoading(true);
    setTimeout(() => {
      const res = networkSecurityService.resolveDns(target, dnsServer);
      setDnsResult(res);
      setDnsLoading(false);
      onRunCliCommand(`dig +short ${target}`);
    }, 250);
  };

  const handleCopyValue = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedRecord(val);
    setTimeout(() => setCopiedRecord(null), 2000);
  };

  // Sniffer Handlers
  const handleInjectPacket = (proto: 'TCP' | 'UDP' | 'ICMP' | 'DNS' | 'TLS') => {
    const p = networkSecurityService.injectTestPacket(proto);
    setPackets(networkSecurityService.getCapturedPackets());
    setSelectedPacket(p);
    showBanner(`Injected simulated ${proto} packet into kernel capture queue.`);
    onRunCliCommand(`tcpdump -c 1 -nn -XX ${proto.toLowerCase()}`);
  };

  const handleClearPackets = () => {
    networkSecurityService.clearCapturedPackets();
    setPackets([]);
    setSelectedPacket(null);
    showBanner('Cleared packet capture buffer.');
  };

  // Diagnostics Handlers
  const handleRunPing = () => {
    if (!diagHost.trim()) return;
    setPingRunning(true);
    setPingOutput(['Sending 4 ICMP ECHO packets to ' + diagHost + '...']);
    setTimeout(() => {
      const res = networkSecurityService.runPing(diagHost);
      setPingOutput(res.logs);
      setPingRunning(false);
      onRunCliCommand(`ping -c 4 ${diagHost}`);
    }, 600);
  };

  const handleRunTraceroute = () => {
    if (!diagHost.trim()) return;
    setTraceRunning(true);
    setTraceOutput(['Initiating traceroute gateway hop discovery to ' + diagHost + ' (max 30 hops)...']);
    setTimeout(() => {
      const res = networkSecurityService.runTraceroute(diagHost);
      setTraceOutput(res.logs);
      setTraceRunning(false);
      onRunCliCommand(`traceroute ${diagHost}`);
    }, 800);
  };

  const filteredRules = firewallRules.filter(r => {
    if (ruleFilterDirection === 'ALL') return true;
    return r.direction === ruleFilterDirection;
  });

  const filteredSockets = sockets.filter(s => {
    if (socketFilterState !== 'ALL' && s.state !== socketFilterState) return false;
    if (socketSearch.trim()) {
      const q = socketSearch.toLowerCase();
      return (
        s.service.toLowerCase().includes(q) ||
        s.processName.toLowerCase().includes(q) ||
        s.localPort.toString().includes(q) ||
        s.localAddress.includes(q) ||
        s.foreignAddress.includes(q)
      );
    }
    return true;
  });

  const filteredPackets = packets.filter(p => {
    if (packetFilterProto !== 'ALL' && p.protocol !== packetFilterProto) return false;
    if (packetSearchTerm.trim()) {
      const q = packetSearchTerm.toLowerCase();
      return (
        p.src.toLowerCase().includes(q) ||
        p.dst.toLowerCase().includes(q) ||
        p.info.toLowerCase().includes(q) ||
        p.protocol.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredGeoNodes = geoNodes.filter(n => {
    if (geoDirectionFilter === 'ALL') return true;
    return n.direction === geoDirectionFilter;
  });

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-zinc-200 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Toast Banner */}
      {bannerMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-cyan-500/40 text-cyan-300 px-4 py-2.5 rounded-lg shadow-2xl text-xs flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{bannerMsg}</span>
        </div>
      )}

      {/* Header & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Network & Security Control Cockpit
                <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded-full">
                  lwIP Ring-0
                </span>
              </h2>
              <p className="text-xs text-[#888]">
                Firewall state machine, real-time packet sniffer, DNS query workbench, and GeoIP traffic matrix
              </p>
            </div>
          </div>
        </div>

        {/* Global Firewall Master Switch & CLI Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleFirewallMaster}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all shadow-md ${
              firewallActive 
                ? 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/60 shadow-emerald-950/30' 
                : 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border-rose-700/60 shadow-rose-950/30'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>Firewall: {firewallActive ? 'ACTIVE (ENFORCING)' : 'DISABLED'}</span>
          </button>

          <button
            onClick={() => onRunCliCommand('ufw status verbose')}
            className="px-2.5 py-1.5 bg-[#141414] hover:bg-[#202020] text-[#aaa] hover:text-white rounded-lg border border-[#333] text-xs font-mono flex items-center gap-1.5 transition-colors"
            title="Inspect firewall rules via CLI"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>ufw status</span>
          </button>

          <button
            onClick={() => onRunCliCommand('ss -tulpn')}
            className="px-2.5 py-1.5 bg-[#141414] hover:bg-[#202020] text-[#aaa] hover:text-white rounded-lg border border-[#333] text-xs font-mono flex items-center gap-1.5 transition-colors"
            title="Inspect listening ports via CLI"
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>ss -tulpn</span>
          </button>

          <button
            onClick={() => onRunCliCommand('dig google.com')}
            className="px-2.5 py-1.5 bg-[#141414] hover:bg-[#202020] text-[#aaa] hover:text-white rounded-lg border border-[#333] text-xs font-mono flex items-center gap-1.5 transition-colors"
            title="Run DNS lookup"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>dig</span>
          </button>

          <button
            onClick={() => onRunCliCommand('tcpdump -c 5 -nn')}
            className="px-2.5 py-1.5 bg-[#141414] hover:bg-[#202020] text-[#aaa] hover:text-white rounded-lg border border-[#333] text-xs font-mono flex items-center gap-1.5 transition-colors"
            title="Run live packet capture in CLI"
          >
            <Binary className="w-3.5 h-3.5 text-amber-400" />
            <span>tcpdump</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs (11 Comprehensive Security & Network Tabs) */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#222] pb-2">
        <button
          onClick={() => setActiveTab('hips')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'hips'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
              : 'bg-purple-950/20 text-purple-300 border border-purple-500/20 hover:bg-purple-950/40 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-purple-400" />
          <span>HIPS & Anti-Malware ({threatCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('quarantine')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'quarantine'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
              : 'bg-purple-950/20 text-purple-300 border border-purple-500/20 hover:bg-purple-950/40 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4 text-purple-400" />
          <span>Quarantine & Sandbox ({quarantineCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'vault'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
              : 'bg-purple-950/20 text-purple-300 border border-purple-500/20 hover:bg-purple-950/40 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4 text-purple-400" />
          <span>Encrypted Vault</span>
        </button>

        <button
          onClick={() => setActiveTab('ebpf')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'ebpf'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/50'
              : 'bg-cyan-950/20 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-950/40 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>eBPF Syscall Sandbox</span>
        </button>

        <button
          onClick={() => setActiveTab('firewall')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'firewall'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-[#888] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Firewall Rules ({firewallRules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wifi')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'wifi'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-[#888] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Wifi className="w-4 h-4" />
          <span>Wi-Fi & Spectrum ({wifiProfileCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('vpn')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'vpn'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-[#888] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <ShieldCheck className={`w-4 h-4 ${vpnConnected ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <span>Quantum VPN Tunnel ({vpnConnected ? 'PROTECTED' : 'IDLE'})</span>
        </button>

        <button
          onClick={() => setActiveTab('interfaces')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'interfaces'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-[#888] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Network Interfaces ({interfaces.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sockets')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'sockets'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-[#888] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Socket Monitor ({sockets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dns')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'dns'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-[#888] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>DNS Resolver & Workbench</span>
        </button>

        <button
          onClick={() => setActiveTab('sniffer')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'sniffer'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-[#888] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Binary className="w-4 h-4" />
          <span>Live Packet Sniffer ({packets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('geoip')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'geoip'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
              : 'text-[#888] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Global GeoIP Threat Map</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'diagnostics'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-[#888] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Ping & Traceroute</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB: HIPS & ANTI-MALWARE ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'hips' && (
        <HipsAntiMalwareGUI 
          onRunCliCommand={onRunCliCommand}
          onNavigateToQuarantine={(vaultId) => {
            if (vaultId) setQuarantineFocusId(vaultId);
            setActiveTab('quarantine');
          }}
          onNavigateToEbpf={() => setActiveTab('ebpf')}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: QUARANTINE & SANDBOX STUDY WORKBENCH */}
      {/* ========================================================================= */}
      {activeTab === 'quarantine' && (
        <QuarantineSandboxGUI
          initialSelectedVaultId={quarantineFocusId}
          onRunCliCommand={onRunCliCommand}
          onNavigateToVault={() => setActiveTab('vault')}
          onNavigateToEbpf={() => setActiveTab('ebpf')}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: ENCRYPTED INDEXEDDB PERSISTENT VAULT (AES-GCM-256) */}
      {/* ========================================================================= */}
      {activeTab === 'vault' && (
        <EncryptedVaultGUI
          onRunCliCommand={onRunCliCommand}
          onNavigateToQuarantine={() => setActiveTab('quarantine')}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: REAL-TIME SYSCALL HOOKING & eBPF BEHAVIORAL SANDBOX */}
      {/* ========================================================================= */}
      {activeTab === 'ebpf' && (
        <EbpfSyscallSandboxGUI
          onRunCliCommand={onRunCliCommand}
          onNavigateToQuarantine={() => setActiveTab('quarantine')}
          onNavigateToVault={() => setActiveTab('vault')}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 0: WI-FI & SPECTRUM CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === 'wifi' && (
        <WifiNetworkManagerGUI 
          onRunCliCommand={onRunCliCommand} 
          onRefreshParent={refreshData}
          onNavigateToVpn={() => setActiveTab('vpn')}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 0.5: BUILT-IN QUANTUM-RESISTANT VPN MANAGEMENT SUITE */}
      {/* ========================================================================= */}
      {activeTab === 'vpn' && (
        <VpnManagerGUI
          onRunCliCommand={onRunCliCommand}
          onRefreshParent={refreshData}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: FIREWALL RULES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'firewall' && (
        <div className="space-y-5">
          {/* Integrated HIPS & Anti-Malware Alert Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 via-[#10081d] to-[#0c0f1d] border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-900/60 border border-purple-500/50 text-purple-300">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-sans">Host Intrusion Prevention (HIPS) & Anti-Malware Active</span>
                  <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-400 text-[10px] font-bold">
                    {threatCount} THREATS LOGGED
                  </span>
                </div>
                <p className="text-[11px] text-purple-300/70 pt-0.5">
                  Deep behavioral interception, kernel syscall trap, and isolated quarantine sandbox operational.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('hips')}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>View HIPS Log</span>
              </button>
              <button
                onClick={() => setActiveTab('quarantine')}
                className="px-3 py-1.5 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Quarantine Sandbox ({quarantineCount})</span>
              </button>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111] p-3 rounded-xl border border-[#222]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#888]">Filter Direction:</span>
              {(['ALL', 'INBOUND', 'OUTBOUND'] as const).map(dir => (
                <button
                  key={dir}
                  onClick={() => setRuleFilterDirection(dir)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    ruleFilterDirection === dir
                      ? 'bg-cyan-600 text-white'
                      : 'bg-[#1a1a1a] text-[#888] hover:text-white'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-[#888]">
                <span>Zone Policy:</span>
                <span className="px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-400 border border-indigo-700/60 font-mono font-semibold">
                  {currentZone}
                </span>
              </div>

              <button
                onClick={() => setIsAddingRule(true)}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rule</span>
              </button>
            </div>
          </div>

          {/* Add Rule Form Modal / Collapsible */}
          {isAddingRule && (
            <form onSubmit={handleCreateRule} className="bg-[#121212] border border-cyan-500/40 rounded-xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#222] pb-3">
                <h3 className="font-bold text-sm text-cyan-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Define Stateful Packet Filter Rule</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="text-xs text-[#888] hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-[#888] mb-1 font-sans">Rule Name / Alias</label>
                  <input
                    type="text"
                    required
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    placeholder="e.g. Allow Custom Microservice"
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[#888] mb-1 font-sans">Direction</label>
                  <select
                    value={newRuleDir}
                    onChange={(e) => setNewRuleDir(e.target.value as FirewallDirection)}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="INBOUND">INBOUND (Input Chain)</option>
                    <option value="OUTBOUND">OUTBOUND (Output Chain)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#888] mb-1 font-sans">Action</label>
                  <select
                    value={newRuleAction}
                    onChange={(e) => setNewRuleAction(e.target.value as FirewallAction)}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALLOW">ALLOW (Accept Packet)</option>
                    <option value="BLOCK">BLOCK (Reject with ICMP)</option>
                    <option value="DROP">DROP (Silent Discard)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#888] mb-1 font-sans">Protocol</label>
                  <select
                    value={newRuleProto}
                    onChange={(e) => setNewRuleProto(e.target.value as FirewallProtocol)}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="ICMP">ICMP</option>
                    <option value="ALL">ALL (Any Protocol)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#888] mb-1 font-sans">Port / Range</label>
                  <input
                    type="text"
                    value={newRulePort}
                    onChange={(e) => setNewRulePort(e.target.value)}
                    placeholder="e.g. 8080 or 8000-8050"
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[#888] mb-1 font-sans">Source CIDR</label>
                  <input
                    type="text"
                    value={newRuleSource}
                    onChange={(e) => setNewRuleSource(e.target.value)}
                    placeholder="0.0.0.0/0"
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[#888] mb-1 font-sans">Description & Purpose</label>
                  <input
                    type="text"
                    value={newRuleDesc}
                    onChange={(e) => setNewRuleDesc(e.target.value)}
                    placeholder="Description of the traffic allowed by this firewall rule..."
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] text-[#ccc] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Commit Rule to iptables Chain</span>
                </button>
              </div>
            </form>
          )}

          {/* Rules Table */}
          <div className="bg-[#0f0f0f] border border-[#222] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#141414] border-b border-[#222] text-[#888]">
                    <th className="py-3 px-4">State</th>
                    <th className="py-3 px-4">Rule Name</th>
                    <th className="py-3 px-4">Direction</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Proto</th>
                    <th className="py-3 px-4">Port</th>
                    <th className="py-3 px-4">Source → Destination</th>
                    <th className="py-3 px-4">Hits</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1c1c]">
                  {filteredRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-[#141414] transition-colors">
                      {/* Enable/Disable Toggle */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                            rule.enabled 
                              ? 'bg-emerald-500 text-black' 
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                          title={rule.enabled ? 'Enabled (Click to disable)' : 'Disabled (Click to enable)'}
                        >
                          {rule.enabled && <CheckCircle2 className="w-3 h-3" />}
                        </button>
                      </td>

                      {/* Rule Name */}
                      <td className="py-3 px-4 font-sans font-medium text-white">
                        <div>{rule.name}</div>
                        <div className="text-[11px] text-[#666] truncate max-w-xs">{rule.description}</div>
                      </td>

                      {/* Direction */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rule.direction === 'INBOUND' 
                            ? 'bg-cyan-950/70 text-cyan-400 border border-cyan-800/50' 
                            : 'bg-amber-950/70 text-amber-400 border border-amber-800/50'
                        }`}>
                          {rule.direction}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rule.action === 'ALLOW'
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                            : 'bg-rose-950/70 text-rose-400 border border-rose-800/50'
                        }`}>
                          {rule.action}
                        </span>
                      </td>

                      {/* Protocol */}
                      <td className="py-3 px-4 text-[#aaa]">{rule.protocol}</td>

                      {/* Port Range */}
                      <td className="py-3 px-4 text-cyan-300">{rule.portRange}</td>

                      {/* Source -> Dest */}
                      <td className="py-3 px-4 text-[#888]">
                        <span className="text-white">{rule.source}</span> → <span className="text-[#aaa]">{rule.destination}</span>
                      </td>

                      {/* Hits */}
                      <td className="py-3 px-4 text-emerald-400">
                        {rule.hits.toLocaleString()}
                      </td>

                      {/* Delete */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 text-[#666] hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                          title="Delete Firewall Rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NETWORK INTERFACES CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === 'interfaces' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {interfaces.map(iface => (
              <div 
                key={iface.name}
                className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4 shadow-xl flex flex-col justify-between space-y-4 hover:border-cyan-500/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#222] pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                        {iface.type === 'WIRELESS' ? <Wifi className="w-4 h-4" /> : <Server className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white font-mono">{iface.name}</h4>
                        <p className="text-[11px] text-[#777] truncate max-w-[140px]">{iface.driver}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      iface.state === 'UP' 
                        ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60' 
                        : 'bg-rose-950/70 text-rose-400 border border-rose-800/60'
                    }`}>
                      {iface.state}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-[#888]">
                      <span>IPv4 Address:</span>
                      <span className="text-white font-semibold">{iface.ipv4}</span>
                    </div>
                    <div className="flex justify-between text-[#888]">
                      <span>MAC Address:</span>
                      <span className="text-[#aaa]">{iface.mac}</span>
                    </div>
                    <div className="flex justify-between text-[#888]">
                      <span>Gateway:</span>
                      <span className="text-[#aaa]">{iface.gateway}</span>
                    </div>
                    <div className="flex justify-between text-[#888]">
                      <span>MTU:</span>
                      <span className="text-[#aaa]">{iface.mtu} bytes</span>
                    </div>
                    <div className="flex justify-between text-[#888]">
                      <span>Link Speed:</span>
                      <span className="text-cyan-400">{iface.speedMbps} Mbps</span>
                    </div>
                    <div className="flex justify-between text-[#888]">
                      <span>RX / TX:</span>
                      <span className="text-emerald-400">
                        {(iface.rxBytes / (1024 * 1024)).toFixed(1)} MB / {(iface.txBytes / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#1a1a1a]">
                  <button
                    onClick={() => handleToggleInterface(iface.name)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      iface.state === 'UP'
                        ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40'
                        : 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{iface.state === 'UP' ? 'Deactivate' : 'Activate'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditIface(iface)}
                    className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] text-white rounded-lg text-xs font-medium border border-[#333] flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit IP</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Edit Modal */}
          {isEditingIface && selectedIface && (
            <div className="bg-[#121212] border border-cyan-500/40 rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#222] pb-3">
                <h3 className="font-bold text-sm text-cyan-400 font-mono">
                  Configure Interface: {selectedIface.name}
                </h3>
                <button
                  onClick={() => setIsEditingIface(false)}
                  className="text-xs text-[#888] hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-[#888] mb-1 font-sans">
                    IPv4 Address {editIsDhcp && '(Automatic DHCP allocation)'}
                  </label>
                  <input
                    type="text"
                    value={editIpv4}
                    onChange={(e) => setEditIpv4(e.target.value)}
                    disabled={editIsDhcp}
                    className={`w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 ${
                      editIsDhcp ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[#888] mb-1 font-sans">Subnet Netmask</label>
                  <input
                    type="text"
                    value={editNetmask}
                    onChange={(e) => setEditNetmask(e.target.value)}
                    disabled={editIsDhcp}
                    className={`w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 ${
                      editIsDhcp ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[#888] mb-1 font-sans">Default Gateway Router</label>
                  <input
                    type="text"
                    value={editGateway}
                    onChange={(e) => setEditGateway(e.target.value)}
                    disabled={editIsDhcp}
                    className={`w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 ${
                      editIsDhcp ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[#888] mb-1 font-sans">Primary DNS Server</label>
                  <input
                    type="text"
                    value={editPrimaryDns}
                    onChange={(e) => setEditPrimaryDns(e.target.value)}
                    placeholder="1.1.1.1"
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[#888] mb-1 font-sans">Secondary DNS Server</label>
                  <input
                    type="text"
                    value={editSecondaryDns}
                    onChange={(e) => setEditSecondaryDns(e.target.value)}
                    placeholder="8.8.8.8"
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[#888] mb-1 font-sans">MTU (Maximum Transmission Unit)</label>
                  <input
                    type="number"
                    value={editMtu}
                    onChange={(e) => setEditMtu(Number(e.target.value))}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 md:col-span-2">
                  <input
                    type="checkbox"
                    id="dhcpToggle"
                    checked={editIsDhcp}
                    onChange={(e) => setEditIsDhcp(e.target.checked)}
                    className="rounded bg-[#0a0a0a] border-[#333] text-cyan-600 focus:ring-0"
                  />
                  <label htmlFor="dhcpToggle" className="text-xs font-sans text-white cursor-pointer select-none">
                    Enable Dynamic Host Configuration Protocol (DHCP) Lease Allocation
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setIsEditingIface(false)}
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] text-[#ccc] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveIface}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Apply & Restart Interface</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ACTIVE SOCKETS & LISTENING PORTS */}
      {/* ========================================================================= */}
      {activeTab === 'sockets' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111] p-3 rounded-xl border border-[#222]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#888]">Filter State:</span>
              {(['ALL', 'LISTEN', 'ESTABLISHED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setSocketFilterState(st)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    socketFilterState === st
                      ? 'bg-cyan-600 text-white'
                      : 'bg-[#1a1a1a] text-[#888] hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#666]" />
                <input
                  type="text"
                  value={socketSearch}
                  onChange={(e) => setSocketSearch(e.target.value)}
                  placeholder="Filter by port, PID, or process..."
                  className="bg-[#0a0a0a] border border-[#333] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-[#222] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#141414] border-b border-[#222] text-[#888]">
                    <th className="py-3 px-4">Proto</th>
                    <th className="py-3 px-4">Local Address:Port</th>
                    <th className="py-3 px-4">Foreign Address:Port</th>
                    <th className="py-3 px-4">State</th>
                    <th className="py-3 px-4">PID</th>
                    <th className="py-3 px-4">Process Name</th>
                    <th className="py-3 px-4">Subsystem Service</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1c1c]">
                  {filteredSockets.map((sock) => (
                    <tr key={sock.id} className="hover:bg-[#141414] transition-colors">
                      <td className="py-3 px-4 text-cyan-400 font-bold">{sock.proto}</td>
                      <td className="py-3 px-4 text-white">
                        {sock.localAddress}:{sock.localPort}
                      </td>
                      <td className="py-3 px-4 text-[#888]">
                        {sock.foreignPort ? `${sock.foreignAddress}:${sock.foreignPort}` : `${sock.foreignAddress}:*`}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sock.state === 'LISTEN'
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-700/50'
                            : sock.state === 'ESTABLISHED'
                            ? 'bg-cyan-950/70 text-cyan-400 border border-cyan-700/50'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-700'
                        }`}>
                          {sock.state}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#888]">{sock.pid}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">{sock.processName}</td>
                      <td className="py-3 px-4 font-sans text-xs text-[#aaa]">{sock.service}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onRunCliCommand(`tasklist /PID ${sock.pid}`)}
                          className="px-2 py-1 bg-[#1a1a1a] hover:bg-[#252525] text-[#ccc] hover:text-white rounded border border-[#333] text-[11px] font-sans transition-colors"
                        >
                          PID Trace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DNS RESOLVER & WORKBENCH */}
      {/* ========================================================================= */}
      {activeTab === 'dns' && (
        <div className="space-y-6">
          {/* Query Bar */}
          <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">DNS Resolver & Record Explorer</h3>
                  <p className="text-xs text-[#777]">Simulate BIND9/Unbound recursive queries, DNSSEC validation, and latency benchmarking</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#888]">Upstream:</span>
                <select
                  value={dnsServer}
                  onChange={(e) => setDnsServer(e.target.value)}
                  className="bg-[#0a0a0a] border border-[#333] rounded-lg px-2.5 py-1 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value="1.1.1.1 (Cloudflare)">1.1.1.1 (Cloudflare Anycast)</option>
                  <option value="8.8.8.8 (Google Public DNS)">8.8.8.8 (Google Public DNS)</option>
                  <option value="9.9.9.9 (Quad9 Secured)">9.9.9.9 (Quad9 Secured)</option>
                  <option value="127.0.0.1 (Local Stub Resolver)">127.0.0.1 (Local Stub Resolver)</option>
                </select>
              </div>
            </div>

            {/* Input & Quick Presets */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={dnsQueryDomain}
                  onChange={(e) => setDnsQueryDomain(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRunDnsResolve(); }}
                  placeholder="Enter hostname or FQDN (e.g. google.com, cloudflare.com, github.com)..."
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-3 pr-24 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleRunDnsResolve()}
                  disabled={dnsLoading}
                  className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  {dnsLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  <span>Resolve</span>
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-[#666]">Presets:</span>
                {['google.com', 'cloudflare.com', 'github.com', 'kernel.org'].map(d => (
                  <button
                    key={d}
                    onClick={() => {
                      setDnsQueryDomain(d);
                      handleRunDnsResolve(d);
                    }}
                    className="px-2 py-1 bg-[#141414] hover:bg-[#202020] text-[#aaa] hover:text-white rounded border border-[#2c2c2c] text-[11px] font-mono transition-colors"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Section */}
            {dnsResult && (
              <div className="space-y-4 pt-2">
                {/* Meta telemetry bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#070707] p-3 rounded-lg border border-[#1c1c1c] text-xs font-mono">
                  <div>
                    <span className="text-[#777] block text-[10px]">RESPONSE CODE</span>
                    <span className="text-emerald-400 font-bold">{dnsResult.status}</span>
                  </div>
                  <div>
                    <span className="text-[#777] block text-[10px]">QUERY RTT</span>
                    <span className="text-cyan-400 font-bold">{dnsResult.queryTimeMs} ms</span>
                  </div>
                  <div>
                    <span className="text-[#777] block text-[10px]">RESOLVER USED</span>
                    <span className="text-white truncate block">{dnsResult.serverUsed}</span>
                  </div>
                  <div>
                    <span className="text-[#777] block text-[10px]">DNSSEC STATUS</span>
                    <span className="text-indigo-400 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Validated
                    </span>
                  </div>
                </div>

                {/* Records Table */}
                <div className="border border-[#222] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-[#141414] border-b border-[#222] text-[#888]">
                        <th className="py-2.5 px-4">Record Type</th>
                        <th className="py-2.5 px-4">Name</th>
                        <th className="py-2.5 px-4">Value / Target</th>
                        <th className="py-2.5 px-4">TTL (Sec)</th>
                        <th className="py-2.5 px-4 text-center">Copy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1c1c1c]">
                      {dnsResult.records.map((rec, idx) => (
                        <tr key={idx} className="hover:bg-[#141414] transition-colors">
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.type === 'A' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                              rec.type === 'AAAA' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                              rec.type === 'MX' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                              rec.type === 'TXT' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                              'bg-zinc-900 text-zinc-400 border border-zinc-700'
                            }`}>
                              {rec.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-white font-semibold">{rec.name}</td>
                          <td className="py-2.5 px-4 text-emerald-300 font-mono break-all">
                            {rec.priority ? `[Priority ${rec.priority}] ` : ''}{rec.value}
                          </td>
                          <td className="py-2.5 px-4 text-[#888]">{rec.ttl}s</td>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={() => handleCopyValue(rec.value)}
                              className="p-1 text-[#666] hover:text-white rounded transition-colors"
                              title="Copy record value"
                            >
                              {copiedRecord === rec.value ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: LIVE PACKET SNIFFER (tcpdump / Wireshark) */}
      {/* ========================================================================= */}
      {activeTab === 'sniffer' && (
        <div className="space-y-4">
          {/* Sniffer toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111] p-3 rounded-xl border border-[#222]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSniffing(!isSniffing)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSniffing 
                    ? 'bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-700/60'
                    : 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60'
                }`}
              >
                {isSniffing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSniffing ? 'Pause Sniffer' : 'Resume Capture'}</span>
              </button>

              <button
                onClick={handleClearPackets}
                className="px-2.5 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] text-[#ccc] rounded-lg text-xs font-medium border border-[#333] transition-colors"
              >
                Clear Buffer
              </button>

              <div className="h-4 w-px bg-[#333] mx-1" />

              {/* Protocol Filters */}
              <div className="flex items-center gap-1">
                {['ALL', 'TCP', 'TLS', 'DNS', 'ICMP', 'ARP'].map(proto => (
                  <button
                    key={proto}
                    onClick={() => setPacketFilterProto(proto)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                      packetFilterProto === proto
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-[#181818] text-[#888] hover:text-white'
                    }`}
                  >
                    {proto}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Packet Injections */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#666]">Inject:</span>
              {(['DNS', 'TLS', 'TCP', 'ICMP'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => handleInjectPacket(p)}
                  className="px-2 py-1 bg-[#161616] hover:bg-[#222] text-[#aaa] hover:text-cyan-400 rounded border border-[#2a2a2a] text-[11px] font-mono transition-colors"
                >
                  +{p}
                </button>
              ))}
            </div>
          </div>

          {/* Master-Detail Split Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Packet Table Stream */}
            <div className="lg:col-span-7 bg-[#0f0f0f] border border-[#222] rounded-xl overflow-hidden shadow-xl flex flex-col h-[480px]">
              <div className="p-2.5 bg-[#141414] border-b border-[#222] flex items-center justify-between text-xs text-[#888]">
                <span className="font-semibold text-white">Ring 0 Packet Stream ({filteredPackets.length} frames)</span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live NIC Promiscuous Mode
                </span>
              </div>

              <div className="flex-1 overflow-y-auto font-mono text-[11px]">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-[#161616] border-b border-[#222] text-[#777]">
                    <tr>
                      <th className="py-2 px-3">No.</th>
                      <th className="py-2 px-3">Time</th>
                      <th className="py-2 px-3">Source → Dest</th>
                      <th className="py-2 px-3">Protocol</th>
                      <th className="py-2 px-3">Len</th>
                      <th className="py-2 px-3">Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181818]">
                    {filteredPackets.map(pkt => (
                      <tr
                        key={pkt.id}
                        onClick={() => setSelectedPacket(pkt)}
                        className={`cursor-pointer transition-colors ${
                          selectedPacket?.id === pkt.id
                            ? 'bg-amber-950/40 text-amber-200 border-l-2 border-amber-400'
                            : 'hover:bg-[#141414] text-[#ccc]'
                        }`}
                      >
                        <td className="py-2 px-3 text-[#666]">{pkt.id}</td>
                        <td className="py-2 px-3 text-[#888] whitespace-nowrap">{pkt.timestamp}</td>
                        <td className="py-2 px-3 text-white whitespace-nowrap">
                          {pkt.src} → {pkt.dst}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            pkt.protocol === 'TCP' ? 'bg-cyan-950 text-cyan-400' :
                            pkt.protocol === 'TLS' ? 'bg-indigo-950 text-indigo-400' :
                            pkt.protocol === 'DNS' ? 'bg-emerald-950 text-emerald-400' :
                            pkt.protocol === 'ICMP' ? 'bg-rose-950 text-rose-400' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {pkt.protocol}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[#777]">{pkt.lengthBytes}</td>
                        <td className="py-2 px-3 text-[#aaa] truncate max-w-xs">{pkt.info}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deep Packet Dissector / Hex View */}
            <div className="lg:col-span-5 bg-[#0f0f0f] border border-[#222] rounded-xl p-4 shadow-xl flex flex-col h-[480px] space-y-4">
              <div className="flex items-center justify-between border-b border-[#222] pb-2.5">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-xs text-white">Frame Dissection & Hex Payload</h4>
                </div>
                {selectedPacket && (
                  <span className="text-[11px] font-mono text-cyan-400">Frame #{selectedPacket.id}</span>
                )}
              </div>

              {selectedPacket ? (
                <div className="flex-1 overflow-y-auto space-y-4 text-xs font-mono">
                  {/* Protocol breakdown tree */}
                  <div className="bg-[#080808] border border-[#1c1c1c] rounded-lg p-3 space-y-2 text-[11px]">
                    <div className="text-[#777] font-semibold flex items-center gap-1.5">
                      <span className="text-cyan-400">▶</span> Frame {selectedPacket.id}: {selectedPacket.lengthBytes} bytes on wire
                    </div>
                    <div className="text-[#888] pl-3">
                      Ethernet II, Src: 52:54:00:12:34:56, Dst: Gateway
                    </div>
                    <div className="text-[#aaa] pl-3">
                      Internet Protocol Version 4, Src: {selectedPacket.src}, Dst: {selectedPacket.dst}
                    </div>
                    <div className="text-amber-300 pl-3">
                      Transmission Control / {selectedPacket.protocol}, Info: {selectedPacket.info}
                    </div>
                  </div>

                  {/* Hex & ASCII Dump View */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-[#777] uppercase font-bold tracking-wider">Hexadecimal Payload Dissection</span>
                    <div className="bg-[#050505] border border-[#1c1c1c] rounded-lg p-3 text-[11px] font-mono text-emerald-400 leading-relaxed overflow-x-auto space-y-1">
                      <div className="text-[#555] border-b border-[#1c1c1c] pb-1 flex justify-between">
                        <span>Offset: 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F</span>
                        <span>Decoded Text</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-emerald-400">{selectedPacket.hexDump}</span>
                        <span className="text-cyan-300 shrink-0 font-bold">{selectedPacket.asciiDump}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[#555] text-xs flex items-center justify-center flex-1 italic">
                  Select a captured packet on the left to dissect headers and payload bytes.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: GLOBAL GEOIP THREAT & TRAFFIC MAP */}
      {/* ========================================================================= */}
      {activeTab === 'geoip' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111] p-3 rounded-xl border border-[#222]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#888]">Traffic Flow:</span>
              {(['ALL', 'INBOUND', 'OUTBOUND'] as const).map(dir => (
                <button
                  key={dir}
                  onClick={() => setGeoDirectionFilter(dir)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    geoDirectionFilter === dir
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#1a1a1a] text-[#888] hover:text-white'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#888]">
              <span>Active Endpoints:</span>
              <span className="text-white font-bold">{filteredGeoNodes.length} Global Nodes</span>
            </div>
          </div>

          {/* World Coordinates Vector Stage */}
          <div className="bg-[#0b0c10] border border-[#222] rounded-xl p-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#222] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Global Autonomous System (ASN) Coordinate Matrix</h3>
              </div>
              <span className="text-xs font-mono text-indigo-400">Mercator Projection EPSG:3857</span>
            </div>

            {/* SVG Visual World Projection */}
            <div className="relative w-full h-[280px] bg-[#07080c] rounded-lg border border-[#191d26] overflow-hidden flex items-center justify-center">
              {/* Grid overlay */}
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-20">
                {Array.from({ length: 72 }).map((_, i) => (
                  <div key={i} className="border-r border-b border-indigo-500/20" />
                ))}
              </div>

              {/* Central Local Gateway Hub */}
              <div 
                className="absolute w-4 h-4 bg-cyan-400 rounded-full flex items-center justify-center ring-4 ring-cyan-500/30 z-20 shadow-lg shadow-cyan-500/50"
                style={{ left: '26%', top: '38%' }}
                title="Local Node (192.168.1.140)"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>

              {/* Render Nodes onto Map Coordinates */}
              {filteredGeoNodes.map(node => {
                // Approximate Mercator projection formula into percentage
                const leftPercent = Math.min(95, Math.max(5, ((node.lng + 180) / 360) * 100));
                const topPercent = Math.min(90, Math.max(10, ((90 - node.lat) / 180) * 100));

                const isBlocked = node.threatLevel === 'BLOCKED';

                return (
                  <div
                    key={node.ip}
                    onClick={() => setSelectedGeoNode(node)}
                    className="absolute cursor-pointer group z-20 transition-transform hover:scale-125"
                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  >
                    {/* Pulsing ring */}
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      isBlocked
                        ? 'bg-rose-600 ring-4 ring-rose-500/40 animate-ping'
                        : 'bg-indigo-500 ring-4 ring-indigo-500/30'
                    }`}>
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>

                    {/* Tooltip Tag */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#161616] text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-xl whitespace-nowrap border border-[#333] pointer-events-none">
                      {node.city} ({node.ip})
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Node Details Card */}
            {selectedGeoNode && (
              <div className="mt-4 bg-[#12141a] border border-indigo-500/40 rounded-lg p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="space-y-1 font-mono">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{selectedGeoNode.city}, {selectedGeoNode.country}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedGeoNode.threatLevel === 'BLOCKED' 
                        ? 'bg-rose-950 text-rose-400 border border-rose-800' 
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {selectedGeoNode.threatLevel === 'BLOCKED' ? 'THREAT BLOCKED' : 'CLEAN TRAFFIC'}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-300">{selectedGeoNode.org} — IP: {selectedGeoNode.ip}</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[#777] block text-[10px]">CONNECTIONS</span>
                    <span className="text-white font-bold">{selectedGeoNode.activeConnections} active</span>
                  </div>
                  <div>
                    <span className="text-[#777] block text-[10px]">THROUGHPUT</span>
                    <span className="text-cyan-400 font-bold">{selectedGeoNode.bandwidthKbps} Kbps</span>
                  </div>
                  <button
                    onClick={() => onRunCliCommand(`whois ${selectedGeoNode.ip}`)}
                    className="px-3 py-1.5 bg-[#1e2230] hover:bg-[#282e42] text-indigo-300 rounded border border-indigo-700/50 text-xs font-semibold"
                  >
                    Run WHOIS
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: NETWORK DIAGNOSTICS (Ping & Traceroute Tools) */}
      {/* ========================================================================= */}
      {activeTab === 'diagnostics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ping Diagnostic Panel */}
          <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">ICMP Echo Ping Tool</h3>
                  <p className="text-xs text-[#777]">Measure packet round-trip time and jitter</p>
                </div>
              </div>

              <span className="text-xs font-mono text-emerald-400">Ring 0 lwIP</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={diagHost}
                onChange={(e) => setDiagHost(e.target.value)}
                placeholder="Target Host or IP (e.g. 1.1.1.1 or google.com)"
                className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleRunPing}
                disabled={pingRunning}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40"
              >
                {pingRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>Send Ping</span>
              </button>
            </div>

            {/* Output Box */}
            <div className="bg-[#070707] border border-[#1c1c1c] rounded-lg p-3 font-mono text-xs text-[#ccc] min-h-[160px] overflow-y-auto space-y-1">
              {pingOutput ? (
                pingOutput.map((line, idx) => (
                  <div key={idx} className={line.includes('loss') ? 'text-emerald-400 font-bold' : ''}>
                    {line}
                  </div>
                ))
              ) : (
                <div className="text-[#555] italic flex items-center justify-center h-full pt-12">
                  Enter target host and click "Send Ping" to trigger ICMP diagnostics.
                </div>
              )}
            </div>
          </div>

          {/* Traceroute Diagnostic Panel */}
          <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Route Hops Traceroute</h3>
                  <p className="text-xs text-[#777]">Inspect intermediate router nodes and latency</p>
                </div>
              </div>

              <span className="text-xs font-mono text-indigo-400">TTL 30 Max</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={diagHost}
                onChange={(e) => setDiagHost(e.target.value)}
                placeholder="Target Host or IP (e.g. 1.1.1.1)"
                className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleRunTraceroute}
                disabled={traceRunning}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950/40"
              >
                {traceRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                <span>Trace Route</span>
              </button>
            </div>

            {/* Output Box */}
            <div className="bg-[#070707] border border-[#1c1c1c] rounded-lg p-3 font-mono text-xs text-[#ccc] min-h-[160px] overflow-y-auto space-y-1">
              {traceOutput ? (
                traceOutput.map((line, idx) => (
                  <div key={idx} className={line.includes('traceroute') ? 'text-indigo-400 font-bold' : ''}>
                    {line}
                  </div>
                ))
              ) : (
                <div className="text-[#555] italic flex items-center justify-center h-full pt-12">
                  Click "Trace Route" to investigate packet gateway hops across the internet backbone.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
