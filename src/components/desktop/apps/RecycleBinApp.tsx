// jb7572_2026-08-27: Linux FreeDesktop.org compliant Recycle Bin & Trash App (0-Loss Original Path Restoration)

import React, { useState } from 'react';
import { useDesktop } from '../../../context/DesktopContext';
import { TrashItem } from '../../../types/desktop';
import { 
  Trash2, 
  RotateCcw, 
  FileCode, 
  FileText, 
  Folder, 
  FolderArchive,
  Search, 
  Layers, 
  Info, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  ShieldAlert, 
  HardDrive, 
  Terminal, 
  LayoutList, 
  LayoutGrid,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const RecycleBinApp: React.FC = () => {
  const { 
    trashItems, 
    restoreTrashItem, 
    restoreAllTrashItems, 
    emptyTrash, 
    deletePermanently,
    openApp, 
    personality, 
    themeConfig,
    addNotification 
  } = useDesktop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeTab, setActiveTab] = useState<'info' | 'trashinfo' | 'preview'>('info');
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  // Filter items based on search query (matches name or original path)
  const filteredItems = trashItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.originalPath.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate total deleted size
  const totalSizeBytes = trashItems.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  const formattedTotalSize = totalSizeBytes > 1024 * 1024 
    ? `${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(totalSizeBytes / 1024).toFixed(1)} KB`;

  const handleCopyPath = (path: string) => {
    navigator.clipboard?.writeText(path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
    addNotification({
      title: 'Path Copied',
      message: `Copied original path: /${path}`,
      type: 'info',
      appId: 'recycle-bin'
    });
  };

  const handleRestoreSelected = () => {
    if (!selectedItem) return;
    restoreTrashItem(selectedItem.id);
    setSelectedItem(null);
  };

  const handleDeleteSelected = () => {
    if (!selectedItem) return;
    deletePermanently(selectedItem.id);
    setSelectedItem(null);
  };

  const getItemIcon = (item: TrashItem) => {
    if (item.type === 'folder') return <Folder className="w-5 h-5 text-amber-400" />;
    const ext = item.name.split('.').pop()?.toLowerCase();
    if (['c', 'h', 'cpp', 'asm', 's', 'py', 'sh', 'json', 'ts', 'tsx'].includes(ext || '')) {
      return <FileCode className="w-5 h-5 text-sky-400" />;
    }
    return <FileText className="w-5 h-5 text-slate-300" />;
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0d13] text-[#e2e8f0] font-sans select-none overflow-hidden relative">
      {/* 1. Header Toolbar */}
      <div className="p-3 border-b border-[#1f2438] bg-[#111420] flex flex-wrap items-center justify-between gap-3">
        {/* Left: App Title & Trash Path Specs */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-inner">
            <Trash2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-wide">
                {personality === 'windows' ? 'Recycle Bin' : 'Trash Storage'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {trashItems.length} items ({formattedTotalSize})
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline-flex items-center gap-1">
                <FileCheck className="w-3 h-3" />
                0-Loss Path Engine
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#64748b] truncate max-w-md">
              {personality === 'windows' 
                ? 'Location: C:\\$Recycle.Bin • Full Original Path & File Identity Preservation'
                : 'FreeDesktop.org Trash Spec • ~/.local/share/Trash/files & info'
              }
            </div>
          </div>
        </div>

        {/* Right: Actions & Filter */}
        <div className="flex items-center gap-2">
          {/* Restore All Button */}
          <button
            disabled={trashItems.length === 0}
            onClick={restoreAllTrashItems}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            title="Restore all files back to their exact original directory paths"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Restore All Items</span>
          </button>

          {/* Empty Trash Button */}
          <button
            disabled={trashItems.length === 0}
            onClick={() => setShowEmptyConfirm(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            title="Permanently empty all items from Trash"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Empty Recycle Bin</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#181d2c] border border-[#272f45] rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-sky-500 text-white' : 'text-[#8292ab] hover:text-white'}`}
              title="List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-sky-500 text-white' : 'text-[#8292ab] hover:text-white'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Filter */}
          <div className="relative w-40 sm:w-52">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trash / paths..."
              className="w-full pl-7 pr-2 py-1.5 text-xs rounded-xl bg-[#08090f] border border-[#272f45] text-white focus:outline-none focus:border-rose-500 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-2 top-2" />
          </div>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Trashed Items List / Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-3xl bg-[#141824] border border-[#272f45] flex items-center justify-center text-[#64748b] mb-4 shadow-xl">
                <Trash2 className="w-8 h-8 stroke-1 text-[#475569]" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                {trashItems.length === 0 ? 'Recycle Bin is Empty' : 'No Trashed Files Match Search'}
              </h3>
              <p className="text-xs text-[#64748b] max-w-sm">
                {trashItems.length === 0 
                  ? 'Files deleted from File Explorer, Mission Control Cockpit, or Terminal are preserved here with full original directory paths and metadata.'
                  : 'Try changing your search term to find files or original paths.'
                }
              </p>
              {trashItems.length === 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => openApp('file-explorer')}
                    className="px-3 py-1.5 rounded-xl bg-[#1c2233] hover:bg-[#28314a] text-sky-300 border border-[#2e3752] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    Open File Explorer
                  </button>
                </div>
              )}
            </div>
          ) : viewMode === 'list' ? (
            /* Table / List View */
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead className="sticky top-0 bg-[#0d101a] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-[#1f2438] z-10">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Name</th>
                    <th className="py-2.5 px-4 font-semibold">Original Path (0-Loss)</th>
                    <th className="py-2.5 px-4 font-semibold hidden md:table-cell">Date Deleted</th>
                    <th className="py-2.5 px-4 font-semibold hidden lg:table-cell">Size</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181d2e]">
                  {filteredItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    const dateFormatted = new Date(item.deletionDate).toLocaleString();

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        onDoubleClick={() => restoreTrashItem(item.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-rose-500/15 text-white font-medium' 
                            : 'hover:bg-[#131724] text-[#cbd5e1]'
                        }`}
                      >
                        {/* Name */}
                        <td className="py-2.5 px-4 flex items-center gap-2.5">
                          {getItemIcon(item)}
                          <span className="font-semibold truncate max-w-[200px]">{item.name}</span>
                        </td>

                        {/* Exact Original Path */}
                        <td className="py-2.5 px-4">
                          <span className="text-sky-400 bg-black/40 px-2 py-0.5 rounded border border-sky-500/20 text-[11px] truncate inline-block max-w-[320px]">
                            /{item.originalPath}
                          </span>
                        </td>

                        {/* Date Deleted */}
                        <td className="py-2.5 px-4 text-[#94a3b8] text-[11px] hidden md:table-cell">
                          {dateFormatted}
                        </td>

                        {/* Size */}
                        <td className="py-2.5 px-4 text-[#94a3b8] text-[11px] hidden lg:table-cell">
                          {(item.sizeBytes / 1024).toFixed(1)} KB
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              restoreTrashItem(item.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold inline-flex items-center gap-1 transition-colors"
                            title="Restore back to original directory"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid / Tile View */
            <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    onDoubleClick={() => restoreTrashItem(item.id)}
                    className={`p-3 rounded-2xl border flex flex-col items-center text-center group transition-all relative ${
                      isSelected
                        ? 'bg-rose-500/20 border-rose-500 shadow-lg text-white'
                        : 'bg-[#131622] border-[#22273a] hover:border-[#38415c] text-[#cbd5e1]'
                    }`}
                  >
                    <div className="p-3 rounded-xl bg-[#0a0c12] mb-2 group-hover:scale-105 transition-transform shadow-inner">
                      {getItemIcon(item)}
                    </div>
                    <span className="text-xs font-mono font-bold truncate w-full px-1">{item.name}</span>
                    <span className="text-[10px] text-sky-400 font-mono truncate w-full mt-0.5">
                      /{item.originalPath}
                    </span>
                    <span className="text-[9px] text-[#64748b] font-mono mt-1">
                      {(item.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Selected Item Property & 0-Loss Restoration Panel */}
        {selectedItem && (
          <div className="w-80 sm:w-96 border-l border-[#1f2438] bg-[#0e111a] flex flex-col overflow-hidden">
            {/* Panel Header */}
            <div className="p-4 border-b border-[#1f2438] bg-[#121624] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Trash Object Inspector
                </span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-xs text-[#64748b] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-[#1f2438] bg-[#0a0c14] text-xs font-mono">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                  activeTab === 'info' 
                    ? 'border-rose-500 text-white font-bold bg-rose-500/10' 
                    : 'border-transparent text-[#64748b] hover:text-white'
                }`}
              >
                Original Path
              </button>
              <button
                onClick={() => setActiveTab('trashinfo')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                  activeTab === 'trashinfo' 
                    ? 'border-rose-500 text-white font-bold bg-rose-500/10' 
                    : 'border-transparent text-[#64748b] hover:text-white'
                }`}
              >
                .trashinfo Spec
              </button>
              {selectedItem.content && (
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                    activeTab === 'preview' 
                      ? 'border-rose-500 text-white font-bold bg-rose-500/10' 
                      : 'border-transparent text-[#64748b] hover:text-white'
                  }`}
                >
                  File Preview
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
              {activeTab === 'info' && (
                <div className="space-y-3.5">
                  {/* Name & Type */}
                  <div className="p-3 rounded-xl bg-[#141826] border border-[#242b40] flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-black/40">
                      {getItemIcon(selectedItem)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-white font-bold text-sm truncate">{selectedItem.name}</div>
                      <div className="text-[#64748b] text-[10px] uppercase">
                        {selectedItem.type} • {(selectedItem.sizeBytes / 1024).toFixed(2)} KB
                      </div>
                    </div>
                  </div>

                  {/* Guaranteed 0-Loss Original Path */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-[#64748b] font-bold uppercase tracking-wider">
                      <span>Exact Original Directory Path</span>
                      <button
                        onClick={() => handleCopyPath(selectedItem.originalPath)}
                        className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedPath ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-black/60 border border-sky-500/30 text-sky-300 break-all text-[11px] leading-relaxed shadow-inner">
                      /{selectedItem.originalPath}
                    </div>
                    <p className="text-[10px] text-[#64748b] leading-tight">
                      When restored, this file will be reconstructed at this exact location with no data or name truncation.
                    </p>
                  </div>

                  {/* Metadata fields */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-[#141826] border border-[#242b40]">
                      <span className="text-[#64748b] block text-[9px] uppercase">Deletion Timestamp</span>
                      <span className="text-slate-200 text-[10px]">
                        {new Date(selectedItem.deletionDate).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#141826] border border-[#242b40]">
                      <span className="text-[#64748b] block text-[9px] uppercase">MIME Standard</span>
                      <span className="text-slate-200 text-[10px] truncate block">
                        {selectedItem.trashInfo.mimeType}
                      </span>
                    </div>
                  </div>

                  {selectedItem.description && (
                    <div className="p-2.5 rounded-lg bg-[#141826] border border-[#242b40]">
                      <span className="text-[#64748b] block text-[9px] uppercase">Description</span>
                      <span className="text-[#94a3b8] text-[11px]">{selectedItem.description}</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'trashinfo' && (
                <div className="space-y-2">
                  <div className="text-[10px] text-[#64748b] uppercase font-bold">
                    FreeDesktop .trashinfo Metadata Header
                  </div>
                  <pre className="p-3 rounded-xl bg-black/70 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed overflow-x-auto shadow-inner">
{`[Trash Info]
Path=/${selectedItem.originalPath}
DeletionDate=${selectedItem.trashInfo.deletionDate}
SpecVersion=${selectedItem.trashInfo.specVersion}
Permissions=${selectedItem.trashInfo.permissions}
MimeType=${selectedItem.trashInfo.mimeType}
DeletedBy=${selectedItem.trashInfo.deletedBy}
Checksum=${selectedItem.trashInfo.hash}`}
                  </pre>
                  <p className="text-[10px] text-[#64748b]">
                    Compliant with the FreeDesktop.org Desktop Trash Can Specification 1.0.
                  </p>
                </div>
              )}

              {activeTab === 'preview' && selectedItem.content && (
                <div className="space-y-2">
                  <div className="text-[10px] text-[#64748b] uppercase font-bold flex items-center justify-between">
                    <span>Source Snapshot</span>
                    <button
                      onClick={() => openApp('notepad', `Trash Preview: ${selectedItem.name}`, { initialContent: selectedItem.content, filename: selectedItem.name })}
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Open in Notepad</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-black/70 border border-[#272f45] text-[#94a3b8] text-[10px] max-h-60 overflow-y-auto leading-normal font-mono">
                    {selectedItem.content}
                  </pre>
                </div>
              )}
            </div>

            {/* Bottom Actions for Selected Item */}
            <div className="p-4 border-t border-[#1f2438] bg-[#111420] space-y-2">
              <button
                onClick={handleRestoreSelected}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restore to Original Path</span>
              </button>

              <div className="flex gap-2">
                {selectedItem.content && (
                  <button
                    onClick={() => openApp('notepad', `Edit: ${selectedItem.name}`, { initialContent: selectedItem.content, filename: selectedItem.name })}
                    className="flex-1 py-2 rounded-xl bg-[#1c2233] hover:bg-[#28314a] text-sky-300 border border-[#2e3752] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                )}
                <button
                  onClick={handleDeleteSelected}
                  className="flex-1 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Forever</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Empty Confirmation Modal */}
      {showEmptyConfirm && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#121624] border border-rose-500/40 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Empty Recycle Bin?</h4>
                <p className="text-xs text-[#94a3b8]">This will permanently delete {trashItems.length} items.</p>
              </div>
            </div>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Are you sure you want to permanently purge all items from the Linux Trash (~/.local/share/Trash)? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowEmptyConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[#1c2233] hover:bg-[#28314a] text-[#cbd5e1] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  emptyTrash();
                  setShowEmptyConfirm(false);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-950/50"
              >
                Yes, Empty Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bottom System Status Bar */}
      <div className="h-7 px-4 bg-[#0a0c12] border-t border-[#1f2438] flex items-center justify-between text-[10px] font-mono text-[#64748b]">
        <div className="flex items-center gap-3">
          <span>{trashItems.length} items</span>
          <span>•</span>
          <span>Footprint: {formattedTotalSize}</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          <span>Exact Path Preservation Active</span>
        </div>
      </div>
    </div>
  );
};
