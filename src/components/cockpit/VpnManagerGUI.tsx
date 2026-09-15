// jb7572_2026-08-28: Built-in Quantum-Resistant VPN Management Suite GUI
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Server, 
  Globe, 
  Radio, 
  Activity, 
  Zap, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Terminal, 
  Check, 
  AlertTriangle, 
  Cpu, 
  Key, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sliders, 
  Power,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';
import { networkSecurityService } from '../../services/networkSecurityService';
import { VpnConfig, VpnServerProfile, VpnProtocol } from '../../types';

interface VpnManagerGUIProps {
  onRunCliCommand?: (cmd: string) => void;
  onRefreshParent?: () => void;
}

export const VpnManagerGUI: React.FC<VpnManagerGUIProps> = ({
  onRunCliCommand = (_cmd: string) => {},
  onRefreshParent = () => {}
}) => {
  const [config, setConfig] = useState<VpnConfig>(() => networkSecurityService.getVpnConfig());
  const [servers, setServers] = useState<VpnServerProfile[]>(() => networkSecurityService.getVpnServerProfiles());
  const [isConnecting, setIsConnecting] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // Custom Server Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [customProtocol, setCustomProtocol] = useState<VpnProtocol>('WIREGUARD');
  const [customLocation, setCustomLocation] = useState('Private Datacenter');
  const [customCountry, setCustomCountry] = useState('LOC');
  const [customCipher, setCustomCipher] = useState('ChaCha20-Poly1305 + Kyber-1024');
  const [customQuantum, setCustomQuantum] = useState(true);

  const showBanner = (msg: string) => {
    setBannerMsg(msg);
    setTimeout(() => setBannerMsg(null), 3800);
  };

  const reloadData = () => {
    setConfig(networkSecurityService.getVpnConfig());
    setServers(networkSecurityService.getVpnServerProfiles());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleToggleConnect = (targetServerId?: string) => {
    setIsConnecting(true);
    const idToUse = targetServerId || config.activeProfileId || servers[0]?.id;

    if (config.status === 'CONNECTED' && (!targetServerId || targetServerId === config.activeProfileId)) {
      // Disconnect
      setTimeout(() => {
        const res = networkSecurityService.disconnectVpn();
        setIsConnecting(false);
        reloadData();
        onRefreshParent();
        showBanner(res.message);
        onRunCliCommand('vpnctl disconnect');
      }, 400);
    } else {
      // Connect / Switch Server
      setTimeout(() => {
        const res = networkSecurityService.connectVpn(idToUse);
        setIsConnecting(false);
        reloadData();
        onRefreshParent();
        showBanner(res.message);
        onRunCliCommand(`vpnctl connect --server=${idToUse} --quantum-kyber`);
      }, 600);
    }
  };

  const handleToggleKillSwitch = () => {
    const newVal = networkSecurityService.toggleVpnKillSwitch();
    reloadData();
    showBanner(`Emergency Kill Switch is now ${newVal ? 'ENABLED (Non-VPN traffic dropped)' : 'DISABLED'}.`);
    onRunCliCommand(`vpnctl set-killswitch ${newVal ? 'enable' : 'disable'}`);
  };

  const handleToggleDnsLeak = () => {
    const newVal = networkSecurityService.toggleVpnDnsLeakProtection();
    reloadData();
    showBanner(`DNS Leak Protection is now ${newVal ? 'ACTIVE (Forcing 10.64.0.1 resolver)' : 'DISABLED'}.`);
    onRunCliCommand(`vpnctl set-dns-leak-protect ${newVal ? 'enable' : 'disable'}`);
  };

  const handleToggleSplitTunnel = () => {
    const newVal = networkSecurityService.toggleVpnSplitTunneling();
    reloadData();
    showBanner(`Split Tunneling is now ${newVal ? 'ENABLED' : 'DISABLED'}.`);
    onRunCliCommand(`vpnctl set-split-tunnel ${newVal ? 'enable' : 'disable'}`);
  };

  const handleToggleAutoUntrusted = () => {
    const newVal = networkSecurityService.toggleAutoConnectOnUntrustedWifi();
    reloadData();
    showBanner(`Auto-Shield on Untrusted Networks is now ${newVal ? 'ARMED' : 'DISARMED'}.`);
    onRunCliCommand(`vpnctl set-auto-untrusted ${newVal ? 'enable' : 'disable'}`);
  };

  const handleAddCustomServer = () => {
    if (!customName.trim() || !customEndpoint.trim()) {
      showBanner('Please provide a server name and endpoint URI.');
      return;
    }
    const res = networkSecurityService.addCustomVpnServer({
      name: customName.trim(),
      endpoint: customEndpoint.trim(),
      protocol: customProtocol,
      location: customLocation.trim(),
      countryCode: customCountry.trim(),
      cipher: customCipher.trim(),
      quantumResistant: customQuantum,
      pingMs: Math.floor(Math.random() * 30) + 15
    });

    if (res.success) {
      showBanner(res.message);
      setIsAddModalOpen(false);
      setCustomName('');
      setCustomEndpoint('');
      reloadData();
      onRunCliCommand(`vpnctl profile import --name="${customName}"`);
    } else {
      showBanner(res.message);
    }
  };

  const handleDeleteCustomServer = (id: string, name: string) => {
    const res = networkSecurityService.deleteCustomVpnServer(id);
    if (res.success) {
      showBanner(res.message);
      reloadData();
      onRefreshParent();
      onRunCliCommand(`vpnctl profile delete --id=${id}`);
    }
  };

  const activeServer = servers.find(s => s.id === config.activeProfileId) || servers[0];
  const isConnected = config.status === 'CONNECTED';

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {bannerMsg && (
        <div className="bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs backdrop-blur animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{bannerMsg}</span>
          </div>
          <button 
            onClick={() => setBannerMsg(null)}
            className="text-cyan-400 hover:text-white font-mono text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HERO SECTION: LIVE VPN TUNNEL STATUS & 1-CLICK TOGGLE */}
      {/* ========================================================================= */}
      <div className={`border rounded-2xl p-5 md:p-6 transition-all duration-300 relative overflow-hidden ${
        isConnected 
          ? 'bg-gradient-to-br from-[#0c1f18] via-[#091510] to-[#070d0b] border-emerald-500/30 shadow-2xl shadow-emerald-950/20' 
          : 'bg-[#0e0e0e] border-[#222]'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Status Indicator & Server Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl border ${
                isConnected 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse' 
                  : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
              }`}>
                {isConnected ? <ShieldCheck className="w-7 h-7" /> : <Shield className="w-7 h-7" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white tracking-wide">
                    {isConnected ? 'Quantum-Encrypted Tunnel Active' : 'VPN Tunnel Disconnected'}
                  </h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    isConnected 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {isConnected ? 'PROTECTED' : 'UNSHIELDED'}
                  </span>
                  {isConnected && config.activeTunnel?.cipher.includes('Kyber') && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      Kyber-1024 PQ
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  {isConnected 
                    ? `Connected to ${config.activeTunnel?.serverName} (${config.activeTunnel?.endpoint}) via ${config.activeTunnel?.virtualInterface}`
                    : `Ready to establish zero-log tunnel through ${activeServer?.name || 'SecureCurtain Gateway'}`
                  }
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar (if connected) */}
            {isConnected && config.activeTunnel && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-2.5">
                  <div className="text-[10px] text-zinc-400 font-mono uppercase">Assigned IP</div>
                  <div className="text-xs font-mono text-emerald-300 font-semibold">{config.activeTunnel.assignedIp}</div>
                </div>
                <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-2.5">
                  <div className="text-[10px] text-zinc-400 font-mono uppercase">Latency / Protocol</div>
                  <div className="text-xs font-mono text-white flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span>{config.activeTunnel.latencyMs} ms ({config.activeTunnel.protocol})</span>
                  </div>
                </div>
                <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-2.5">
                  <div className="text-[10px] text-zinc-400 font-mono uppercase">Traffic In / Out</div>
                  <div className="text-xs font-mono text-cyan-300 flex items-center gap-1">
                    <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                    <span>{(config.activeTunnel.bytesReceived / 1024 / 1024).toFixed(2)} MB</span>
                    <span className="text-zinc-500">|</span>
                    <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                    <span>{(config.activeTunnel.bytesSent / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
                <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-2.5">
                  <div className="text-[10px] text-zinc-400 font-mono uppercase">Cipher Suite</div>
                  <div className="text-[11px] font-mono text-zinc-200 truncate" title={config.activeTunnel.cipher}>
                    {config.activeTunnel.cipher}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => handleToggleConnect()}
              disabled={isConnecting}
              className={`px-5 py-3 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-lg ${
                isConnected
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 hover:border-rose-500/60'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-emerald-500/20'
              }`}
            >
              <Power className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
              <span>
                {isConnecting 
                  ? 'Negotiating Crypto Keys...' 
                  : isConnected 
                    ? 'Disconnect VPN Tunnel' 
                    : 'Connect Secure VPN Tunnel'
                }
              </span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-500 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Import Config</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECURITY CONTROLS & AUTO-SHIELD POLICIES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kill Switch */}
        <div className="bg-[#121212] border border-[#222] rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Emergency Kill Switch
              </span>
              <button 
                onClick={handleToggleKillSwitch}
                className="text-white hover:text-cyan-400 transition-colors"
              >
                {config.killSwitch ? (
                  <ToggleRight className="w-6 h-6 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-zinc-600" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Instantly drops all internet traffic if the VPN tunnel drops unexpectedly to prevent real IP exposure.
            </p>
          </div>
          <div className="text-[10px] font-mono text-zinc-500">
            Status: <span className={config.killSwitch ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>{config.killSwitch ? 'ACTIVE' : 'OFF'}</span>
          </div>
        </div>

        {/* DNS Leak Protection */}
        <div className="bg-[#121212] border border-[#222] rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                DNS Leak Protection
              </span>
              <button 
                onClick={handleToggleDnsLeak}
                className="text-white hover:text-cyan-400 transition-colors"
              >
                {config.dnsLeakProtection ? (
                  <ToggleRight className="w-6 h-6 text-cyan-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-zinc-600" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Forces all DNS name queries through the private 10.64.0.1 encrypted loopback gateway.
            </p>
          </div>
          <div className="text-[10px] font-mono text-zinc-500">
            Resolver: <span className="text-cyan-400 font-bold">10.64.0.1 (DoT/DoH)</span>
          </div>
        </div>

        {/* Untrusted Wi-Fi Auto-Shield */}
        <div className="bg-[#121212] border border-[#222] rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                Untrusted Wi-Fi Shield
              </span>
              <button 
                onClick={handleToggleAutoUntrusted}
                className="text-white hover:text-cyan-400 transition-colors"
              >
                {config.autoConnectOnUntrustedWifi ? (
                  <ToggleRight className="w-6 h-6 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-zinc-600" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Automatically arms and connects the VPN tunnel whenever associating with open or public Wi-Fi.
            </p>
          </div>
          <div className="text-[10px] font-mono text-zinc-500">
            Policy: <span className={config.autoConnectOnUntrustedWifi ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>{config.autoConnectOnUntrustedWifi ? 'AUTO-CONNECT ON' : 'PROMPT ONLY'}</span>
          </div>
        </div>

        {/* Split Tunneling */}
        <div className="bg-[#121212] border border-[#222] rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                Split Tunneling
              </span>
              <button 
                onClick={handleToggleSplitTunnel}
                className="text-white hover:text-cyan-400 transition-colors"
              >
                {config.splitTunneling ? (
                  <ToggleRight className="w-6 h-6 text-purple-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-zinc-600" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Excludes trusted local subnet ranges (192.168.0.0/16, 10.0.0.0/8) from routing through the VPN tunnel.
            </p>
          </div>
          <div className="text-[10px] font-mono text-zinc-500">
            Excluded: <span className="text-purple-300">LAN Broadcasts</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ENDPOINT SERVER DIRECTORY */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              High-Speed Quantum & Privacy Gateway Network ({servers.length} Nodes)
            </h4>
          </div>
          <button
            onClick={() => {
              reloadData();
              showBanner('Refreshed VPN cluster server latency metrics.');
            }}
            className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Ping All Nodes</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {servers.map((server) => {
            const isThisActive = isConnected && config.activeProfileId === server.id;
            const isSelected = config.activeProfileId === server.id;

            return (
              <div 
                key={server.id}
                className={`border rounded-xl p-4 transition-all flex flex-col justify-between space-y-3 ${
                  isThisActive
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                    : isSelected
                      ? 'bg-cyan-950/10 border-cyan-500/30'
                      : 'bg-[#111] border-[#222] hover:border-[#333]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          {server.countryCode}
                        </span>
                        <h5 className="text-sm font-medium text-white">{server.name}</h5>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">{server.location}</p>
                    </div>

                    {isThisActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Technical Meta */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-mono text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>{server.protocol}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-emerald-400" />
                      <span>{server.pingMs} ms (Load: {server.loadPercent}%)</span>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] font-mono text-zinc-500 truncate" title={server.endpoint}>
                    URI: {server.endpoint}
                  </div>
                  
                  {server.quantumResistant && (
                    <div className="mt-1 text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                      <Key className="w-2.5 h-2.5" />
                      <span>Post-Quantum Key Exchange (NIST Kyber)</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#222]">
                  {isThisActive ? (
                    <button
                      onClick={() => handleToggleConnect()}
                      className="w-full py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-mono font-medium border border-rose-500/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleConnect(server.id)}
                      className="w-full py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono font-medium border border-cyan-500/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Route Traffic Through Here</span>
                    </button>
                  )}

                  {server.isCustom && (
                    <button
                      onClick={() => handleDeleteCustomServer(server.id, server.name)}
                      className="p-2 rounded-lg bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-zinc-800 transition-all"
                      title="Remove Custom Endpoint"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CUSTOM VPN PROFILE IMPORT MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-[#222] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Import Custom VPN Configuration</h3>
                  <p className="text-[11px] text-zinc-400">Add custom WireGuard, OpenVPN, or IPsec tunnel endpoint</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-500 hover:text-white font-mono text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 mb-1 font-sans">Profile Friendly Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. My Private WireGuard Cloud"
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-sans">VPN Protocol</label>
                  <select
                    value={customProtocol}
                    onChange={(e) => setCustomProtocol(e.target.value as VpnProtocol)}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-sans"
                  >
                    <option value="WIREGUARD">WireGuard (Linux Kernel lwIP)</option>
                    <option value="OPENVPN">OpenVPN (TLS 1.3 / AES-256)</option>
                    <option value="IPSEC_IKEV2">IPsec / IKEv2 (StrongSwan)</option>
                    <option value="STEALTH_HYSTERIA2">Stealth Hysteria2 (QUIC-Cloaked)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-sans">Country Code</label>
                  <input
                    type="text"
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value.toUpperCase())}
                    placeholder="e.g. US, DE, JP, IS"
                    maxLength={4}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-sans">Server Endpoint Host:Port</label>
                <input
                  type="text"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  placeholder="e.g. vpn.example.com:51820 or 198.51.100.22:51820"
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-sans">Location / Datacenter Label</label>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="e.g. Private Homelab / AWS US-East"
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="customQuantumCheck"
                  checked={customQuantum}
                  onChange={(e) => setCustomQuantum(e.target.checked)}
                  className="rounded bg-[#0a0a0a] border-[#333] text-cyan-600 focus:ring-0"
                />
                <label htmlFor="customQuantumCheck" className="text-xs font-sans text-white cursor-pointer select-none">
                  Enable Quantum-Resistant Hybrid Key Encapsulation (Kyber-1024)
                </label>
              </div>
            </div>

            <div className="p-5 border-t border-[#222] bg-[#0c0c0c] flex items-center justify-end gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-sans text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomServer}
                className="px-5 py-2 rounded-lg text-xs font-sans font-medium bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Endpoint Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
