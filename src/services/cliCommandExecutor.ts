// CLI Command Executor: Comprehensive Multi-Domain Engine
// Executes POSIX, modern Linux, Windows CLI/PowerShell, security, diagnostics,
// kernel parameters, and hardware introspection commands.

import { COMMAND_DOCS } from './commandRegistryService';
import { backgroundJobService } from './backgroundJobService';
import { bugReporterService, OFFICIAL_BUG_RECIPIENT } from './bugReporterService';
import { systemConfigService } from './systemConfigService';
import { RegistryHive, RegistryValueType, RegistryEntry, TreeNode } from '../types';
import { initialOSTree } from '../data/osTreeData';
import { findTreeNode } from '../utils/vfsUtils';

const VIRTUAL_FILES: Record<string, string> = {
  '/etc/os-release': `NAME="SecureCurtain OS"
VERSION="1.0.4 LTS (Hardened Microkernel)"
ID=securecurtain
ID_LIKE=linux
VERSION_ID="1.0.4"
PRETTY_NAME="SecureCurtain OS 1.0.4 LTS x86_64"
ANSI_COLOR="0;36"
HOME_URL="https://securecurtain.io"
SUPPORT_URL="https://github.com/SecureCurtain/securecurtainos"
BUG_REPORT_URL="mailto:securecurtainos.bugs@gmail.com"
SECURITY_POLICY="IMMUTABLE_ROOT_A + DM_VERITY + EBPF_ENFORCED"`,
  '/etc/issue': `SecureCurtain OS 1.0.4 LTS \\n \\l\n\n`,
  '/etc/hostname': `securecurtain-node01\n`,
  '/etc/hosts': `127.0.0.1\tlocalhost securecurtain-node01
::1\tlocalhost ip6-localhost ip6-loopback
192.168.1.1\tgateway.internal
10.0.0.1\tairgap.internal.securecurtain\n`,
  '/proc/version': `Linux version 6.10.4-securecurtain-x86_64 (toolchains@securecurtain.dev) (gcc version 14.1.0 (GCC)) #1 SMP PREEMPT_DYNAMIC Mon Aug 24 21:00:00 UTC 2026\n`,
  '/proc/cpuinfo': `processor\t: 0
vendor_id\t: GenuineIntel
cpu family\t: 6
model\t\t: 154
model name\t: 13th Gen Intel(R) Core(TM) i9-13900K
cpu MHz\t\t: 3000.000
cache size\t: 36864 KB
flags\t\t: fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ss ht syscall nx pdpe1gb rdtscp lm constant_tsc avx avx2 bmi1 bmi2\n`,
  '/proc/meminfo': `MemTotal:       32768000 kB
MemFree:        21854200 kB
MemAvailable:   26402300 kB
Buffers:          412900 kB
Cached:          4528000 kB
SwapTotal:      16777212 kB
SwapFree:       16777212 kB\n`,
  '/proc/uptime': `14285.32 57141.28\n`
};

// Melded to canonical findTreeNode in vfsUtils.ts
function findVfsNode(node: TreeNode, target: string): TreeNode | null {
  return findTreeNode(node, target);
}

export interface CommandExecutionResult {
  output: string;
  isError?: boolean;
}

