// jb7572_2026-08-25: Dual-Persona File Explorer App with Drag-and-Drop Installation

import React, { useState, useRef } from 'react';
import { useDesktop } from '../../../context/DesktopContext';
import { TreeNode } from '../../../types';
import { findTreeNode } from '../../../utils/vfsUtils';
import { 
  Folder, 
  FileCode, 
  FileText, 
  HardDrive, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  Search, 
  Layers, 
  Cpu, 
  ChevronRight,
  Eye,
  FilePlus,
  RefreshCw,
  Terminal,
  UploadCloud,
  FileUp,
  Sparkles,
  Trash2,
  Plus,
  LayoutGrid,
  List,
  Sliders,
  Database,
  ChevronDown,
  Copy,
  Move,
  ArrowRightLeft,
  ShieldCheck as ShieldCheckIcon,
  Download,
  Radio
} from 'lucide-react';
import { backgroundJobService, BackgroundJob } from '../../../services/backgroundJobService';
import { systemConfigService } from '../../../services/systemConfigService';

export const FileExplorerApp: React.FC = () => {
  const { 
    personality, 
    openApp, 
    treeData, 
    placeFileInTree, 
    addNotification, 
    moveToTrash,
    addDesktopIcon
  } = useDesktop();
  const [currentPath, setCurrentPath] = useState<string>('home/projects/SecureCurtain/sys');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<TreeNode | null>(null);
  const [isDragOverFolder, setIsDragOverFolder] = useState(false);
  const [showViewOptions, setShowViewOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Windows Registry State for Explorer
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => 
    (systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Visual', 'ViewMode', 'grid') as 'grid' | 'list') || 'grid'
  );
  const [showHidden, setShowHidden] = useState<boolean>(() => 
    Number(systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', 'Hidden', 1)) === 1
  );
  const [hideFileExt, setHideFileExt] = useState<boolean>(() => 
    Number(systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', 'HideFileExt', 0)) === 1
  );

  // Reactive subscription to registry changes
  React.useEffect(() => {
    const unsub = systemConfigService.subscribeToRegistry(() => {
      const vm = systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Visual', 'ViewMode', 'grid') as 'grid' | 'list';
      const hid = Number(systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', 'Hidden', 1)) === 1;
      const ext = Number(systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', 'HideFileExt', 0)) === 1;
      setViewMode(vm || 'grid');
      setShowHidden(hid);
      setHideFileExt(ext);
    });
    return unsub;
  }, []);

  const handleUpdateRegistrySetting = (path: string, valueName: string, value: any, type: 'REG_DWORD' | 'REG_SZ') => {
    systemConfigService.setRegistryValue('HKCU', path, valueName, value, type);
    addNotification({
      title: 'Registry Key Updated',
      message: `HKCU\\${path}\\${valueName} = ${value}`,
      type: 'info',
      appId: 'system-config'
    });
  };

  // Background Operations status inside File Explorer
  const [activeJobs, setActiveJobs] = useState<BackgroundJob[]>(() => backgroundJobService.getActiveJobs());

  React.useEffect(() => {
    const unsub = backgroundJobService.subscribe(jobs => {
      setActiveJobs(jobs.filter(j => j.status === 'RUNNING'));
    });
    return () => unsub();
  }, []);

  // Format Path based on OS Personality
  const displayPath = React.useMemo(() => {
    if (personality === 'windows') {
      return currentPath.replace(/^home\/projects\/SecureCurtain/, 'C:\\SecureCurtain').replace(/\//g, '\\');
    }
    return `/${currentPath}`;
  }, [currentPath, personality]);

  // Melded canonical helper using unified findTreeNode
  const currentNode = findTreeNode(treeData, { query: currentPath, by: 'path' }) || treeData;
  const items = (currentNode.children || []).filter(item => {
    if (!showHidden && item.name.startsWith('.')) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatItemName = (name: string, isFolder: boolean) => {
    if (!isFolder && hideFileExt) {
      const lastDot = name.lastIndexOf('.');
      if (lastDot > 0) return name.substring(0, lastDot);
    }
    return name;
  };

  const handleNavigate = (child: TreeNode) => {
    if (child.type === 'folder') {
      setCurrentPath(child.path);
      setSelectedItem(null);
    } else {
      setSelectedItem(child);
    }
  };

  const handleGoUp = () => {
    const parts = currentPath.split('/');
    if (parts.length > 1) {
      parts.pop();
      const parentPath = parts.join('/');
      setCurrentPath(parentPath);
      setSelectedItem(null);
    }
  };

  // Drag and drop into current folder
  const handleFolderDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverFolder(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      (Array.from(e.dataTransfer.files) as File[]).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          placeFileInTree(file.name, currentPath, content, `Imported via Drag & Drop into ${currentPath}`);
          addNotification({
            title: 'File Installed',
            message: `Installed ${file.name} directly into /${currentPath}`,
            type: 'success',
            appId: 'file-explorer'
          });
        };
        reader.readAsText(file);
      });
    }
  };

  const handleManualImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      (Array.from(e.target.files) as File[]).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          placeFileInTree(file.name, currentPath, content, `Imported via File Explorer into ${currentPath}`);
          addNotification({
            title: 'File Installed',
            message: `Installed ${file.name} into /${currentPath}`,
            type: 'success',
            appId: 'file-explorer'
          });
        };
        reader.readAsText(file);
      });
    }
  };

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setIsDragOverFolder(true); }}
      onDragLeave={() => setIsDragOverFolder(false)}
      onDrop={handleFolderDrop}
      className="h-full flex flex-col bg-[#0f1117] text-[#e2e8f0] font-sans select-none overflow-hidden relative"
    >
      {/* Drag Over Overlay */}
      {isDragOverFolder && (
        <div className="absolute inset-0 z-40 bg-[#0b1329]/90 border-2 border-dashed border-sky-400 m-2 rounded-2xl flex flex-col items-center justify-center text-center pointer-events-none">
          <UploadCloud className="w-12 h-12 text-sky-400 mb-2 animate-bounce" />
          <span className="text-sm font-bold text-white">Drop file to install into:</span>
          <code className="text-xs text-sky-300 font-mono mt-1 bg-black/40 px-2 py-1 rounded">
            {displayPath}
          </code>
        </div>
      )}

      {/* Top Address & Navigation Bar */}
      <div className="p-3 border-b border-[#222738] bg-[#141722] flex items-center gap-2">
        <button
          onClick={handleGoUp}
          className="p-1.5 rounded-lg bg-[#1c2130] hover:bg-[#282f45] text-[#94a3b8] hover:text-white transition-colors"
          title="Up one folder"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setCurrentPath('home/projects/SecureCurtain/sys'); setSelectedItem(null); }}
          className="p-1.5 rounded-lg bg-[#1c2130] hover:bg-[#282f45] text-[#94a3b8] hover:text-white transition-colors"
          title="Root / Home"
        >
          <HardDrive className="w-4 h-4 text-sky-400" />
        </button>

        {/* Address Bar */}
        <div className="flex-1 px-3 py-1.5 rounded-lg bg-[#0b0c12] border border-[#262c3e] flex items-center gap-2 font-mono text-xs text-sky-300 overflow-hidden">
          <span className="text-[#64748b]">Location:</span>
          <span className="truncate">{displayPath}</span>
        </div>

        {/* Import Action */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-2.5 py-1 text-xs font-mono rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-colors"
          title="Import file into this folder"
        >
          <FileUp className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Import File</span>
        </button>

        {/* Download in Background (continues when locked) */}
        <button
          onClick={() => {
            const dlJob = backgroundJobService.startDownload(
              'firmware_microcode_patch_2026.img',
              'https://airgap.internal.securecurtain/firmware_patch.img',
              14500000
            );
            addNotification({
              title: 'Download Started',
              message: `Downloading ${dlJob.name} in background (Persists during lock).`,
              type: 'info'
            });
          }}
          className="px-2.5 py-1 text-xs font-mono rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
          title="Download remote microcode patch in background (persists when workstation is locked)"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Download ISO</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleManualImport} 
          className="hidden" 
          multiple
        />

        {/* View Mode & Registry Options Controls */}
        <div className="flex items-center gap-1">
          {/* View Mode Toggle Button */}
          <button
            onClick={() => {
              const nextMode = viewMode === 'grid' ? 'list' : 'grid';
              setViewMode(nextMode);
              handleUpdateRegistrySetting(
                'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Visual',
                'ViewMode',
                nextMode,
                'REG_SZ'
              );
            }}
            className="p-1.5 rounded-lg bg-[#151926] hover:bg-[#202638] text-[#94a3b8] hover:text-white border border-[#262c3e] transition-colors"
            title={`Switch to ${viewMode === 'grid' ? 'Details / List' : 'Icons / Grid'} View (HKCU\\Explorer\\Visual)`}
          >
            {viewMode === 'grid' ? <List className="w-3.5 h-3.5 text-sky-400" /> : <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />}
          </button>

          {/* Explorer Options Popover */}
          <div className="relative">
            <button
              onClick={() => setShowViewOptions(!showViewOptions)}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors border ${
                showViewOptions 
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-300' 
                  : 'bg-[#151926] hover:bg-[#202638] border-[#262c3e] text-[#94a3b8]'
              }`}
              title="Folder & View Registry Options (HKCU\...\Explorer\Advanced)"
            >
              <Sliders className="w-3.5 h-3.5" />
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showViewOptions && (
              <div className="absolute right-0 top-9 z-40 w-72 bg-[#161924] border border-[#2d364d] rounded-lg shadow-2xl p-3 text-xs space-y-3 font-mono text-[#cbd5e1]">
                <div className="flex items-center justify-between border-b border-[#252c3f] pb-2">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <Database className="w-3.5 h-3.5 text-sky-400" />
                    <span>Explorer Registry Policy</span>
                  </div>
                  <button
                    onClick={() => setShowViewOptions(false)}
                    className="text-[#64748b] hover:text-white px-1 rounded"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span>Show Hidden Files</span>
                    <input
                      type="checkbox"
                      checked={showHidden}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setShowHidden(val);
                        handleUpdateRegistrySetting(
                          'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced',
                          'Hidden',
                          val ? 1 : 2,
                          'REG_DWORD'
                        );
                      }}
                      className="accent-sky-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span>Hide Known File Extensions</span>
                    <input
                      type="checkbox"
                      checked={hideFileExt}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setHideFileExt(val);
                        handleUpdateRegistrySetting(
                          'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced',
                          'HideFileExt',
                          val ? 1 : 0,
                          'REG_DWORD'
                        );
                      }}
                      className="accent-sky-500 rounded"
                    />
                  </label>
                </div>

                <div className="pt-2 border-t border-[#252c3f] flex items-center justify-between">
                  <button
                    onClick={() => {
                      setShowViewOptions(false);
                      openApp('system-config');
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
                  >
                    <Database className="w-3 h-3" />
                    <span>Open Registry Editor</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filter Input */}
        <div className="relative w-36 sm:w-48">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter folder..."
            className="w-full pl-7 pr-2 py-1 text-xs rounded-lg bg-[#0b0c12] border border-[#262c3e] text-white focus:outline-none focus:border-sky-500 font-mono"
          />
          <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-2 top-2" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tree Quick Access */}
        <div className="w-52 border-r border-[#222738] bg-[#121520] p-3 space-y-4 overflow-y-auto hidden sm:block">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748b] font-bold">
            {personality === 'windows' ? 'Quick Access / Drives' : 'Places & Mounts'}
          </div>
          <div className="space-y-1 text-xs">
            <button
              onClick={() => setCurrentPath('home/projects/SecureCurtain/sys')}
              className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left transition-colors ${
                currentPath === 'home/projects/SecureCurtain/sys' ? 'bg-sky-500/20 text-sky-300 font-medium' : 'text-[#94a3b8] hover:bg-[#1a1f2e]'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              <span>{personality === 'windows' ? 'OS Drive (C:)' : 'sys / root (/)'}</span>
            </button>
            <button
              onClick={() => setCurrentPath('home/projects/SecureCurtain/sys/kernel')}
              className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left transition-colors ${
                currentPath.includes('kernel') ? 'bg-sky-500/20 text-sky-300 font-medium' : 'text-[#94a3b8] hover:bg-[#1a1f2e]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Kernel Core</span>
            </button>
            <button
              onClick={() => setCurrentPath('home/projects/SecureCurtain/sys/subsystems')}
              className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left transition-colors ${
                currentPath.includes('subsystems') ? 'bg-sky-500/20 text-sky-300 font-medium' : 'text-[#94a3b8] hover:bg-[#1a1f2e]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Subsystems</span>
            </button>
          </div>
        </div>

        {/* Center Canvas of Files & Folders (Grid or List View) */}
        <div className="flex-1 p-4 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#64748b] text-xs">
              <Folder className="w-12 h-12 stroke-1 mb-2 opacity-40" />
              <p>Folder is empty or no files match search.</p>
              <p className="text-[11px] text-[#475569] mt-1">Drag and drop files here to install into this directory.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {items.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const isFolder = item.type === 'folder';
                const displayName = formatItemName(item.name, isFolder);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item)}
                    className={`p-3 rounded-xl border flex flex-col items-center text-center group transition-all ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-500 shadow-md text-white'
                        : 'bg-[#151926] border-[#22273a] hover:border-[#38415c] text-[#cbd5e1]'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-[#0e1018] mb-2 group-hover:scale-105 transition-transform">
                      {isFolder ? (
                        <Folder className="w-8 h-8 text-sky-400 fill-sky-400/20" />
                      ) : item.name.endsWith('.c') || item.name.endsWith('.h') || item.name.endsWith('.asm') ? (
                        <FileCode className="w-8 h-8 text-purple-400" />
                      ) : (
                        <FileText className="w-8 h-8 text-amber-400" />
                      )}
                    </div>
                    <span className="text-xs font-mono font-medium truncate w-full px-1" title={item.name}>
                      {displayName}
                    </span>
                    <span className="text-[10px] text-[#64748b] truncate w-full">
                      {isFolder ? `${item.children?.length || 0} items` : (item.description || 'Source file')}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Details / List View */
            <div className="border border-[#22273a] rounded-xl overflow-hidden bg-[#11131c]">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-[#161a26] border-b border-[#22273a] text-[11px] font-mono text-[#64748b] font-semibold">
                <span className="col-span-6 sm:col-span-5">Name</span>
                <span className="col-span-3 sm:col-span-3">Type</span>
                <span className="col-span-3 sm:col-span-4">Details</span>
              </div>
              <div className="divide-y divide-[#1e2334]">
                {items.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const isFolder = item.type === 'folder';
                  const displayName = formatItemName(item.name, isFolder);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNavigate(item)}
                      className={`grid grid-cols-12 gap-2 px-3 py-2 items-center cursor-pointer transition-colors text-xs font-mono ${
                        isSelected 
                          ? 'bg-sky-500/20 text-white' 
                          : 'hover:bg-[#181d2c] text-[#cbd5e1]'
                      }`}
                    >
                      <div className="col-span-6 sm:col-span-5 flex items-center gap-2 truncate">
                        {isFolder ? (
                          <Folder className="w-4 h-4 text-sky-400 shrink-0" />
                        ) : item.name.endsWith('.c') || item.name.endsWith('.h') || item.name.endsWith('.asm') ? (
                          <FileCode className="w-4 h-4 text-purple-400 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span className="truncate" title={item.name}>{displayName}</span>
                      </div>
                      <span className="col-span-3 sm:col-span-3 text-[11px] text-[#94a3b8] truncate">
                        {isFolder ? 'File folder' : item.name.split('.').pop()?.toUpperCase() + ' File'}
                      </span>
                      <span className="col-span-3 sm:col-span-4 text-[11px] text-[#64748b] truncate">
                        {isFolder ? `${item.children?.length || 0} items` : (item.description || `${item.content?.length || 0} bytes`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Details Panel (if item selected) */}
        {selectedItem && (
          <div className="w-64 border-l border-[#222738] bg-[#121520] p-4 space-y-4 overflow-y-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-sky-300 border-b border-[#222738] pb-2">
              Item Properties
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div>
                <span className="text-[#64748b] block text-[10px]">NAME</span>
                <span className="text-white font-semibold">{selectedItem.name}</span>
              </div>
              <div>
                <span className="text-[#64748b] block text-[10px]">PATH</span>
                <span className="text-sky-400 text-[11px] break-all">{selectedItem.path}</span>
              </div>
              {selectedItem.description && (
                <div>
                  <span className="text-[#64748b] block text-[10px]">DESCRIPTION</span>
                  <span className="text-[#94a3b8] text-[11px]">{selectedItem.description}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-[#222738]">
              {selectedItem.content && (
                <button
                  onClick={() => openApp('notepad', `Edit: ${selectedItem.name}`, { initialContent: selectedItem.content, filename: selectedItem.name })}
                  className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Open in Notepad
                </button>
              )}

              <button
                onClick={() => {
                  // If it's a known executable or notepad file, create a desktop shortcut
                  addDesktopIcon('notepad');
                  addNotification({
                    title: 'Shortcut Created',
                    message: `Created desktop shortcut for ${selectedItem.name}`,
                    type: 'success'
                  });
                }}
                className="w-full py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                title="Create a shortcut icon on the desktop canvas"
              >
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                Send Shortcut to Desktop
              </button>

              {/* Background Operations (Runs when locked) */}
              <div className="pt-2 border-t border-[#222738] space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>Background Operations (Lock-Safe)</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      const job = backgroundJobService.startCopyFile(
                        selectedItem.path,
                        `home/projects/SecureCurtain/backup/${selectedItem.name}`,
                        selectedItem.sizeBytes || 4500000
                      );
                      addNotification({
                        title: 'Background Copy Queued',
                        message: `Copying ${selectedItem.name} to /backup. Runs continuously even if locked.`,
                        type: 'info'
                      });
                    }}
                    className="py-1.5 px-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono flex items-center justify-center gap-1 transition-colors"
                    title="Copy file in background (persists through lock)"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Job</span>
                  </button>

                  <button
                    onClick={() => {
                      const job = backgroundJobService.startMoveFile(
                        selectedItem.path,
                        `home/projects/SecureCurtain/archive/${selectedItem.name}`,
                        selectedItem.sizeBytes || 3200000
                      );
                      addNotification({
                        title: 'Background Move Queued',
                        message: `Moving ${selectedItem.name} to /archive. Runs continuously even if locked.`,
                        type: 'info'
                      });
                    }}
                    className="py-1.5 px-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono flex items-center justify-center gap-1 transition-colors"
                    title="Move file in background"
                  >
                    <Move className="w-3 h-3" />
                    <span>Move Job</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      const job = backgroundJobService.startTransferFile(
                        selectedItem.name,
                        `sftp://airgap-vault-02.internal.lan/volume1/${selectedItem.name}`,
                        selectedItem.sizeBytes || 7800000
                      );
                      addNotification({
                        title: 'SFTP Transfer Queued',
                        message: `Streaming ${selectedItem.name} to remote air-gap repository.`,
                        type: 'info'
                      });
                    }}
                    className="py-1.5 px-2 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 text-[11px] font-mono flex items-center justify-center gap-1 transition-colors"
                    title="Transfer over SFTP in background"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Transfer</span>
                  </button>

                  <button
                    onClick={() => {
                      const job = backgroundJobService.startAntiMalwareScan(
                        selectedItem.path,
                        selectedItem.name
                      );
                      addNotification({
                        title: 'Anti-Malware Scan Queued',
                        message: `Deep HIPS scan running on ${selectedItem.name}.`,
                        type: 'info'
                      });
                    }}
                    className="py-1.5 px-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-[11px] font-mono flex items-center justify-center gap-1 transition-colors"
                    title="Deep scan with HIPS heuristics"
                  >
                    <ShieldCheckIcon className="w-3 h-3 text-red-400" />
                    <span>Scan Item</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  moveToTrash(selectedItem);
                  setSelectedItem(null);
                }}
                className="w-full py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                title="Send to FreeDesktop Recycle Bin with 0-loss path preservation"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                Move to Recycle Bin
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-7 px-4 bg-[#0d0f17] border-t border-[#222738] flex items-center justify-between text-[10px] font-mono text-[#64748b]">
        <span>{items.length} items listed</span>

        {activeJobs.length > 0 ? (
          <div className="flex items-center gap-2 text-cyan-400">
            <Radio className="w-3 h-3 animate-spin text-cyan-400" />
            <span className="font-semibold text-white">Active Background Task:</span>
            <span>{activeJobs[0].name} ({activeJobs[0].progress.toFixed(0)}%)</span>
            <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-cyan-400 h-full transition-all duration-300"
                style={{ width: `${activeJobs[0].progress}%` }}
              />
            </div>
          </div>
        ) : (
          <span>Drag & drop files to install into current directory</span>
        )}
      </div>
    </div>
  );
};
