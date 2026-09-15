// jb7572_2026-08-24: Process Virtual Memory, Hex Dumper & Disassembly Debugger Service
import { ProcessMemoryDetail, ProcessMemorySection, CpuRegistersSnapshot, DisassemblyInstruction } from '../types';
import { systemProcessService } from './systemProcessService';

class MemoryDebuggerService {
  private sampleDisassemblyMap: Record<string, DisassemblyInstruction[]> = {
    'kmain': [
      { address: '0x0000000000401000', rawHex: '55', mnemonic: 'push', operands: 'rbp', comment: 'setup stack frame' },
      { address: '0x0000000000401001', rawHex: '48 89 e5', mnemonic: 'mov', operands: 'rbp, rsp' },
      { address: '0x0000000000401004', rawHex: '48 83 ec 20', mnemonic: 'sub', operands: 'rsp, 0x20', comment: 'reserve local buffer' },
      { address: '0x0000000000401008', rawHex: '48 8b 05 f1 2f 00 00', mnemonic: 'mov', operands: 'rax, qword ptr [rip + 0x2ff1]', comment: 'load CR3 page dir root' },
      { address: '0x000000000040100f', rawHex: '0f 22 d8', mnemonic: 'mov', operands: 'cr3, rax', comment: 'flush TLB / switch PML4' },
      { address: '0x0000000000401012', rawHex: 'e8 59 02 00 00', mnemonic: 'call', operands: '0x401270 <vfs_init>', comment: 'initialize virtual VFS' },
      { address: '0x0000000000401017', rawHex: '48 85 c0', mnemonic: 'test', operands: 'rax, rax' },
      { address: '0x000000000040101a', rawHex: '75 08', mnemonic: 'jnz', operands: '0x401024 <kmain_panic>', comment: 'panic if VFS fails' },
      { address: '0x000000000040101c', rawHex: 'b8 00 00 00 00', mnemonic: 'mov', operands: 'eax, 0' },
      { address: '0x0000000000401021', rawHex: 'c9', mnemonic: 'leave', operands: '' },
      { address: '0x0000000000401022', rawHex: 'c3', mnemonic: 'ret', operands: '' },
      { address: '0x0000000000401024', rawHex: 'bf 01 00 00 00', mnemonic: 'mov', operands: 'edi, 1' },
      { address: '0x0000000000401029', rawHex: 'e8 b2 0f 00 00', mnemonic: 'call', operands: '0x401fe0 <kernel_panic>' },
      { address: '0x000000000040102e', rawHex: 'f4', mnemonic: 'hlt', operands: '', comment: 'freeze core' }
    ],
    'default': [
      { address: '0x00007fff00100000', rawHex: '48 31 c0', mnemonic: 'xor', operands: 'rax, rax', comment: 'clear return reg' },
      { address: '0x00007fff00100003', rawHex: '48 89 c7', mnemonic: 'mov', operands: 'rdi, rax' },
      { address: '0x00007fff00100006', rawHex: '0f 05', mnemonic: 'syscall', operands: '', comment: 'SYS_sched_yield / epoll_wait' },
      { address: '0x00007fff00100008', rawHex: '48 85 c0', mnemonic: 'test', operands: 'rax, rax' },
      { address: '0x00007fff0010000b', rawHex: '78 12', mnemonic: 'js', operands: '0x7fff0010001f <handle_err>' },
      { address: '0x00007fff0010000d', rawHex: 'eb f1', mnemonic: 'jmp', operands: '0x7fff00100000 <loop>' }
    ]
  };

  private generateHexDump(baseOffset: string, byteCount: number = 128) {
    const lines = [];
    const base = parseInt(baseOffset.replace('0x', ''), 16) || 0x401000;
    
    for (let i = 0; i < byteCount; i += 16) {
      const currentAddr = (base + i).toString(16).padStart(16, '0');
      const hexBytes: string[] = [];
      let ascii = '';

      for (let j = 0; j < 16; j++) {
        // pseudo realistic opcodes and ascii
        const byteVal = (Math.sin(base + i + j) * 10000) & 0xff;
        const hex = byteVal.toString(16).padStart(2, '0');
        hexBytes.push(hex);
        
        // Printable ASCII
        if (byteVal >= 32 && byteVal <= 126) {
          ascii += String.fromCharCode(byteVal);
        } else {
          ascii += '.';
        }
      }

      lines.push({
        offset: `0x${currentAddr}`,
        hexBytes,
        ascii
      });
    }

    return lines;
  }

