// jb7572_2026-08-25: Primary OS Desktop Environment & Architect Assistant Application
import React, { useState, useEffect } from 'react';
import { initialOSTree } from './data/osTreeData';
import { TreeNode } from './types';
import { TreeView } from './components/TreeView';
import { CodeAnalyzer } from './components/CodeAnalyzer';
import { BeginnerGuide } from './components/BeginnerGuide';
import { ExportPanel } from './components/ExportPanel';
import { FileViewerModal } from './components/FileViewerModal';
import { UtilitiesCockpit } from './components/cockpit/UtilitiesCockpit';
import { DesktopProvider } from './context/DesktopContext';
import { DesktopEnvironment } from './components/desktop/DesktopEnvironment';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LandingPageModal } from './components/LandingPageModal';
import { 
  Terminal, 
  FolderTree, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  FilePlus, 
  HardDrive, 
  Search, 
  Activity,
  Monitor,
  LayoutGrid,
  FolderGit2
} from 'lucide-react';

function MainOSWorkspace() {
  const [treeData, setTreeData] = useState<TreeNode>(initialOSTree);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'studio'>('desktop');
  const [activeStudioTab, setActiveStudioTab] = useState<'cockpit' | 'analyzer' | 'guide' | 'export'>('cockpit');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLandingPageOpen, setIsLandingPageOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsLandingPageOpen(true);
    window.addEventListener('open-landing-page-modal', handleOpen);
    return () => window.removeEventListener('open-landing-page-modal', handleOpen);
  }, []);

  // Places a new or evaluated file into the targeted directory path
  const handlePlaceFileInTree = (
    filename: string,
    targetPath: string,
    content: string,
    description: string
  ) => {
    const newFileNode: TreeNode = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: filename,
      type: 'file',
      path: `${targetPath}/${filename}`,
      content,
      description,
      isCustom: true
    };

    setTreeData(prevTree => {
      const updated = JSON.parse(JSON.stringify(prevTree)) as TreeNode;

      const addNodeToPath = (current: TreeNode, path: string): boolean => {
        if (current.path === path) {
          if (!current.children) current.children = [];
          const existingIndex = current.children.findIndex(c => c.name === filename);
          if (existingIndex >= 0) {
            current.children[existingIndex] = newFileNode;
          } else {
            current.children.push(newFileNode);
          }
          return true;
        }

        if (current.children) {
          for (const child of current.children) {
            if (addNodeToPath(child, path)) return true;
          }
        }
        return false;
      };

      const success = addNodeToPath(updated, targetPath);
      if (!success) {
        if (updated.children) {
          const kernelFolder = updated.children.find(c => c.name === 'kernel');
          if (kernelFolder) {
            if (!kernelFolder.children) kernelFolder.children = [];
            kernelFolder.children.push(newFileNode);
          }
        }
      }
      return updated;
    });
  };

  const handleDeleteCustomFile = (nodeId: string) => {
    setTreeData(prevTree => {
      const updated = JSON.parse(JSON.stringify(prevTree)) as TreeNode;
      const removeNode = (current: TreeNode): boolean => {
        if (!current.children) return false;
        const idx = current.children.findIndex(c => c.id === nodeId);
        if (idx >= 0) {
          current.children.splice(idx, 1);
          return true;
        }
        for (const child of current.children) {
          if (removeNode(child)) return true;
        }
        return false;
      };
      removeNode(updated);
      return updated;
    });

    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleManualAddFile = (folderPath: string) => {
    const filename = prompt('Enter new filename (e.g. keyboard.c, pci.h):');
    if (!filename || !filename.trim()) return;

    const desc = prompt('Enter a short description:', 'Custom module');
    handlePlaceFileInTree(
      filename.trim(),
      folderPath,
      `// Custom OS File: ${filename.trim()}\n// Created for SecureCurtain architecture\n\n#include <stdint.h>\n\nvoid init_${filename.replace(/[^a-zA-Z0-9]/g, '_')}(void) {\n    // Implementation here\n}\n`,
      desc || 'Custom module'
    );
  };

  const countFiles = (node: TreeNode): number => {
    if (node.type === 'file') return 1;
    if (!node.children) return 0;
    return node.children.reduce((sum, child) => sum + countFiles(child), 0);
  };

  const totalFiles = countFiles(treeData);

  // If in Desktop Environment Mode: Full Desktop Shell
  if (viewMode === 'desktop') {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        {/* Floating Quick Mode Switcher Bar */}
        <div className="absolute top-2 right-4 z-50 flex items-center gap-2">
          <button
            onClick={() => setViewMode('studio')}
            className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 backdrop-blur-md text-[11px] font-mono flex items-center gap-1.5 transition-all shadow-lg"
            title="Switch to Classic Studio View"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
            <span>Classic Studio</span>
          </button>
        </div>

        <DesktopEnvironment />

        {/* Global Landing Page Modal */}
        <LandingPageModal
          isOpen={isLandingPageOpen}
          onClose={() => setIsLandingPageOpen(false)}
        />
      </div>
    );
  }

  // Classic Studio View Mode
  return (
    <div className="min-h-screen bg-[#080808] text-[#f5f5f5] flex flex-col font-sans selection:bg-[#c4b5fd] selection:text-[#080808]">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-[#222] bg-[#0c0c0c]/80 backdrop-blur-md px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#171717] rounded-lg border border-[#2a2a2a] text-[#c4b5fd]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-wide text-[#f5f5f5]">
                SecureCurtain / sys Architect Studio
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#1e1e1e] text-[#a3a3a3] border border-[#2a2a2a]">
                x86_64 Long Mode
              </span>
            </div>
            <p className="text-xs text-[#737373] hidden sm:block">
              Self-Healing Microkernel, VirtIO Network, Dual Subsystems & Utilities Cockpit
            </p>
          </div>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex items-center gap-2">
          {/* GitHub Landing Page Modal Trigger */}
          <button
            onClick={() => setIsLandingPageOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs mr-1"
            title="View & Copy GitHub README.md / Landing Page Template"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />
            <span>GitHub Landing Page</span>
          </button>

          {/* Switch to Desktop Shell Mode */}
          <button
            onClick={() => setViewMode('desktop')}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 mr-2"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Open Desktop Shell</span>
          </button>

          <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-xl border border-[#262626]">
            <button
              onClick={() => setActiveStudioTab('cockpit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeStudioTab === 'cockpit'
                  ? 'bg-[#2a2a2a] text-[#c4b5fd] shadow-xs'
                  : 'text-[#888] hover:text-[#eee]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Utilities Cockpit</span>
            </button>

            <button
              onClick={() => setActiveStudioTab('analyzer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeStudioTab === 'analyzer'
                  ? 'bg-[#2a2a2a] text-[#c4b5fd] shadow-xs'
                  : 'text-[#888] hover:text-[#eee]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Code Analyzer</span>
            </button>

            <button
              onClick={() => setActiveStudioTab('guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeStudioTab === 'guide'
                  ? 'bg-[#2a2a2a] text-[#c4b5fd] shadow-xs'
                  : 'text-[#888] hover:text-[#eee]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guide</span>
            </button>

            <button
              onClick={() => setActiveStudioTab('export')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeStudioTab === 'export'
                  ? 'bg-[#2a2a2a] text-[#c4b5fd] shadow-xs'
                  : 'text-[#888] hover:text-[#eee]'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Tree & Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        {activeStudioTab === 'cockpit' && (
          <UtilitiesCockpit />
        )}

        {activeStudioTab !== 'cockpit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#0f0f0f] rounded-xl border border-[#222] p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#222] pb-3">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-[#c4b5fd]" />
                    <h2 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#a3a3a3]">
                      Project Hierarchy
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-[#737373] bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#262626]">
                    {totalFiles} {totalFiles === 1 ? 'file' : 'files'}
                  </span>
                </div>

                <div className="p-3 bg-[#050505] text-[#c4b5fd] rounded-lg font-mono text-xs flex items-center gap-2 border border-[#1a1a1a]">
                  <HardDrive className="w-4 h-4 text-[#a3a3a3] shrink-0" />
                  <span className="truncate text-[#e5e5e5] tracking-tight">home/projects/SecureCurtain/sys</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${totalFiles} OS files or paths...`}
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-[#050505] border border-[#1a1a1a] rounded-lg focus:outline-none focus:border-[#333] text-[#e5e5e5] placeholder-[#4a4a4a]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#666] absolute left-2.5 top-2" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1.5 text-[10px] text-[#737373] hover:text-[#d4d4d4] font-mono px-1 py-0.5 rounded bg-[#181818]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="pt-1 max-h-[440px] overflow-y-auto">
                  <TreeView
                    node={treeData}
                    selectedFileId={selectedNode?.id || null}
                    onSelectFile={(node) => setSelectedNode(node)}
                    onAddCustomFile={handleManualAddFile}
                    onDeleteFile={handleDeleteCustomFile}
                    searchQuery={searchQuery}
                  />
                </div>

                <button
                  onClick={() => handleManualAddFile('home/projects/SecureCurtain/sys/kernel')}
                  className="w-full py-2.5 text-xs font-mono tracking-wider uppercase bg-[#141414] hover:bg-[#1f1f1f] text-[#d4d4d4] hover:text-white rounded-lg flex items-center justify-center gap-2 transition-colors border border-[#262626]"
                >
                  <FilePlus className="w-3.5 h-3.5 text-[#c4b5fd]" /> Add File to Kernel
                </button>
              </div>

              <div className="bg-[#0f0f0f] rounded-xl border border-[#222] p-4 space-y-3 text-xs">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#737373] font-semibold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#c4b5fd]" />
                  Tree State Checklist
                </h3>
                <ul className="space-y-2 font-mono text-[#a3a3a3]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>/boot/arch/x86_64 <span className="text-[#525252] text-[10px]">(ASM / LD)</span></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>/kernel/include <span className="text-[#525252] text-[10px]">(Headers .h)</span></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>/subsystems <span className="text-[#525252] text-[10px]">(Modules)</span></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>build_subsystem.py <span className="text-[#525252] text-[10px]">(Builder)</span></span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              {activeStudioTab === 'analyzer' && (
                <CodeAnalyzer onPlaceFile={handlePlaceFileInTree} />
              )}

              {activeStudioTab === 'guide' && (
                <BeginnerGuide />
              )}

              {activeStudioTab === 'export' && (
                <ExportPanel rootNode={treeData} />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="h-10 bg-[#0a0a0a] border-t border-[#222] px-6 sm:px-8 flex items-center justify-between text-[10px] tracking-widest text-[#525252] uppercase font-mono mt-auto">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Session
          </span>
          <span>Target Architecture: x86_64</span>
        </div>
        <div>SecureCurtain/sys v0.1 • Hybrid Desktop Engine</div>
      </footer>

      {selectedNode && (
        <FileViewerModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Global Landing Page Modal */}
      <LandingPageModal
        isOpen={isLandingPageOpen}
        onClose={() => setIsLandingPageOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <DesktopProvider>
        <MainOSWorkspace />
      </DesktopProvider>
    </ErrorBoundary>
  );
}

