// jb7572_2026-08-24: Category 6 - Package Delivery & Features GUI Component
// Updated 2026-09-04: Redesigned with Octopi Layout, Multi-Repository Configurator (Add/Subtract GUI), and Origin-Lock Conflict Shield
import React, { useState, useEffect, useRef } from 'react';
import { 
  SystemPackage, 
  OptionalOsFeature, 
  PackageCategory, 
  InstallerBackend, 
  ConfiguredRepository 
} from '../../types';
import { packageManagementService } from '../../services/packageManagementService';
import { 
  Package, 
  Sliders, 
  Download, 
  ArrowUpCircle, 
  Trash2, 
  Search, 
  Filter, 
  Terminal, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Layers, 
  Box, 
  Cpu, 
  Zap, 
  FolderPlus, 
  ExternalLink,
  Lock,
  Sparkles,
  UploadCloud,
  FileUp,
  FileCode2,
  HardDrive,
  Globe,
  PlusCircle,
  AlertTriangle,
  Server,
  KeyRound,
  FileText,
  ListFilter,
  Check,
  RotateCcw,
  CheckSquare,
  Flame,
  Info
} from 'lucide-react';

interface PackageFeaturesGUIProps {
  onRunCliCommand?: (cmd: string) => void;
  initialTab?: TabType;
}

export type TabType = 
  | 'OCTOPI_PACKAGES' 
  | 'REPOSITORIES' 
  | 'SAFETY_AUDIT' 
  | 'OPTIONAL_FEATURES' 
  | 'DRAG_DROP_INSTALLER'
  // Backward compatibility alias
  | 'PACKAGE_POOL';

