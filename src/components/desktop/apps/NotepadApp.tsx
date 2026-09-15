// jb7572_2026-08-25: Kernel Notepad & Code Scratchpad App
// Subsystem integrated: Real-time sync with HKCU\Software\Microsoft\Notepad

import React, { useState, useEffect } from 'react';
import { useDesktop } from '../../../context/DesktopContext';
import { systemConfigService } from '../../../services/systemConfigService';
import { 
  FileText, 
  Save, 
  Copy, 
  Check, 
  Settings,
  Sliders,
  Database,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface NotepadProps {
  customProps?: {
    initialContent?: string;
    filename?: string;
  };
}

export const NotepadApp: React.FC<NotepadProps> = ({ customProps }) => {
  const { placeFileInTree, addNotification, openApp } = useDesktop();
  const defaultCode = `// jb7572_2026-08-25: SecureCurtain Kernel Architecture Header
#ifndef _KERNEL_CORE_H
#define _KERNEL_CORE_H

#include <stdint.h>
#include <stddef.h>

#define KERNEL_MAGIC_CR3 0x1000
#define PAGE_SIZE_4K     4096
#define MAX_CORES        16

typedef struct {
    uint64_t rip;
    uint64_t rsp;
    uint64_t cr3;
    uint32_t pid;
    uint8_t  state;
} process_thread_t;

void init_kernel_subsystems(void);
void pml4_map_page(uint64_t vaddr, uint64_t paddr, uint32_t flags);
int  schedule_next_thread(void);

#endif // _KERNEL_CORE_H
`;

  const [filename, setFilename] = useState<string>(customProps?.filename || 'kernel_notes.c');
  const [content, setContent] = useState<string>(customProps?.initialContent || defaultCode);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [showSettingsPopover, setShowSettingsPopover] = useState<boolean>(false);

  // Live Windows Registry State for Notepad (HKCU\Software\Microsoft\Notepad)
  const [fontSize, setFontSize] = useState<number>(() => 
    Number(systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Notepad', 'iFontSize', 13)) || 13
  );
  const [fontFace, setFontFace] = useState<string>(() => 
    String(systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Notepad', 'lfFaceName', 'Consolas')) || 'Consolas'
  );
  const [wrapText, setWrapText] = useState<boolean>(() => 
    Number(systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Notepad', 'fWrapText', 1)) === 1
  );
  const [showStatusBar, setShowStatusBar] = useState<boolean>(() => 
    Number(systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Notepad', 'fStatusBar', 1)) === 1
  );
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(() => 
    Number(systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Notepad', 'fLineNumbers', 1)) === 1
  );

  // Real-time reactive subscription to registry changes (e.g. CLI 'reg add' or GUI regedit)
  useEffect(() => {
    const unsubscribe = systemConfigService.subscribeToRegistry(() => {
      const fs = Number(systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Notepad', 'iFontSize', 13)) || 13;
      const ff = String(systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Notepad', 'lfFaceName', 'Consolas')) || 'Consolas';
      const wt = Number(systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Notepad', 'fWrapText', 1)) === 1;
      const sb = Number(systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Notepad', 'fStatusBar', 1)) === 1;
      const ln = Number(systemConfigService.getRegistryValue('HKCU', 'Software\\Microsoft\\Notepad', 'fLineNumbers', 1)) === 1;

      setFontSize(fs);
      setFontFace(ff);
      setWrapText(wt);
      setShowStatusBar(sb);
      setShowLineNumbers(ln);
    });
    return unsubscribe;
  }, []);

  const handleUpdateRegistrySetting = (valueName: string, value: string | number, type: 'REG_DWORD' | 'REG_SZ') => {
    systemConfigService.setRegistryValue(
      'HKCU',
      'Software\\Microsoft\\Notepad',
      valueName,
      value,
      type,
      `Notepad application preference (${valueName})`
    );
    setStatusMessage(`Saved to Registry: HKCU\\...\\${valueName} = ${value}`);
    setTimeout(() => setStatusMessage('Ready'), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setStatusMessage('Copied to clipboard');
    setTimeout(() => {
      setIsCopied(false);
      setStatusMessage('Ready');
    }, 2000);
  };

  const handleSave = () => {
    placeFileInTree(filename, 'home/projects/SecureCurtain/sys/kernel', content, `Created/Edited in Notepad`);
    addNotification({
      title: 'File Saved with Provenance Header',
      message: `Saved ${filename} to /home/projects/SecureCurtain/sys/kernel`,
      type: 'success',
      appId: 'notepad'
    });
    setStatusMessage(`Saved & Watermarked: ${filename}`);
    setTimeout(() => setStatusMessage('Ready'), 2500);
  };

  const lines = content.split('\n');

  return (
    <div className="h-full flex flex-col bg-[#0d0e12] text-[#f1f5f9] font-mono select-none relative">
      {/* Top Controls Toolbar */}
      <div className="p-2 border-b border-[#202433] bg-[#13151c] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1">
          <FileText className="w-4 h-4 text-amber-400 shrink-0" />
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="px-2 py-1 rounded bg-[#090a0e] border border-[#272b3d] text-white font-mono text-xs focus:outline-none focus:border-amber-400 w-44"
          />

          {/* Quick Registry Indicator */}
          <div 
            onClick={() => setShowSettingsPopover(!showSettingsPopover)}
            className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1e2333]/80 border border-[#2e3752] text-[#94a3b8] hover:text-white cursor-pointer hover:border-amber-500/50 transition-all text-[11px]"
            title="Active Registry Hive: HKCU\Software\Microsoft\Notepad"
          >
            <Database className="w-3 h-3 text-amber-400" />
            <span className="truncate max-w-[130px]">HKCU\...\Notepad</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSettingsPopover(!showSettingsPopover)}
            className={`p-1.5 rounded flex items-center gap-1 transition-colors ${
              showSettingsPopover 
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300' 
                : 'bg-[#1c202d] hover:bg-[#282d40] text-[#cbd5e1]'
            }`}
            title="Configure Notepad Registry Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Preferences</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded bg-[#1c202d] hover:bg-[#282d40] text-[#cbd5e1] hover:text-white flex items-center gap-1.5 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#94a3b8]" />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleSave}
            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Preferences / Registry Settings Flyout */}
      {showSettingsPopover && (
        <div className="absolute top-11 right-3 z-30 w-80 bg-[#161922] border border-[#2b334a] rounded-lg shadow-2xl p-3.5 text-xs text-[#cbd5e1] space-y-3">
          <div className="flex items-center justify-between border-b border-[#252b3d] pb-2">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <Database className="w-4 h-4 text-amber-400" />
              <span>Notepad Registry Settings</span>
            </div>
            <button
              onClick={() => setShowSettingsPopover(false)}
              className="text-[#64748b] hover:text-white px-1.5 py-0.5 rounded hover:bg-[#222738]"
            >
              ✕
            </button>
          </div>

          <div className="text-[10px] text-[#64748b] bg-[#0c0d12] p-1.5 rounded border border-[#1f2433] font-mono break-all">
            HKCU\Software\Microsoft\Notepad
          </div>

          {/* Font Size */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#94a3b8]">Font Size (iFontSize)</span>
              <span className="text-amber-400 font-bold">{fontSize} pt</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[11, 12, 13, 14, 16, 18, 20].map((sz) => (
                <button
                  key={sz}
                  onClick={() => handleUpdateRegistrySetting('iFontSize', sz, 'REG_DWORD')}
                  className={`flex-1 py-1 rounded text-center font-mono text-[11px] transition-all ${
                    fontSize === sz 
                      ? 'bg-amber-500 text-black font-bold shadow-sm' 
                      : 'bg-[#1e2333] hover:bg-[#282e42] text-[#94a3b8]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Font Face */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#94a3b8]">Font Family (lfFaceName)</span>
              <span className="text-emerald-400">{fontFace}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {['Consolas', 'Courier New', 'monospace', 'sans-serif'].map((face) => (
                <button
                  key={face}
                  onClick={() => handleUpdateRegistrySetting('lfFaceName', face, 'REG_SZ')}
                  className={`px-2 py-1 rounded text-[11px] truncate text-left transition-all ${
                    fontFace === face 
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300' 
                      : 'bg-[#1e2333] hover:bg-[#282e42] text-[#94a3b8]'
                  }`}
                >
                  {face}
                </button>
              ))}
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="pt-2 border-t border-[#252b3d] space-y-2">
            <label className="flex items-center justify-between cursor-pointer text-[11px] hover:text-white">
              <span>Word Wrap (fWrapText)</span>
              <input
                type="checkbox"
                checked={wrapText}
                onChange={(e) => handleUpdateRegistrySetting('fWrapText', e.target.checked ? 1 : 0, 'REG_DWORD')}
                className="accent-amber-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-[11px] hover:text-white">
              <span>Line Numbers (fLineNumbers)</span>
              <input
                type="checkbox"
                checked={showLineNumbers}
                onChange={(e) => handleUpdateRegistrySetting('fLineNumbers', e.target.checked ? 1 : 0, 'REG_DWORD')}
                className="accent-amber-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-[11px] hover:text-white">
              <span>Status Bar (fStatusBar)</span>
              <input
                type="checkbox"
                checked={showStatusBar}
                onChange={(e) => handleUpdateRegistrySetting('fStatusBar', e.target.checked ? 1 : 0, 'REG_DWORD')}
                className="accent-amber-500 rounded"
              />
            </label>
          </div>

          {/* Quick Registry Action Button */}
          <div className="pt-2 border-t border-[#252b3d] flex items-center justify-between">
            <button
              onClick={() => {
                setShowSettingsPopover(false);
                openApp('system-config');
              }}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open in Registry Editor (regedit)</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor Main Canvas with Optional Line Numbers */}
      <div className="flex-1 flex overflow-hidden bg-[#0a0b0e]">
        {/* Line Numbers */}
        {showLineNumbers && (
          <div 
            className="py-3 px-3 bg-[#0d0e12] border-r border-[#1e2230] text-[#475569] text-right font-mono select-none min-w-[3rem] overflow-hidden"
            style={{ fontSize: `${fontSize}px`, lineHeight: `${Math.round(fontSize * 1.6)}px` }}
          >
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: `${Math.round(fontSize * 1.6)}px`,
            fontFamily: fontFace === 'monospace' ? 'monospace' : `"${fontFace}", monospace`,
            whiteSpace: wrapText ? 'pre-wrap' : 'pre',
            wordBreak: wrapText ? 'break-word' : 'normal'
          }}
          className="flex-1 p-3 bg-transparent text-[#e2e8f0] resize-none focus:outline-none overflow-auto selection:bg-amber-500/30 selection:text-white"
          spellCheck={false}
        />
      </div>

      {/* Footer Info Bar */}
      {showStatusBar && (
        <div className="h-6 px-3 bg-[#11131a] border-t border-[#202433] flex items-center justify-between text-[10px] text-[#64748b] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-[#94a3b8]">{statusMessage}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{lines.length} lines</span>
            <span>{content.length} chars</span>
            <span>{fontFace}, {fontSize}pt</span>
            <span>UTF-8</span>
          </div>
        </div>
      )}
    </div>
  );
};
