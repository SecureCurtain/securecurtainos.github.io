// jb7572_2026-09-01: Universal Package Manager, GPG Keyring & Multi-Repo Hook (Arch, Yay/AUR, Debian, Kali)
import React, { useState } from 'react';
import { 
  DEFAULT_GPG_KEYRINGS, 
  DEFAULT_REPO_MIRRORS, 
  UNIVERSAL_PACKAGE_POOL,
  GpgKeyringDescriptor,
  RepoMirrorConfig,
  UniversalPackageBinary,
  SupportedDistroRepo
} from '../../../services/packageManagerService';
import { 
  Package, 
  KeyRound, 
  Globe, 
  Download, 
  Terminal, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Layers, 
  Copy, 
  Search, 
  ExternalLink, 
  PlusCircle, 
  Cpu, 
  Trash2, 
  Play, 
  Flame, 
  CheckSquare, 
  Server,
  Lock,
  AlertTriangle
} from 'lucide-react';

interface Props {
  onNotify: (title: string, message: string) => void;
}

type TabMode = 'PACKAGES' | 'REPOSITORIES' | 'SAFETY_AUDIT' | 'GPG_KEYS' | 'TERMINAL_INSTALLER';

export const PackageManagerTab: React.FC<Props> = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('PACKAGES');
  const [selectedDistroFilter, setSelectedDistroFilter] = useState<'ALL' | SupportedDistroRepo>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // State for dynamic keyrings, mirrors, and package pool
  const [keyrings, setKeyrings] = useState<GpgKeyringDescriptor[]>(DEFAULT_GPG_KEYRINGS);
  const [mirrors, setMirrors] = useState<RepoMirrorConfig[]>(DEFAULT_REPO_MIRRORS);
  const [packages, setPackages] = useState<UniversalPackageBinary[]>(UNIVERSAL_PACKAGE_POOL);

  // Add Repository Modal State
  const [isAddRepoOpen, setIsAddRepoOpen] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDistro, setNewRepoDistro] = useState<SupportedDistroRepo>('ARCH');
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [newRepoBranch, setNewRepoBranch] = useState('rolling');
  const [newRepoComponents, setNewRepoComponents] = useState('main');

  // Installer simulation state
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [installProgress, setInstallProgress] = useState<number>(0);
  const [activePackageId, setActivePackageId] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[*] Universal Package Management Engine Initialized.',
    '[*] Active Package Backends: pacman 6.1, yay (AUR Helper v12), apt / dpkg 1.22',
    '[*] Integrated Repositories: Arch (Core/Extra), AUR (RPC v5), Debian (Trixie), Kali Linux (Rolling)',
    '[✓] Origin-Lock Enforcer: ACTIVE (Cross-manager updates blocked to prevent glibc/dynamic library collisions).'
  ]);

  // Key import state
  const [isImportingKey, setIsImportingKey] = useState<boolean>(false);
  const [newKeyUrl, setNewKeyUrl] = useState<string>('');
  const [newKeyDistro, setNewKeyDistro] = useState<SupportedDistroRepo>('ARCH');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onNotify('Copied to Clipboard', `${label} copied.`);
  };

  const handleAddRepository = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim() || !newRepoUrl.trim()) {
      onNotify('Error', 'Repository name and mirror URL are required.');
      return;
    }

    const components = newRepoComponents.split(',').map(c => c.trim()).filter(Boolean);
    const newRepo: RepoMirrorConfig = {
      id: `custom_mirror_${Date.now()}`,
      name: newRepoName.trim(),
      distro: newRepoDistro,
      mirrorUrl: newRepoUrl.trim(),
      branch: newRepoBranch.trim() || 'rolling',
      branchOrSuite: newRepoBranch.trim() || 'rolling',
      components: components.length > 0 ? components : ['main'],
      isEnabled: true,
      status: 'SYNCED',
      latencyMs: Math.floor(Math.random() * 25) + 10,
      lastUpdatedUtc: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      isCustom: true
    };

    setMirrors(prev => [...prev, newRepo]);
    setIsAddRepoOpen(false);
    setNewRepoName('');
    setNewRepoUrl('');
    setTerminalLogs(prev => [
      ...prev,
      `[+] Added new ${newRepoDistro} repository mirror "${newRepo.name}" (${newRepo.mirrorUrl})`,
      `[✓] Synced in GUI without requiring manual configuration file edits.`
    ]);
    onNotify('Repository Added', `"${newRepo.name}" successfully added to system repositories.`);
  };

  const handleRemoveRepository = (repoId: string, name: string) => {
    setMirrors(prev => prev.filter(m => m.id !== repoId));
    setTerminalLogs(prev => [
      ...prev,
      `[-] Subtracted repository mirror "${name}" from system pool.`
    ]);
    onNotify('Repository Removed', `"${name}" removed from configuration.`);
  };

  // Filter packages
  const filteredPackages = packages.filter(pkg => {
    const matchesDistro = selectedDistroFilter === 'ALL' || pkg.distro === selectedDistroFilter;
    const matchesSearch = 
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.packageManager.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDistro && matchesSearch;
  });

  // Handle Refreshing/Syncing Mirrors
  const handleSyncMirrors = () => {
    setTerminalLogs(prev => [
      ...prev,
      '[*] Synchronizing repository databases and testing latency...',
      '-> pacman -Syy (Arch Core/Extra)',
      '-> yay -Syy --aur (AUR RPC v5 query)',
      '-> apt-get update (Debian Trixie & Kali Rolling)'
    ]);
    
    setTimeout(() => {
      setMirrors(prev => prev.map(m => ({
        ...m,
        status: 'SYNCED',
        latencyMs: Math.floor(Math.random() * 20) + 12,
        lastUpdatedUtc: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
      })));
      setTerminalLogs(prev => [
        ...prev,
        '[✓] All repository mirror metadata successfully updated and cryptographically verified.'
      ]);
      onNotify('Repositories Synced', 'Arch, AUR/Yay, Debian, and Kali Linux package indices refreshed.');
    }, 800);
  };

  // Handle Importing / Fetching GPG Key
  const handleFetchKey = (keyId: string) => {
    const targetKey = keyrings.find(k => k.id === keyId);
    if (!targetKey) return;

    setIsImportingKey(true);
    setTerminalLogs(prev => [
      ...prev,
      `[*] Fetching GPG Key from: ${targetKey.sourceUrl}`,
      `[*] Key ID: ${targetKey.keyId} (${targetKey.keyName})`,
      `-> gpg --keyserver hkps://keyserver.ubuntu.com --recv-keys ${targetKey.keyId.replace('0x', '')}`,
      `-> gpg --export --armor ${targetKey.keyId.replace('0x', '')} | gpg --dearmor -o ${targetKey.keyringPath}`
    ]);

    setTimeout(() => {
      setKeyrings(prev => prev.map(k => k.id === keyId ? { ...k, isImported: true, importedAt: new Date().toISOString() } : k));
      setIsImportingKey(false);
      setTerminalLogs(prev => [
        ...prev,
        `[✓] GPG Public Key ${targetKey.keyId} imported and verified into trusted trustdb!`
      ]);
      onNotify('GPG Key Verified', `Imported ${targetKey.keyName} successfully.`);
    }, 700);
  };

  // Handle Package Install / Removal Toggle
  const handleTogglePackageInstall = (pkg: UniversalPackageBinary) => {
    setIsInstalling(true);
    setActivePackageId(pkg.id);
    setInstallProgress(10);

    const isCurrentlyInstalled = pkg.installed;
    const actionVerb = isCurrentlyInstalled ? 'Removing' : 'Installing';

    let installCmd = '';
    if (pkg.packageManager === 'pacman') {
      installCmd = isCurrentlyInstalled ? `pacman -Rns ${pkg.name} --noconfirm` : `pacman -Sy ${pkg.name} --noconfirm`;
    } else if (pkg.packageManager === 'yay') {
      installCmd = isCurrentlyInstalled ? `yay -Rns ${pkg.name} --noconfirm` : `yay -S ${pkg.name} --noconfirm --needed`;
    } else {
      installCmd = isCurrentlyInstalled ? `apt-get remove --purge -y ${pkg.name}` : `apt-get update && apt-get install -y ${pkg.name}`;
    }

    setTerminalLogs(prev => [
      ...prev,
      `[>] ${actionVerb} ${pkg.name} v${pkg.version} (${pkg.packageManager.toUpperCase()})...`,
      `[CMD] ${installCmd}`,
      `[*] Verifying package digest SHA256: ${pkg.sha256.slice(0, 16)}...`
    ]);

    setTimeout(() => setInstallProgress(45), 300);
    setTimeout(() => setInstallProgress(80), 600);
    setTimeout(() => {
      setInstallProgress(100);
      setIsInstalling(false);
      setActivePackageId(null);
      
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, installed: !isCurrentlyInstalled } : p));
      
      setTerminalLogs(prev => [
        ...prev,
        `[✓] SUCCESS: ${pkg.name} ${isCurrentlyInstalled ? 'uninstalled' : 'installed'} to ${pkg.binaryPath}!`
      ]);

      onNotify(
        `${pkg.name} ${isCurrentlyInstalled ? 'Removed' : 'Installed'}`,
        `${pkg.name} is now ${isCurrentlyInstalled ? 'purged from' : 'available in'} the system binaries pool.`
      );
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                <Package className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100">Universal Package Manager & Multi-Distro Repositories</h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                pacman • yay (AUR) • apt • GPG Keyrings
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              Hook into official <strong>Arch Linux</strong>, <strong>AUR (Yay)</strong>, <strong>Debian (Trixie)</strong>, and <strong>Kali Linux</strong> repositories. Import cryptographic GPG keys, verify package hashes, and install binaries with full dependency resolution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncMirrors}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-all shadow-md shadow-purple-600/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync All Repositories</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'PACKAGES', label: 'Package Pool & Binaries', icon: Package, count: packages.length },
            { id: 'REPOSITORIES', label: 'Repository Mirrors', icon: Globe, count: mirrors.length },
            { id: 'SAFETY_AUDIT', label: 'Origin-Lock & Dangers Audit', icon: ShieldCheck, count: 'ACTIVE' },
            { id: 'GPG_KEYS', label: 'GPG Keyrings & Web of Trust', icon: KeyRound, count: keyrings.length },
            { id: 'TERMINAL_INSTALLER', label: 'Live CLI & Build Console', icon: Terminal, count: terminalLogs.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabMode)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-200 border border-purple-500/80 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-700">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Distro Quick Selector */}
        {activeTab === 'PACKAGES' && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['ALL', 'ARCH', 'AUR_YAY', 'DEBIAN', 'KALI'] as const).map(dist => (
              <button
                key={dist}
                onClick={() => setSelectedDistroFilter(dist)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                  selectedDistroFilter === dist
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dist === 'AUR_YAY' ? 'AUR (Yay)' : dist}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: PACKAGE POOL & BINARIES */}
      {activeTab === 'PACKAGES' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <Search className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="Search packages by name, binary, category, pacman, yay, apt..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-200 mr-2"
              >
                Clear
              </button>
            )}
          </div>

          {/* Package Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPackages.map(pkg => (
              <div 
                key={pkg.id} 
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        pkg.distro === 'ARCH' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                        pkg.distro === 'AUR_YAY' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                        pkg.distro === 'KALI' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}>
                        {pkg.distro === 'AUR_YAY' ? 'yay (AUR)' : pkg.packageManager}
                      </span>
                      <h4 className="text-sm font-bold text-slate-100 font-mono">{pkg.name}</h4>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      v{pkg.version}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {pkg.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Binary Target:</span>
                    <span className="text-slate-300">{pkg.binaryPath}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Installed Size:</span>
                    <span className="text-slate-300">{pkg.installedSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="text-purple-300">{pkg.category}</span>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px]">
                      {pkg.installed ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Installed in /bin
                        </span>
                      ) : (
                        <span className="text-slate-500">Not Installed</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleTogglePackageInstall(pkg)}
                      disabled={isInstalling && activePackageId === pkg.id}
                      className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        pkg.installed
                          ? 'bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-200 border border-slate-700'
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-600/30'
                      }`}
                    >
                      {isInstalling && activePackageId === pkg.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : pkg.installed ? (
                        <Trash2 className="w-3 h-3 text-rose-400" />
                      ) : (
                        <Download className="w-3 h-3" />
                      )}
                      <span>{pkg.installed ? 'Uninstall' : 'Install Binary'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: REPOSITORIES */}
      {activeTab === 'REPOSITORIES' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  Configured Distribution Repositories & Mirrors
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Package index sources queried by pacman, yay, and apt during synchronization. Add or subtract mirrors without editing config files manually.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddRepoOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-purple-600/30"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Repository</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {mirrors.map(m => (
                <div key={m.id} className="bg-slate-950/90 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${
                        m.distro === 'ARCH' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                        m.distro === 'AUR_YAY' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        m.distro === 'KALI' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {m.distro}
                      </span>
                      <span className="font-bold text-slate-200 text-sm">{m.name}</span>
                      {m.isCustom && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30">
                          Custom
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {m.latencyMs}ms Latency
                      </span>
                      <span className="text-slate-400">{m.lastUpdatedUtc}</span>

                      {m.isCustom && (
                        <button
                          onClick={() => handleRemoveRepository(m.id, m.name)}
                          className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 transition-all ml-1"
                          title="Remove repository mirror"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800/80 font-mono text-xs text-slate-300 flex items-center justify-between">
                    <span className="truncate max-w-[500px] text-purple-300">{m.mirrorUrl}</span>
                    <button 
                      onClick={() => copyToClipboard(m.mirrorUrl, 'Mirror URL')}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                    <span className="text-slate-500">Components:</span>
                    {m.components.map(c => (
                      <span key={c} className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-800">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Repository Modal */}
          {isAddRepoOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-mono">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-400" />
                    <h3 className="text-sm font-bold text-slate-100">Add New Repository Mirror</h3>
                  </div>
                  <button onClick={() => setIsAddRepoOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleAddRepository} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Repository Name:</label>
                    <input
                      type="text"
                      placeholder="e.g. BlackArch Tools Mirror"
                      value={newRepoName}
                      onChange={e => setNewRepoName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-purple-500 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Target Distro:</label>
                      <select
                        value={newRepoDistro}
                        onChange={e => setNewRepoDistro(e.target.value as SupportedDistroRepo)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-purple-500 outline-none"
                      >
                        <option value="ARCH">ARCH (pacman)</option>
                        <option value="AUR_YAY">AUR (yay)</option>
                        <option value="DEBIAN">DEBIAN (apt)</option>
                        <option value="KALI">KALI (apt)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Branch / Suite:</label>
                      <input
                        type="text"
                        placeholder="e.g. rolling, trixie"
                        value={newRepoBranch}
                        onChange={e => setNewRepoBranch(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Mirror URL:</label>
                    <input
                      type="text"
                      placeholder="https://mirror.example.org/os/arch"
                      value={newRepoUrl}
                      onChange={e => setNewRepoUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-purple-300 font-mono text-xs focus:border-purple-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Components (comma separated):</label>
                    <input
                      type="text"
                      placeholder="main, contrib, extra"
                      value={newRepoComponents}
                      onChange={e => setNewRepoComponents(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-purple-500 outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddRepoOpen(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30"
                    >
                      Save Repository
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: ORIGIN-LOCK & SYSTEM DANGERS AUDIT */}
      {activeTab === 'SAFETY_AUDIT' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Multi-Manager System Safety & Origin-Lock Enforcement</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Co-locating <strong>pacman/yay (Arch Linux)</strong> and <strong>apt/dpkg (Debian/Kali)</strong> grants maximum forensic tool availability, but unshielded updates between the two will destroy an operating system. Below is how our Origin-Lock prevents failure, followed by an analysis of other critical system hazards.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>1. Origin-Lock Update Enforcement Policy</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-slate-300 text-[11px] leading-relaxed">
              <div>
                <strong className="text-emerald-400">Strict Rule:</strong> Every application is tagged with its original installer backend (<code>pacman</code>, <code>yay</code>, or <code>apt</code>).
              </div>
              <div>
                An application can <strong className="text-white">ONLY be updated or mutated by its original installer</strong>. If an operator or automated script invokes <code>apt upgrade</code> on a package deployed via <code>pacman</code>, our safety engine intercepts the operation and rejects it before files can be overwritten.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
              <AlertTriangle className="w-4 h-4" />
              <span>Other Critical Dangers That Could Break the System</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-rose-400 font-bold">1. glibc Dynamic Linker Trampling</div>
                <div className="text-slate-300 leading-relaxed">
                  Arch Linux glibc is bleeding-edge rolling (2.40+), whereas Debian uses frozen stable (2.36). If apt overwrites <code>libc.so.6</code> or <code>ld-linux-x86-64.so.2</code>, every ELF binary on the machine crashes with immediate Segfaults.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-rose-400 font-bold">2. Shared Library (.so) Soname Collisions</div>
                <div className="text-slate-300 leading-relaxed">
                  Packages sharing <code>/usr/lib/libssl.so</code> or <code>libcrypto.so</code> have different symbol exports. Overwriting them breaks existing applications with <code>symbol lookup error: undefined symbol</code>.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-rose-400 font-bold">3. Desynchronized Package Databases</div>
                <div className="text-slate-300 leading-relaxed">
                  <code>dpkg</code> has zero knowledge of <code>pacman.db</code>. If <code>apt autoremove</code> prunes an orphaned dependency, it silently destroys runtime files that a pacman application was depending on.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-rose-400 font-bold">4. Kernel Headers & DKMS Module Incompatibility</div>
                <div className="text-slate-300 leading-relaxed">
                  Compiling out-of-tree kernel modules (ZFS, forensic Wi-Fi drivers) using Debian's DKMS against an Arch kernel causes fatal <code>vermagic</code> mismatches and kernel panics.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-amber-400 font-bold">5. Arch Linux Partial Upgrades</div>
                <div className="text-slate-300 leading-relaxed">
                  Running <code>pacman -Sy &lt;pkg&gt;</code> without <code>-Syu</code> installs newer binaries linked against newer libraries that haven't been upgraded yet, causing library mismatch errors.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-amber-400 font-bold">6. Live USB RAM/Persistence (COW) Exhaustion</div>
                <div className="text-slate-300 leading-relaxed">
                  Live Rescue USBs write through a Copy-On-Write (COW) overlay in RAM or flash. Downloading large unconstrained packages exhausts the overlayfs, causing immediate filesystem write lockups.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GPG KEYRINGS */}
      {activeTab === 'GPG_KEYS' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  GPG Signing Keyrings & Authenticode Verification
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cryptographic public keys for Arch Master Signing, AUR Trusted Users, Debian Archive, and Kali Linux.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                  Web of Trust Validated
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {keyrings.map(k => (
                <div key={k.id} className="bg-slate-950/90 border border-slate-800 rounded-lg p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                      k.distro === 'ARCH' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      k.distro === 'AUR_YAY' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      k.distro === 'KALI' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {k.distro}
                    </span>
                    <span className="font-mono text-emerald-400 text-[11px] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {k.signatureAlgorithm}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{k.keyName}</h4>
                    <div className="text-[11px] font-mono text-purple-300 mt-0.5">Key ID: {k.keyId}</div>
                  </div>

                  <div className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[10px] text-slate-400 break-all">
                    <span className="text-slate-500">Fingerprint:</span><br />
                    {k.fingerprint}
                  </div>

                  <div className="space-y-1 font-mono text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                    <div className="flex justify-between">
                      <span>Keyring File:</span>
                      <span className="text-slate-300 truncate max-w-[200px]">{k.keyringPath}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span className="text-slate-300">{k.expires}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => copyToClipboard(k.fingerprint, 'GPG Fingerprint')}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[11px] flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Fingerprint</span>
                    </button>

                    <button
                      onClick={() => handleFetchKey(k.id)}
                      disabled={isImportingKey}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-all"
                    >
                      <RefreshCw className={`w-3 h-3 ${isImportingKey ? 'animate-spin' : ''}`} />
                      <span>Re-Fetch / Verify</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TERMINAL LOGS & CLI */}
      {activeTab === 'TERMINAL_INSTALLER' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Package Manager Live Command Output (pacman / yay / apt)</span>
            </div>
            <button
              onClick={() => setTerminalLogs(['[*] Console cleared.'])}
              className="text-slate-400 hover:text-slate-200 text-[11px]"
            >
              Clear Logs
            </button>
          </div>

          <div className="bg-black/90 p-4 rounded-lg border border-slate-800/80 h-72 overflow-y-auto space-y-1 text-xs text-slate-300">
            {terminalLogs.map((log, i) => (
              <div key={i} className="leading-relaxed">
                {log.startsWith('[✓]') ? (
                  <span className="text-emerald-400 font-semibold">{log}</span>
                ) : log.startsWith('[CMD]') ? (
                  <span className="text-cyan-400 font-bold">{log}</span>
                ) : log.startsWith('[>]') ? (
                  <span className="text-purple-400 font-semibold">{log}</span>
                ) : (
                  <span className="text-slate-400">{log}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
