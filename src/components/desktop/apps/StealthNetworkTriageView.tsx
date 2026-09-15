// jb7572_2026-08-26: SecureCurtain Core Architecture - Diamond-Grade Air-Gapped Stealth Network Triage & Rogue Hunter (Zeek / Bettercap)
import React, { useState } from 'react';
import {
  Radio,
  Wifi,
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Copy,
  Zap,
  Globe,
  Lock,
  Search,
  EyeOff
} from 'lucide-react';

interface NetworkAnomaly {
  id: string;
  threatType: 'ARP Spoofing' | 'Rogue DHCP Server' | 'C2 Periodic Beacon' | 'DNS Tunneling';
  attackerIpMac: string;
  target: string;
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  detail: string;
}

const SAMPLE_NETWORK_ANOMALIES: NetworkAnomaly[] = [
  {
    id: 'net_1',
    threatType: 'ARP Spoofing',
    attackerIpMac: '192.168.1.185 (00:1A:2B:6F:89:C4)',
    target: 'Default Gateway 192.168.1.1 (e0:d5:5e:10:20:30)',
    severity: 'CRITICAL',
    detail: 'Gratuitous ARP replies remapping Gateway MAC address to attacker host (Man-in-the-Middle).'
  },
  {
    id: 'net_2',
    threatType: 'C2 Periodic Beacon',
    attackerIpMac: '192.168.1.42 -> 198.51.100.89:443',
    target: 'Outbound TCP Stream',
    severity: 'HIGH',
    detail: 'Jittered heartbeat beacon observed every 60.02s with 128-byte encrypted payload.'
  },
  {
    id: 'net_3',
    threatType: 'Rogue DHCP Server',
    attackerIpMac: '192.168.1.200 (f4:6b:8f:12:34:56)',
    target: 'Broadcast 255.255.255.255:67/68',
    severity: 'HIGH',
    detail: 'Rogue DHCPOFFER assigning malicious DNS server (192.168.1.200) to new clients.'
  }
];

interface StealthNetworkTriageViewProps {
  addNotification?: (notification: any) => void;
}

