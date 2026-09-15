// jb7572_2026-08-24: OS Codebase Export & Hydrator Panel
import React, { useState, useMemo } from 'react';
import { TreeNode } from '../types';
import { Terminal, Copy, Check, Download, FileCode, FolderTree, Layers, Sparkles, Archive } from 'lucide-react';

interface ExportPanelProps {
  rootNode: TreeNode;
}

// jb7572_2026-08-24: Export Panel Component for generating shell scripts & ASCII hierarchy
export const ExportPanel: React.FC<ExportPanelProps> = ({ rootNode }) => {
  const [exportMode, setExportMode] = useState<'full_source' | 'scaffold' | 'ascii'>('full_source');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedTree, setCopiedTree] = useState(false);

  // jb7572_2026-08-24: Recursive generator for directory & file manifest lists
  const generateBashScript = (node: TreeNode, accDirectories: string[] = [], accFiles: { path: string; content?: string }[] = []) => {
    if (node.type === 'folder') {
      accDirectories.push(node.path);
      if (node.children) {
        node.children.forEach(child => generateBashScript(child, accDirectories, accFiles));
      }
    } else {
      accFiles.push({ path: node.path, content: node.content });
    }
    return { directories: accDirectories, files: accFiles };
  };

  const { directories, files } = generateBashScript(rootNode);

  // Helper to normalize path by stripping virtual 'home/projects/SecureCurtain/' or 'home/projects/' prefix
  const cleanPath = (p: string): string => {
    return p.replace(/^home\/projects\/SecureCurtain\//, '').replace(/^home\/projects\//, '');
  };

  // jb7572_2026-08-24: Lightweight scaffold script generator
  const scaffoldScript = [
    '#!/usr/bin/env bash',
    '# Automatic Directory Setup Script for SecureCurtain (Lightweight Skeleton)',
    '# Usage: ./setup_skeleton.sh [TARGET_DIR] (defaults to current working directory)',
    'set -e',
    '',
    'TARGET_DIR="${1:-.}"',
    'echo "Initializing SecureCurtain directory structure in: ${TARGET_DIR}..."',
    ...directories.map(d => {
      const cd = cleanPath(d);
      return `mkdir -p "\${TARGET_DIR}/${cd}"`;
    }),
    '',
    'echo "Touching workspace files..."',
    ...files.map(f => {
      const cp = cleanPath(f.path);
      return `touch "\${TARGET_DIR}/${cp}"`;
    }),
    '',
    'echo "Done! Operating system skeleton tree initialized successfully."'
  ].join('\n');

  // jb7572_2026-08-24: Complete production source code hydrator script generator (memoized to prevent re-render lag)
  const fullSourceScript = useMemo(() => {
    return [
      '#!/usr/bin/env bash',
      '# Complete Source Code Hydrator for SecureCurtain OS',
      '# Ring 0 Microkernel, Subsystems, Win32 API, Recovery Gateway, & Network Engine',
      '# Usage: bash "full source hydrator.sh" [TARGET_DIR]',
      'set -e',
      '',
      'TARGET_DIR="${1:-.}"',
      'echo "[*] Hydrating SecureCurtain OS verified source files into: ${TARGET_DIR}..."',
      '',
      'echo "[*] Creating directory hierarchy..."',
      ...directories.map(d => {
        const cd = cleanPath(d);
        return cd && cd !== '.' ? `mkdir -p "\${TARGET_DIR}/${cd}"` : '';
      }).filter(Boolean),
      '',
      'echo "[*] Writing verified source files..."',
      ...files.map(f => {
        const cp = cleanPath(f.path);
        const content = f.content || '';
        let delim = '__SECURECURTAIN_EOF__';
        let counter = 0;
        while (
          content.includes(`\n${delim}\n`) ||
          content.includes(`\n${delim}`) ||
          content.startsWith(`${delim}\n`) ||
          content === delim
        ) {
          counter++;
          delim = `__SECURECURTAIN_EOF_${counter}__`;
        }
        return `cat << '${delim}' > "\${TARGET_DIR}/${cp}"\n${content}\n${delim}\n`;
      }),
      '',
      'echo "[*] Setting execute permissions on scripts and tools..."',
      'chmod +x "${TARGET_DIR}"/scripts/*.sh "${TARGET_DIR}"/scripts/*.py "${TARGET_DIR}"/sys/*.sh 2>/dev/null || true',
      '',
      'echo "======================================================================"',
      'echo "  SUCCESS: All SecureCurtain OS source files hydrated successfully!"',
      'echo "======================================================================"',
      'echo "  To build the bootable microkernel & hybrid ISO, run:"',
      'echo "    ./scripts/build_kernel.sh"',
      'echo "======================================================================"'
    ].join('\n');
  }, [directories, files]);

  // jb7572_2026-08-24: ASCII diagram tree renderer
  const renderAsciiTree = (node: TreeNode, prefix = '', isLast = true): string => {

    let result = '';
    const connector = isLast ? '└── ' : '├── ';
    result += prefix + (prefix ? connector : '') + node.name + (node.type === 'folder' ? '/' : '') + '\n';

    if (node.type === 'folder' && node.children) {
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      node.children.forEach((child, index) => {
        const lastChild = index === node.children!.length - 1;
        result += renderAsciiTree(child, childPrefix, lastChild);
      });
    }

    return result;
  };

  const asciiTree = renderAsciiTree(rootNode);

  // jb7572_2026-08-24: Clipboard copy handler with feedback indicator
  const handleCopy = (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // jb7572_2026-08-24: Download script trigger creating Blob URL
  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  // Authenticated binary download via browser session with dynamic API fallback & cache busting
  const handleBinaryDownload = async (url: string, filename: string) => {
    try {
      setDownloadingFile(filename);
      const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
      const res = await fetch(cacheBustUrl, { 
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.warn('Direct fetch failed, falling back to direct navigation:', err);
      window.location.href = url;
    } finally {
      setDownloadingFile(null);
    }
  };


  return (
    <div className="space-y-5">
      {/* Mode Selector */}
      <div className="bg-[#0f0f0f] p-4 rounded-xl border border-[#222] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#c4b5fd]" />
          <span className="text-xs uppercase tracking-wider font-semibold text-[#e5e5e5]">
            Export Target Format:
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setExportMode('full_source')}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${
              exportMode === 'full_source'
                ? 'bg-[#222] text-[#c4b5fd] font-bold border border-[#444]'
                : 'text-[#737373] hover:text-[#e5e5e5] hover:bg-[#141414]'
            }`}
          >
            Full Source Hydrator (.sh)
          </button>
          <button
            onClick={() => setExportMode('scaffold')}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${
              exportMode === 'scaffold'
                ? 'bg-[#222] text-[#c4b5fd] font-bold border border-[#444]'
                : 'text-[#737373] hover:text-[#e5e5e5] hover:bg-[#141414]'
            }`}
          >
            Directory Skeleton (.sh)
          </button>
          <button
            onClick={() => setExportMode('ascii')}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${
              exportMode === 'ascii'
                ? 'bg-[#222] text-[#c4b5fd] font-bold border border-[#444]'
                : 'text-[#737373] hover:text-[#e5e5e5] hover:bg-[#141414]'
            }`}
          >
            ASCII Architecture Tree
          </button>
        </div>
      </div>

      {exportMode === 'full_source' && (
        <div className="bg-[#0f0f0f] p-5 rounded-xl border border-[#222] shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e5e5e5]">
                  Full Codebase Hydrator ({files.length} Verified Files)
                </h2>
              </div>
              <p className="text-xs text-[#737373] mt-0.5">
                Generates every file with full production C, Assembly, and Python source code.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleBinaryDownload('/api/download/zip', 'securecurtain.zip')}
                disabled={downloadingFile !== null}
                className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-md flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                title="Direct Universal ZIP Archive (Works natively on Mac, Windows, Linux archive managers)"
              >
                <Archive className="w-3.5 h-3.5" /> {downloadingFile === 'securecurtain.zip' ? 'Downloading...' : 'Source .zip (Recommended)'}
              </button>
              <button
                onClick={() => handleBinaryDownload('/api/download/tar', 'securecurtain.tar.gz')}
                disabled={downloadingFile !== null}
                className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-semibold bg-[#1a1a1a] hover:bg-[#262626] disabled:opacity-50 text-[#e5e5e5] border border-[#333] rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Direct POSIX Tarball Archive (.tar.gz)"
              >
                <Download className="w-3.5 h-3.5" /> {downloadingFile === 'securecurtain.tar.gz' ? 'Downloading...' : 'Source .tar.gz'}
              </button>
              <button
                onClick={() => handleBinaryDownload('/api/download/hydrator', 'hydrator.sh')}
                disabled={downloadingFile !== null}
                className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-semibold bg-[#1a1a1a] hover:bg-[#262626] disabled:opacity-50 text-[#e5e5e5] border border-[#333] rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download verified standalone hydrator bash script"
              >
                <Download className="w-3.5 h-3.5" /> {downloadingFile === 'hydrator.sh' ? 'Downloading...' : 'hydrator.sh'}
              </button>
              <button
                onClick={() => handleCopy(fullSourceScript, setCopiedFull)}
                className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-semibold bg-[#1a1a1a] hover:bg-[#262626] text-[#c4b5fd] border border-[#333] rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedFull ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedFull ? 'Copied' : 'Copy All'}
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg text-xs text-amber-200/90 font-mono space-y-1">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5">
              <span>⚠️</span> Terminal Extraction Guide:
            </div>
            <p className="text-neutral-300">
              The AI Studio preview server requires active Google authentication cookies, so running <code className="text-amber-300 font-bold">curl</code> in an unauthenticated terminal downloads Google&apos;s authentication page instead of the zip.
            </p>
            <p className="text-neutral-300">
              Click <span className="text-emerald-400 font-bold">Source .zip</span> above to save directly to your computer, then in your terminal run:
            </p>
            <div className="p-2 bg-black/60 rounded text-emerald-300 select-all font-mono text-[11px] mt-1 border border-amber-900/30">
              mv ~/Downloads/securecurtain.zip . &amp;&amp; unzip -q securecurtain.zip &amp;&amp; ./scripts/build_kernel.sh
            </div>
          </div>

          <pre className="p-4 bg-[#050505] text-[#34d399] rounded-lg font-mono text-xs overflow-x-auto max-h-[380px] leading-relaxed border border-[#1a1a1a]">
            {fullSourceScript.slice(0, 3000)}
            {`\n... [Remaining ${files.length} source files embedded in full export] ...`}
          </pre>
        </div>
      )}

      {exportMode === 'scaffold' && (
        <div className="bg-[#0f0f0f] p-5 rounded-xl border border-[#222] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#c4b5fd]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e5e5e5]">
                Directory Skeleton Bash Script
              </h2>
            </div>
            <button
              onClick={() => handleCopy(scaffoldScript, setCopiedScript)}
              className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-semibold bg-[#1a1a1a] hover:bg-[#262626] text-[#c4b5fd] border border-[#333] rounded-md flex items-center gap-1.5 transition-colors"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedScript ? 'Copied Script' : 'Copy Script'}
            </button>
          </div>

          <p className="text-xs text-[#737373]">
            Run this in your terminal to initialize all directories and empty touch files:
          </p>

          <pre className="p-4 bg-[#050505] text-[#34d399] rounded-lg font-mono text-xs overflow-x-auto max-h-[380px] leading-relaxed border border-[#1a1a1a]">
            {scaffoldScript}
          </pre>
        </div>
      )}

      {exportMode === 'ascii' && (
        <div className="bg-[#0f0f0f] p-5 rounded-xl border border-[#222] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-[#c4b5fd]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e5e5e5]">
                ASCII Directory Tree Diagram
              </h2>
            </div>
            <button
              onClick={() => handleCopy(asciiTree, setCopiedTree)}
              className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-semibold bg-[#1a1a1a] hover:bg-[#262626] text-[#d4d4d4] border border-[#333] rounded-md flex items-center gap-1.5 transition-colors"
            >
              {copiedTree ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedTree ? 'Copied Tree' : 'Copy Tree Diagram'}
            </button>
          </div>

          <pre className="p-4 bg-[#050505] text-[#c4b5fd] rounded-lg font-mono text-xs overflow-x-auto max-h-[380px] leading-relaxed border border-[#1a1a1a]">
            {asciiTree}
          </pre>
        </div>
      )}
    </div>
  );
};