export const PackageFeaturesGUI: React.FC<PackageFeaturesGUIProps> = ({ 
  onRunCliCommand, 
  initialTab = 'OCTOPI_PACKAGES' 
}) => {
  const normalizedInitial = initialTab === 'PACKAGE_POOL' ? 'OCTOPI_PACKAGES' : initialTab;
  const [activeTab, setActiveTab] = useState<TabType>(normalizedInitial);
  
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab === 'PACKAGE_POOL' ? 'OCTOPI_PACKAGES' : initialTab);
    }
  }, [initialTab]);
  
  // Data States
  const [packages, setPackages] = useState<SystemPackage[]>([]);
  const [repositories, setRepositories] = useState<ConfiguredRepository[]>([]);
  const [features, setFeatures] = useState<OptionalOsFeature[]>([]);

  // Octopi Selection & Inspector State
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg_pacman_core');
  const [octopiInspectorTab, setOctopiInspectorTab] = useState<'INFO' | 'FILES' | 'TRANSACTIONS' | 'OUTPUT' | 'ORIGIN_GUARD'>('INFO');

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBackend, setSelectedBackend] = useState<'ALL' | InstallerBackend>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'INSTALLED' | 'UPGRADABLE' | 'AVAILABLE'>('ALL');
  const [isDragOverPkg, setIsDragOverPkg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add Repository Modal State
  const [isAddRepoModalOpen, setIsAddRepoModalOpen] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoBackend, setNewRepoBackend] = useState<InstallerBackend>('pacman');
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [newRepoBranch, setNewRepoBranch] = useState('main');
  const [newRepoComponents, setNewRepoComponents] = useState('main');
  const [newRepoDescription, setNewRepoDescription] = useState('');

  // Notification Toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);

  // Simulated Terminal Output for Octopi bottom tab
  const [octopiLogs, setOctopiLogs] = useState<string[]>([
    '[*] Octopi Universal Package Management Core Initialized (libalpm v14.0 & APT/Winget bridge)',
    '[+] Active Package Databases: pacman (Arch [core]/[extra]), yay (AUR RPC v5), apt (Debian/Kali), winget',
    '[✓] Origin-Locked Conflict Shield: ACTIVE. Cross-manager updates strictly blocked to prevent glibc/dynamic library collisions.',
    '[✓] Ready for transactions.'
  ]);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const refreshData = () => {
    setPackages(packageManagementService.getPackages());
    setRepositories(packageManagementService.getRepositories());
    setFeatures(packageManagementService.getFeatures());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const activePackage = packages.find(p => p.id === selectedPackageId) || packages[0] || null;

  // ==========================================
  // SAFE PACKAGE ACTIONS (Origin-Locked)
  // ==========================================
  const handleInstall = (pkg: SystemPackage) => {
    const res = packageManagementService.installPackage(pkg.id, pkg.originInstaller);
    refreshData();
    if (res.success) {
      showNotification(res.message, 'success');
      setOctopiLogs(prev => [
        ...prev,
        `-> [${pkg.originInstaller?.toUpperCase() || 'PACMAN'}] Installing ${pkg.name} v${pkg.version}...`,
        `[✓] Verified SHA256: ${pkg.sha256.substring(0, 16)}...`,
        `[✓] Package registered into /var/lib/${pkg.originInstaller === 'apt' ? 'dpkg' : 'pacman/local'}/`,
        `[✓] Origin-Lock set: Upgrades will only be permitted via ${pkg.originInstaller || 'pacman'}.`
      ]);
    } else {
      showNotification(res.message, 'error');
      setOctopiLogs(prev => [...prev, `[!] INSTALLATION BLOCKED: ${res.message}`]);
    }
  };

  const handleUpgrade = (pkg: SystemPackage, requestedInstaller?: InstallerBackend) => {
    // If user attempts an upgrade, check origin lock
    const installerToUse = requestedInstaller || pkg.originInstaller || 'pacman';
    const res = packageManagementService.upgradePackage(pkg.id, installerToUse);
    refreshData();
    if (res.success) {
      showNotification(res.message, 'success');
      setOctopiLogs(prev => [
        ...prev,
        `-> [${installerToUse.toUpperCase()}] Upgrading ${pkg.name} to v${pkg.version}...`,
        `[✓] Upgraded successfully via original installer.`
      ]);
    } else {
      showNotification(res.message, 'error');
      setOctopiLogs(prev => [
        ...prev,
        `[!] UPGRADE BLOCKED BY ORIGIN-LOCK: ${res.message}`
      ]);
      setOctopiInspectorTab('ORIGIN_GUARD');
    }
  };

  const handleRemove = (pkg: SystemPackage) => {
    const res = packageManagementService.removePackage(pkg.id, pkg.originInstaller);
    refreshData();
    if (res.success) {
      showNotification(res.message, 'info');
      setOctopiLogs(prev => [
        ...prev,
        `-> [${pkg.originInstaller?.toUpperCase() || 'PACMAN'}] Removing ${pkg.name}...`,
        `[✓] Removed ${pkg.installedFiles?.length || 1} binaries from system.`
      ]);
    } else {
      showNotification(res.message, 'error');
      setOctopiLogs(prev => [...prev, `[!] REMOVAL ERROR: ${res.message}`]);
    }
  };

  const handleSyncDatabases = () => {
    const res = packageManagementService.syncRepositories();
    refreshData();
    showNotification(res.message, 'success');
    setOctopiLogs(prev => [
      ...prev,
      '[*] Synchronizing repository databases (pacman -Syy, yay -Syy, apt-get update)...',
      `[✓] Core, Extra, AUR, Debian, Kali, and Winget metadata synced. Latency: 14ms - 35ms.`
    ]);
  };

  const handleUpgradeAll = () => {
    const res = packageManagementService.upgradeAll();
    refreshData();
    showNotification(res.message, 'success');
    setOctopiLogs(prev => [
      ...prev,
      '[*] Executing Safe Multi-Manager Upgrade (Origin-Locked)...',
      `[✓] ${res.message}`
    ]);
  };

  // ==========================================
  // REPOSITORY CONFIGURATION (Add / Remove / Toggle)
  // ==========================================
  const handleAddRepository = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim() || !newRepoUrl.trim()) {
      showNotification('Please provide both repository name and mirror URL.', 'error');
      return;
    }

    const components = newRepoComponents.split(',').map(c => c.trim()).filter(Boolean);
    const res = packageManagementService.addRepository({
      name: newRepoName.trim(),
      backend: newRepoBackend,
      url: newRepoUrl.trim(),
      branchOrSuite: newRepoBranch.trim() || 'main',
      components: components.length > 0 ? components : ['main'],
      description: newRepoDescription.trim() || 'Custom user repository.'
    });

    if (res.success) {
      refreshData();
      setIsAddRepoModalOpen(false);
      setNewRepoName('');
      setNewRepoUrl('');
      setNewRepoDescription('');
      showNotification(res.message, 'success');
      setOctopiLogs(prev => [
        ...prev,
        `[+] Added new ${newRepoBackend} repository "${res.repo?.name}" at ${res.repo?.url}`,
        `[✓] Automatically written to configuration without manual file edits!`
      ]);
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleRemoveRepository = (repo: ConfiguredRepository) => {
    const res = packageManagementService.removeRepository(repo.id);
    if (res.success) {
      refreshData();
      showNotification(res.message, 'info');
      setOctopiLogs(prev => [
        ...prev,
        `[-] Subtracted repository "${repo.name}" from active pool.`
      ]);
    } else {
      showNotification(res.message, 'warning');
    }
  };

  const handleToggleRepository = (repo: ConfiguredRepository) => {
    const res = packageManagementService.toggleRepository(repo.id);
    if (res.success) {
      refreshData();
      showNotification(res.message, 'info');
      setOctopiLogs(prev => [
        ...prev,
        `[*] Repository "${repo.name}" status changed to ${repo.isEnabled ? 'DISABLED' : 'ENABLED'}.`
      ]);
    }
  };

  // Filtered Packages
  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          pkg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkg.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || pkg.category === selectedCategory;
    const matchesBackend = selectedBackend === 'ALL' || pkg.originInstaller === selectedBackend;
    const matchesStatus = statusFilter === 'ALL' || pkg.status === statusFilter;
    return matchesSearch && matchesCategory && matchesBackend && matchesStatus;
  });

  const upgradableCount = packages.filter(p => p.status === 'UPGRADABLE').length;
  const installedCount = packages.filter(p => p.status === 'INSTALLED' || p.status === 'UPGRADABLE').length;

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  const getBackendBadgeColor = (backend?: InstallerBackend) => {
    switch (backend) {
      case 'pacman':
        return 'bg-cyan-950 text-cyan-300 border-cyan-500/40';
      case 'yay':
        return 'bg-purple-950 text-purple-300 border-purple-500/40';
      case 'apt':
        return 'bg-rose-950 text-rose-300 border-rose-500/40';
      case 'winget':
        return 'bg-blue-950 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-[#0c0d12] border border-[#1e2333] rounded-xl p-4 shadow-2xl text-[#ececf1] space-y-4 font-sans">
      
      {/* ========================================================================= */}
      {/* OCTOPI TOP TOOLBAR & ACTION HEADER                                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#1c2234]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <button
            id="tab_btn_octopi"
            onClick={() => setActiveTab('OCTOPI_PACKAGES')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
              activeTab === 'OCTOPI_PACKAGES'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'bg-[#141824] text-[#8fa0b5] hover:text-white border border-[#232c44]'
            }`}
          >
            <Package className="w-4 h-4 text-cyan-300" />
            <span>Octopi Package Explorer</span>
            <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px]">
              {packages.length}
            </span>
          </button>

          <button
            id="tab_btn_repos"
            onClick={() => setActiveTab('REPOSITORIES')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
              activeTab === 'REPOSITORIES'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-[#141824] text-[#8fa0b5] hover:text-white border border-[#232c44]'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-300" />
            <span>Repositories & Mirrors ({repositories.length})</span>
          </button>

          <button
            id="tab_btn_safety_guard"
            onClick={() => setActiveTab('SAFETY_AUDIT')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
              activeTab === 'SAFETY_AUDIT'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-[#141824] text-[#8fa0b5] hover:text-white border border-[#232c44]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Origin-Lock Shield & Dangers Audit</span>
          </button>

          <button
            id="tab_btn_features"
            onClick={() => setActiveTab('OPTIONAL_FEATURES')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
              activeTab === 'OPTIONAL_FEATURES'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-[#141824] text-[#8fa0b5] hover:text-white border border-[#232c44]'
            }`}
          >
            <Sliders className="w-4 h-4 text-purple-300" />
            <span>OS Features</span>
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Origin-Lock Status Chip */}
          <div 
            onClick={() => setActiveTab('SAFETY_AUDIT')}
            className="cursor-pointer hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 hover:bg-emerald-900/60 transition-all"
            title="Cross-manager package updates are strictly blocked to prevent glibc/dynamic library collisions."
          >
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>ORIGIN-LOCK: ENFORCED</span>
          </div>

          <button
            id="btn_sync_repos"
            onClick={handleSyncDatabases}
            title="Synchronize repository indexes (pacman -Syy / apt-get update)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182033] hover:bg-[#232d48] text-cyan-300 border border-cyan-500/30 text-xs font-mono transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>

          {upgradableCount > 0 && (
            <button
              id="btn_upgrade_all"
              onClick={handleUpgradeAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-amber-600/20"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>Upgrade All ({upgradableCount})</span>
            </button>
          )}

          <button
            onClick={() => setIsAddRepoModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-indigo-600/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Repo</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between font-mono animate-fadeIn ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200' 
            : notification.type === 'error'
            ? 'bg-rose-950/90 border-rose-500/60 text-rose-200'
            : notification.type === 'warning'
            ? 'bg-amber-950/90 border-amber-500/60 text-amber-200'
            : 'bg-blue-950/90 border-blue-500/60 text-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" /> : <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs opacity-70 hover:opacity-100 ml-3">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: OCTOPI PACKAGES VIEW (Classic Octopi 2-Pane Split)                 */}
      {/* ========================================================================= */}
      {activeTab === 'OCTOPI_PACKAGES' && (
        <div className="space-y-3">
          
          {/* Octopi Filter & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-[#101422] p-2.5 rounded-xl border border-[#1b2338]">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter packages (pacman -Ss / yay -Ss)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0d16] border border-[#222c44] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#ddd] placeholder-[#555] focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {/* Installer Backend Filter (pacman, yay, apt, winget) */}
              <div className="flex items-center bg-[#0a0d16] border border-[#222c44] rounded-lg p-0.5 text-xs font-mono">
                <button
                  onClick={() => setSelectedBackend('ALL')}
                  className={`px-2 py-1 rounded transition-colors ${selectedBackend === 'ALL' ? 'bg-cyan-950 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  All Managers
                </button>
                <button
                  onClick={() => setSelectedBackend('pacman')}
                  className={`px-2 py-1 rounded transition-colors ${selectedBackend === 'pacman' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  pacman
                </button>
                <button
                  onClick={() => setSelectedBackend('yay')}
                  className={`px-2 py-1 rounded transition-colors ${selectedBackend === 'yay' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  yay (AUR)
                </button>
                <button
                  onClick={() => setSelectedBackend('apt')}
                  className={`px-2 py-1 rounded transition-colors ${selectedBackend === 'apt' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  apt
                </button>
                <button
                  onClick={() => setSelectedBackend('winget')}
                  className={`px-2 py-1 rounded transition-colors ${selectedBackend === 'winget' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  winget
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-[#0a0d16] border border-[#222c44] rounded-lg p-0.5 text-xs font-mono">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2 py-1 rounded transition-colors ${statusFilter === 'ALL' ? 'bg-[#1b253e] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  All ({packages.length})
                </button>
                <button
                  onClick={() => setStatusFilter('INSTALLED')}
                  className={`px-2 py-1 rounded transition-colors ${statusFilter === 'INSTALLED' ? 'bg-emerald-950 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Installed ({installedCount})
                </button>
                {upgradableCount > 0 && (
                  <button
                    onClick={() => setStatusFilter('UPGRADABLE')}
                    className={`px-2 py-1 rounded transition-colors ${statusFilter === 'UPGRADABLE' ? 'bg-amber-950 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Upgradable ({upgradableCount})
                  </button>
                )}
                <button
                  onClick={() => setStatusFilter('AVAILABLE')}
                  className={`px-2 py-1 rounded transition-colors ${statusFilter === 'AVAILABLE' ? 'bg-[#1b253e] text-slate-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Available
                </button>
              </div>
            </div>
          </div>

          {/* Octopi Top Pane: Package Master Table */}
          <div className="border border-[#1e253a] rounded-xl overflow-hidden bg-[#0a0d16]">
            <div className="max-h-64 overflow-y-auto font-mono text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#121727] text-slate-400 border-b border-[#1e253a] text-[11px] select-none">
                  <tr>
                    <th className="py-2 px-3 w-8">Status</th>
                    <th className="py-2 px-3">Package Name</th>
                    <th className="py-2 px-3">Version</th>
                    <th className="py-2 px-3">Origin Installer</th>
                    <th className="py-2 px-3">Repository</th>
                    <th className="py-2 px-3">Size</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151c2e]">
                  {filteredPackages.map(pkg => {
                    const isSelected = pkg.id === activePackage?.id;
                    const isInstalled = pkg.status === 'INSTALLED' || pkg.status === 'UPGRADABLE';
                    const isUpgradable = pkg.status === 'UPGRADABLE';

                    return (
                      <tr
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-[#172138] text-white font-medium' 
                            : 'hover:bg-[#0f1424] text-slate-300'
                        }`}
                      >
                        {/* Status Icon */}
                        <td className="py-2 px-3" title={isUpgradable ? 'Update available' : isInstalled ? 'Installed' : 'Available'}>
                          {isUpgradable ? (
                            <ArrowUpCircle className="w-4 h-4 text-amber-400" />
                          ) : isInstalled ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 block ml-0.5" />
                          )}
                        </td>

                        {/* Package Name */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{pkg.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{pkg.description}</div>
                        </td>

                        {/* Version */}
                        <td className="py-2 px-3">
                          <span className={isUpgradable ? 'text-amber-300 font-bold' : ''}>
                            {pkg.version}
                          </span>
                          {pkg.installedVersion && pkg.installedVersion !== pkg.version && (
                            <span className="text-[10px] text-slate-400 block">installed: {pkg.installedVersion}</span>
                          )}
                        </td>

                        {/* Origin Installer Lock */}
                        <td className="py-2 px-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-bold ${getBackendBadgeColor(pkg.originInstaller)}`}>
                            <Lock className="w-2.5 h-2.5" />
                            <span>{pkg.originInstaller?.toUpperCase() || 'PACMAN'}</span>
                          </span>
                        </td>

                        {/* Repository */}
                        <td className="py-2 px-3 text-[11px] text-slate-400">
                          {pkg.repoSource.replace('repo_', '')}
                        </td>

                        {/* Size */}
                        <td className="py-2 px-3 text-[11px] text-slate-400">
                          {formatBytes(pkg.sizeBytes)}
                        </td>

                        {/* Actions (Origin-Locked) */}
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                            {isUpgradable && (
                              <button
                                onClick={() => handleUpgrade(pkg)}
                                className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] flex items-center gap-1 transition-all"
                                title={`Upgrade via original installer (${pkg.originInstaller})`}
                              >
                                <ArrowUpCircle className="w-3 h-3" />
                                <span>Upgrade</span>
                              </button>
                            )}

                            {!isInstalled ? (
                              <button
                                onClick={() => handleInstall(pkg)}
                                className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] flex items-center gap-1 transition-all"
                              >
                                <Download className="w-3 h-3" />
                                <span>Install</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRemove(pkg)}
                                className="px-2 py-0.5 rounded bg-[#1e273e] hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 font-bold text-[10px] flex items-center gap-1 transition-all"
                                title="Remove package"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Octopi Bottom Pane: Inspector Tabs (Info, Files, Transactions, Output, Origin Guard) */}
          {activePackage && (
            <div className="bg-[#0b0e17] border border-[#1b2338] rounded-xl overflow-hidden">
              {/* Octopi Sub-Tabs */}
              <div className="flex items-center gap-1 bg-[#101422] px-3 py-1.5 border-b border-[#1b2338] text-xs font-mono">
                <button
                  onClick={() => setOctopiInspectorTab('INFO')}
                  className={`px-3 py-1 rounded transition-colors ${octopiInspectorTab === 'INFO' ? 'bg-[#1b253e] text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Information
                </button>
                <button
                  onClick={() => setOctopiInspectorTab('FILES')}
                  className={`px-3 py-1 rounded transition-colors ${octopiInspectorTab === 'FILES' ? 'bg-[#1b253e] text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Files ({activePackage.installedFiles?.length || 0})
                </button>
                <button
                  onClick={() => setOctopiInspectorTab('TRANSACTIONS')}
                  className={`px-3 py-1 rounded transition-colors ${octopiInspectorTab === 'TRANSACTIONS' ? 'bg-[#1b253e] text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Transaction Queue
                </button>
                <button
                  onClick={() => setOctopiInspectorTab('OUTPUT')}
                  className={`px-3 py-1 rounded transition-colors ${octopiInspectorTab === 'OUTPUT' ? 'bg-[#1b253e] text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Output Terminal
                </button>
                <button
                  onClick={() => setOctopiInspectorTab('ORIGIN_GUARD')}
                  className={`px-3 py-1 rounded transition-colors flex items-center gap-1 ${octopiInspectorTab === 'ORIGIN_GUARD' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Origin-Lock Guard</span>
                </button>
              </div>

              {/* Inspector Content */}
              <div className="p-3.5 text-xs font-mono">
                {/* SUB-TAB 1: INFORMATION */}
                {octopiInspectorTab === 'INFO' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div><strong className="text-slate-400">Name:</strong> <span className="text-white font-bold">{activePackage.name}</span></div>
                      <div><strong className="text-slate-400">Version:</strong> <span className="text-cyan-300">{activePackage.version}</span></div>
                      <div><strong className="text-slate-400">Origin Installer:</strong> <span className="text-emerald-300 font-bold uppercase">{activePackage.originInstaller || 'pacman'} (Locked)</span></div>
                      <div><strong className="text-slate-400">Repository:</strong> <span className="text-white">{activePackage.repoSource}</span></div>
                      <div><strong className="text-slate-400">Description:</strong> <span className="text-slate-300">{activePackage.description}</span></div>
                      <div><strong className="text-slate-400">Architecture:</strong> <span className="text-white">{activePackage.architecture || 'x86_64'}</span></div>
                    </div>

                    <div className="space-y-2">
                      <div><strong className="text-slate-400">License:</strong> <span className="text-white">{activePackage.license || 'Open Source'}</span></div>
                      <div><strong className="text-slate-400">Packager:</strong> <span className="text-slate-300">{activePackage.maintainer}</span></div>
                      <div><strong className="text-slate-400">Dependencies:</strong> <span className="text-purple-300">{activePackage.dependencies.length > 0 ? activePackage.dependencies.join(', ') : 'None (Base)'}</span></div>
                      <div><strong className="text-slate-400">SHA256:</strong> <span className="text-slate-400 text-[10px] break-all">{activePackage.sha256}</span></div>
                      {activePackage.upstreamUrl && (
                        <div>
                          <strong className="text-slate-400">Upstream URL:</strong>{' '}
                          <a href={activePackage.upstreamUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                            {activePackage.upstreamUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUB-TAB 2: FILES */}
                {octopiInspectorTab === 'FILES' && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-slate-400 mb-1">
                      Installed binary and configuration file tree for <strong className="text-white">{activePackage.name}</strong>:
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#05070d] border border-slate-800/80 max-h-40 overflow-y-auto space-y-1 text-slate-300 text-[11px]">
                      {activePackage.installedFiles && activePackage.installedFiles.length > 0 ? (
                        activePackage.installedFiles.map((f, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <FileCode2 className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="select-all">{f}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 italic">No files installed on target drive yet. Install package to extract binary payload.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUB-TAB 3: TRANSACTION QUEUE */}
                {octopiInspectorTab === 'TRANSACTIONS' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Pending system operations:</span>
                      <span className="text-cyan-300 font-bold">{upgradableCount} Upgrades Pending</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#05070d] border border-slate-800 max-h-36 overflow-y-auto space-y-1.5 text-[11px]">
                      {packages.filter(p => p.status === 'UPGRADABLE').map(p => (
                        <div key={p.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ArrowUpCircle className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-white font-bold">{p.name}</span>
                            <span className="text-slate-400">({p.installedVersion} -&gt; {p.version})</span>
                          </div>
                          <span className="text-[10px] text-purple-300 font-mono">[{p.originInstaller?.toUpperCase()}]</span>
                        </div>
                      ))}

                      {upgradableCount === 0 && (
                        <div className="text-slate-500 italic">No pending transactions. All installed packages match repository manifests.</div>
                      )}
                    </div>

                    {upgradableCount > 0 && (
                      <button
                        onClick={handleUpgradeAll}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/20"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Apply Transaction Queue</span>
                      </button>
                    )}
                  </div>
                )}

                {/* SUB-TAB 4: OUTPUT TERMINAL */}
                {octopiInspectorTab === 'OUTPUT' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Live Package Manager Output Stream:</span>
                      <button onClick={() => setOctopiLogs([])} className="hover:text-white">Clear</button>
                    </div>
                    <div className="p-3 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-[11px] space-y-1 max-h-40 overflow-y-auto select-all">
                      {octopiLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`${
                            log.includes('[✓]')
                              ? 'text-emerald-400 font-bold'
                              : log.includes('[!]')
                              ? 'text-rose-400 font-bold'
                              : log.includes('->')
                              ? 'text-amber-300'
                              : log.includes('[+]')
                              ? 'text-cyan-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUB-TAB 5: ORIGIN-LOCK GUARD & CONFLICT SHIELD */}
                {octopiInspectorTab === 'ORIGIN_GUARD' && (
                  <div className="space-y-3 bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/30 text-slate-200">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Origin-Lock Conflict Prevention Policy: ACTIVE</span>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-300">
                      <strong>Rule:</strong> <em className="text-white">An application can only be upgraded, mutated, or removed by its original installer ({activePackage.originInstaller?.toUpperCase() || 'PACMAN'}).</em>
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-black/40 border border-slate-800">
                        <div className="text-slate-400 font-bold">Why Cross-Manager Updates Break Systems:</div>
                        <div className="text-slate-300 mt-0.5">
                          If <code>apt</code> updates a package installed by <code>pacman</code>, it overwrites shared libraries (e.g. <code>/usr/lib/libssl.so</code>), corrupts glibc symbol versions, and leaves pacman's local database desynchronized.
                        </div>
                      </div>
                      <div className="p-2 rounded bg-black/40 border border-slate-800">
                        <div className="text-slate-400 font-bold">Origin Enforcement Active:</div>
                        <div className="text-emerald-300 font-bold mt-0.5">
                          {activePackage.name} is locked to {activePackage.originInstaller?.toUpperCase() || 'PACMAN'}.
                        </div>
                        <div className="text-[10px] text-slate-400">Attempts to run <code>apt upgrade {activePackage.name}</code> are automatically intercepted and rejected.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REPOSITORY CONFIGURATION (Add & Subtract in GUI without file edit) */}
      {/* ========================================================================= */}
      {activeTab === 'REPOSITORIES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#101422] border border-[#1b2338]">
            <div>
              <h4 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Configured System Repositories & Mirrors</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Add, remove, or toggle package repositories in GUI without needing to manually edit <code>/etc/pacman.conf</code> or <code>/etc/apt/sources.list</code>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncDatabases}
                className="px-3 py-1.5 rounded-lg bg-[#182033] hover:bg-[#232d48] text-cyan-300 border border-cyan-500/30 text-xs font-mono flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Test Mirror Latency</span>
              </button>

              <button
                onClick={() => setIsAddRepoModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Repository</span>
              </button>
            </div>
          </div>

          {/* Repositories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            {repositories.map(repo => (
              <div
                key={repo.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  repo.isEnabled 
                    ? 'bg-[#0f1424] border-[#1e273e]' 
                    : 'bg-[#0a0d16] border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">{repo.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${getBackendBadgeColor(repo.backend)}`}>
                        {repo.backend}
                      </span>
                      {repo.isCustom && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{repo.description}</div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleRepository(repo)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        repo.isEnabled 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {repo.isEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>

                    {repo.isCustom && (
                      <button
                        onClick={() => handleRemoveRepository(repo)}
                        className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 transition-all"
                        title="Remove / Subtract Repository"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-2 rounded bg-black/50 border border-slate-800/80 text-[11px] text-cyan-300 break-all select-all mb-2">
                  {repo.url}
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#182030]">
                  <div>Branch: <strong className="text-slate-300">{repo.branchOrSuite}</strong> ({repo.components.join(', ')})</div>
                  <div className="flex items-center gap-2">
                    <span>Latency: <strong className="text-emerald-400">{repo.latencyMs} ms</strong></span>
                    <span>•</span>
                    <span>Status: <strong className="text-cyan-300">{repo.status}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SAFETY & SYSTEM DANGERS AUDIT (Answering user questions)          */}
      {/* ========================================================================= */}
      {activeTab === 'SAFETY_AUDIT' && (
        <div className="space-y-4 font-mono text-xs">
          {/* Header Card */}
          <div className="p-4 rounded-xl bg-[#0e1612] border border-emerald-500/40 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Multi-Package Manager Isolation & System Breakage Prevention</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Running hybrid package systems like <strong>Arch (pacman/yay)</strong> alongside <strong>Debian (apt/dpkg)</strong> and <strong>Windows (winget)</strong> gives immense forensic power, but requires strict safety guards. Here is how our system prevents corruption and a breakdown of the critical dangers that could break hybrid systems.
            </p>
          </div>

          {/* Core Safeguard: Origin-Lock */}
          <div className="p-4 rounded-xl bg-[#101422] border border-[#1b2338] space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>1. The Origin-Locked Update Enforcer (Implemented)</span>
            </div>
            <div className="p-3 rounded-lg bg-[#06080f] border border-slate-800 space-y-2 text-slate-300 text-[11px] leading-relaxed">
              <div>
                <strong className="text-emerald-400">Strict Rule:</strong> Every application is tagged with its <code>originInstaller</code> (<code className="text-cyan-300">pacman</code>, <code className="text-purple-300">yay</code>, <code className="text-rose-300">apt</code>, or <code className="text-blue-300">winget</code>).
              </div>
              <div>
                An application can <strong className="text-white">ONLY</strong> be updated by its original installer. If a user or script invokes <code>apt upgrade</code> on a package originally deployed by <code>pacman</code> (or vice versa), our safety enforcer automatically blocks the execution with an immediate safety notice:
              </div>
              <div className="p-2 rounded bg-black text-rose-300 font-mono text-[10px] select-all border border-rose-900/60">
                [CROSS-MANAGER CONFLICT BLOCKED] Application "dislocker" was installed via "pacman". Mutating via "apt" is prohibited to protect /usr/lib dynamic library symlinks and glibc ABI integrity.
              </div>
            </div>
          </div>

          {/* DANGERS BREAKDOWN: Answering "Are there any other dangers that could potentially break our system?" */}
          <div className="p-4 rounded-xl bg-[#101422] border border-[#1b2338] space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
              <AlertTriangle className="w-4 h-4" />
              <span>Critical Dangers That Could Potentially Break the System</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              {/* Danger 1 */}
              <div className="p-3 rounded-lg bg-[#06080f] border border-slate-800 space-y-1">
                <div className="text-rose-400 font-bold flex items-center gap-1.5">
                  <span>1. glibc Runtime & Dynamic Linker Trampling</span>
                </div>
                <div className="text-slate-300 leading-relaxed">
                  Arch Linux uses rolling bleeding-edge <code>glibc</code> (e.g. 2.40+), while Debian uses frozen stable releases (e.g. 2.36). If <code>apt</code> overwrites <code>/lib64/ld-linux-x86-64.so.2</code> or <code>libc.so.6</code> with Debian's older version, every binary on the system (including <code>ls</code>, <code>bash</code>, and <code>systemd</code>) will immediately crash with a fatal <strong>Segmentation Fault</strong>.
                </div>
              </div>

              {/* Danger 2 */}
              <div className="p-3 rounded-lg bg-[#06080f] border border-slate-800 space-y-1">
                <div className="text-rose-400 font-bold flex items-center gap-1.5">
                  <span>2. Shared Library (.so) Soname Collisions</span>
                </div>
                <div className="text-slate-300 leading-relaxed">
                  Libraries like <code>libssl.so.3</code>, <code>libcrypto.so.3</code>, and <code>libz.so.1</code> reside in <code>/usr/lib</code>. Different distros compile them with differing compiler flags, symbols, and patch sets. Overwriting an Arch library with a Debian build breaks all dependent software with <code>symbol lookup error: undefined symbol</code>.
                </div>
              </div>

              {/* Danger 3 */}
              <div className="p-3 rounded-lg bg-[#06080f] border border-slate-800 space-y-1">
                <div className="text-rose-400 font-bold flex items-center gap-1.5">
                  <span>3. Desynchronized Package Databases</span>
                </div>
                <div className="text-slate-300 leading-relaxed">
                  Debian tracks state in <code>/var/lib/dpkg/status</code> while Arch tracks in <code>/var/lib/pacman/local/</code>. Neither knows what the other installed. If <code>apt-get autoremove</code> removes a shared library that a <code>pacman</code> app requires, the app silently breaks with no warning.
                </div>
              </div>

              {/* Danger 4 */}
              <div className="p-3 rounded-lg bg-[#06080f] border border-slate-800 space-y-1">
                <div className="text-rose-400 font-bold flex items-center gap-1.5">
                  <span>4. Kernel Headers & DKMS Module Incompatibilities</span>
                </div>
                <div className="text-slate-300 leading-relaxed">
                  Compiling out-of-tree kernel drivers (such as ZFS, NVIDIA, WireGuard, or custom forensic Wi-Fi injection drivers) using Debian's DKMS toolchain against an Arch Linux kernel triggers fatal <code>vermagic</code> mismatches or boot-time kernel panics.
                </div>
              </div>

              {/* Danger 5 */}
              <div className="p-3 rounded-lg bg-[#06080f] border border-slate-800 space-y-1">
                <div className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span>5. Partial Upgrades on Arch Linux</span>
                </div>
                <div className="text-slate-300 leading-relaxed">
                  Running <code>pacman -Sy &lt;pkg&gt;</code> without <code>-Syu</code> updates only one package against older system libraries. Arch Linux does not support partial upgrades; doing so can break critical core libraries across the operating system.
                </div>
              </div>

              {/* Danger 6 */}
              <div className="p-3 rounded-lg bg-[#06080f] border border-slate-800 space-y-1">
                <div className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span>6. Live Rescue USB Persistence (COW) Exhaustion</span>
                </div>
                <div className="text-slate-300 leading-relaxed">
                  Live Rescue USBs write through a Copy-On-Write (COW) overlayfs in RAM or persistent flash. Downloading gigabytes of unconstrained package updates can exhaust the overlay partition, causing the filesystem to suddenly freeze and remount read-only.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: OPTIONAL OS FEATURES                                               */}
      {/* ========================================================================= */}
      {activeTab === 'OPTIONAL_FEATURES' && (
        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-[#101422] border border-[#1b2338]">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Modular Kernel & Subsystem Features</span>
            </h4>
            <p className="text-slate-400 text-xs mt-0.5">
              Enable or disable optional system components (KVM, Linux ABI syscall layer, eBPF JIT) without manual module configuration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map(f => (
              <div key={f.id} className="p-3 rounded-xl bg-[#0a0d16] border border-slate-800 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-white font-bold">{f.name}</span>
                    <div className="text-[10px] text-slate-400">{f.category} • {formatBytes(f.payloadSizeBytes)}</div>
                  </div>
                  <button
                    onClick={() => {
                      const res = packageManagementService.toggleFeature(f.id);
                      refreshData();
                      showNotification(res.message, 'info');
                    }}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                      f.enabled ? 'bg-purple-950 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {f.enabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
                <p className="text-slate-300 text-[11px]">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD REPOSITORY MODAL (Add without editing files manually!)                */}
      {/* ========================================================================= */}
      {isAddRepoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn font-mono">
          <div className="bg-[#0f1422] border border-[#24304e] rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1f2942] pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Add New Package Repository</h3>
              </div>
              <button onClick={() => setIsAddRepoModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1 text-xs">
              <div className="text-slate-400 text-[10px]">QUICK PRESETS:</div>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setNewRepoName('BlackArch Linux');
                    setNewRepoBackend('pacman');
                    setNewRepoUrl('https://blackarch.org/blackarch/$repo/os/$arch');
                    setNewRepoBranch('rolling');
                    setNewRepoComponents('blackarch');
                    setNewRepoDescription('Over 2,800 security, reverse-engineering, and digital forensics tools.');
                  }}
                  className="px-2 py-1 rounded bg-[#182033] hover:bg-[#232f4c] text-cyan-300 border border-cyan-500/30"
                >
                  BlackArch (pacman)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewRepoName('Chaotic-AUR Mirror');
                    setNewRepoBackend('yay');
                    setNewRepoUrl('https://geo-mirror.chaotic.cx/chaotic-aur/x86_64');
                    setNewRepoBranch('main');
                    setNewRepoComponents('chaotic-aur');
                    setNewRepoDescription('Automated continuous pre-compiled binary packages from the AUR.');
                  }}
                  className="px-2 py-1 rounded bg-[#182033] hover:bg-[#232f4c] text-purple-300 border border-purple-500/30"
                >
                  Chaotic-AUR (yay)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewRepoName('Ubuntu Noble Security');
                    setNewRepoBackend('apt');
                    setNewRepoUrl('http://security.ubuntu.com/ubuntu');
                    setNewRepoBranch('noble-security');
                    setNewRepoComponents('main, universe');
                    setNewRepoDescription('Ubuntu 24.04 LTS official security patch stream.');
                  }}
                  className="px-2 py-1 rounded bg-[#182033] hover:bg-[#232f4c] text-rose-300 border border-rose-500/30"
                >
                  Ubuntu Security (apt)
                </button>
              </div>
            </div>

            <form onSubmit={handleAddRepository} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Repository Name:</label>
                <input
                  type="text"
                  placeholder="e.g. BlackArch Tools"
                  value={newRepoName}
                  onChange={e => setNewRepoName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#070a12] border border-slate-700 text-white font-mono text-xs focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Backend Manager:</label>
                  <select
                    value={newRepoBackend}
                    onChange={e => setNewRepoBackend(e.target.value as InstallerBackend)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#070a12] border border-slate-700 text-white font-mono text-xs focus:border-indigo-500 outline-none"
                  >
                    <option value="pacman">pacman (Arch Native)</option>
                    <option value="yay">yay (Arch User Repository)</option>
                    <option value="apt">apt (Debian / Kali)</option>
                    <option value="winget">winget (Windows Subsystem)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Branch / Suite:</label>
                  <input
                    type="text"
                    placeholder="e.g. rolling, trixie, main"
                    value={newRepoBranch}
                    onChange={e => setNewRepoBranch(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#070a12] border border-slate-700 text-white font-mono text-xs focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Mirror URL:</label>
                <input
                  type="text"
                  placeholder="https://mirror.example.org/$repo/os/$arch"
                  value={newRepoUrl}
                  onChange={e => setNewRepoUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#070a12] border border-slate-700 text-cyan-300 font-mono text-xs focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Components (comma separated):</label>
                <input
                  type="text"
                  placeholder="main, contrib, extra"
                  value={newRepoComponents}
                  onChange={e => setNewRepoComponents(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#070a12] border border-slate-700 text-white font-mono text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Description (optional):</label>
                <input
                  type="text"
                  placeholder="Brief description of repo purpose..."
                  value={newRepoDescription}
                  onChange={e => setNewRepoDescription(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#070a12] border border-slate-700 text-white font-mono text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="pt-2 border-t border-[#1f2942] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRepoModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  Save to System Repositories
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
