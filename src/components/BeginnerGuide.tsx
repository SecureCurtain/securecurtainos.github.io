// jb7572_2026-08-24: OS Architecture & Beginner Guidelines Documentation Component
import React from 'react';
import { 
  FolderTree, 
  Cpu, 
  Code2, 
  FileCode, 
  Terminal, 
  Layers, 
  HelpCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

// jb7572_2026-08-24: Educational component detailing directory semantics for SecureCurtain/sys
export const BeginnerGuide: React.FC = () => {
  return (
    <div className="space-y-5">
      {/* jb7572_2026-08-24: Main OS Architecture Overview Banner */}
      <div className="bg-[#0f0f0f] p-5 rounded-xl border border-[#222] shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1a1a1a] text-[#c4b5fd] rounded-lg border border-[#333]">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#e5e5e5]">
              Operating System Architecture Guide
            </h2>
            <p className="text-xs text-[#737373]">
              Directory semantics for <code className="bg-[#181818] px-1.5 py-0.5 rounded font-mono text-[#c4b5fd] border border-[#282828]">home/projects/SecureCurtain/sys</code>.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#a3a3a3] leading-relaxed">
          When building an x86_64 Operating System from scratch, separating code by execution stage and responsibility keeps your build scripts simple, prevents compilation circular dependencies, and mimics real production OS kernels like Linux or OS/161.
        </p>

        {/* jb7572_2026-08-24: Directory responsibility breakdown cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">

          {/* Boot */}
          <div className="p-3.5 rounded-lg border border-[#222] bg-[#080808] space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-mono font-semibold text-xs">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>/boot/arch/x86_64</span>
            </div>
            <p className="text-[11px] text-[#888] leading-relaxed">
              Low-level bootloader startup code, CPU mode switches, and linker memory mappings.
            </p>
            <div className="text-[10px] font-mono bg-[#020202] text-[#a3a3a3] p-2 rounded border border-[#181818] space-y-1">
              <div>• <code className="text-[#c4b5fd]">boot.asm</code> - Multiboot header & 64-bit jump</div>
              <div>• <code className="text-[#c4b5fd]">linker.ld</code> - Memory addresses (1MB boundary)</div>
              <div>• <code className="text-[#c4b5fd]">gdt.asm</code> - Global Descriptor Table setup</div>
            </div>
          </div>

          {/* Kernel Core */}
          <div className="p-3.5 rounded-lg border border-[#222] bg-[#080808] space-y-2">
            <div className="flex items-center gap-2 text-blue-300 font-mono font-semibold text-xs">
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span>/kernel</span>
            </div>
            <p className="text-[11px] text-[#888] leading-relaxed">
              Core kernel source files (.c) that handle boot initialization, interrupt vectors, and low-level drivers.
            </p>
            <div className="text-[10px] font-mono bg-[#020202] text-[#a3a3a3] p-2 rounded border border-[#181818] space-y-1">
              <div>• <code className="text-[#c4b5fd]">kmain.c</code> - C entry point after boot</div>
              <div>• <code className="text-[#c4b5fd]">vga.c</code> - VGA text frame buffer driver</div>
              <div>• <code className="text-[#c4b5fd]">idt.c</code> - Interrupt Descriptor Table setup</div>
            </div>
          </div>

          {/* Kernel Include */}
          <div className="p-3.5 rounded-lg border border-[#222] bg-[#080808] space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-mono font-semibold text-xs">
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>/kernel/include</span>
            </div>
            <p className="text-[11px] text-[#888] leading-relaxed">
              Global header files (.h) containing function prototypes, struct definitions, and hardware constants.
            </p>
            <div className="text-[10px] font-mono bg-[#020202] text-[#a3a3a3] p-2 rounded border border-[#181818] space-y-1">
              <div>• <code className="text-[#c4b5fd]">vga.h</code> - Display output prototypes</div>
              <div>• <code className="text-[#c4b5fd]">idt.h</code> - Interrupt handler structs</div>
              <div>• <code className="text-[#c4b5fd]">types.h</code> - <code className="text-[9px]">uint64_t</code> definitions</div>
            </div>
          </div>

          {/* Subsystems */}
          <div className="p-3.5 rounded-lg border border-[#222] bg-[#080808] space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-mono font-semibold text-xs">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>/subsystems</span>
            </div>
            <p className="text-[11px] text-[#888] leading-relaxed">
              Modular high-level OS features sitting above the core bare-metal kernel.
            </p>
            <div className="text-[10px] font-mono bg-[#020202] text-[#a3a3a3] p-2 rounded border border-[#181818] space-y-1">
              <div>• <code className="text-[#c4b5fd]">/memory/pmm.c</code> - Page frame manager</div>
              <div>• <code className="text-[#c4b5fd]">/process/sched.c</code> - Task scheduler</div>
              <div>• <code className="text-[#c4b5fd]">/fs/vfs.c</code> - Virtual File System</div>
            </div>
          </div>
        </div>
      </div>

      {/* jb7572_2026-08-24: Rules of thumb checklist for beginners */}
      <div className="bg-[#0f0f0f] p-5 rounded-xl border border-[#222] shadow-xl space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#e5e5e5] flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#c4b5fd]" /> Architectural Placement Rules
        </h3>


        <div className="space-y-2.5 text-xs">
          <div className="flex items-start gap-3 p-3 bg-[#050505] rounded-lg border border-[#1a1a1a]">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <span className="font-mono font-semibold text-[#e5e5e5]">Rule 1: Assembly (`mov`, `cli`, `lgdt`)</span>
              <p className="text-[#888] mt-0.5">
                Target location: <code className="font-mono text-purple-300">boot/arch/x86_64/filename.asm</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[#050505] rounded-lg border border-[#1a1a1a]">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <span className="font-mono font-semibold text-[#e5e5e5]">Rule 2: Header file (`.h` / `#ifndef`)</span>
              <p className="text-[#888] mt-0.5">
                Target location: <code className="font-mono text-emerald-300">kernel/include/filename.h</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[#050505] rounded-lg border border-[#1a1a1a]">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <span className="font-mono font-semibold text-[#e5e5e5]">Rule 3: OS feature module (allocator, scheduler)</span>
              <p className="text-[#888] mt-0.5">
                Target location: <code className="font-mono text-amber-300">subsystems/feature_name/module.c</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[#050505] rounded-lg border border-[#1a1a1a]">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <span className="font-mono font-semibold text-[#e5e5e5]">Rule 4: Linker or Python build script</span>
              <p className="text-[#888] mt-0.5">
                Linker scripts go to <code className="font-mono text-pink-300">boot/arch/x86_64/linker.ld</code>, build scripts to <code className="font-mono text-[#d4d4d4]">sys/build_subsystem.py</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
