// jb7572_2026-08-28: Admin Wi-Fi 7/8 & Multi-Network Roaming Configuration GUI Suite with Hidden SSID Detection & VPN Shield
import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Lock, 
  Unlock, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Server, 
  Globe, 
  RefreshCw, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Check, 
  Radio, 
  Smartphone, 
  Laptop, 
  Sliders, 
  Layers, 
  Terminal, 
  Share2, 
  Eye, 
  EyeOff, 
  HelpCircle,
  Activity,
  Zap,
  Info,
  Power,
  AlertTriangle,
  Key,
  Flame,
  Search,
  Maximize2
} from 'lucide-react';
import { networkSecurityService } from '../../services/networkSecurityService';
import { 
  WifiNetworkProfile, 
  WifiGeneration, 
  WifiSecurityType, 
  WifiFrequencyBand,
  VpnConfig
} from '../../types';

interface WifiNetworkManagerGUIProps {
  onRunCliCommand?: (cmd: string) => void;
  onRefreshParent?: () => void;
  onNavigateToVpn?: () => void;
}

export const WifiNetworkManagerGUI: React.FC<WifiNetworkManagerGUIProps> = ({ 
  onRunCliCommand = (_cmd: string) => {}, 
  onRefreshParent = () => {},
  onNavigateToVpn = () => {}
}) => {
  const [profiles, setProfiles] = useState<WifiNetworkProfile[]>([]);
  const [scannedAps, setScannedAps] = useState<WifiNetworkProfile[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [activeProfile, setActiveProfile] = useState<WifiNetworkProfile | null>(null);
  const [vpnConfig, setVpnConfig] = useState<VpnConfig>(() => networkSecurityService.getVpnConfig());

  // Untrusted Network Warning Modal / Banner Dismiss State
  const [dismissUntrustedWarning, setDismissUntrustedWarning] = useState(false);

  // Profile Editor Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [showPassword, setShowPassword] = useState(false);

  // Hidden SSID Unmask Modal State
  const [unmaskAp, setUnmaskAp] = useState<WifiNetworkProfile | null>(null);
  const [unmaskInputSsid, setUnmaskInputSsid] = useState('');
  const [unmaskPassword, setUnmaskPassword] = useState('');

  // Form fields
  const [formId, setFormId] = useState('');
  const [formSsid, setFormSsid] = useState('');
  const [formBssid, setFormBssid] = useState('');
  const [formSecurity, setFormSecurity] = useState<WifiSecurityType>('WPA4-Quantum');
  const [formPassword, setFormPassword] = useState('');
  const [formIpMode, setFormIpMode] = useState<'DHCP' | 'STATIC'>('DHCP');
  const [formIpAddress, setFormIpAddress] = useState('192.168.1.150');
  const [formSubnetMask, setFormSubnetMask] = useState('255.255.255.0');
  const [formGateway, setFormGateway] = useState('192.168.1.1');
  const [formPrimaryDns, setFormPrimaryDns] = useState('1.1.1.1');
  const [formSecondaryDns, setFormSecondaryDns] = useState('8.8.8.8');
  const [formNetworkType, setFormNetworkType] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [formAutoConnect, setFormAutoConnect] = useState(true);
  const [formFrequency, setFormFrequency] = useState<WifiFrequencyBand>('Sub-THz');
  const [formChannel, setFormChannel] = useState(165);
  const [formGeneration, setFormGeneration] = useState<WifiGeneration>('WiFi 8');
  const [formChannelWidth, setFormChannelWidth] = useState<20 | 40 | 80 | 160 | 320>(320);
  const [formMlo, setFormMlo] = useState(true);
  const [formIsHidden, setFormIsHidden] = useState(false);

  // Quick Connect Modal for Scanned Networks
  const [quickConnectAp, setQuickConnectAp] = useState<WifiNetworkProfile | null>(null);
  const [quickPassphrase, setQuickPassphrase] = useState('');
  const [quickIpMode, setQuickIpMode] = useState<'DHCP' | 'STATIC'>('DHCP');
  const [quickNetworkType, setQuickNetworkType] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');

  // Feedback banner
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  const showBanner = (msg: string) => {
    setBannerMsg(msg);
    setTimeout(() => setBannerMsg(null), 3800);
  };

  const reloadData = () => {
    const list = networkSecurityService.getWifiProfiles();
    setProfiles(list);
    const connected = list.find(p => p.connected) || null;
    setActiveProfile(connected);
    setVpnConfig(networkSecurityService.getVpnConfig());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleScanAirwaves = () => {
    setIsScanning(true);
    showBanner('Scanning 2.4GHz / 5GHz / 6GHz / Sub-THz RF spectrum for visible & hidden APs...');
    onRunCliCommand('iw dev wlan0 scan dump --include-hidden --eht-be --uhr-bn');
    setTimeout(() => {
      const scanned = networkSecurityService.scanWifiNetworks();
      // Filter out those already saved
      const savedIds = new Set(networkSecurityService.getWifiProfiles().map(p => p.ssid));
      const discoveredOnly = scanned.filter(ap => !savedIds.has(ap.ssid));
      setScannedAps(discoveredOnly);
      setIsScanning(false);
      showBanner(`Spectrum scan complete: Discovered ${discoveredOnly.length} nearby APs (including Wi-Fi 7/8 & Hidden Beacons).`);
    }, 1100);
  };

  const handleConnectProfile = (profile: WifiNetworkProfile, password?: string) => {
    const res = networkSecurityService.connectToWifi(profile.id, password || profile.password);
    reloadData();
    onRefreshParent();
    showBanner(res.message);
    if (res.success) {
      onRunCliCommand(`nmcli dev wifi connect "${profile.ssid}" ${password ? `password "${password}"` : ''}`);
      setDismissUntrustedWarning(false); // reset warning state for new connection
    }
  };

  const handleDisconnect = () => {
    const res = networkSecurityService.disconnectWifi();
    reloadData();
    onRefreshParent();
    showBanner(res.message);
    onRunCliCommand('nmcli dev disconnect wlan0');
  };

  const handleDeleteProfile = (id: string, ssid: string) => {
    const res = networkSecurityService.deleteWifiProfile(id);
    reloadData();
    onRefreshParent();
    showBanner(res.message);
    onRunCliCommand(`nmcli connection delete "${ssid}"`);
  };

  const handleToggleAutoConnect = (id: string) => {
    const res = networkSecurityService.toggleProfileAutoConnect(id);
    reloadData();
    showBanner(res.message);
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormId(`wifi_custom_${Date.now()}`);
    setFormSsid('');
    setFormBssid('00:00:00:00:00:00');
    setFormSecurity('WPA4-Quantum');
    setFormPassword('');
    setFormIpMode('DHCP');
    setFormIpAddress('192.168.1.160');
    setFormSubnetMask('255.255.255.0');
    setFormGateway('192.168.1.1');
    setFormPrimaryDns('1.1.1.1');
    setFormSecondaryDns('8.8.8.8');
    setFormNetworkType('PRIVATE');
    setFormAutoConnect(true);
    setFormFrequency('Sub-THz');
    setFormChannel(165);
    setFormGeneration('WiFi 8');
    setFormChannelWidth(320);
    setFormMlo(true);
    setFormIsHidden(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (profile: WifiNetworkProfile) => {
    setModalMode('edit');
    setFormId(profile.id);
    setFormSsid(profile.ssid);
    setFormBssid(profile.bssid || 'a4:bb:6d:88:99:aa');
    setFormSecurity(profile.security);
    setFormPassword(profile.password || '');
    setFormIpMode(profile.ipMode);
    setFormIpAddress(profile.ipAddress || '192.168.1.150');
    setFormSubnetMask(profile.subnetMask || '255.255.255.0');
    setFormGateway(profile.gateway || '192.168.1.1');
    setFormPrimaryDns(profile.primaryDns || '1.1.1.1');
    setFormSecondaryDns(profile.secondaryDns || '8.8.8.8');
    setFormNetworkType(profile.networkType);
    setFormAutoConnect(profile.autoConnect);
    setFormFrequency(profile.frequency || '5GHz');
    setFormChannel(profile.channel || 44);
    setFormGeneration(profile.generation || 'WiFi 7');
    setFormChannelWidth(profile.channelWidthMHz || 320);
    setFormMlo(profile.mloEnabled ?? true);
    setFormIsHidden(profile.isHidden ?? false);
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSsid.trim()) {
      showBanner('SSID Network Name cannot be blank.');
      return;
    }

    const isSec = formSecurity !== 'OPEN';
    const newProf: WifiNetworkProfile = {
      id: formId,
      ssid: formSsid.trim(),
      bssid: formBssid.trim() || '02:00:00:00:00:00',
      security: formSecurity,
      isSecured: isSec,
      password: isSec ? formPassword : '',
      ipMode: formIpMode,
      ipAddress: formIpAddress.trim() || '192.168.1.150',
      subnetMask: formSubnetMask.trim() || '255.255.255.0',
      gateway: formGateway.trim() || '192.168.1.1',
      primaryDns: formPrimaryDns.trim() || '1.1.1.1',
      secondaryDns: formSecondaryDns.trim() || '8.8.8.8',
      networkType: formNetworkType,
      signalStrength: 92,
      frequency: formFrequency,
      channel: formChannel,
      generation: formGeneration,
      channelWidthMHz: formChannelWidth,
      mloEnabled: formMlo,
      isHidden: formIsHidden,
      autoConnect: formAutoConnect,
      saved: true,
      connected: modalMode === 'edit' && activeProfile?.id === formId ? true : false,
      lastConnected: modalMode === 'edit' ? activeProfile?.lastConnected : undefined
    };

    const res = networkSecurityService.saveWifiProfile(newProf);
    reloadData();
    onRefreshParent();
    setIsModalOpen(false);
    showBanner(res.message);
    onRunCliCommand(`nmcli connection modify "${newProf.ssid}" 802-11-wireless.band ${formFrequency === 'Sub-THz' || formFrequency === '6GHz' ? 'a' : 'bg'}`);
  };

  const handleQuickConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickConnectAp) return;

    const newProfile: WifiNetworkProfile = {
      ...quickConnectAp,
      id: `wifi_prof_${Date.now()}`,
      password: quickPassphrase,
      ipMode: quickIpMode,
      networkType: quickNetworkType,
      saved: true,
      connected: false
    };

    networkSecurityService.saveWifiProfile(newProfile);
    handleConnectProfile(newProfile, quickPassphrase);
    setQuickConnectAp(null);
    setQuickPassphrase('');
  };

  const handleUnmaskAndConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unmaskAp || !unmaskInputSsid.trim()) return;

    const res = networkSecurityService.unmaskHiddenSsid(unmaskAp.id, unmaskInputSsid.trim());
    if (res.success && res.profile) {
      const updatedProfile: WifiNetworkProfile = {
        ...res.profile,
        password: unmaskPassword,
        saved: true
      };
      networkSecurityService.saveWifiProfile(updatedProfile);
      handleConnectProfile(updatedProfile, unmaskPassword);
      setUnmaskAp(null);
      setUnmaskInputSsid('');
      setUnmaskPassword('');
      showBanner(res.message);
    }
  };

  const handle1ClickVpnConnect = () => {
    const res = networkSecurityService.connectVpn();
    reloadData();
    onRefreshParent();
    showBanner(res.message);
    onRunCliCommand('vpnctl connect --quantum-kyber');
  };

  const isUntrusted = activeProfile ? (activeProfile.networkType === 'PUBLIC' || !activeProfile.isSecured || activeProfile.security === 'OPEN') : false;
  const isVpnActive = vpnConfig.status === 'CONNECTED';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification Banner */}
      {bannerMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-cyan-500/40 text-cyan-300 px-4 py-3 rounded-xl shadow-2xl text-xs flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-mono">{bannerMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLASHING UNTRUSTED NETWORK WARNING (HUD BANNER / PROMPT) */}
      {/* ========================================================================= */}
      {isUntrusted && !dismissUntrustedWarning && (
        <div className="bg-gradient-to-r from-amber-950/90 via-rose-950/80 to-amber-950/90 border-2 border-amber-500/80 text-amber-100 p-4 sm:p-5 rounded-2xl shadow-2xl animate-pulse relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-bounce text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                    ⚠️ UNTRUSTED / UNSECURE NETWORK WARNING
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase font-bold">
                    PACKET SNIFFING HAZARD
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                  You are associated with <strong className="text-white font-mono">{activeProfile?.ssid}</strong> ({activeProfile?.networkType} Profile / {activeProfile?.security}). 
                  Wireless frames on this network are unauthenticated or unencrypted. Third-party actors on this channel can eavesdrop, capture unencrypted credentials, or attempt DNS hijacking.
                </p>
                {!isVpnActive && (
                  <p className="text-xs font-semibold text-cyan-300 mt-1">
                    🛡️ Would you like to shield all outgoing packets using the built-in Quantum-Resistant VPN tunnel?
                  </p>
                )}
              </div>
            </div>

            {/* Warning Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {!isVpnActive ? (
                <button
                  onClick={handle1ClickVpnConnect}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-mono shadow-lg shadow-cyan-500/30 flex items-center gap-2 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Connect Built-in VPN Now</span>
                </button>
              ) : (
                <div className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>VPN Active (Traffic Encrypted)</span>
                </div>
              )}

              {onNavigateToVpn && (
                <button
                  onClick={onNavigateToVpn}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Configure VPN</span>
                </button>
              )}

              <button
                onClick={() => setDismissUntrustedWarning(true)}
                className="px-3 py-2.5 rounded-xl bg-black/40 hover:bg-black/60 text-amber-300 border border-amber-500/40 text-xs font-mono transition-all"
              >
                Dismiss Warning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HERO SECTION: ACTIVE WI-FI & MULTI-BAND SPECTRUM ADAPTER */}
      {/* ========================================================================= */}
      <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-[#222] pb-5">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-xl border ${
              activeProfile 
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                : 'bg-zinc-800/40 text-zinc-400 border-zinc-700/40'
            }`}>
              {activeProfile ? <Wifi className="w-6 h-6 animate-pulse" /> : <WifiOff className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="text-lg font-bold text-white font-mono">
                  {activeProfile ? activeProfile.ssid : 'Wireless Interface Offline / Disconnected'}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  activeProfile 
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60' 
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}>
                  {activeProfile ? 'Connected & Associated' : 'Idle'}
                </span>
                {activeProfile && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                    activeProfile.networkType === 'PRIVATE'
                      ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-700/50'
                      : 'bg-amber-950/70 text-amber-300 border border-amber-700/50'
                  }`}>
                    {activeProfile.networkType} PROFILE
                  </span>
                )}
                {activeProfile?.generation && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {activeProfile.generation} {activeProfile.generation === 'WiFi 8' ? '(802.11bn UHR)' : activeProfile.generation === 'WiFi 7' ? '(802.11be EHT)' : ''}
                  </span>
                )}
                {activeProfile?.mloEnabled && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    MLO Multi-Band 320MHz
                  </span>
                )}
              </div>
              <p className="text-xs text-[#888] mt-0.5">
                {activeProfile 
                  ? `NextGen PCIe 802.11be/bn Adapter (wlan0) • Associated with BSSID ${activeProfile.bssid || 'a4:bb:6d:88:99:aa'} • Bandwidth: ${activeProfile.channelWidthMHz || 320} MHz`
                  : 'No wireless access point currently bound to physical adapter wlan0.'
                }
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Built-in VPN Quick Toggle in Header */}
            <button
              onClick={handle1ClickVpnConnect}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
                isVpnActive
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isVpnActive ? 'VPN: Encrypted (wg0)' : 'Shield with VPN'}</span>
            </button>

            {onNavigateToVpn && (
              <button
                onClick={onNavigateToVpn}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                title="Open VPN & Mesh Tunnel Manager"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Manage VPN</span>
              </button>
            )}

            <button
              onClick={handleScanAirwaves}
              disabled={isScanning}
              className="px-3 py-2 bg-[#161616] hover:bg-[#202020] text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isScanning ? 'Scanning Spectrum...' : 'Scan Spectrum (Visible & Hidden)'}</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Wi-Fi 7/8 Profile</span>
            </button>

            {activeProfile && (
              <button
                onClick={handleDisconnect}
                className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-Time Association Telemetry */}
        {activeProfile ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 font-mono text-xs">
            <div className="bg-[#141414] border border-[#222] p-3 rounded-lg">
              <span className="text-[#666] block text-[10px] uppercase font-sans">Signal & RSSI</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-white font-bold">{activeProfile.signalStrength}%</span>
                <span className="text-[#666] text-[10px]">(-{Math.round(100 - activeProfile.signalStrength * 0.6)} dBm)</span>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222] p-3 rounded-lg">
              <span className="text-[#666] block text-[10px] uppercase font-sans">Spectrum Band</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-white font-bold">{activeProfile.frequency}</span>
                <span className="text-[#666] text-[10px]">Ch {activeProfile.channel}</span>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222] p-3 rounded-lg">
              <span className="text-[#666] block text-[10px] uppercase font-sans">Assigned IPv4</span>
              <div className="mt-1 text-cyan-300 font-bold truncate">
                {activeProfile.ipAddress || '192.168.50.75'}
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222] p-3 rounded-lg">
              <span className="text-[#666] block text-[10px] uppercase font-sans">Gateway Router</span>
              <div className="mt-1 text-white truncate">
                {activeProfile.gateway || '192.168.50.1'}
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222] p-3 rounded-lg">
              <span className="text-[#666] block text-[10px] uppercase font-sans">Primary / Sec DNS</span>
              <div className="mt-1 text-white truncate">
                {activeProfile.primaryDns || '1.1.1.1'}, {activeProfile.secondaryDns || '8.8.8.8'}
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222] p-3 rounded-lg">
              <span className="text-[#666] block text-[10px] uppercase font-sans">Security Standard</span>
              <div className="flex items-center gap-1.5 mt-1">
                {activeProfile.isSecured ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-rose-400" />}
                <span className="text-white font-bold">{activeProfile.security}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-lg bg-[#141414] border border-[#222] text-xs text-[#888] flex items-center justify-between">
            <span>Connect to a saved network profile below or scan the airwaves to associate with a wireless access point.</span>
            <button 
              onClick={handleScanAirwaves}
              className="text-cyan-400 hover:text-cyan-300 underline font-mono text-xs"
            >
              Scan spectrum now →
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: SAVED NETWORK PROFILES BANK */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Saved Roaming Network Profiles ({profiles.length})
            </h4>
          </div>
          <span className="text-[11px] text-[#888] font-sans">
            Automatic profile switching enabled when moving between known BSSIDs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {profiles.map((prof) => {
            const isConnected = prof.connected;
            return (
              <div 
                key={prof.id}
                className={`border rounded-xl p-4 transition-all duration-200 relative flex flex-col justify-between ${
                  isConnected 
                    ? 'bg-gradient-to-b from-[#111c19] to-[#0d1412] border-emerald-500/40 shadow-lg shadow-emerald-950/20' 
                    : 'bg-[#111] border-[#222] hover:border-[#333]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${
                        isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1a1a1a] text-[#888]'
                      }`}>
                        <Wifi className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-sm font-bold text-white font-mono">{prof.ssid}</h5>
                          {prof.isHidden && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              HIDDEN
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[#666]">
                          BSSID: {prof.bssid || 'Auto-Roam MAC'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isConnected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <Check className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        prof.networkType === 'PRIVATE'
                          ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-700/50'
                          : 'bg-amber-950/70 text-amber-300 border border-amber-700/50'
                      }`}>
                        {prof.networkType}
                      </span>
                    </div>
                  </div>

                  {/* Profile Meta Chips */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-mono text-[#888]">
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-cyan-400" />
                      <span>{prof.frequency} • Ch {prof.channel} ({prof.channelWidthMHz || 160}MHz)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {prof.isSecured ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-rose-400" />}
                      <span>{prof.security}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Server className="w-3 h-3 text-purple-400" />
                      <span>IP: {prof.ipMode === 'DHCP' ? 'DHCP (Auto)' : `${prof.ipAddress} (Static)`}</span>
                    </div>
                  </div>

                  {prof.generation && (
                    <div className="mt-2 text-[10px] font-mono text-cyan-300/80 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>Standard: {prof.generation} {prof.generation === 'WiFi 8' ? '(802.11bn UHR 320MHz)' : prof.generation === 'WiFi 7' ? '(802.11be EHT)' : ''}</span>
                    </div>
                  )}

                  {prof.lastConnected && (
                    <div className="text-[10px] font-mono text-[#555] mt-1">
                      Last connected: {prof.lastConnected}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#222]">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-sans text-[#888] hover:text-white">
                    <input 
                      type="checkbox"
                      checked={prof.autoConnect}
                      onChange={() => handleToggleAutoConnect(prof.id)}
                      className="rounded bg-[#0a0a0a] border-[#333] text-cyan-600 focus:ring-0"
                    />
                    <span>Auto-Roam</span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(prof)}
                      className="p-1.5 rounded-lg bg-[#181818] hover:bg-[#252525] text-[#aaa] hover:text-white transition-colors"
                      title="Edit Network Configuration"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteProfile(prof.id, prof.ssid)}
                      className="p-1.5 rounded-lg bg-[#181818] hover:bg-rose-950/50 text-[#aaa] hover:text-rose-400 transition-colors"
                      title="Delete Saved Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {isConnected ? (
                      <button
                        onClick={handleDisconnect}
                        className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-mono font-semibold transition-colors"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnectProfile(prof)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-semibold transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: LIVE RF SPECTRUM SCANNER (VISIBLE & HIDDEN APs) */}
      {/* ========================================================================= */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Live RF Spectrum Discovery (2.4GHz • 5GHz • 6GHz • Sub-THz)
              </h4>
            </div>
            <p className="text-[11px] text-[#888] mt-0.5">
              Real-time airwave probe sniffer detects visible SSIDs, Wi-Fi 7/8 nodes, and non-broadcasting hidden beacon frames.
            </p>
          </div>

          <button
            onClick={handleScanAirwaves}
            disabled={isScanning}
            className="px-3.5 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-all self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Spectrum...' : 'Rescan Spectrum'}</span>
          </button>
        </div>

        {scannedAps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {scannedAps.map((ap) => {
              const isHidden = ap.isHidden;
              return (
                <div 
                  key={ap.id}
                  className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
                    isHidden 
                      ? 'bg-purple-950/10 border-purple-500/30 hover:border-purple-500/50' 
                      : 'bg-[#0d0d0d] border-[#222] hover:border-[#333]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className={`text-sm font-bold font-mono ${isHidden ? 'text-purple-300' : 'text-white'}`}>
                            {ap.ssid}
                          </h5>
                          {isHidden && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold uppercase">
                              Hidden Probe Detected
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[#666]">
                          BSSID: {ap.bssid}
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        ap.networkType === 'PRIVATE'
                          ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-700/50'
                          : 'bg-amber-950/70 text-amber-300 border border-amber-700/50'
                      }`}>
                        {ap.networkType}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-mono text-[#888]">
                      <div className="flex items-center gap-1.5">
                        <Radio className="w-3 h-3 text-cyan-400" />
                        <span>{ap.frequency} • Ch {ap.channel} ({ap.channelWidthMHz || 80}MHz)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {ap.isSecured ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-rose-400" />}
                        <span>{ap.security}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        <span>Signal: {ap.signalStrength}%</span>
                      </div>
                      {ap.generation && (
                        <div className="flex items-center gap-1.5 text-cyan-300">
                          <Zap className="w-3 h-3 text-cyan-400" />
                          <span>{ap.generation}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 mt-3 border-t border-[#222]">
                    {isHidden ? (
                      <button
                        onClick={() => {
                          setUnmaskAp(ap);
                          setUnmaskInputSsid('');
                          setUnmaskPassword('');
                        }}
                        className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Search className="w-3.5 h-3.5 text-purple-400" />
                        <span>Reveal Hidden SSID & Connect</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setQuickConnectAp(ap);
                          setQuickPassphrase('');
                          setQuickIpMode('DHCP');
                          setQuickNetworkType(ap.networkType);
                        }}
                        className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Configure & Connect</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl">
            <Radio className="w-8 h-8 text-cyan-400/50 mx-auto mb-2 animate-pulse" />
            <p className="text-xs text-white font-mono">No new unconfigured access points in immediate range.</p>
            <p className="text-[11px] text-[#666] mt-1 font-sans">
              Click &quot;Rescan Spectrum&quot; to probe for visible broadcast beacons, Wi-Fi 7/8 multi-link nodes, and stealth hidden networks.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT FULL NETWORK PROFILE (WI-FI 7 & 8 CAPABLE) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-[#222] flex items-center justify-between sticky top-0 bg-[#111] z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {modalMode === 'create' ? 'Create Next-Gen Wi-Fi 7 / 8 Profile' : `Edit Profile: ${formSsid}`}
                  </h3>
                  <p className="text-[11px] text-zinc-400">Configure multi-band radio, addressing, DNS, and security isolation</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white font-mono text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-4 text-xs font-mono">
              {/* SSID & Security Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1 font-sans">Network Name (SSID)</label>
                  <input
                    type="text"
                    value={formSsid}
                    onChange={(e) => setFormSsid(e.target.value)}
                    placeholder="e.g. FlightDeck-Ultra-8G"
                    required
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-sans">Security Standard</label>
                  <select
                    value={formSecurity}
                    onChange={(e) => setFormSecurity(e.target.value as WifiSecurityType)}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-sans"
                  >
                    <option value="WPA4-Quantum">WPA4-Quantum (Post-Quantum SAE)</option>
                    <option value="WPA3">WPA3-Personal (SAE 256-bit)</option>
                    <option value="WPA2">WPA2-Personal (AES-CCMP)</option>
                    <option value="OWE">OWE (Opportunistic Wireless Encryption)</option>
                    <option value="WEP">WEP (Legacy Deprecated)</option>
                    <option value="OPEN">OPEN (Unsecured Captive Portal)</option>
                  </select>
                </div>
              </div>

              {/* Passphrase (if secured) */}
              {formSecurity !== 'OPEN' && formSecurity !== 'OWE' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-400 font-sans">Security Passphrase</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-sans"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? 'Hide' : 'Reveal'}</span>
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Enter WPA passphrase or quantum PSK"
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Wi-Fi Generation, Spectrum, & Channel Bandwidth */}
              <div className="border border-[#222] rounded-xl p-3 bg-[#0d0d0d] space-y-3">
                <span className="text-[11px] font-sans text-cyan-400 font-semibold uppercase tracking-wider block">
                  Radio Spectrum & Generation Specs (Wi-Fi 7 & 8 Ready)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-sans">Wi-Fi Generation</label>
                    <select
                      value={formGeneration}
                      onChange={(e) => setFormGeneration(e.target.value as WifiGeneration)}
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-sans"
                    >
                      <option value="WiFi 8">Wi-Fi 8 (802.11bn UHR)</option>
                      <option value="WiFi 7">Wi-Fi 7 (802.11be EHT)</option>
                      <option value="WiFi 6E">Wi-Fi 6E (802.11ax 6GHz)</option>
                      <option value="WiFi 6">Wi-Fi 6 (802.11ax)</option>
                      <option value="WiFi 5">Wi-Fi 5 (802.11ac)</option>
                      <option value="WiFi 4">Wi-Fi 4 (802.11n)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-sans">Frequency Band</label>
                    <select
                      value={formFrequency}
                      onChange={(e) => setFormFrequency(e.target.value as WifiFrequencyBand)}
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-sans"
                    >
                      <option value="Sub-THz">Sub-THz (Wi-Fi 8 Ultra-Band)</option>
                      <option value="Multi-Band MLO">Multi-Band MLO (5G + 6G Aggregate)</option>
                      <option value="6GHz">6 GHz (Clean Spectrum)</option>
                      <option value="5GHz">5 GHz (High Throughput)</option>
                      <option value="2.4GHz">2.4 GHz (Long Range)</option>
                      <option value="60GHz">60 GHz (WiGig / Millimeter)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-sans">Channel Bandwidth</label>
                    <select
                      value={formChannelWidth}
                      onChange={(e) => setFormChannelWidth(Number(e.target.value) as any)}
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-sans"
                    >
                      <option value={320}>320 MHz (Wi-Fi 7/8 Ultra-Wide)</option>
                      <option value={160}>160 MHz (Wi-Fi 6/6E)</option>
                      <option value={80}>80 MHz (Standard 5G)</option>
                      <option value={40}>40 MHz</option>
                      <option value={20}>20 MHz</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-zinc-300 font-sans cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formMlo}
                      onChange={(e) => setFormMlo(e.target.checked)}
                      className="rounded bg-[#0a0a0a] border-[#333] text-cyan-600 focus:ring-0"
                    />
                    <span>Enable Multi-Link Operation (MLO) Link Aggregation</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 font-sans cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsHidden}
                      onChange={(e) => setFormIsHidden(e.target.checked)}
                      className="rounded bg-[#0a0a0a] border-[#333] text-purple-600 focus:ring-0"
                    />
                    <span>Hidden (Non-Broadcasting) Network</span>
                  </label>
                </div>
              </div>

              {/* IP Configuration (DHCP vs Static) */}
              <div className="border border-[#222] rounded-xl p-3 bg-[#0d0d0d] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-sans text-cyan-400 font-semibold uppercase tracking-wider">
                    IP Addressing & Gateway Configuration
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormIpMode('DHCP')}
                      className={`px-2.5 py-1 rounded text-[11px] font-sans font-medium transition-all ${
                        formIpMode === 'DHCP' 
                          ? 'bg-cyan-500 text-black font-bold' 
                          : 'bg-[#181818] text-zinc-400 hover:text-white'
                      }`}
                    >
                      Automatic DHCP
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIpMode('STATIC')}
                      className={`px-2.5 py-1 rounded text-[11px] font-sans font-medium transition-all ${
                        formIpMode === 'STATIC' 
                          ? 'bg-cyan-500 text-black font-bold' 
                          : 'bg-[#181818] text-zinc-400 hover:text-white'
                      }`}
                    >
                      Manual Static IP
                    </button>
                  </div>
                </div>

                {formIpMode === 'STATIC' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-zinc-400 mb-1 font-sans">Static IPv4 Address</label>
                      <input
                        type="text"
                        value={formIpAddress}
                        onChange={(e) => setFormIpAddress(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1 font-sans">Subnet Mask</label>
                      <input
                        type="text"
                        value={formSubnetMask}
                        onChange={(e) => setFormSubnetMask(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1 font-sans">Default Gateway</label>
                      <input
                        type="text"
                        value={formGateway}
                        onChange={(e) => setFormGateway(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                {/* DNS Configuration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-sans">Primary DNS Server</label>
                    <input
                      type="text"
                      value={formPrimaryDns}
                      onChange={(e) => setFormPrimaryDns(e.target.value)}
                      placeholder="1.1.1.1"
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-sans">Secondary DNS Server</label>
                    <input
                      type="text"
                      value={formSecondaryDns}
                      onChange={(e) => setFormSecondaryDns(e.target.value)}
                      placeholder="8.8.8.8"
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Security Isolation Profile */}
              <div>
                <label className="block text-zinc-400 mb-1 font-sans">Network Isolation Policy</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    formNetworkType === 'PRIVATE'
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
                      : 'bg-[#0a0a0a] border-[#222] text-zinc-400'
                  }`}>
                    <input
                      type="radio"
                      name="networkTypeRadio"
                      value="PRIVATE"
                      checked={formNetworkType === 'PRIVATE'}
                      onChange={() => setFormNetworkType('PRIVATE')}
                      className="text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-sans font-bold text-xs">Private Network (Trusted)</div>
                      <div className="text-[10px] font-sans text-zinc-400">Device discoverable, LAN sharing enabled</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    formNetworkType === 'PUBLIC'
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                      : 'bg-[#0a0a0a] border-[#222] text-zinc-400'
                  }`}>
                    <input
                      type="radio"
                      name="networkTypeRadio"
                      value="PUBLIC"
                      checked={formNetworkType === 'PUBLIC'}
                      onChange={() => setFormNetworkType('PUBLIC')}
                      className="text-amber-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-sans font-bold text-xs">Public Network (Untrusted)</div>
                      <div className="text-[10px] font-sans text-zinc-400">Device hidden, stealth firewall active</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-4 border-t border-[#222] bg-[#0c0c0c] flex items-center justify-end gap-3 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-sans text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-sans font-semibold bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Network Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REVEAL / UNMASK HIDDEN SSID & CONNECT */}
      {/* ========================================================================= */}
      {unmaskAp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-purple-500/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-[#222] bg-purple-950/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Unmask Hidden Access Point</h3>
                  <p className="text-[11px] text-purple-300/80 font-mono">BSSID: {unmaskAp.bssid}</p>
                </div>
              </div>
              <button 
                onClick={() => setUnmaskAp(null)}
                className="text-zinc-500 hover:text-white font-mono text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUnmaskAndConnect} className="p-5 space-y-4 text-xs font-mono">
              <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                This access point is transmitting beacon frames without broadcasting its SSID name. 
                Enter the exact hidden SSID to associate frame probes and negotiate authentication.
              </p>

              <div>
                <label className="block text-zinc-400 mb-1 font-sans">Hidden SSID Name</label>
                <input
                  type="text"
                  value={unmaskInputSsid}
                  onChange={(e) => setUnmaskInputSsid(e.target.value)}
                  placeholder="Enter secret network SSID name"
                  required
                  autoFocus
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {unmaskAp.isSecured && (
                <div>
                  <label className="block text-zinc-400 mb-1 font-sans">Security Passphrase ({unmaskAp.security})</label>
                  <input
                    type="password"
                    value={unmaskPassword}
                    onChange={(e) => setUnmaskPassword(e.target.value)}
                    placeholder="Enter WPA passphrase"
                    required
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div className="p-3 bg-[#0c0c0c] border border-[#222] rounded-lg text-[11px] text-zinc-400 space-y-1">
                <div>Band: <span className="text-white font-bold">{unmaskAp.frequency} (Ch {unmaskAp.channel})</span></div>
                <div>Standard: <span className="text-cyan-300 font-bold">{unmaskAp.generation || 'Wi-Fi 7/8'} ({unmaskAp.channelWidthMHz || 320} MHz)</span></div>
              </div>

              <div className="p-4 border-t border-[#222] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUnmaskAp(null)}
                  className="px-4 py-2 rounded-lg text-xs font-sans text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-sans font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Unmask & Connect</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: QUICK CONNECT FOR SCANNED APs */}
      {/* ========================================================================= */}
      {quickConnectAp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-[#222] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Connect to &quot;{quickConnectAp.ssid}&quot;</h3>
                  <p className="text-[11px] text-zinc-400">{quickConnectAp.frequency} • {quickConnectAp.security} Security</p>
                </div>
              </div>
              <button 
                onClick={() => setQuickConnectAp(null)}
                className="text-zinc-500 hover:text-white font-mono text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickConnectSubmit} className="p-5 space-y-4 text-xs font-mono">
              {quickConnectAp.isSecured && (
                <div>
                  <label className="block text-zinc-400 mb-1 font-sans">Passphrase / Key</label>
                  <input
                    type="password"
                    value={quickPassphrase}
                    onChange={(e) => setQuickPassphrase(e.target.value)}
                    placeholder="Enter wireless security password"
                    required
                    autoFocus
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-zinc-400 mb-1 font-sans">Network Isolation Profile</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickNetworkType('PRIVATE')}
                    className={`p-2.5 rounded-lg border text-left font-sans ${
                      quickNetworkType === 'PRIVATE'
                        ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
                        : 'bg-[#0a0a0a] border-[#222] text-zinc-400'
                    }`}
                  >
                    <div className="font-bold text-xs">Private (Trusted)</div>
                    <div className="text-[10px] text-zinc-500">Home/Office LAN</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickNetworkType('PUBLIC')}
                    className={`p-2.5 rounded-lg border text-left font-sans ${
                      quickNetworkType === 'PUBLIC'
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                        : 'bg-[#0a0a0a] border-[#222] text-zinc-400'
                    }`}
                  >
                    <div className="font-bold text-xs">Public (Untrusted)</div>
                    <div className="text-[10px] text-zinc-500">Coffee / Airport</div>
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-[#222] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setQuickConnectAp(null)}
                  className="px-4 py-2 rounded-lg text-xs font-sans text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-sans font-semibold bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Authenticate & Connect</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