export class CliCommandExecutor {
  static execute(cmd: string, args: string[], currentDir: string = '/'): CommandExecutionResult | null {
    const main = cmd.toLowerCase();

    switch (main) {
      // --- Core Shell & System Introspection ---
      case 'pwd': {
        return { output: currentDir || '/root' };
      }

      case 'whoami': {
        return { output: 'root' };
      }

      case 'id': {
        return { output: 'uid=0(root) gid=0(root) groups=0(root),27(sudo),100(users)' };
      }

      case 'echo': {
        const raw = args.join(' ');
        const cleaned = raw.replace(/^["'](.*)["']$/, '$1');
        return { output: cleaned };
      }

      case 'cat': {
        if (!args[0]) return { output: 'cat: missing file operand\nTry "cat --help" for more information.', isError: true };
        const target = args[0];
        const lower = target.toLowerCase();

        for (const [vPath, vContent] of Object.entries(VIRTUAL_FILES)) {
          if (lower === vPath || lower === vPath.replace(/^\/+/, '')) {
            return { output: vContent };
          }
        }

        const node = findVfsNode(initialOSTree, target);
        if (node) {
          if (node.type === 'folder') {
            return { output: `cat: ${target}: Is a directory`, isError: true };
          }
          return { output: node.content || `/* [File: ${node.name}] - Size: ${node.sizeBytes || 1024} bytes */\n// ${node.description || 'Binary/Text payload'}` };
        }

        return { output: `cat: ${target}: No such file or directory`, isError: true };
      }

      case 'head': {
        if (!args[0]) return { output: 'head: missing file operand', isError: true };
        let linesCount = 10;
        let fileArg = args[0];
        if (args[0] === '-n' && args[1]) {
          linesCount = parseInt(args[1], 10) || 10;
          fileArg = args[2] || '';
        }
        let content = VIRTUAL_FILES[fileArg.toLowerCase()] || '';
        if (!content) {
          const node = findVfsNode(initialOSTree, fileArg);
          content = node?.content || (node ? `/* ${node.name} */` : '');
        }
        if (!content) return { output: `head: cannot open '${fileArg}': No such file or directory`, isError: true };
        return { output: content.split('\n').slice(0, linesCount).join('\n') };
      }

      case 'tail': {
        if (!args[0]) return { output: 'tail: missing file operand', isError: true };
        let linesCount = 10;
        let fileArg = args[0];
        if (args[0] === '-n' && args[1]) {
          linesCount = parseInt(args[1], 10) || 10;
          fileArg = args[2] || '';
        }
        let content = VIRTUAL_FILES[fileArg.toLowerCase()] || '';
        if (!content) {
          const node = findVfsNode(initialOSTree, fileArg);
          content = node?.content || (node ? `/* ${node.name} */` : '');
        }
        if (!content) return { output: `tail: cannot open '${fileArg}': No such file or directory`, isError: true };
        const lines = content.split('\n');
        return { output: lines.slice(Math.max(0, lines.length - linesCount)).join('\n') };
      }

      case 'wc': {
        if (!args[0]) return { output: 'wc: missing file operand', isError: true };
        const fileArg = args[0];
        let content = VIRTUAL_FILES[fileArg.toLowerCase()] || '';
        if (!content) {
          const node = findVfsNode(initialOSTree, fileArg);
          content = node?.content || (node ? `/* ${node.name} */` : '');
        }
        if (!content) return { output: `wc: ${fileArg}: No such file or directory`, isError: true };
        const lines = content.split('\n').length;
        const words = content.trim().split(/\s+/).filter(Boolean).length;
        const bytes = new TextEncoder().encode(content).length;
        return { output: `  ${lines}  ${words}  ${bytes} ${fileArg}` };
      }

      case 'touch': {
        if (!args[0]) return { output: 'touch: missing file operand', isError: true };
        return { output: `touch: updated timestamp / created inode for '${args[0]}'` };
      }

      case 'mkdir': {
        if (!args[0]) return { output: 'mkdir: missing operand', isError: true };
        return { output: `mkdir: created directory '${args[0]}'` };
      }

      case 'rm': {
        if (!args[0]) return { output: 'rm: missing operand', isError: true };
        return { output: `rm: removed '${args[0]}'` };
      }
      // --- File & Directory Utilities ---
      case 'basename': {
        if (!args[0]) return { output: 'basename: missing operand\nTry "basename --help" or "man basename" for more information.', isError: true };
        const path = args[0].replace(/\/+$/, '');
        const base = path.substring(path.lastIndexOf('/') + 1) || '/';
        const suffix = args[1];
        if (suffix && base.endsWith(suffix)) {
          return { output: base.slice(0, -suffix.length) };
        }
        return { output: base };
      }

      case 'dirname': {
        if (!args[0]) return { output: 'dirname: missing operand\nTry "dirname --help" or "man dirname" for more information.', isError: true };
        const path = args[0].replace(/\/+$/, '');
        const lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return { output: '.' };
        if (lastSlash === 0) return { output: '/' };
        return { output: path.substring(0, lastSlash) };
      }

      case 'realpath': {
        if (!args[0]) return { output: currentDir };
        let target = args[0];
        if (!target.startsWith('/')) {
          target = (currentDir === '/' ? '' : currentDir) + '/' + target;
        }
        const parts = target.split('/').filter(Boolean);
        const resolved: string[] = [];
        for (const p of parts) {
          if (p === '.') continue;
          if (p === '..') resolved.pop();
          else resolved.push(p);
        }
        return { output: '/' + resolved.join('/') };
      }

      case 'sync': {
        return { output: '[  OK  ] Synchronized VFS buffers: 8 dirty pages committed to NVMe block device.' };
      }

      case 'shred': {
        if (!args[0]) return { output: 'shred: missing file operand', isError: true };
        return {
          output: `shred: overwriting ${args[0]} with 3 passes of cryptographically secure random bytes...\nshred: pass 1/3 (random)...\nshred: pass 2/3 (0xFF)...\nshred: pass 3/3 (0x00)...\nshred: ${args[0]}: removed.`
        };
      }

      case 'mktemp': {
        const rand = Math.random().toString(36).substring(2, 8);
        return { output: `/tmp/tmp.${rand}` };
      }

      case 'nl': {
        return {
          output: `     1  /* SecureCurtain OS Kernel Core */\n     2  #include <kernel/types.h>\n     3  #include <kernel/mmu.h>\n     4  void kmain(void) {\n     5      init_mmu();\n     6      init_watchdog();\n     7  }`
        };
      }

      case 'rev': {
        const text = args.join(' ') || 'SecureCurtain OS Linux Shell';
        return { output: text.split('').reverse().join('') };
      }

      case 'strings': {
        const target = args[0] || '/boot/vmlinuz-6.10-SecureCurtain';
        return {
          output: `SecureCurtain OS ELF64 Header\nLinux version 6.10.4-securecurtain-x86_64\nGCC: (GNU) 14.1.0\n.rodata: IMMUTABLE_ROOT_A\n.text: _start\n.symtab: kmain\n.strtab: watchdog_heartbeat`
        };
      }

      // --- Security & Permissions ---
      case 'chattr': {
        const flag = args[0];
        const file = args[1] || args[0];
        return { output: `chattr: attributes ${flag || '+i'} set on ${file || '/boot/vmlinuz-6.10-SecureCurtain'}` };
      }

      case 'lsattr': {
        const file = args[0] || '/boot/vmlinuz-6.10-SecureCurtain';
        return { output: `----i---------e---- ${file}` };
      }

      case 'getfacl': {
        const file = args[0] || '/etc/shadow';
        return {
          output: `# file: ${file}\n# owner: root\n# group: shadow\nuser::rw-\ngroup::r--\nmask::r--\nother::---`
        };
      }

      case 'setfacl': {
        return { output: `setfacl: ACL updated successfully for ${args.join(' ') || '/etc/shadow'}` };
      }

      case 'sestatus': {
        return {
          output: `SELinux status:                 enabled\nSELinuxfs mount:                /sys/fs/selinux\nSELinux root directory:         /etc/selinux\nLoaded policy name:             targeted\nCurrent mode:                   enforcing\nMode from config file:          enforcing\nPolicy MLS status:              enabled\nPolicy deny_unknown status:     allowed\nMemory protection:              active (W^X enforced)`
        };
      }

      case 'getsebool': {
        return {
          output: `allow_execmem --> off\nallow_execstack --> off\nsecure_mode_policyload --> on\nselinuxuser_ping --> on\nsystemd_coredump --> off`
        };
      }

      case 'setsebool': {
        return { output: `setsebool: parameter updated and committed to active policy.` };
      }

      case 'faillock':
      case 'faillog': {
        return {
          output: `Login Failures Log:\nUsername      Failures  Latest Failure                 Status\nroot                 0  Never                          Unlocked\nadmin                0  Never                          Unlocked\nguest                1  2026-08-31 14:12:05 UTC        Active`
        };
      }

      case 'lastlog': {
        return {
          output: `Username         Port     From             Latest\nroot             tty1     console          Mon Aug 31 14:50:02 -0700 2026\nadmin            pts/0    127.0.0.1        Mon Aug 31 14:52:19 -0700 2026`
        };
      }

      // --- Modern Networking & Sockets ---
      case 'ss': {
        return {
          output: `Netid State      Recv-Q Send-Q Local Address:Port        Peer Address:PortProcess\ntcp   LISTEN     0      128    127.0.0.1:3000                 0.0.0.0:*    users:(("node",pid=1,fd=19))\ntcp   LISTEN     0      4096   0.0.0.0:22                     0.0.0.0:*    users:(("sshd",pid=102,fd=3))\ntcp   LISTEN     0      512    127.0.0.1:5432                 0.0.0.0:*    users:(("postgres",pid=110,fd=5))\nudp   UNCONN     0      0      0.0.0.0:68                     0.0.0.0:*    users:(("dhclient",pid=94,fd=6))`
        };
      }

      case 'traceroute':
      case 'tracepath':
      case 'tracert': {
        const host = args[0] || '8.8.8.8';
        return {
          output: `traceroute to ${host} (8.8.8.8), 30 hops max, 60 byte packets\n 1  gateway.local (192.168.1.1)  0.412 ms  0.380 ms  0.365 ms\n 2  10.240.0.1 (10.240.0.1)  2.140 ms  2.115 ms  2.090 ms\n 3  142.250.230.12 (142.250.230.12)  5.420 ms  5.390 ms  5.370 ms\n 4  dns.google (${host})  8.120 ms  7.980 ms  8.010 ms`
        };
      }

      case 'mtr': {
        const host = args[0] || '8.8.8.8';
        return {
          output: `My traceroute [v0.95] (SecureCurtain MTR Realtime)\nHost: localhost                          Loss%   Snt   Last   Avg  Best  Wrst StDev\n 1.|-- 192.168.1.1                        0.0%    10    0.4   0.4   0.3   0.5   0.1\n 2.|-- 10.240.0.1                         0.0%    10    2.1   2.2   2.0   2.5   0.2\n 3.|-- 142.250.230.12                     0.0%    10    5.4   5.5   5.2   5.8   0.2\n 4.|-- ${host}                            0.0%    10    8.0   8.1   7.9   8.4   0.2`
        };
      }

      case 'dig':
      case 'drill': {
        const domain = args[0] || 'google.com';
        return {
          output: `; <<>> DiG 9.18.28-SecureCurtain <<>> ${domain}\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 48192\n;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1\n\n;; QUESTION SECTION:\n;${domain}.                     IN      A\n\n;; ANSWER SECTION:\n${domain}.              300     IN      A       142.250.190.46\n\n;; Query time: 12 msec\n;; SERVER: 127.0.0.53#53(127.0.0.53) (UDP)\n;; WHEN: ${new Date().toUTCString()}\n;; MSG SIZE  rcvd: 55`
        };
      }

      case 'nc':
      case 'netcat':
      case 'socat': {
        return {
          output: `netcat: listening on 0.0.0.0:${args[1] || '8080'} (Press Ctrl+C to abort)`
        };
      }

      // --- Hardware Introspection & Diagnostics ---
      case 'lscpu': {
        return {
          output: `Architecture:                    x86_64\nCPU op-mode(s):                  32-bit, 64-bit\nAddress sizes:                   39 bits physical, 48 bits virtual\nByte Order:                      Little Endian\nCPU(s):                          8\nOn-line CPU(s) list:             0-7\nVendor ID:                       GenuineIntel\nModel name:                      Intel(R) Xeon(R) CPU @ 2.80GHz\nCPU family:                      6\nModel:                           85\nThread(s) per core:              2\nCore(s) per socket:              4\nSocket(s):                       1\nBogoMIPS:                        5600.00\nFlags:                           fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ss ht syscall nx pdpe1gb rdtscp lm constant_tsc rep_good nopl xtopology nonstop_tsc cpuid tsc_known_freq pni pclmulqdq ssse3 fma cx16 pcid sse4_1 sse4_2 x2apic movbe popcnt tsc_deadline_timer aes xsave avx f16c rdrand hypervisor lahf_lm abm 3dnowprefetch invpcid_single ssbd ibrs ibpb stibp fsgsbase tsc_adjust bmi1 hle avx2 smep bmi2 erms invpcid rtm mpx avx512f avx512dq rdseed adx smap clflushopt clwb avx512cd avx512bw avx512vl xsaveopt xsavec xgetbv1 xsaves arat md_clear arch_capabilities\nVirtualization features:\n  Hypervisor vendor:             KVM\n  Virtualization type:           full\nCaches (sum of all):\n  L1d:                           128 KiB (4 instances)\n  L1i:                           128 KiB (4 instances)\n  L2:                            4 MiB (4 instances)\n  L3:                            33 MiB (1 instance)`
        };
      }

      case 'lspci': {
        return {
          output: `00:00.0 Host bridge: Intel Corporation 82G33/G31/P35/P31 Express DRAM Controller\n00:01.0 VGA compatible controller: Red Hat, Inc. Virtio GPU (rev 01)\n00:02.0 Non-Volatile memory controller: Amazon.com, Inc. NVMe Controller (rev 01)\n00:03.0 Ethernet controller: Red Hat, Inc. Virtio network device\n00:04.0 Audio device: Intel Corporation 82801I (ICH9 Family) HD Audio Controller\n00:1f.0 ISA bridge: Intel Corporation 82801IB (ICH9) LPC Interface Controller`
        };
      }

      case 'lsusb': {
        return {
          output: `Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub\nBus 001 Device 002: ID 0627:0001 Adomax Technology Co., Ltd QEMU USB Tablet\nBus 001 Device 003: ID 046d:c52b Logitech, Inc. Unifying Receiver\nBus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub`
        };
      }

      case 'sensors': {
        return {
          output: `coretemp-isa-0000\nAdapter: ISA adapter\nPackage id 0:  +38.0°C  (high = +82.0°C, crit = +100.0°C)\nCore 0:        +36.0°C  (high = +82.0°C, crit = +100.0°C)\nCore 1:        +37.0°C  (high = +82.0°C, crit = +100.0°C)\nCore 2:        +35.0°C  (high = +82.0°C, crit = +100.0°C)\nCore 3:        +38.0°C  (high = +82.0°C, crit = +100.0°C)\n\nnvme-pci-0002\nAdapter: PCI adapter\nComposite:     +32.8°C  (low  = -273.1°C, high = +84.8°C)\nSensor 1:      +32.8°C  (low  = -273.1°C, high = +65261.8°C)`
        };
      }

      case 'turbostat':
      case 'cpupower': {
        return {
          output: `System CPU Frequency Profile:\n  Driver: intel_pstate\n  Governor: performance\n  Base Clock: 2.80 GHz\n  Turbo Max: 3.40 GHz\n  Core Package C-State: C6 (Power Saving Optimal)`
        };
      }

      // --- Kernel & Modules ---
      case 'modprobe': {
        const mod = args[0] || 'virtio_gpu';
        return { output: `[  OK  ] Kernel module '${mod}' resolved dependencies and loaded into Ring 0 address space.` };
      }

      case 'lsmod': {
        return {
          output: `Module                  Size  Used by\nvirtio_gpu             65536  1\ndrm_kms_helper        212992  1 virtio_gpu\nnvme                   53248  2\nnvme_core             131072  1 nvme\nintel_rapl_msr         20480  0\nwatchdog_core          28672  1 iTCO_wdt`
        };
      }

      case 'insmod':
      case 'rmmod': {
        return { output: `[  OK  ] Kernel module operation succeeded for ${args[0] || 'driver'}.` };
      }

      case 'sysctl': {
        if (!args[0]) {
          return {
            output: `net.ipv4.ip_forward = 0\nnet.ipv4.tcp_syncookies = 1\nvm.swappiness = 10\nkernel.sysrq = 1\nkernel.watchdog_thresh = 10\nfs.file-max = 2097152`
          };
        }
        return { output: `${args[0]} = ${args[1] || '1'}` };
      }

      case 'kexec': {
        return {
          output: `kexec: staging image /boot/vmlinuz-6.10-SecureCurtain\nkexec: jumping to new kernel execution entry point (BIOS bypass)...`
        };
      }

      case 'dracut':
      case 'update-initramfs': {
        return {
          output: `dracut: Creating /boot/initramfs-6.10.4.img\ndracut: *** Including module: bash ***\ndracut: *** Including module: systemd ***\ndracut: *** Including module: kernel-modules ***\ndracut: *** Including module: rootfs-block ***\ndracut: *** Storing initramfs image in /boot/initramfs-6.10.4.img (Size: 18.2 MB) ***`
        };
      }

      // --- Storage & LVM ---
      case 'fstrim': {
        return { output: `/: 14.8 GiB (15892418560 bytes) trimmed on /dev/nvme0n1p2` };
      }

      case 'findmnt': {
        return {
          output: `TARGET                       SOURCE         FSTYPE     OPTIONS\n/                            /dev/nvme0n1p2 ext4       ro,relatime,errors=remount-ro\n├─/boot/efi                  /dev/nvme0n1p1 vfat       rw,relatime,fmask=0077,dmask=0077\n├─/data                      /dev/nvme0n1p3 ext4       rw,noatime,data=ordered\n├─/proc                      proc           proc       rw,nosuid,nodev,noexec,relatime\n├─/sys                       sysfs          sysfs      rw,nosuid,nodev,noexec,relatime\n└─/dev                       udev           devtmpfs   rw,nosuid,relatime,size=3998160k`
        };
      }

      case 'pvcreate':
      case 'vgcreate':
      case 'lvcreate': {
        return { output: `  Physical volume "${args[0] || '/dev/nvme0n1p4'}" successfully initialized for LVM.` };
      }

      case 'pvdisplay':
      case 'vgdisplay':
      case 'lvdisplay': {
        return {
          output: `  --- Physical volume ---\n  PV Name               /dev/nvme0n1p3\n  VG Name               securecurtain_vg\n  PV Size               64.00 GiB / not usable 4.00 MiB\n  Allocatable           yes\n  PE Size               4.00 MiB\n  Total PE              16383\n  Free PE               4096\n  Allocated PE          12287`
        };
      }

      // --- Text Formatting & Cryptography ---
      case 'sha256sum': {
        const file = args[0] || '/boot/vmlinuz-6.10-SecureCurtain';
        return { output: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  ${file}` };
      }

      case 'sha512sum': {
        const file = args[0] || '/boot/vmlinuz-6.10-SecureCurtain';
        return { output: `cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e  ${file}` };
      }

      case 'md5sum': {
        const file = args[0] || '/etc/passwd';
        return { output: `d41d8cd98f00b204e9800998ecf8427e  ${file}` };
      }

      case 'b2sum': {
        const file = args[0] || '/boot/vmlinuz-6.10-SecureCurtain';
        return { output: `786a02f742015903c6c6687e3249004850d5d388b3e85e45e28464324f170c90  ${file}` };
      }

      case 'base64': {
        if (args[0] === '-d' && args[1]) {
          try {
            return { output: atob(args[1]) };
          } catch {
            return { output: 'base64: invalid input', isError: true };
          }
        }
        const text = args.join(' ') || 'SecureCurtain OS';
        return { output: btoa(text) };
      }

      case 'jq': {
        return {
          output: `{\n  "system": "SecureCurtain OS",\n  "arch": "x86_64",\n  "status": "HEALTHY",\n  "dualSlot": {\n    "activeSlot": "SLOT_A",\n    "standbySlot": "SLOT_B",\n    "integrity": "VERIFIED"\n  }\n}`
        };
      }

      // --- Windows / PowerShell Cross-Platform Aliases ---
      case 'tasklist':
      case 'get-process': {
        return {
          output: `Image Name                     PID Session Name        Session#    Mem Usage\n========================= ======== ================ =========== ============\nSystem Idle Process              0 Services                   0          8 K\nSystem                           4 Services                   0        296 K\nsmss.exe                       368 Services                   0      1,024 K\ncsrss.exe                      512 Services                   0      4,120 K\nwininit.exe                    580 Services                   0      3,840 K\nservices.exe                   668 Services                   0      7,890 K\nlsass.exe                      680 Services                   0     14,200 K\nsvchost.exe                    820 Services                   0     24,800 K\nexplorer.exe                  2104 Console                    1     68,400 K\nnode.exe                      3410 Console                    1     52,100 K`
        };
      }

      case 'get-service': {
        return {
          output: `Status   Name               DisplayName\n------   ----               -----------\nRunning  WatchdogSentinel   SecureCurtain Hardware Watchdog Daemon\nRunning  A/BUpdateService   Dual-Slot OS Firmware Flash Manager\nRunning  SecureVFS          Encrypted Virtual File System Driver\nRunning  SSHDeamon          OpenSSH Secure Shell Service\nStopped  DiagnosticsLogger  Deep Kernel Trace Collector`
        };
      }

      case 'get-disk':
      case 'get-volume': {
        return {
          output: `DriveLetter FileSystemLabel FileSystem DriveType HealthStatus SizeRemaining TotalSize\n----------- --------------- ---------- --------- ------------ ------------- ---------\nC           OS_ROOT_A       EXT4       Fixed     Healthy           14.22 GB  32.00 GB\nD           USER_DATA       EXT4       Fixed     Healthy           48.91 GB  64.00 GB\nE           EFI_BOOT        FAT32      Fixed     Healthy          480.00 MB 512.00 MB`
        };
      }

      case 'get-netipaddress':
      case 'ipconfig': {
        return {
          output: `Windows / PowerShell IP Configuration:\n\nEthernet adapter eth0:\n   Connection-specific DNS Suffix  . : localdomain\n   Link-local IPv6 Address . . . . . : fe80::5054:ff:fe12:3456%3\n   IPv4 Address. . . . . . . . . . . : 192.168.1.105\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.1.1`
        };
      }

      case 'test-connection': {
        const target = args[0] || '8.8.8.8';
        return {
          output: `Source        Destination     IPV4Address      IPV6Address  Bytes    Time(ms)\n------        -----------     -----------      -----------  -----    --------\nlocalhost     ${target}         8.8.8.8                       32       8`
        };
      }

      case 'get-filehash': {
        const file = args[0] || '/boot/vmlinuz-6.10-SecureCurtain';
        return {
          output: `Algorithm       Hash                                                              Path\n---------       ----                                                              ----\nSHA256          E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855  ${file}`
        };
      }

      case 'reg':
      case 'regedit': {
        const sub = (args[0] || 'query').toLowerCase();

        const parseKeyTarget = (rawKey?: string): { hive: RegistryHive; keyPath: string } | null => {
          if (!rawKey) return null;
          const cleaned = rawKey.replace(/^\[|\]$/g, '').replace(/\//g, '\\');
          const firstSlash = cleaned.indexOf('\\');
          let hiveStr = firstSlash === -1 ? cleaned : cleaned.substring(0, firstSlash);
          const pathStr = firstSlash === -1 ? '' : cleaned.substring(firstSlash + 1);

          hiveStr = hiveStr.toUpperCase();
          let hive: RegistryHive = 'HKLM';
          if (hiveStr === 'HKCU' || hiveStr === 'HKEY_CURRENT_USER') hive = 'HKCU';
          else if (hiveStr === 'HKLM' || hiveStr === 'HKEY_LOCAL_MACHINE') hive = 'HKLM';
          else if (hiveStr === 'KCONFIG') hive = 'KCONFIG';
          else if (hiveStr === 'HKCR' || hiveStr === 'HKEY_CLASSES_ROOT') hive = 'HKCR';
          else if (hiveStr === 'HKU' || hiveStr === 'HKEY_USERS') hive = 'HKU';
          else if (['HKLM', 'HKCU', 'KCONFIG', 'HKCR', 'HKU'].includes(hiveStr as any)) hive = hiveStr as RegistryHive;

          return { hive, keyPath: pathStr };
        };

        if (sub === '/?' || sub === '-h' || sub === '--help' || sub === 'help') {
          return {
            output: `REG.EXE: Windows Registry Console Tool (SecureCurtain Subsystem)

Syntax:
  REG [ Operation ] [ Parameter List ]

Operations:
  REG QUERY  [KeyName] [/v ValueName | /s] [/f SearchString]
  REG ADD    [KeyName] [/v ValueName] [/t Type] [/d Data] [/f]
  REG DELETE [KeyName] [/v ValueName | /va] [/f]
  REG EXPORT [KeyName] [FileName.reg]
  REG IMPORT [FileName.reg]
  REG RESET  [/f]

Examples:
  reg query HKCU\\Software\\Microsoft\\Notepad
  reg add HKCU\\Software\\Microsoft\\Notepad /v iFontSize /t REG_DWORD /d 16 /f
  reg delete HKCU\\Software\\Microsoft\\Notepad /v iFontSize /f
  reg export HKCU\\Software\\Microsoft\\Notepad backup.reg`
          };
        }

        if (sub === 'query' || sub === 'list') {
          const rawTarget = args[1] && !args[1].startsWith('/') ? args[1] : undefined;
          let filterValueName: string | undefined;
          let filterSearch: string | undefined;

          for (let i = 1; i < args.length; i++) {
            if (args[i].toLowerCase() === '/v' && args[i + 1]) {
              filterValueName = args[i + 1];
              i++;
            } else if (args[i].toLowerCase() === '/f' && args[i + 1]) {
              filterSearch = args[i + 1];
              i++;
            }
          }

          let hiveFilter: string | undefined;
          let pathFilter: string | undefined;
          if (rawTarget) {
            const parsed = parseKeyTarget(rawTarget);
            if (parsed) {
              hiveFilter = parsed.hive;
              pathFilter = parsed.keyPath;
            }
          }

          const results = systemConfigService.queryRegistry(hiveFilter, pathFilter, filterSearch || filterValueName);

          if (results.length === 0) {
            return { output: `ERROR: The system was unable to find the specified registry key or value.`, isError: true };
          }

          const groups: { [k: string]: RegistryEntry[] } = {};
          for (const r of results) {
            const fullKey = `${r.hive}\\${r.keyPath}`;
            if (!groups[fullKey]) groups[fullKey] = [];
            groups[fullKey].push(r);
          }

          const sections: string[] = [];
          for (const [keyHeader, keyEntries] of Object.entries(groups)) {
            let sec = `${keyHeader}\n`;
            for (const e of keyEntries) {
              const namePadded = `    ${e.valueName}`.padEnd(28, ' ');
              const typePadded = `${e.valueType}`.padEnd(16, ' ');
              let displayVal = String(e.value);
              if (e.valueType === 'REG_DWORD') {
                const num = Number(e.value) || 0;
                displayVal = `0x${num.toString(16)} (${num})`;
              }
              sec += `${namePadded} ${typePadded} ${displayVal}\n`;
            }
            sections.push(sec.trimEnd());
          }

          return { output: sections.join('\n\n') + `\n\nEnd of search: ${results.length} match(es) found.` };
        }

        if (sub === 'add') {
          const rawTarget = args[1] && !args[1].startsWith('/') ? args[1] : undefined;
          if (!rawTarget) {
            return { output: `ERROR: Key name is missing.\nType "REG ADD /?" for usage syntax.`, isError: true };
          }
          const parsed = parseKeyTarget(rawTarget);
          if (!parsed) {
            return { output: `ERROR: Invalid registry key specified "${rawTarget}".`, isError: true };
          }

          let valueName = '@';
          let valueType: RegistryValueType = 'REG_SZ';
          let valueData: any = '';

          for (let i = 2; i < args.length; i++) {
            const flag = args[i].toLowerCase();
            if (flag === '/v' && args[i + 1]) {
              valueName = args[i + 1];
              i++;
            } else if (flag === '/t' && args[i + 1]) {
              const t = args[i + 1].toUpperCase();
              if (['REG_SZ', 'REG_DWORD', 'BOOL', 'REG_BINARY', 'REG_MULTI_SZ'].includes(t)) {
                valueType = t as RegistryValueType;
              }
              i++;
            } else if (flag === '/d' && args[i + 1] !== undefined) {
              valueData = args[i + 1];
              i++;
            }
          }

          if (valueType === 'REG_DWORD') {
            valueData = parseInt(String(valueData), 10) || 0;
          } else if (valueType === 'BOOL') {
            valueData = valueData === 'true' || valueData === '1' || valueData === 1;
          }

          const res = systemConfigService.setRegistryValue(parsed.hive, parsed.keyPath, valueName, valueData, valueType);
          if (res.success) {
            return { output: `The operation completed successfully.\n[${parsed.hive}\\${parsed.keyPath}] "${valueName}" [${valueType}] = ${valueData}` };
          }
          return { output: `ERROR: ${res.message}`, isError: true };
        }

        if (sub === 'delete') {
          const rawTarget = args[1] && !args[1].startsWith('/') ? args[1] : undefined;
          if (!rawTarget) {
            return { output: `ERROR: Key name is missing.\nType "REG DELETE /?" for usage syntax.`, isError: true };
          }
          const parsed = parseKeyTarget(rawTarget);
          if (!parsed) {
            return { output: `ERROR: Invalid registry key specified "${rawTarget}".`, isError: true };
          }

          let valueName: string | undefined;
          for (let i = 2; i < args.length; i++) {
            const flag = args[i].toLowerCase();
            if (flag === '/v' && args[i + 1]) {
              valueName = args[i + 1];
              i++;
            } else if (flag === '/va') {
              valueName = undefined;
            }
          }

          const res = systemConfigService.deleteRegistryValue(parsed.hive, parsed.keyPath, valueName);
          if (res.success) {
            return { output: `The operation completed successfully. ${res.message}` };
          }
          return { output: `ERROR: ${res.message}`, isError: true };
        }

        if (sub === 'export') {
          const rawTarget = args[1] && !args[1].startsWith('/') ? args[1] : undefined;
          const fileName = args[2] || 'registry_export.reg';
          let hiveFilter: RegistryHive | 'ALL' = 'ALL';
          let pathFilter: string | undefined;

          if (rawTarget) {
            const parsed = parseKeyTarget(rawTarget);
            if (parsed) {
              hiveFilter = parsed.hive;
              pathFilter = parsed.keyPath;
            }
          }

          const regContent = systemConfigService.exportRegistryHive(hiveFilter, pathFilter);
          return {
            output: `The operation completed successfully.\nRegistry exported to "${fileName}".\nPreview:\n` +
                    regContent.split('\n').slice(0, 20).join('\n')
          };
        }

        if (sub === 'reset') {
          const res = systemConfigService.resetRegistryToDefaults();
          return { output: `The operation completed successfully.\n${res.message}` };
        }

        return { output: `Usage: reg [ query | add | delete | export | reset ]\nType "reg /?" for help.` };
      }

      // --- Digital Forensics & Bit-Stream Imaging ---
      case 'dc3dd': {
        const target = args.find(a => a.startsWith('of='))?.substring(3) || '/mnt/forensic_vault/evidence_sdb_raw.dd';
        return {
          output: `dc3dd v7.2 (DoD Cyber Crime Center)\n[i] Source: /dev/sdb (Samsung 980 PRO NVMe 1TB)\n[i] Target: ${target}\n[i] Write-Blocker Status: 100% ENFORCED (ro,noload,noexec,nodev,WP=1)\n[i] Hashing: SHA-256 + MD5 on-the-fly\n[  OK  ] 1953525168 sectors (1000.20 GB) copied in 2060.4 s (485.4 MB/s)\n[  OK  ] Input MD5:   9e107d9d372bb6826bd81d3542a419d6\n[  OK  ] Output MD5:  9e107d9d372bb6826bd81d3542a419d6 (MATCH)\n[  OK  ] Input SHA256:  5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8\n[  OK  ] Output SHA256: 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8 (MATCH)\n[  OK  ] Bad sectors: 0\nVerification successful: Source and Target bitstreams are mathematically identical.`
        };
      }

      case 'ewfacquire': {
        return {
          output: `ewfacquire 20240506 (libewf - Expert Witness Compression E01/Ex01)\nEvidence format: EnCase / FTK E01\nCase number: CASE-2026-X86-0419\nEvidence number: EVD-01-SAMSUNG-NVME\nExaminer: Lead Forensic Examiner (CSO)\nCompression: Deflate (level: 6, chunk: 64 sectors)\nStatus: Acquired 1000.20 GB in 2060 seconds (zero bad sectors)\nStored MD5: 9e107d9d372bb6826bd81d3542a419d6\nCalculated MD5: 9e107d9d372bb6826bd81d3542a419d6\nAcquisition hash verification: MATCHED.`
        };
      }

      case 'aff4acquire': {
        return {
          output: `aff4acquire v1.0 (Advanced Forensic Format 4)\nCreating AFF4 Container with Snappy compression & sparse Blake3 indexing...\nSource: /dev/sdb -> Destination: /mnt/forensic_vault/evidence_sdb.aff4\nContainer UUID: urn:aff4:49a2-91f0-4821-bcde-09382109283\nStreams written: 1953525168 sectors. Blake3: b3f5c9e2d1a4b870c6e5a4f3b2c1d0e9...`
        };
      }

      case 'fls': {
        return {
          output: `r/r 1042:  Windows/System32/drivers/etc/hosts\nd/d 1589:  Users/architect/AppData/Local/Temp/sys_recovery_token.tmp (DELETED)\nr/r 2201:  Program Files/SecureCurtain/Kernel/watchdog_service.sys\nr/r 3105:  Users/architect/Desktop/forensics_case_notes.md\nr/r * 4018:  Users/architect/Downloads/deleted_payload_trojan_dissect.elf (DELETED, CARVED)`
        };
      }

      case 'mactime': {
        return {
          output: `Date                       Size MACB  Permissions  UID  GID  File / Activity\n----------------------------------------------------------------------------------------------------\n2026-08-31 14:15:22.108     824 M.CB  rw-r--r--      0    0  C:/Windows/System32/drivers/etc/hosts\n2026-08-31 14:18:04.992    4096 MA.B  rw-------   1000 1000  [DELETED] C:/Users/architect/AppData/Local/Temp/sys_recovery_token.tmp\n2026-08-31 14:20:11.450  524288 .A..  rwxr-xr-x      0    0  C:/Program Files/SecureCurtain/Kernel/watchdog_service.sys\n2026-08-31 14:24:59.001   12480 MACB  rw-r--r--   1000 1000  C:/Users/architect/Desktop/forensics_case_notes.md`
        };
      }

      case 'forensics-imager':
      case 'ftkimager': {
        return {
          output: `[FORENSICS WORKSTATION CORE]\nHardware Write Blocker: ACTIVE (Tableau / WiebeTech USB Bridge, WP=1)\nMount Enforcement: ro,noload,noexec,nodev,noatime\nUSB Lockout Status: UNLOCKED (Elevated Sudo PIN Active)\nToaster Slots: Bay 1 (NVMe Source /dev/sdb [1TB]), Bay 2 (Target Vault /dev/sdc [4TB])\nCourt Admissibility: NIST SP 800-86 & ISO/IEC 27037 Compliant`
        };
      }

      case 'vol.py':
      case 'volatility': {
        const sub = args[0] || 'windows.pslist';
        if (args.includes('windows.malfind')) {
          return {
            output: `Volatility 3 Framework 2.7.0\nProgress: 100.00%\nPID\tProcess\t\tStart VPN\tEnd VPN\t\tTag\tProtection\t\tCommit\tHexDump\n3840\tpowershell.exe\t0x21a0000\t0x21b0000\tVad \tPAGE_EXECUTE_READWRITE\t1\t4d 5a 90 00 03 00 00 00 (MZ Header - Injected Executable)\n4920\trundll32.exe\t0x7fff0000\t0x7fff4000\tVadS\tPAGE_EXECUTE_READWRITE\t1\te8 00 00 00 00 58 (Shellcode Call POP)`
          };
        }
        if (args.includes('timeliner.Timeliner') || args.includes('timeliner')) {
          return {
            output: `Volatility 3 Timeliner (Kernel & EPROCESS Event Stream)\nPlugin\t\t\tDate Time (UTC)\t\t\tDescription\nwindows.pslist\t\t2026-09-01 07:10:02\tProcess created: System (PID: 4, PPID: 0)\nwindows.pslist\t\t2026-09-01 08:44:19\tProcess created: powershell.exe (PID: 3840, PPID: 1104)\nwindows.netscan\t\t2026-09-01 08:45:01\tSocket ESTABLISHED: rundll32.exe (PID: 4920) -> 203.0.113.88:8443`
          };
        }
        return {
          output: `Volatility 3 Framework 2.7.0\nPID\tPPID\tImageFileName\tOffset(V)\t\tThreads\tHandles\tSessionId\tCreateTime\n4\t0\tSystem\t\t0xfa8003c20040\t218\t4096\t0\t\t2026-09-01 07:10:02.000000\n624\t590\tlsass.exe\t0xfa80058b3090\t18\t1240\t0\t\t2026-09-01 07:10:12.000000\n3840\t1104\tpowershell.exe\t0xfa8006e89020\t24\t450\t1\t\t2026-09-01 08:44:19.000000 [SUSPICIOUS: -Bypass -Enc]\n4920\t3840\trundll32.exe\t0xfa8007a11040\t2\t38\t1\t\t2026-09-01 08:45:00.000000 [SUSPICIOUS: C2 Socket]`
        };
      }

      case 'memprocfs': {
        return {
          output: `MemProcFS (Memory Process File System) v5.8\n[+] Initializing memory analysis engine from: /mnt/forensic_vault/RAM_DUMPS/live_ram_target_host.raw\n[+] Kernel base found: 0xfffff80002800000 (Windows 11 Pro Build 22621.1702)\n[+] Mounting virtual file system at: /mnt/memprocfs\n[+] Virtual mount points active:\n    /mnt/memprocfs/sys/          -> OS configuration, drivers, established sockets\n    /mnt/memprocfs/name/         -> Per-process folder hierarchy (minidump.dmp, vads, handles)\n    /mnt/memprocfs/pid/          -> PID indexing (e.g. /pid/3840/)\n    /mnt/memprocfs/forensics/    -> YARA automated signature scanner hits\nFilesystem ready. Explore with standard UNIX tools (ls, grep, cat).`
        };
      }

      case 'arsenal-recon':
      case 'hibrecon':
      case 'hibr2bin': {
        return {
          output: `Arsenal Hibernation Recon & hibr2bin v3.12\n[+] Input file: /mnt/forensics_slot_1_ro/hiberfil.sys (12.80 GB)\n[+] Architecture: Windows 10/11 64-bit Multi-Phase Xpress Huffman Compression\n[+] Scanning header: PO_MEMORY_IMAGE signature verified\n[+] Decompressing 8,388,608 memory pages into raw 32GB RAM image...\n[+] Restoring active process states, non-paged pool, and active registry hives...\n[  OK  ] Output generated: /mnt/forensic_vault/DECOMPRESSED_RAM/hiberfil_decompressed.raw (34.35 GB)\n[  OK  ] SHA-256: 1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d\nReady for Volatility 3 and MemProcFS analysis.`
        };
      }

      case 'cfae':
      case 'registry-explorer': {
        return {
          output: `TZWorks cfae / Registry Explorer Core v4.1\n[+] Processing Registry Hive: NTUSER.DAT & SYSTEM (Read-Only Copy)\n[+] UserAssist (ROT13 Decoded):\n    - powershell.exe (Runs: 47, Last: 2026-09-01 08:44:19 UTC, Focus: 1840s)\n    - live_usb_watchdog_bypass.exe (Runs: 1, Last: 2026-09-01 08:42:00 UTC)\n[+] ShellBags Artifacts:\n    - C:\\Users\\architect\\Downloads\\Forensic_Triage_Tools.zip (FolderView: Direct)\n[+] AppCompatCache / ShimCache:\n    - C:\\Temp\\live_usb_watchdog_bypass.exe [FLAG: EXECUTED]\n[+] USBSTOR Device Serial History:\n    - SanDisk Extreme PRO USB 3.2 64GB [Serial: SDCZ880-064G-G46, Insert: 2026-08-31 14:10:00 UTC]`
        };
      }

      case 'evtx-viewer':
      case 'evtx_dump': {
        return {
          output: `Windows Event Log (*.evtx) Analyzer v2.4\n[+] Parsed: Security.evtx, System.evtx, PowerShell/Operational.evtx, Sysmon.evtx\n[+] High-Priority Triage Hits:\n    [Event 4624] 2026-09-01 08:40:12 UTC - Interactive Logon: architect (LogonType: 2)\n    [Event 4688] 2026-09-01 08:44:19 UTC - Process Created: powershell.exe -ExecutionPolicy Bypass\n    [Event 4104] 2026-09-01 08:44:22 UTC - PowerShell ScriptBlock: Invoke-Mimikatz reflection detected\n    [Sysmon 3]   2026-09-01 08:45:01 UTC - Network Socket: rundll32.exe -> 203.0.113.88:8443\n    [Event 7045] 2026-08-31 14:12:00 UTC - Service Installed: ForensicWriteBlockDriver`
        };
      }

      case 'belkasoft-ram':
      case 'magnet-ram':
      case 'volatile-collector': {
        return {
          output: `Belkasoft & Magnet Live RAM Capturer Core\n[+] Initializing Ring 0 Kernel Memory Acquisition Driver...\n[+] Anti-Debugging & Hook Protections: BYPASSED\n[+] Capturing Physical RAM: 32768 MB (DDR5) -> /mnt/forensic_vault/RAM_DUMPS/live_ram_target_host.raw\n[+] Live Volatile Triage Collected:\n    - 148 Active Processes\n    - 37 Open Network Sockets\n    - 212 Loaded Kernel Drivers\n    - Clipboard: "powershell -EncodedCommand JABzAGUAYwByAGUAdAA9ACcANwA1ADcAMgAnAA=="\n[  OK  ] Acquisition Complete: 32.00 GB captured in 42.1s (SHA256 verified).`
        };
      }

      case 'log2timeline.py':
      case 'log2timeline': {
        const out = args[0] || '/mnt/forensic_vault/disk.plaso';
        return {
          output: `Plaso log2timeline.py v20240308\n[+] Storage file: ${out}\n[+] Enabled parsers: win7, win10, mft, evtx, registry, chrome_cache, prefetch, bencode\n[+] Extraction progress: 1953525168 sectors parsed\n[+] Extracted 84,912 forensic events into Plaso container\nReady for psort.py filtering and Volatility 3 timeline merge.`
        };
      }

      case 'psort.py':
      case 'psort': {
        return {
          output: `Plaso psort.py v20240308\n[+] Input Plaso file: /mnt/forensic_vault/disk.plaso\n[+] Output format: l2tcsv (Log2Timeline Super-Timeline CSV)\n[+] Merged sources:\n    - Disk.plaso (MFT, EVTX, Registry, Browser History)\n    - Volatility 3 RAM Timeliner (Process spawns, Sockets, Kernel callbacks)\n    - Mactime parser timestamp synchronization\n[  OK  ] Written to: /mnt/forensic_vault/super-timeline.csv (84,912 records)\n[  OK  ] Court-Admissible Unified Super-Timeline generated.`
        };
      }

      case 'vshadowinfo': {
        return {
          output: `vshadowinfo 20230304\n\nVolume Shadow Snapshot information:\nNumber of stores: 3\n\nStore: 1\n\tIdentifier: {3f4a9b21-8842-4f9e-9d21-482098b1a341}\n\tCreation time: 2026-08-28 04:15:00 UTC\n\tDevice object: \\\\?\\GLOBALROOT\\Device\\HarddiskVolumeShadowCopy1\n\tOriginating volume: \\\\?\\Volume{c8a91f42-0000-0000-0000-100000000000}\\\n\tAllocated diff size: 1,847,197,696 bytes\n\nStore: 2\n\tIdentifier: {9b28a471-1049-410a-ba41-998811224411}\n\tCreation time: 2026-08-30 04:15:00 UTC\n\tDevice object: \\\\?\\GLOBALROOT\\Device\\HarddiskVolumeShadowCopy2\n\tAllocated diff size: 2,411,724,800 bytes\n\nStore: 3\n\tIdentifier: {11a0bb33-7766-4d1a-8b8b-cc9900112233}\n\tCreation time: 2026-09-01 04:15:00 UTC\n\tDevice object: \\\\?\\GLOBALROOT\\Device\\HarddiskVolumeShadowCopy3\n\tAllocated diff size: 3,892,310,016 bytes`
        };
      }

      case 'vshadowmount': {
        const img = args[0] || '/mnt/forensic_vault/evidence.raw';
        const mnt = args[1] || '/mnt/vss';
        return {
          output: `vshadowmount 20230304\n[+] Inspecting NTFS Volume Shadow Copies on ${img}...\n[+] Discovered 3 volume shadow snapshot stores.\n[+] Mounting virtual block devices into ${mnt}:\n    ${mnt}/vss1 -> HarddiskVolumeShadowCopy1 (Read-Only FUSE block)\n    ${mnt}/vss2 -> HarddiskVolumeShadowCopy2 (Read-Only FUSE block)\n    ${mnt}/vss3 -> HarddiskVolumeShadowCopy3 (Read-Only FUSE block)\n[  OK  ] Mounted successfully. Use TSK 'fls ${mnt}/vss1' or mount loop ro.`
        };
      }

      case 'blkls': {
        const isSlack = args.includes('-s');
        if (isSlack) {
          return {
            output: `blkls (The Sleuth Kit v4.12.1)\n[+] Mode: File Slack Space Extraction (-s)\n[+] Target image: ${args[args.length - 1] || '/mnt/forensic_vault/evidence.raw'}\n[+] Processing allocated inodes and reading EOF to cluster end padding...\n[+] Total slack space extracted: 14,892,160 bytes across 3,636 allocated clusters.\n[!] Discovered suspicious residual ASCII strings (Base64 payloads, PowerShell commands) in slack clusters.\n[  OK  ] Slack stream carved successfully.`
          };
        }
        return {
          output: `blkls (The Sleuth Kit v4.12.1)\n[+] Mode: Unallocated Cluster Extraction (-e)\n[+] Carved 12,491,200 unallocated disk sectors for scalpel/foremost analysis.`
        };
      }

      case 'streams': {
        return {
          output: `Streams v1.60 - Enumerate NTFS Alternate Data Streams\nCopyright (C) 2005-2016 Mark Russinovich\nSysinternals - www.sysinternals.com\n\nScanning NTFS volume...\nC:\\Users\\architect\\Downloads\\quarterly_financial_report.docx:Zone.Identifier:$DATA\t\t68 bytes\nC:\\Users\\architect\\Downloads\\quarterly_financial_report.docx:invoice_details.ps1:$DATA\t\t3,410 bytes\nC:\\Windows\\System32\\calc.exe:privkey.pem:$DATA\t\t1,704 bytes\nC:\\Users\\architect\\Desktop\\vacation_photo.jpg:c2_beacon.vbs:$DATA\t\t1,120 bytes\n\nTotal 4 Alternate Data Streams detected across 3 host files.`
        };
      }

      case 'hips-scan': {
        return {
          output: `[HIPS DEFENSE SCANNER v4.8.2]\n[+] Initializing Ring 0 Hook & Syscall Interception...\n[+] Scanning Memory VAD allocations: 42,910 regions inspected\n[+] Heuristic zero-day bytecode analyzer: ACTIVE\n[+] Results:\n    - Intercepted Syscall Injection: PID 3840 (Trojan.Linux.Mirai.Gen)\n    - Unauthorized Raw Socket: PID 4920 (Backdoor.XMRig.Miner.v3)\n    - Malicious Crontab: /etc/cron.hourly/sys_sync.sh\n[!] 3 threats detected. Quarantined in Air-Gapped Ring -1 Vault (/var/quarantine/vault).`
        };
      }

      case 'hips-status': {
        return {
          output: `[HIPS ENGINE STATUS]\nKernel Syscall Trap:       ACTIVE (Ring 0 eBPF filter)\nMemory RWX Injection Guard: ACTIVE (W^X Enforced)\nZero-Day Heuristic Model:  v2026.09-R2 (100% confidence threshold)\nActive Quarantined Vault:  AES-XTS-256 Encrypted (3 artifacts contained)\nNetwork Payload Intercept: ENGAGED (0.0.0.0 egress lock on untrusted binaries)`
        };
      }

      case 'quarantine-vault': {
        const sub = args[0] || 'list';
        if (sub === 'list') {
          return {
            output: `VAULT ID   THREAT NAME                     SEVERITY  ORIGIN FILE                         ENTROPY  STATUS\nQZ-9041    Trojan.Linux.Mirai.Gen          CRITICAL  /tmp/.sys_sync_daemon               7.91     ISOLATED\nQZ-8812    Backdoor.XMRig.Miner.v3         HIGH      /usr/local/bin/kworker_d            7.84     ISOLATED\nQZ-7203    Stealer.KeyLog.MemHook          HIGH      /home/architect/.config/sys_hook.so 7.72     ISOLATED`
          };
        }
        return {
          output: `[QUARANTINE VAULT]\nTarget: ${args.join(' ')}\nAction: Air-gapped sandbox execution permissions revoked.\nBytecode stripped for static forensic analysis in Cockpit Workbench.`
        };
      }

      case 'yara': {
        const rule = args[0] || 'rule_threat.yar';
        const target = args[1] || '/tmp';
        return {
          output: `[YARA 4.3.2 Scanner]\n[+] Loaded rule file: ${rule}\n[+] Scanning target: ${target}\n[MATCH] Rule: Trojan_Generic_C2_Beacon [tags: malware, c2, packed] -> /tmp/.sys_sync_daemon\n[MATCH] Rule: Miner_Stratum_Payload -> /usr/local/bin/kworker_d\nScan finished in 0.18s. 2 rules matched.`
        };
      }

      case 'clamscan': {
        return {
          output: `----------- SCAN SUMMARY -----------
Known viruses: 8742109 (Updated to Live USB persistent partition)
Engine version: 1.2.1
Target: /mnt/windows_sys (Offline Analysis Mode)
Scanned directories: 64
Scanned files: 1520
Infected files: 2
Data scanned: 418.50 MB
Time: 2.104 sec (0 m 2 s)
Infected files flagged for quarantine.`
        };
      }

      case 'freshclam': {
        const datadir = args.find(a => a.startsWith('--datadir='))?.split('=')[1] || '/mnt/live_persistence/signatures';
        return {
          output: `ClamAV Virus Signature Database Updater 1.2.1
[*] Live USB Storage: ${datadir} (Persistent OverlayFS partition)
[*] Querying database.clamav.net for mirrors...
[+] Connecting to db.local.clamav.net (192.0.2.10:443)...
[+] Downloading daily.cvd [100%] (Diff: +14,890 virus definitions)
[+] daily.cvd updated (version: 27412, sigs: 8742109, f-level: 90, builder: raynman)
[+] bytecode.cvd is up to date (version: 335, sigs: 86, f-level: 90)
[+] Database updated and synchronized to Live Rescue USB flash storage.
[✓] SUCCESS: Signatures are saved to USB persistence. No daily re-burning of the USB drive is needed!`
        };
      }

      case 'hivexregedit':
      case 'hivexsh': {
        return {
          output: `[HIVEX 1.3.23 Offline Windows Registry Editor]
[+] Target Hive: /mnt/windows_sys/Windows/System32/config/SOFTWARE
[+] Scanned Keys: Winlogon\\Shell, Winlogon\\Userinit, Image File Execution Options\\explorer.exe
[+] Scanned SYSTEM: ControlSet001\\Services
[+] Results:
    1. Winlogon\\Shell: RESTORED -> 'explorer.exe' (Neutralized C:\\Users\\Public\\svchost_updater.exe)
    2. Winlogon\\Userinit: RESTORED -> 'C:\\Windows\\system32\\userinit.exe,'
    3. IFEO\\explorer.exe: DELETED Debugger redirection value
    4. Service WinDefSvcHelper: Start changed to 4 (Disabled)
[✓] Offline registry persistence purged without booting host operating system.`
        };
      }

      case 'rkhunter': {
        return {
          output: `[ Rootkit Hunter version 1.4.6 ]\nChecking system commands...\n  Checking 'strings' command: OK\n  Checking 'ps' command: OK\n  Checking 'ls' command: OK\nChecking for rootkits / backdoors...\n  Checking for known rootkit files: None found\n  Checking for hidden ports / raw sockets: Intercepted by HIPS\nSystem check completed: 0 warnings found.`
        };
      }

      case 'chkrootkit': {
        return {
          output: `ROOTDIR is ` + '/' + `\nChecking 'amd'... not infected\nChecking 'basename'... not infected\nChecking 'biff'... not infected\nChecking 'chfn'... not infected\nChecking 'cron'... not infected\nChecking 'date'... not infected\nChecking 'du'... not infected\nChecking 'echo'... not infected\nChecking 'fingerd'... not found\nChecking 'gpm'... not infected\nChecking 'ifconfig'... not infected\nChecking 'inetd'... not infected\nChecking 'login'... not infected\nChecking 'ls'... not infected\nChecking 'named'... not infected\nChecking 'netstat'... not infected\nChecking 'passwd'... not infected\nChecking 'pidof'... not infected\nChecking 'ps'... not infected\nChecking 'rlogind'... not found\nChecking 'rshd'... not found\nChecking 'slogin'... not infected\nChecking 'su'... not infected\nChecking 'syslogd'... not infected\nChecking 'tar'... not infected\nChecking 'tcpd'... not infected\nChecking 'top'... not infected\nChecking 'w'... not infected\nChecking 'aliens'... no suspect files found.`
        };
      }

      case 'aide': {
        return {
          output: `AIDE 0.18.6 File Integrity Monitored (FIM)\n[+] Checking database: /var/lib/aide/aide.db.gz\n[+] Scanned 18,421 files in 1.42 seconds\n[+] Integrity verified: All system binaries match cryptographic SHA256 signatures in TPM PCR 10.`
        };
      }

      case 'screensaver':
      case 'tux':
      case 'xscreensaver': {
        const sub = (args[0] || '').toLowerCase();
        if (sub === 'lock') {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('lock-session-event'));
          }
          return {
            output: `[  OK  ] Workstation locked and Tux screensaver engaged. (Hotkey: Ctrl+L)`
          };
        }
        // Dispatch screensaver custom event to open screensaver
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('launch-screensaver'));
        }
        return {
          output: `[  OK  ] Activated Tux & Windows Butterfly Cartoon Screensaver.\nType: Vector Animated Canvas\nCast: Linux Penguin Tux (Fly Swatter / Net on Pole) vs. Windows 4-Squares Butterfly.\nStatus: Running active stage.\nHotkey: <Ctrl> + L locks the screen immediately.`
        };
      }

      case 'lock':
      case 'lockscreen':
      case 'vlock':
      case 'loginctl': {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('lock-session-event'));
        }
        return {
          output: `[  OK  ] Workstation session locked (Hotkey: Ctrl+L).\nActivating Tux Screensaver & transitioning to secure authentication stage.\n[NOTE] All background downloads, file copies, moves, and anti-malware scans continue running uninterrupted.`
        };
      }

      // --- Background Operations Engine (Lock-Safe) ---
      case 'jobs':
      case 'tasks':
      case 'bg': {
        const jobs = backgroundJobService.getJobs();
        if (jobs.length === 0) {
          return {
            output: `[Background Job Scheduler]\nNo active or recent background jobs.\nTip: Start a job with 'download <url>', 'cp <src> <dst>', 'mv <src> <dst>', or 'scan'.\nAll background tasks continue running when the workstation is locked.`
          };
        }
        let out = `[SecureCurtain Background Operations Scheduler]\nWorkstation Lock Persistence: ENABLED (Operations run 24/7 through lock & screensaver)\n\n`;
        out += `ID          TYPE            STATUS     PROGRESS   SPEED        ETA      NAME\n`;
        out += `--------------------------------------------------------------------------------------\n`;
        jobs.forEach(j => {
          const id = j.id.padEnd(11);
          const type = j.type.padEnd(15);
          const status = j.status.padEnd(10);
          const prog = `${j.progress.toFixed(0)}%`.padEnd(10);
          const speed = (j.speed || '-').padEnd(12);
          const eta = (j.estimatedRemainingSeconds > 0 ? `${j.estimatedRemainingSeconds}s` : '-').padEnd(8);
          out += `${id} ${type} ${status} ${prog} ${speed} ${eta} ${j.name}\n`;
          if (j.currentStep) {
            out += `   ↳ Step: ${j.currentStep}\n`;
          }
        });
        return { output: out };
      }

      case 'download':
      case 'wget':
      case 'curl': {
        const target = args[0] || 'kernel_update_v1.0.4.patch.iso';
        const url = args[0]?.startsWith('http') ? args[0] : `https://airgap.internal.securecurtain/packages/${target}`;
        const filename = target.split('/').pop() || 'downloaded_artifact.iso';
        const job = backgroundJobService.startDownload(filename, url, 18500000);
        return {
          output: `[+] Started background download: ${filename}\n[+] Job ID: ${job.id}\n[+] Source URL: ${url}\n[+] Destination: /home/projects/SecureCurtain/downloads/${filename}\n[+] Resilience: Task continues processing seamlessly if workstation is locked (Ctrl+L) or screensaver is active.\nType 'jobs' to view live status or 'cancel-job ${job.id}' to terminate.`
        };
      }

      case 'cp':
      case 'copy': {
        const src = args[0] || 'home/projects/SecureCurtain/sys/kernel/core.c';
        const dst = args[1] || 'home/projects/SecureCurtain/backup/core.c';
        const job = backgroundJobService.startCopyFile(src, dst, 4200000);
        return {
          output: `[+] Queued background file copy:\n[+] Source: ${src}\n[+] Destination: ${dst}\n[+] Job ID: ${job.id}\n[+] Workstation Lock Behavior: Continues running uninterrupted during workstation lock.\nType 'jobs' to monitor real-time I/O transfer rate.`
        };
      }

      case 'mv':
      case 'move': {
        const src = args[0] || 'home/projects/SecureCurtain/downloads/firmware.img';
        const dst = args[1] || 'home/projects/SecureCurtain/archive/firmware.img';
        const job = backgroundJobService.startMoveFile(src, dst, 3100000);
        return {
          output: `[+] Queued background file move:\n[+] Source: ${src}\n[+] Destination: ${dst}\n[+] Job ID: ${job.id}\n[+] Status: Moving blocks asynchronously (Runs through lock/screensaver).`
        };
      }

      case 'transfer':
      case 'sftp':
      case 'scp': {
        const src = args[0] || 'telemetry_dump.log';
        const dst = args[1] || 'sftp://vault-02.internal.lan/airgap_dumps/telemetry_dump.log';
        const job = backgroundJobService.startTransferFile(src, dst, 6700000);
        return {
          output: `[+] Queued remote network stream transfer:\n[+] File: ${src}\n[+] Remote Endpoint: ${dst}\n[+] Job ID: ${job.id}\n[+] Transfer Protocol: Authenticated SFTP/TLS 1.3\n[+] Status: Running in background.`
        };
      }

      case 'scan':
      case 'antivirus': {
        const path = args[0] || '/';
        const job = backgroundJobService.startAntiMalwareScan(path, 'Microkernel & Memory Space');
        return {
          output: `[+] Initiated background deep anti-malware scan:\n[+] Target Path: ${path}\n[+] Job ID: ${job.id}\n[+] Scan Engine: PML4 Ring-0 Hook, Process Virtual Memory, and YARA Behavioral Heuristics\n[+] Status: Running in background (Continues during lock screen & screensaver).`
        };
      }

      case 'pause-job': {
        const id = args[0];
        if (!id) return { output: 'Usage: pause-job <job-id>', isError: true };
        const ok = backgroundJobService.pauseJob(id);
        return { output: ok ? `[OK] Paused job ${id}.` : `Job ${id} not found or not currently running.`, isError: !ok };
      }

      case 'resume-job': {
        const id = args[0];
        if (!id) return { output: 'Usage: resume-job <job-id>', isError: true };
        const ok = backgroundJobService.resumeJob(id);
        return { output: ok ? `[OK] Resumed job ${id}.` : `Job ${id} not found or not currently paused.`, isError: !ok };
      }

      case 'cancel-job':
      case 'kill-job': {
        const id = args[0];
        if (!id) return { output: 'Usage: cancel-job <job-id>', isError: true };
        const ok = backgroundJobService.cancelJob(id);
        return { output: ok ? `[OK] Terminated job ${id}.` : `Job ${id} not found.`, isError: !ok };
      }

      case 'sc-vault':
      case 'vault': {
        const sub = (args[0] || 'status').toLowerCase();
        if (sub === 'status') {
          return {
            output: `[SecureCurtain Encrypted Persistent Vault]\nStorage Backend: IndexedDB (SecureCurtainVaultDB_v1)\nEncryption: AES-GCM 256-bit Authenticated Cipher\nKey Derivation: PBKDF2-SHA256 (100,000 rounds)\nIntegrity Status: VERIFIED (0 tamper flags)\nState: UNLOCKED\nRun 'vault sync' to synchronize quarantine artifacts into encrypted store.`
          };
        }
        if (sub === 'sync') {
          return {
            output: `[+] Scanning HIPS Quarantine Vault...\n[+] Encrypting payload with AES-GCM-256 (random 12-byte IV)...\n[OK] Synchronized quarantine artifacts into IndexedDB persistent storage.`
          };
        }
        if (sub === 'audit' || sub === 'integrity') {
          return {
            output: `[+] Running Cryptographic Integrity Audit...\n[+] Checking AES-GCM authentication tags (GMAC)...\n[+] Verifying SHA-256 payload digests...\n[SUCCESS] All records verified. Zero cipher corruption or disk tampering detected.`
          };
        }
        if (sub === 'lock') {
          return {
            output: `[OK] Vault locked. CryptoKey zeroed from volatile memory.`
          };
        }
        return {
          output: `Usage: vault [status|sync|audit|lock]`
        };
      }

      case 'ebpf':
      case 'bpf':
      case 'kprobe':
      case 'syscall-trace': {
        const sub = (args[0] || 'status').toLowerCase();
        if (sub === 'status') {
          return {
            output: `[SecureCurtain eBPF Kernel JIT Subsystem]\nEngine State:             RUNNING (Clang/LLVM 18 eBPF v4 JIT)\nActive Probes:            6 / 6 Loaded in Ring 0\nRing Buffer Throughput:   48 msgs/sec (Zero-Copy Shared Memory)\nInterception Latency:     0.42 μs (Avg overhead)\nLSM Security Enforcer:    ENGAGED (bpf_lsm/bprm_check_security)\nTotal Syscalls Intercepted: 32,684\nMitigated Threats (Killed): 159\nRun 'ebpf probes' to inspect loaded kernel probes, or 'ebpf trace' for live telemetry.`
          };
        }
        if (sub === 'probes' || sub === 'list') {
          return {
            output: `[LOADED eBPF KERNEL PROBES]\nPROBE ID                 TYPE      TARGET SYSCALL   JIT INSTRS  STATUS\ntrace_mprotect_wx        kprobe    sys_mprotect     284         ACTIVE (W^X Enforced)\ntrace_ptrace_injection   kprobe    sys_ptrace       312         ACTIVE (Anti-Hollowing)\ntrace_memfd_fileless     kprobe    sys_memfd_create 198         ACTIVE (Fileless Trap)\ntrace_byovd_kernel_driver kprobe   sys_init_module  410         ACTIVE (BYOVD Driver Guard)\ntrace_c2_beacon_egress   kprobe    sys_connect      340         ACTIVE (C2 Feed Match)\nlsm_bprm_check_security  bpf_lsm   sys_execve       520         ACTIVE (MAC Binary Auth)`
          };
        }
        if (sub === 'trace' || sub === 'log' || sub === 'tail') {
          return {
            output: `[eBPF RING BUFFER SYSCALL TRACE (TAIL)]\n11:42:18.102 [CPU 2] PID 1492 (dropper_stage1) -> sys_mprotect(prot=PROT_READ|PROT_WRITE|PROT_EXEC) => -1 [KILLED_SIGKILL] (W^X Trap)\n11:42:18.108 [CPU 0] PID 5120 (inject_dbg)      -> sys_ptrace(PTRACE_POKETEXT, pid=844)           => -1 [BLOCKED_EPERM] (Remote Injection)\n11:42:18.115 [CPU 3] PID 4892 (rev_beacon)      -> sys_connect(dst=185.220.101.44:8443)           => -1 [BLOCKED_EPERM] (C2 Feed Match)\n11:28:05.422 [CPU 1] PID 3110 (lockbit3_elf)    -> sys_rename(newpath="*.lockbit")                => -1 [BLOCKED_EPERM] (Ransomware Ext)\n10:15:32.012 [CPU 2] PID 2048 (blacklotus_byovd)-> sys_init_module(driver=mhyprot2.sys)           => -1 [BLOCKED_EPERM] (BYOVD Exploit)`
          };
        }
        if (sub === 'test' || sub === 'sim') {
          const profile = args[1] || 'rwx';
          if (profile === 'rwx' || profile === 'mprotect') {
            return {
              output: `[eBPF TRAP SIMULATION: W^X VIOLATION]\n[+] Allocating test heap page at 0x7fff92a00000...\n[+] Issuing sys_mprotect(0x7fff92a00000, 65536, PROT_READ|PROT_WRITE|PROT_EXEC)...\n[!] eBPF Probe 'trace_mprotect_wx' triggered!\n[KILLED] Kernel sent SIGKILL (Signal 9) to PID. Return code: -EPERM.\nZero execution permitted on mutable pages.`
            };
          }
          if (profile === 'lockbit') {
            return {
              output: `[eBPF TRAP SIMULATION: LOCKBIT 3.0 RANSOMWARE]\n[+] Simulating encryption burst on /home/enterprise/documents/...\n[+] Entropy test: 7.989 bits/byte (High Entropy Ciphertext detected)\n[+] Intercepting sys_rename(*.lockbit)...\n[!] eBPF Probe 'trace_rename_guard' triggered!\n[BLOCKED] Return code: -1 (EPERM). Shadow copies preserved.`
            };
          }
          return {
            output: `Available test simulations: rwx, lockbit, cobalt, blacklotus, xmrig`
          };
        }
        if (sub === 'maps') {
          return {
            output: `[KERNEL BPF MAPS]\nMAP NAME             TYPE                 MAX ENTRIES  CURRENT  KEY/VAL SIZE\nblocked_pids_map     BPF_MAP_TYPE_HASH    1,024        5        4B / 64B\nc2_threat_ips_map    BPF_MAP_TYPE_HASH    8,192        8        4B / 16B\nringbuf_events       BPF_MAP_TYPE_RINGBUF 16,384       142      0B / 256B`
          };
        }
        return {
          output: `Usage: ebpf [status|probes|trace|test|maps]`
        };
      }

      case 'decommission':
      case 'dod-wipe':
      case 'sanitize-system': {
        return {
          output: `[SYSTEM DECOMMISSION & DOD 5220.22-M SANITIZATION]\nAuthority:        SuperAdmin (@admin / ROOT_ADMIN UID 0)\nCockpit Tab:      Mission Control -> Decommission Tab\nSanitization:     DoD 5220.22-M (ECE) 7-Pass Overwrite & NIST SP 800-88 Cryptographic Erase\nTarget Storage:   All attached internal NVMe/SATA SSDs & unremoved external storage\nTPM Subsystem:    TPM2_Clear (SRK, EK, PCR 0-23 Registers)\nFirmware:         UEFI NVRAM Secure Boot Platform Keys (PK, KEK, db) Zeroed\nExternal Drives:  Safeguard isolation enabled in Cockpit Decommission GUI\nTo initiate: Switch to the Decommission tab in Cockpit and authorize via 3-step SUDO PIN verification.`
        };
      }

      case 'report-bug':
      case 'bugreport': {
        const titleArg = args.join(' ') || 'CLI User Reported Anomaly';
        const report = bugReporterService.createBugReport({
          title: titleArg,
          description: `Reported via CLI command 'report-bug'. Hardware, software, and current directory context captured.`,
          manualFile: currentDir + '/kernel_cli.ts',
          manualCodeSnippet: [
            '12:   // CLI Execution Context',
            '13:   const cmd = parseCommand(input);',
            '14: >> executeSyscall(cmd.opcode, cmd.operands);',
            '15:   return renderTerminalOutput();'
          ].join('\n'),
          type: 'MANUAL_REPORT'
        });
        bugReporterService.transmitReport(report.id);
        return {
          output: `[AUTOMATED BUG REPORTER: ZERO-PII DISPATCH]\nReport ID:    ${report.id}\nTarget:       ${OFFICIAL_BUG_RECIPIENT}\nStatus:       TRANSMITTED (Status 200 via Telemetry Gateway)\nPrivacy:      Zero-PII Guaranteed (All user identifiers scrubbed)\nHardware:     ${report.hardware.cpuModel} (${report.hardware.cpuCores} Cores, ${report.hardware.memoryTotalGb}GB RAM)\nSoftware:     ${report.software.osName} v${report.software.osVersion} (${report.software.kernelBuild})\nCode Lines:   ${report.codeContext?.fileOrModule}:${report.codeContext?.lineNumber}\nAttachments:  telemetry.json, hardware-software-manifest.txt, code-fault-area.txt\n\nYou can review or submit full reports visually in Mission Control Cockpit -> Bug Reporter Tab.`
        };
      }

      case 'wishlist':
      case 'ideas':
      case 'feature-request': {
        if (!args[0]) {
          return {
            output: `Usage: wishlist "<title>" "<description/idea>"\nExample: wishlist "Encrypted ZFS Replicas" "Add background encrypted block replica synchronization."\nOr open Mission Control Cockpit -> Bug Reporter & OS Wishlist Tab.`
          };
        }
        const title = args[0];
        const desc = args.slice(1).join(' ') || 'User suggested addition to SecureCurtain OS.';
        const report = bugReporterService.createUserIdeaReport({
          title,
          proposedAddition: desc,
          rationale: 'Submitted via CLI shell operator interface.',
          category: 'GENERAL_OS',
          impactLevel: 'SIGNIFICANT_IMPROVEMENT',
          affectedArea: 'OS Architecture'
        });
        bugReporterService.transmitReport(report.id);
        return {
          output: `[OS WISHLIST: FEATURE PROPOSAL DISPATCHED]\nProposal ID:  ${report.id}\nTarget:       ${OFFICIAL_BUG_RECIPIENT}\nStatus:       TRANSMITTED\nTitle:        ${title}\nProposal:     ${desc}\nPrivacy:      Zero-PII Guaranteed\nEnvironment:  Anonymous Hardware & Software settings profile attached.\nThank you for helping shape SecureCurtain OS!`
        };
      }

      case 'telemetry': {
        const reps = bugReporterService.getReports();
        let out = `[SECURECURTAIN ZERO-PII TELEMETRY & BUG OUTBOX]\nGateway Recipient: ${OFFICIAL_BUG_RECIPIENT}\nTotal Dispatches:  ${reps.length}\n\n`;
        out += `ID                 TYPE         STATUS       TITLE\n`;
        out += `--------------------------------------------------------------------------------\n`;
        reps.forEach(r => {
          out += `${r.id.padEnd(19)} ${r.type.padEnd(12)} ${r.status.padEnd(12)} ${r.title.substring(0, 36)}\n`;
        });
        out += `\nTo inspect in detail or submit new reports, open Mission Control Cockpit.`;
        return { output: out };
      }

      default:
        return null;
    }
  }
}
