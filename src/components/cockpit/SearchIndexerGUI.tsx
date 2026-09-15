// jb7572_2026-08-24: Category 7 - Search & Indexing GUI Component (find, grep, ripgrep, catalog)
import React, { useState, useEffect } from 'react';
import { 
  IndexedFileRecord, 
  SearchResultItem, 
  IndexCatalogStats, 
  FileTypeCategory 
} from '../../types';
import { searchIndexingService } from '../../services/searchIndexingService';
import { 
  Search, 
  FileCode, 
  FileText, 
  Database, 
  FolderTree, 
  Terminal, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  Sliders, 
  Eye, 
  Code, 
  FileCheck, 
  FileSearch,
  Hash,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Filter
} from 'lucide-react';

interface SearchIndexerGUIProps {
  onRunCliCommand?: (cmd: string) => void;
}

type SearchMode = 'RIPGREP_CONTENT' | 'FIND_FILES' | 'INDEX_CATALOG';

export const SearchIndexerGUI: React.FC<SearchIndexerGUIProps> = ({ onRunCliCommand }) => {
  const [activeMode, setActiveMode] = useState<SearchMode>('RIPGREP_CONTENT');

  // Search parameters
  const [searchQuery, setSearchQuery] = useState('PAGE_PRESENT');
  const [pathPrefix, setPathPrefix] = useState('/');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('ALL');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  // Results & Catalog
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [catalogStats, setCatalogStats] = useState<IndexCatalogStats>(searchIndexingService.getStats());
  const [allFiles, setAllFiles] = useState<IndexedFileRecord[]>(searchIndexingService.getFiles());

  // Detailed File Inspector Modal
  const [inspectingFile, setInspectingFile] = useState<IndexedFileRecord | null>(null);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);

  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' } | null>(null);

  const showNotification = (message: string, type: 'info' | 'success' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Perform search based on mode and filters
  const executeSearch = () => {
    if (activeMode === 'RIPGREP_CONTENT') {
      const searchRes = searchIndexingService.grepContent({
        query: searchQuery,
        pathPrefix,
        fileType: fileTypeFilter,
        caseSensitive,
        useRegex
      });
      setResults(searchRes);
    } else if (activeMode === 'FIND_FILES') {
      const findRes = searchIndexingService.findFiles({
        query: searchQuery,
        pathPrefix,
        fileType: fileTypeFilter,
        caseSensitive
      });
      setResults(findRes);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [searchQuery, pathPrefix, fileTypeFilter, caseSensitive, useRegex, activeMode]);

  const handleRebuildCatalog = () => {
    const updated = searchIndexingService.rebuildIndex();
    setCatalogStats(updated);
    setAllFiles(searchIndexingService.getFiles());
    executeSearch();
    showNotification('System Index Catalog rebuilt successfully (100% synchronized).', 'success');
  };

  const handleToggleStatus = () => {
    const updated = searchIndexingService.toggleIndexerStatus();
    setCatalogStats(updated);
    showNotification(`Background indexer state toggled to ${updated.status}.`, 'info');
  };

  const openFileViewer = (file: IndexedFileRecord, lineNum?: number) => {
    setInspectingFile(file);
    setHighlightLine(lineNum || null);
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const totalMatchesCount = results.reduce((sum, r) => sum + (r.matches.length || 1), 0);

  return (
    <div className="bg-[#0c0c0e] border border-[#222] rounded-xl p-5 shadow-2xl text-[#ececf1] space-y-5 font-sans">
      
      {/* Top Header / Mode Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            id="tab_btn_ripgrep"
            onClick={() => {
              setActiveMode('RIPGREP_CONTENT');
              if (!searchQuery) setSearchQuery('PAGE_PRESENT');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeMode === 'RIPGREP_CONTENT'
                ? 'bg-gradient-to-r from-emerald-900/60 to-emerald-800/40 text-emerald-200 border border-emerald-500/40 shadow-sm'
                : 'bg-[#141416] text-[#888] hover:text-[#ccc] border border-[#26262b]'
            }`}
          >
            <FileSearch className="w-3.5 h-3.5 text-emerald-400" />
            <span>Full-Text ripgrep (rg / grep)</span>
          </button>

          <button
            id="tab_btn_find_files"
            onClick={() => setActiveMode('FIND_FILES')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeMode === 'FIND_FILES'
                ? 'bg-gradient-to-r from-blue-900/60 to-blue-800/40 text-blue-200 border border-blue-500/40 shadow-sm'
                : 'bg-[#141416] text-[#888] hover:text-[#ccc] border border-[#26262b]'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-blue-400" />
            <span>File & Path Finder (fd / find)</span>
          </button>

          <button
            id="tab_btn_catalog_indexer"
            onClick={() => setActiveMode('INDEX_CATALOG')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeMode === 'INDEX_CATALOG'
                ? 'bg-gradient-to-r from-purple-900/60 to-purple-800/40 text-purple-200 border border-purple-500/40 shadow-sm'
                : 'bg-[#141416] text-[#888] hover:text-[#ccc] border border-[#26262b]'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Catalog & Indexer Engine</span>
            <span className="ml-1 px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-mono text-[10px]">
              {catalogStats.totalFiles} files
            </span>
          </button>
        </div>

        {/* Global Action Header */}
        <div className="flex items-center gap-2">
          {onRunCliCommand && (
            <button
              id="btn_cli_rg"
              onClick={() => onRunCliCommand(activeMode === 'FIND_FILES' ? `find ${searchQuery || ''}` : `rg "${searchQuery}"`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181820] hover:bg-[#22222c] text-emerald-400 border border-emerald-800/40 text-xs font-mono transition-colors shadow-sm"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{activeMode === 'FIND_FILES' ? 'find' : 'rg'} in CLI</span>
            </button>
          )}

          <button
            id="btn_rebuild_index"
            onClick={handleRebuildCatalog}
            title="Rebuild file index catalog"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-[#aaa] hover:text-white border border-[#333] text-xs transition-colors font-mono"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rebuild Catalog</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between font-mono animate-fadeIn ${
          notification.type === 'success' ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200' : 'bg-blue-950/80 border-blue-700 text-blue-200'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEARCH CONTROLS BAR (Used in Ripgrep & Find Files)                       */}
      {/* ========================================================================= */}
      {activeMode !== 'INDEX_CATALOG' && (
        <div className="space-y-3 bg-[#111114] p-3.5 rounded-lg border border-[#222]">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
              <input
                id="input_search_query"
                type="text"
                placeholder={activeMode === 'RIPGREP_CONTENT' ? 'Search full-text source code (e.g. PAGE_PRESENT, kmain, pci)...' : 'Filter by file or directory name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#18181c] border border-[#2a2a30] rounded-lg pl-9 pr-3 py-2 text-xs text-[#eee] placeholder-[#555] focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Path Scope */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#666]">Path:</span>
              <select
                id="select_path_prefix"
                value={pathPrefix}
                onChange={(e) => setPathPrefix(e.target.value)}
                className="bg-[#18181c] border border-[#2a2a30] rounded-lg px-2.5 py-1.5 text-xs text-[#ccc] focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="/">/ (Root Workspace)</option>
                <option value="/boot">/boot (Bootloader)</option>
                <option value="/kernel">/kernel (Ring 0 Core)</option>
                <option value="/usr/include">/usr/include (Headers)</option>
                <option value="/drivers">/drivers (ACPI/PCI/Serial)</option>
                <option value="/etc">/etc (Sysconfig)</option>
                <option value="/var/log">/var/log (Ring Logs)</option>
              </select>
            </div>

            {/* File Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#666]">Type:</span>
              <select
                id="select_filetype_filter"
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value)}
                className="bg-[#18181c] border border-[#2a2a30] rounded-lg px-2.5 py-1.5 text-xs text-[#ccc] focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="ALL">All File Types</option>
                <option value="SOURCE">Source (*.c, *.asm)</option>
                <option value="HEADER">Headers (*.h)</option>
                <option value="CONFIG">Configs (*.conf, *.json)</option>
                <option value="LOG">Logs (*.journal, *.log)</option>
                <option value="DOCUMENT">Docs (*.md)</option>
              </select>
            </div>
          </div>

          {/* Secondary Filter Flags */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1e1e24] text-xs font-mono">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer text-[#aaa] hover:text-white">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="rounded bg-[#1a1a20] border-[#333] text-emerald-500 focus:ring-0"
                />
                <span>Case Sensitive (-s)</span>
              </label>

              {activeMode === 'RIPGREP_CONTENT' && (
                <label className="flex items-center gap-1.5 cursor-pointer text-[#aaa] hover:text-white">
                  <input
                    type="checkbox"
                    checked={useRegex}
                    onChange={(e) => setUseRegex(e.target.checked)}
                    className="rounded bg-[#1a1a20] border-[#333] text-emerald-500 focus:ring-0"
                  />
                  <span>Regex Pattern</span>
                </label>
              )}
            </div>

            <div className="text-[11px] text-[#777]">
              Matched <strong className="text-emerald-400">{results.length}</strong> files ({totalMatchesCount} matches)
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: RIPGREP FULL-TEXT CODE SEARCH                                   */}
      {/* ========================================================================= */}
      {activeMode === 'RIPGREP_CONTENT' && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="bg-[#111114] border border-[#222] rounded-lg p-8 text-center space-y-2">
              <FileSearch className="w-8 h-8 text-[#444] mx-auto" />
              <h4 className="text-sm font-semibold text-[#888]">No matches found</h4>
              <p className="text-xs text-[#555]">
                Try adjusting your search query, clearing filters, or switching case sensitivity.
              </p>
            </div>
          ) : (
            results.map((res) => (
              <div 
                key={res.file.id}
                className="bg-[#111114] border border-[#222] hover:border-[#333] rounded-lg p-4 space-y-3 transition-all font-mono"
              >
                <div className="flex items-center justify-between gap-3 border-b border-[#1b1b22] pb-2.5">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">{res.file.path}</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#1c1c24] text-[#888] text-[10px]">
                      {res.file.fileType}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-emerald-400">
                      {res.matches.length} {res.matches.length === 1 ? 'match' : 'matches'}
                    </span>
                    <button
                      onClick={() => openFileViewer(res.file, res.matches[0]?.lineNumber)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-[#181820] hover:bg-[#252532] text-xs text-[#bbb] hover:text-white transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View File</span>
                    </button>
                  </div>
                </div>

                {/* Match Lines Snippets */}
                <div className="space-y-1 bg-[#09090b] p-2.5 rounded-md border border-[#1a1a22] text-xs overflow-x-auto">
                  {res.matches.slice(0, 5).map((match, mIdx) => (
                    <div 
                      key={mIdx} 
                      onClick={() => openFileViewer(res.file, match.lineNumber)}
                      className="flex items-start gap-3 hover:bg-[#14141c] p-1 rounded cursor-pointer group"
                    >
                      <span className="text-[#666] select-none group-hover:text-emerald-400 w-8 text-right shrink-0">
                        {match.lineNumber}:
                      </span>
                      <span className="text-[#ccc] group-hover:text-white font-mono break-all">
                        {match.lineContent}
                      </span>
                    </div>
                  ))}
                  {res.matches.length > 5 && (
                    <div className="text-[10px] text-[#666] pt-1 pl-11">
                      + {res.matches.length - 5} more matching lines (open viewer to view all)
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: FAST FILE & PATH FINDER (fd / find)                             */}
      {/* ========================================================================= */}
      {activeMode === 'FIND_FILES' && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((res) => (
              <div 
                key={res.file.id}
                className="bg-[#111114] border border-[#222] hover:border-blue-500/40 rounded-lg p-3.5 space-y-2.5 transition-all font-mono"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-[#181822] border border-[#282836]">
                      {res.file.fileType === 'SOURCE' ? <Code className="w-3.5 h-3.5 text-emerald-400" /> :
                       res.file.fileType === 'HEADER' ? <Hash className="w-3.5 h-3.5 text-cyan-400" /> :
                       res.file.fileType === 'CONFIG' ? <Sliders className="w-3.5 h-3.5 text-amber-400" /> :
                       res.file.fileType === 'LOG' ? <FileText className="w-3.5 h-3.5 text-purple-400" /> :
                       <FileCheck className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{res.file.name}</h4>
                      <p className="text-[11px] text-[#777]">{res.file.path}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#1a1a24] text-blue-300 border border-[#2d2d3a]">
                    {res.file.fileType}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] bg-[#16161c] p-2 rounded border border-[#222] text-[#888]">
                  <div>
                    <span className="block text-[#555]">Size</span>
                    <span className="text-[#ccc]">{formatBytes(res.file.sizeBytes)}</span>
                  </div>
                  <div>
                    <span className="block text-[#555]">Lines</span>
                    <span className="text-[#ccc]">{res.file.lineCount}</span>
                  </div>
                  <div>
                    <span className="block text-[#555]">Permissions</span>
                    <span className="text-[#ccc]">{res.file.permissions}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[10px] text-[#666]">Modified: {res.file.modifiedAt}</span>
                  <button
                    onClick={() => openFileViewer(res.file)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1a1a24] hover:bg-[#252534] text-[#ccc] hover:text-white text-xs transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: INDEX CATALOG & BACKGROUND ENGINE (updatedb)                    */}
      {/* ========================================================================= */}
      {activeMode === 'INDEX_CATALOG' && (
        <div className="space-y-4">
          
          {/* Indexer Status Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#111114] border border-[#222] rounded-lg p-3.5 space-y-1">
              <span className="text-[11px] font-mono text-[#777] block">Indexer Daemon Status</span>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold font-mono ${catalogStats.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {catalogStats.status}
                </span>
                <button
                  onClick={handleToggleStatus}
                  className="text-xs font-mono text-[#aaa] hover:text-white"
                >
                  {catalogStats.status === 'ACTIVE' ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-gray-500" />}
                </button>
              </div>
            </div>

            <div className="bg-[#111114] border border-[#222] rounded-lg p-3.5 space-y-1">
              <span className="text-[11px] font-mono text-[#777] block">Total Indexed Files</span>
              <span className="text-sm font-bold font-mono text-cyan-300">{catalogStats.totalFiles} files</span>
            </div>

            <div className="bg-[#111114] border border-[#222] rounded-lg p-3.5 space-y-1">
              <span className="text-[11px] font-mono text-[#777] block">Catalog Footprint</span>
              <span className="text-sm font-bold font-mono text-purple-300">{formatBytes(catalogStats.totalSizeBytes)}</span>
            </div>

            <div className="bg-[#111114] border border-[#222] rounded-lg p-3.5 space-y-1">
              <span className="text-[11px] font-mono text-[#777] block">Total Lines Indexed</span>
              <span className="text-sm font-bold font-mono text-amber-300">{catalogStats.totalLines.toLocaleString()} LOC</span>
            </div>
          </div>

          {/* Monitored Trees Table */}
          <div className="bg-[#111114] border border-[#222] rounded-lg p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-purple-400" />
                <span>Monitored Tree Catalog Paths</span>
              </h4>
              <span className="text-[11px] text-[#666]">Last synchronized: {catalogStats.lastRebuilt}</span>
            </div>

            <div className="space-y-1.5">
              {catalogStats.indexedPaths.map((path, idx) => {
                const count = allFiles.filter(f => f.path.startsWith(path)).length;
                return (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-[#16161c] border border-[#222] text-xs text-[#ccc]"
                  >
                    <span className="text-purple-300">{path}</span>
                    <span className="text-[11px] text-[#777]">{count} files indexed</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Full File Inspector Modal */}
      {inspectingFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111115] border border-[#2c2c36] rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl font-sans animate-fadeIn">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#222] p-4">
              <div className="flex items-center gap-2 font-mono">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white">{inspectingFile.path}</h3>
                <span className="text-[10px] text-[#777]">({inspectingFile.lineCount} lines, {formatBytes(inspectingFile.sizeBytes)})</span>
              </div>
              <button 
                onClick={() => setInspectingFile(null)}
                className="text-xs text-[#777] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Code Viewer */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#09090c] font-mono text-xs space-y-0.5">
              {inspectingFile.content.split('\n').map((line, idx) => {
                const lineNum = idx + 1;
                const isTarget = highlightLine === lineNum;
                return (
                  <div 
                    key={idx}
                    className={`flex items-start gap-4 px-2 py-0.5 rounded transition-colors ${
                      isTarget ? 'bg-emerald-950/70 border border-emerald-700/50 text-emerald-200' : 'hover:bg-[#14141c]'
                    }`}
                  >
                    <span className={`select-none w-8 text-right text-[11px] shrink-0 ${isTarget ? 'text-emerald-400 font-bold' : 'text-[#555]'}`}>
                      {lineNum}
                    </span>
                    <span className="text-[#ccc] whitespace-pre break-all">{line}</span>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[#222] p-3 text-xs font-mono">
              <span className="text-[#666]">Permissions: {inspectingFile.permissions} | Last Modified: {inspectingFile.modifiedAt}</span>
              <button
                onClick={() => setInspectingFile(null)}
                className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-[#333] text-[#ccc] text-xs font-mono"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