export const StealthNetworkTriageView: React.FC<StealthNetworkTriageViewProps> = ({ addNotification }) => {
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [stealthModeActive, setStealthModeActive] = useState<boolean>(true);
  const [anomalies, setAnomalies] = useState<NetworkAnomaly[]>(SAMPLE_NETWORK_ANOMALIES);
  const [packetCount, setPacketCount] = useState<number>(14890);

  const [triageLogs, setTriageLogs] = useState<string[]>([
    '[*] Air-Gapped Stealth Network Subsystem Initialized',
    '[*] Promiscuous TAP Interface: eth0 (Zero-Emission Mode: ARP & DHCP Transmission DISABLED)',
    '[+] Passive Zeek / Suricata Protocol Analyzer loaded with 2026 IDS rulesets.',
    '[!] Real-time rogue gateway and C2 beacon detector standing by.'
  ]);

  const handleToggleCapture = () => {
    if (!isCapturing) {
      setIsCapturing(true);
      setTriageLogs(prev => [
        ...prev,
        '[*] Starting zero-emission passive PCAP stream on eth0...',
        '[zeek] Analyzing DNS, HTTP/2, TLS SNI, and ARP frames in real-time...'
      ]);
      if (addNotification) {
        addNotification({
          title: 'Stealth Capture Started',
          message: 'Zero-emission passive network TAP active. Zero packets broadcasted.',
          type: 'info'
        });
      }
    } else {
      setIsCapturing(false);
      setTriageLogs(prev => [
        ...prev,
        '[✓] Passive capture paused. Captured 14,890 frames with 0 transmission leakage.'
      ]);
    }
  };

  const getCliCommand = () => {
    return `# 1. Force Network Interface into Zero-Emission Silent Listening (No ARP/DHCP)
ip link set eth0 promisc on
sysctl -w net.ipv4.conf.eth0.arp_ignore=8
sysctl -w net.ipv6.conf.eth0.disable_ipv6=1

# 2. Run Zeek Passive IDS and Sniff for ARP Spoofs & Rogue DHCP
zeek -i eth0 frameworks/files/extract-all-files.zeek policy/protocols/dhcp/detect-rogue.zeek`;
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-950/80 border border-violet-500/40 text-violet-400 shadow-md shadow-violet-950/50">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white">Air-Gapped Stealth Network Triage & Rogue Hunter</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/30">
                ZERO-EMISSION PASSIVE TAP / ZEEK IDS
              </span>
            </div>
            <p className="text-xs text-[#8fa0b5] mt-0.5">
              Sniffs traffic silently without broadcasting packets; flags ARP poisoning, rogue DHCP servers, and periodic C2 beacons.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141b2c] border border-[#232f4b]">
            <EyeOff className="w-4 h-4 text-emerald-400" />
            <span className="text-[#8fa0b5]">Stealth Mode:</span>
            <span className="font-bold text-emerald-300">PASSIVE ONLY</span>
          </div>

          <button
            onClick={handleToggleCapture}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold flex items-center gap-2 transition-all ${
              isCapturing
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 animate-pulse'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'
            }`}
          >
            {isCapturing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Capturing Silently...</span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                <span>Start Stealth Sniffer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Network Threat Matrix */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold font-mono text-white uppercase">Detected Network Attacks & Rogue Devices</span>
          </div>
          <span className="text-[10px] font-mono text-red-400">3 Anomalies Flagged</span>
        </div>

        <div className="space-y-2.5">
          {anomalies.map(item => (
            <div
              key={item.id}
              className={`p-3.5 rounded-lg border text-xs font-mono space-y-1.5 ${
                item.severity === 'CRITICAL'
                  ? 'bg-red-950/30 border-red-500/60 shadow-md shadow-red-950/30'
                  : 'bg-amber-950/30 border-amber-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm">{item.threatType}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#172033] text-sky-300">
                    Source: {item.attackerIpMac}
                  </span>
                </div>

                <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${
                  item.severity === 'CRITICAL'
                    ? 'bg-red-950 text-red-300 border-red-500/30'
                    : 'bg-amber-950 text-amber-300 border-amber-500/30'
                }`}>
                  {item.severity}
                </span>
              </div>

              <div className="text-[11px] text-[#8fa0b5] select-all">
                {item.detail}
              </div>

              <div className="text-[10px] text-amber-300">
                Target Stream: <code className="text-emerald-300">{item.target}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CLI & Passive Rules */}
      <div className="bg-[#080a11] rounded-xl border border-[#1b2234] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#161d2d] pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold font-mono text-white">Passive Stealth TAP & Zeek IDS Commands</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(getCliCommand());
              if (addNotification) {
                addNotification({
                  title: 'Command Copied',
                  message: 'Stealth TAP script copied to clipboard',
                  type: 'info'
                });
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#131a2b] hover:bg-[#1b253e] text-[11px] font-mono text-[#8fa0b5] hover:text-white transition-all"
          >
            <Copy className="w-3 h-3" />
            <span>Copy Script</span>
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs text-violet-300 select-all overflow-x-auto">
          <pre className="text-[11px]">{getCliCommand()}</pre>
        </div>

        <div className="p-3 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs space-y-1 max-h-36 overflow-y-auto">
          {triageLogs.map((log, idx) => (
            <div
              key={idx}
              className={`${
                log.includes('[✓]')
                  ? 'text-emerald-400 font-bold'
                  : log.includes('[!]')
                  ? 'text-amber-300 font-bold'
                  : log.includes('[zeek]')
                  ? 'text-violet-300'
                  : log.includes('[+]')
                  ? 'text-sky-300'
                  : 'text-[#708098]'
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