  public getProcessMemoryDetail(pid: number): ProcessMemoryDetail {
    const procs = systemProcessService.getProcesses();
    const target = procs.find(p => p.pid === pid) || procs[0] || { pid: 1, name: 'init / systemd', status: 'RUNNING' as const };

    const isKernel = target.name.toLowerCase().includes('kernel') || target.pid === 1;

    const sections: ProcessMemorySection[] = [
      {
        name: '.text',
        startAddr: '0x0000000000400000',
        endAddr: '0x0000000000418000',
        sizeBytes: 98304,
        permissions: 'r-xp',
        mappingFile: `/bin/${target.name.replace(/\s+/g, '_')}`
      },
      {
        name: '.rodata',
        startAddr: '0x0000000000600000',
        endAddr: '0x0000000000608000',
        sizeBytes: 32768,
        permissions: 'r--p',
        mappingFile: `/bin/${target.name.replace(/\s+/g, '_')}`
      },
      {
        name: '.data & .bss',
        startAddr: '0x0000000000608000',
        endAddr: '0x0000000000620000',
        sizeBytes: 98304,
        permissions: 'rw-p'
      },
      {
        name: '[heap / brk]',
        startAddr: '0x0000000001a40000',
        endAddr: '0x0000000001cc0000',
        sizeBytes: 2621440,
        permissions: 'rw-p'
      },
      {
        name: '[ipc_shared_mmap]',
        startAddr: '0x00007fff00000000',
        endAddr: '0x00007fff00200000',
        sizeBytes: 2097152,
        permissions: 'rw-s',
        mappingFile: '/dev/shm/SecureCurtain_ipc_bus'
      },
      {
        name: '[user_stack]',
        startAddr: '0x00007ffffffde000',
        endAddr: '0x00007ffffffff000',
        sizeBytes: 135168,
        permissions: 'rw-p'
      }
    ];

    const registers: CpuRegistersSnapshot = {
      rip: isKernel ? '0x0000000000401008' : '0x00007fff00100006',
      rsp: '0x00007fffffffe4c0',
      rbp: '0x00007fffffffe4e0',
      rax: '0x0000000000000000',
      rbx: '0x0000000000608240',
      rcx: '0x00007fff00001020',
      rdx: '0x0000000000000040',
      rsi: '0x00007fffffffe500',
      rdi: '0x0000000000000001',
      r8:  '0x0000000000000000',
      r9:  '0x0000000000000008',
      r10: '0x00007fff00100200',
      r11: '0x0000000000000246',
      r12: '0x0000000000401000',
      r13: '0x00007fffffffe5c0',
      r14: '0x0000000000000000',
      r15: '0x0000000000000000',
      rflags: '0x00000246 [IF DF TF IOPL=0]',
      cr0: '0x80050033 (PG PE WP AM NE TS MP)',
      cr3: `0x000000001f${(pid * 137).toString(16).padStart(6, '0')}000 (PML4)`,
      cr4: '0x000006f0 (PAE PSE PGE OSFXSR)'
    };

    const instructions = isKernel ? this.sampleDisassemblyMap['kmain'] : this.sampleDisassemblyMap['default'];
    const hexDump = this.generateHexDump(instructions[0].address, 128);

    return {
      pid: target.pid,
      name: target.name,
      status: target.status === 'RUNNING' ? 'RUNNING' : target.status === 'STOPPED' ? 'STOPPED' : 'SLEEPING',
      pageTableRootCR3: registers.cr3,
      sections,
      registers,
      instructions,
      hexDump
    };
  }

  public readRawMemoryHex(startAddressHex: string, linesCount: number = 8) {
    return this.generateHexDump(startAddressHex, linesCount * 16);
  }
}

export const memoryDebuggerService = new MemoryDebuggerService();
