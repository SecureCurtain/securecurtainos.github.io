// jb7572_2026-08-24: Process Virtual Memory & Hex/Disassembler Debugger GUI
import React, { useState, useEffect } from 'react';
import { memoryDebuggerService } from '../../services/memoryDebuggerService';
import { systemProcessService } from '../../services/systemProcessService';
import { ProcessMemoryDetail, ProcessMemorySection } from '../../types';
import { WasmDisassemblerGUI } from './WasmDisassemblerGUI';
import { 
  Binary, 
  Cpu, 
  Layers, 
  Code2, 
  FileCode2, 
  Search, 
  RefreshCw, 
  Terminal, 
  ShieldAlert, 
  Play, 
  Pause, 
  Eye,
  Hash,
  Activity,
  ArrowRight,
  Database,
  Upload
} from 'lucide-react';

interface MemoryDebuggerGUIProps {
  onRunCliCommand?: (cmd: string) => void;
}

export const MemoryDebuggerGUI: React.FC<MemoryDebuggerGUIProps> = ({ onRunCliCommand }) => {
  const [processes, setProcesses] = useState(systemProcessService.getProcesses());
  const [selectedPid, setSelectedPid] = useState<number>(1);
  const [memDetail, setMemDetail] = useState<ProcessMemoryDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'MAPS' | 'REGISTERS' | 'DISASM' | 'HEXDUMP' | 'WASM_DISASM'>('MAPS');
  const [customHexAddr, setCustomHexAddr] = useState('0x0000000000401000');
  const [isLiveReading, setIsLiveReading] = useState(true);

  useEffect(() => {
    setProcesses(systemProcessService.getProcesses());
    const detail = memoryDebuggerService.getProcessMemoryDetail(selectedPid);
    setMemDetail(detail);
  }, [selectedPid]);

  const handleRefresh = () => {
    setProcesses(systemProcessService.getProcesses());
    setMemDetail(memoryDebuggerService.getProcessMemoryDetail(selectedPid));
  };

  const handleCustomHexSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHexAddr) return;
    const lines = memoryDebuggerService.readRawMemoryHex(customHexAddr, 10);
    if (memDetail) {
      setMemDetail({
        ...memDetail,
        hexDump: lines
      });
    }
  };

  if (!memDetail) return null;

  return (
    <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-5 shadow-2xl space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#171717] rounded-xl border border-[#2a2a2a] text-purple-400">
            <Binary className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#f5f5f5]">
                Process Virtual Memory & Disassembler Debugger
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/50 font-mono">
                Ring 3 / Ring 0 Low-Level Inspector
              </span>
            </div>
            <p className="text-xs text-[#737373]">
              Page tables (CR3/PML4), ELF segment mappings, x86_64 CPU register snapshots, interactive instruction disassembly & hex memory viewer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181818] border border-[#2c2c2c] text-xs text-[#ddd] hover:bg-[#222] hover:text-white transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            Refresh
          </button>
          <button
            onClick={() => onRunCliCommand && onRunCliCommand(`gdb ${selectedPid}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/50 border border-purple-700/50 text-xs text-purple-300 hover:bg-purple-900/60 transition-all font-mono"
          >
            <Terminal className="w-3.5 h-3.5" />
            gdb {selectedPid}
          </button>
        </div>
      </div>

      {/* Process Selection Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-[#141414] border border-[#242424] rounded-xl p-3">
        <div className="md:col-span-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#888]" />
          <span className="text-xs text-[#bbb] font-medium">Target Process:</span>
          <select
            value={selectedPid}
            onChange={(e) => setSelectedPid(Number(e.target.value))}
            className="bg-[#1c1c1c] border border-[#333] text-xs text-[#f5f5f5] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500 flex-1 font-mono"
          >
            {processes.map((p) => (
              <option key={p.pid} value={p.pid}>
                PID {p.pid}: {p.name} ({p.status})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-8 flex flex-wrap items-center gap-3 justify-end text-xs font-mono">
          <div className="px-2.5 py-1 rounded bg-[#1c1c1c] border border-[#2a2a2a] text-[#aaa]">
            CR3 / PML4: <strong className="text-purple-300">{memDetail.pageTableRootCR3}</strong>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#1c1c1c] border border-[#2a2a2a] text-[#aaa]">
            Status: <strong className={memDetail.status === 'RUNNING' ? 'text-emerald-400' : 'text-amber-400'}>{memDetail.status}</strong>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#1c1c1c] border border-[#2a2a2a] text-[#aaa]">
            Sections: <strong className="text-blue-300">{memDetail.sections.length} Virtual Regions</strong>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#222] gap-2">
        <button
          onClick={() => setActiveTab('MAPS')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'MAPS'
              ? 'border-purple-500 text-purple-300 bg-purple-950/20'
              : 'border-transparent text-[#888] hover:text-[#ddd]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Virtual Memory Mappings (Page Tables)
        </button>

        <button
          onClick={() => setActiveTab('REGISTERS')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'REGISTERS'
              ? 'border-purple-500 text-purple-300 bg-purple-950/20'
              : 'border-transparent text-[#888] hover:text-[#ddd]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          x86_64 Registers & Control Flags
        </button>

        <button
          onClick={() => setActiveTab('DISASM')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'DISASM'
              ? 'border-purple-500 text-purple-300 bg-purple-950/20'
              : 'border-transparent text-[#888] hover:text-[#ddd]'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Live Disassembly (.text stream)
        </button>

        <button
          onClick={() => setActiveTab('HEXDUMP')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'HEXDUMP'
              ? 'border-purple-500 text-purple-300 bg-purple-950/20'
              : 'border-transparent text-[#888] hover:text-[#ddd]'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          Hex Memory Dumper (xxd / hexdump)
        </button>

        <button
          onClick={() => setActiveTab('WASM_DISASM')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'WASM_DISASM'
              ? 'border-purple-500 text-purple-300 bg-purple-950/20'
              : 'border-transparent text-[#888] hover:text-[#ddd]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          WASM Capstone / r2 Engine (Multi-Arch)
        </button>
      </div>

      {/* Tab 5: WASM Capstone / r2 Static Disassembler & File Uploader */}
      {activeTab === 'WASM_DISASM' && (
        <div className="space-y-4">
          <WasmDisassemblerGUI 
            initialBinaryName={`${memDetail.name}.bin`}
            onRunCliCommand={onRunCliCommand}
          />
        </div>
      )}

      {/* Tab 1: Virtual Memory Mappings */}
      {activeTab === 'MAPS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#888]">
            <span>4-Level Page Table Mapping (PML4 &rarr; PDPT &rarr; PD &rarr; PT &rarr; 4KB / 2MB Huge Pages)</span>
            <button
              onClick={() => onRunCliCommand && onRunCliCommand(`readelf ${selectedPid}`)}
              className="text-purple-400 hover:text-purple-300 font-mono text-[11px]"
            >
              Run "readelf {selectedPid}" in CLI &rarr;
            </button>
          </div>

          <div className="overflow-x-auto border border-[#222] rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#151515] border-b border-[#222] text-[#888]">
                <tr>
                  <th className="p-3">Section / Region</th>
                  <th className="p-3">Virtual Start</th>
                  <th className="p-3">Virtual End</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Permissions</th>
                  <th className="p-3">Backing VFS Node</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e] bg-[#0d0d0d]">
                {memDetail.sections.map((sec, idx) => (
                  <tr key={idx} className="hover:bg-[#151515] transition-colors">
                    <td className="p-3 font-semibold text-purple-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      {sec.name}
                    </td>
                    <td className="p-3 text-[#bbb]">{sec.startAddr}</td>
                    <td className="p-3 text-[#888]">{sec.endAddr}</td>
                    <td className="p-3 text-[#ddd]">{(sec.sizeBytes / 1024).toFixed(0)} KB</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sec.permissions.includes('x') 
                          ? 'bg-amber-950/70 text-amber-300 border border-amber-800/40' 
                          : sec.permissions.includes('w')
                          ? 'bg-blue-950/70 text-blue-300 border border-blue-800/40'
                          : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                      }`}>
                        {sec.permissions}
                      </span>
                    </td>
                    <td className="p-3 text-[#777]">{sec.mappingFile || '[anonymous memory]'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setCustomHexAddr(sec.startAddr);
                          setActiveTab('HEXDUMP');
                        }}
                        className="px-2 py-1 rounded bg-[#1c1c1c] text-[#aaa] hover:text-white hover:bg-purple-900/50 text-[10px] transition-all"
                      >
                        Inspect Hex
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Registers & CPU Control Flags */}
      {activeTab === 'REGISTERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#888]">
            <span>64-bit General Purpose Registers (GPRs), Stack Pointer & CPU Control Flags</span>
            <button
              onClick={() => onRunCliCommand && onRunCliCommand(`regs ${selectedPid}`)}
              className="text-purple-400 hover:text-purple-300 font-mono text-[11px]"
            >
              Run "regs {selectedPid}" in CLI →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 font-mono text-xs">
            {Object.entries(memDetail.registers).map(([reg, val]) => {
              const isSpecial = ['rip', 'rsp', 'rbp', 'cr3', 'rflags'].includes(reg);
              return (
                <div 
                  key={reg} 
                  className={`p-3 rounded-xl border ${
                    isSpecial 
                      ? 'bg-[#181524] border-purple-800/50 shadow-sm' 
                      : 'bg-[#121212] border-[#222]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`uppercase font-bold ${isSpecial ? 'text-purple-400' : 'text-[#888]'}`}>
                      {reg}
                    </span>
                    {isSpecial && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-700/50">
                        KEY
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#eee] truncate" title={val}>
                    {val}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Disassembly (.text Instruction Stream) */}
      {activeTab === 'DISASM' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#888]">
            <span>Linear Instruction Stream at RIP ({memDetail.registers.rip})</span>
            <button
              onClick={() => onRunCliCommand && onRunCliCommand(`objdump ${selectedPid}`)}
              className="text-purple-400 hover:text-purple-300 font-mono text-[11px]"
            >
              Run "objdump {selectedPid}" in CLI →
            </button>
          </div>

          <div className="bg-[#0b0b0b] border border-[#222] rounded-xl p-4 font-mono text-xs space-y-1.5 overflow-x-auto">
            {memDetail.instructions.map((ins, i) => {
              const isRip = ins.address.toLowerCase() === memDetail.registers.rip.toLowerCase();
              return (
                <div
                  key={i}
                  className={`flex items-center gap-4 px-2 py-1 rounded transition-colors ${
                    isRip ? 'bg-purple-950/60 border border-purple-700/60 text-white' : 'hover:bg-[#141414] text-[#aaa]'
                  }`}
                >
                  <div className="w-4 text-purple-400 flex items-center">
                    {isRip && <ArrowRight className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-purple-300 w-36">{ins.address}</span>
                  <span className="text-[#666] w-36">{ins.rawHex}</span>
                  <span className="font-bold text-amber-300 w-16">{ins.mnemonic}</span>
                  <span className="text-[#ddd] flex-1">{ins.operands}</span>
                  {ins.comment && (
                    <span className="text-[#555] italic text-[11px]">{`; ${ins.comment}`}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Hex Memory Dumper */}
      {activeTab === 'HEXDUMP' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <form onSubmit={handleCustomHexSearch} className="flex items-center gap-2">
              <span className="text-[#888] font-mono">Address:</span>
              <input
                type="text"
                value={customHexAddr}
                onChange={(e) => setCustomHexAddr(e.target.value)}
                placeholder="0x0000000000401000"
                className="bg-[#161616] border border-[#333] text-xs font-mono text-[#f5f5f5] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-purple-500 w-52"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-700/50 text-purple-300 hover:bg-purple-900/70 font-mono text-xs transition-all"
              >
                Dump
              </button>
            </form>

            <button
              onClick={() => onRunCliCommand && onRunCliCommand(`xxd ${customHexAddr}`)}
              className="text-purple-400 hover:text-purple-300 font-mono text-[11px]"
            >
              Run "xxd {customHexAddr}" in CLI →
            </button>
          </div>

          <div className="bg-[#090909] border border-[#222] rounded-xl p-4 font-mono text-xs space-y-1 overflow-x-auto">
            <div className="flex items-center text-[#555] pb-2 border-b border-[#1c1c1c] text-[11px]">
              <span className="w-36">OFFSET</span>
              <span className="w-96">00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F</span>
              <span className="pl-4">ASCII DECODE</span>
            </div>

            {memDetail.hexDump.map((line, idx) => (
              <div key={idx} className="flex items-center text-[#ccc] hover:bg-[#121212] py-0.5 px-1 rounded">
                <span className="text-purple-400 w-36 font-semibold">{line.offset}</span>
                <span className="text-[#aaa] w-96 flex gap-1">
                  <span className="text-[#bbb]">{line.hexBytes.slice(0, 8).join(' ')}</span>
                  <span className="text-[#555]"> </span>
                  <span className="text-[#999]">{line.hexBytes.slice(8).join(' ')}</span>
                </span>
                <span className="pl-4 text-emerald-400/90 font-sans tracking-widest">{line.ascii}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
