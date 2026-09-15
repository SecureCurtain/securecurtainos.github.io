// =========================================================================
// SecureCurtain OS - eBPF Syscall Hooking & Behavioral Sandbox Service
// Real-time kernel probe monitoring, ring-buffer streaming, and policy enforcement
// =========================================================================

import {
  EbpfProgram,
  SyscallHookPolicy,
  SyscallEvent,
  EbpfMap,
  SandboxSimulationProfile,
  EbpfEngineStats,
  SyscallEnforcementAction
} from '../types';

type SyscallEventListener = (event: SyscallEvent) => void;
type StatsEventListener = (stats: EbpfEngineStats) => void;

class EbpfSyscallService {
  private listeners: Set<SyscallEventListener> = new Set();
  private statsListeners: Set<StatsEventListener> = new Set();
  private recentEvents: SyscallEvent[] = [];
  private maxHistory: number = 300;
  private isStreamPaused: boolean = false;
  private simulationInterval: any = null;
  private backgroundTelemetryTimer: any = null;
  private isSimulationAborted: boolean = false;

  // Active eBPF Probes & Programs loaded in Kernel JIT
  private programs: EbpfProgram[] = [
    {
      id: 'ebpf_prog_mprotect',
      name: 'trace_mprotect_wx',
      section: 'SEC("kprobe/__x64_sys_mprotect")',
      targetSyscall: 'sys_mprotect',
      type: 'kprobe',
      status: 'ACTIVE',
      jitedInstructions: 284,
      complexity: 42,
      stackDepthBytes: 128,
      eventsCount: 4218,
      blocksCount: 39,
      description: 'Enforces W^X (Write XOR Execute). Detects transitions granting both PROT_WRITE and PROT_EXEC to memory pages.',
      cSource: `SEC("kprobe/__x64_sys_mprotect")
int BPF_KPROBE(trace_mprotect_wx, unsigned long start, size_t len, unsigned long prot) {
    struct task_struct *task = (struct task_struct *)bpf_get_current_task();
    u32 pid = bpf_get_current_pid_tgid() >> 32;

    // Check for PROT_WRITE | PROT_EXEC (W^X violation)
    if ((prot & (PROT_WRITE | PROT_EXEC)) == (PROT_WRITE | PROT_EXEC)) {
        struct syscall_event_t evt = {};
        evt.pid = pid;
        evt.syscall_nr = __NR_mprotect;
        evt.threat_score = 95;
        bpf_get_current_comm(&evt.comm, sizeof(evt.comm));
        
        // Push event to ring buffer and trigger SIGKILL or EPERM
        bpf_ringbuf_output(&ringbuf_events, &evt, sizeof(evt), 0);
        bpf_send_signal(9); // SIGKILL
        return -EPERM;
    }
    return 0;
}`
    },
    {
      id: 'ebpf_prog_ptrace',
      name: 'trace_ptrace_injection',
      section: 'SEC("kprobe/__x64_sys_ptrace")',
      targetSyscall: 'sys_ptrace',
      type: 'kprobe',
      status: 'ACTIVE',
      jitedInstructions: 312,
      complexity: 58,
      stackDepthBytes: 160,
      eventsCount: 1845,
      blocksCount: 24,
      description: 'Detects cross-process debugging, process hollowing, and memory tampering via PTRACE_ATTACH and PTRACE_POKETEXT.',
      cSource: `SEC("kprobe/__x64_sys_ptrace")
int BPF_KPROBE(trace_ptrace_injection, long request, long pid, unsigned long addr, unsigned long data) {
    u32 caller_pid = bpf_get_current_pid_tgid() >> 32;
    
    // Intercept remote code injection requests
    if (request == PTRACE_POKETEXT || request == PTRACE_ATTACH || request == PTRACE_SEIZE) {
        struct syscall_event_t evt = {};
        evt.pid = caller_pid;
        evt.target_pid = pid;
        evt.syscall_nr = __NR_ptrace;
        evt.threat_score = 90;
        
        bpf_ringbuf_output(&ringbuf_events, &evt, sizeof(evt), 0);
        return -EPERM; // Deny permission to foreign process memory
    }
    return 0;
}`
    },
    {
      id: 'ebpf_prog_memfd',
      name: 'trace_memfd_fileless',
      section: 'SEC("kprobe/__x64_sys_memfd_create")',
      targetSyscall: 'sys_memfd_create',
      type: 'kprobe',
      status: 'ACTIVE',
      jitedInstructions: 198,
      complexity: 31,
      stackDepthBytes: 96,
      eventsCount: 890,
      blocksCount: 12,
      description: 'Monitors anonymous RAM-backed memory descriptors often used for fileless ELF execution bypassing disk AV scanners.',
      cSource: `SEC("kprobe/__x64_sys_memfd_create")
int BPF_KPROBE(trace_memfd_fileless, const char *uname, unsigned int flags) {
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    struct syscall_event_t evt = {};
    evt.pid = pid;
    evt.syscall_nr = __NR_memfd_create;
    evt.threat_score = 75;

    bpf_probe_read_user_str(&evt.args_str, sizeof(evt.args_str), uname);
    bpf_ringbuf_output(&ringbuf_events, &evt, sizeof(evt), 0);
    return 0;
}`
    },
    {
      id: 'ebpf_prog_init_module',
      name: 'trace_byovd_kernel_driver',
      section: 'SEC("kprobe/__x64_sys_init_module")',
      targetSyscall: 'sys_init_module',
      type: 'kprobe',
      status: 'ACTIVE',
      jitedInstructions: 410,
      complexity: 74,
      stackDepthBytes: 256,
      eventsCount: 142,
      blocksCount: 18,
      description: 'Blocks Bring-Your-Own-Vulnerable-Driver (BYOVD) attacks and unsigned kernel rootkit loading.',
      cSource: `SEC("kprobe/__x64_sys_init_module")
int BPF_KPROBE(trace_byovd_kernel_driver, void *umod, unsigned long len, const char *uargs) {
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    
    // Check module hash against known vulnerable driver list (e.g., RTCore64, mhyprot2)
    if (is_driver_blacklisted(umod, len)) {
        struct syscall_event_t evt = {};
        evt.pid = pid;
        evt.syscall_nr = __NR_init_module;
        evt.threat_score = 100;
        
        bpf_ringbuf_output(&ringbuf_events, &evt, sizeof(evt), 0);
        return -EPERM;
    }
    return 0;
}`
    },
    {
      id: 'ebpf_prog_connect',
      name: 'trace_c2_beacon_egress',
      section: 'SEC("kprobe/__x64_sys_connect")',
      targetSyscall: 'sys_connect',
      type: 'kprobe',
      status: 'ACTIVE',
      jitedInstructions: 340,
      complexity: 65,
      stackDepthBytes: 192,
      eventsCount: 15420,
      blocksCount: 44,
      description: 'Intercepts socket connect requests, comparing destination IPs against real-time C2 threat intelligence maps.',
      cSource: `SEC("kprobe/__x64_sys_connect")
int BPF_KPROBE(trace_c2_beacon_egress, int sockfd, struct sockaddr *addr, int addrlen) {
    struct sockaddr_in sin;
    if (bpf_probe_read_user(&sin, sizeof(sin), addr) < 0) return 0;
    
    u32 daddr = sin.sin_addr.s_addr;
    u32 *is_malicious = bpf_map_lookup_elem(&c2_threat_ips_map, &daddr);
    if (is_malicious && *is_malicious > 0) {
        struct syscall_event_t evt = {};
        evt.pid = bpf_get_current_pid_tgid() >> 32;
        evt.syscall_nr = __NR_connect;
        evt.threat_score = 98;
        
        bpf_ringbuf_output(&ringbuf_events, &evt, sizeof(evt), 0);
        return -ECONNREFUSED;
    }
    return 0;
}`
    },
    {
      id: 'ebpf_prog_lsm_exec',
      name: 'lsm_bprm_check_security',
      section: 'SEC("lsm/bprm_check_security")',
      targetSyscall: 'sys_execve',
      type: 'bpf_lsm',
      status: 'ACTIVE',
      jitedInstructions: 520,
      complexity: 92,
      stackDepthBytes: 320,
      eventsCount: 8930,
      blocksCount: 22,
      description: 'Linux Security Module (LSM) hook executing before process memory image creation to enforce binary signature policy.',
      cSource: `SEC("lsm/bprm_check_security")
int BPF_PROG(lsm_bprm_check_security, struct linux_binprm *bprm) {
    // Audit execution context and inspect interpreter integrity
    if (bprm->file && is_untrusted_quarantine_binary(bprm->file)) {
        return -EACCES;
    }
    return 0;
}`
    }
  ];

  // Syscall Interception Enforcement Policies
  private policies: SyscallHookPolicy[] = [
    {
      id: 'pol_mprotect',
      syscall: 'sys_mprotect',
      syscallNr: 10,
      category: 'MEMORY_INJECTION',
      action: 'KILL_SIGKILL',
      enabled: true,
      threatSeverity: 'CRITICAL',
      description: 'W^X Enforcement: Immediately kills any thread attempting to map or alter page protections to executable and writable.',
      triggerCondition: '(prot & (PROT_WRITE | PROT_EXEC)) == (PROT_WRITE | PROT_EXEC)'
    },
    {
      id: 'pol_ptrace',
      syscall: 'sys_ptrace',
      syscallNr: 101,
      category: 'PROCESS_CONTROL',
      action: 'BLOCK_EPERM',
      enabled: true,
      threatSeverity: 'HIGH',
      description: 'Cross-Process Hollowing: Intercepts memory read/write injections (PTRACE_POKETEXT) into foreign PIDs.',
      triggerCondition: 'request in [PTRACE_POKETEXT, PTRACE_ATTACH, PTRACE_SEIZE] && target_pid != caller_pid'
    },
    {
      id: 'pol_memfd',
      syscall: 'sys_memfd_create',
      syscallNr: 319,
      category: 'FILELESS_EXEC',
      action: 'ISOLATE_SANDBOX',
      enabled: true,
      threatSeverity: 'HIGH',
      description: 'Fileless Payload Interception: Diverts anonymous memory-mapped binaries into an isolated execution sandbox.',
      triggerCondition: 'flags & MFD_CLOEXEC || name starts with ":shm:"'
    },
    {
      id: 'pol_init_module',
      syscall: 'sys_init_module',
      syscallNr: 175,
      category: 'KERNEL_DRIVER',
      action: 'BLOCK_EPERM',
      enabled: true,
      threatSeverity: 'CRITICAL',
      description: 'BYOVD Driver Guard: Blocks vulnerable, unsigned, or revoked kernel driver modules from loading into Ring 0.',
      triggerCondition: 'sha256(module_bytes) in revoked_kernel_drivers_db'
    },
    {
      id: 'pol_connect',
      syscall: 'sys_connect',
      syscallNr: 42,
      category: 'NETWORK_C2',
      action: 'BLOCK_EPERM',
      enabled: true,
      threatSeverity: 'CRITICAL',
      description: 'C2 Beaconing Egress Lock: Blocks TCP/UDP connections to flagged threat intelligence IP ranges and botnet controllers.',
      triggerCondition: 'dst_ip in threat_intel_c2_feed || dst_port in [4444, 1337, 8888, 3333]'
    },
    {
      id: 'pol_unlink_rename',
      syscall: 'sys_rename',
      syscallNr: 82,
      category: 'FILE_TAMPERING',
      action: 'BLOCK_EPERM',
      enabled: true,
      threatSeverity: 'HIGH',
      description: 'Ransomware Mass-Rename Detection: Traps rapid sequential file extensions renaming (e.g. *.lockbit, *.locked).',
      triggerCondition: 'rename_burst_rate > 20_files_per_sec || extension in [".locked", ".lockbit", ".enc"]'
    },
    {
      id: 'pol_execve',
      syscall: 'sys_execve',
      syscallNr: 59,
      category: 'PROCESS_CONTROL',
      action: 'AUDIT',
      enabled: true,
      threatSeverity: 'LOW',
      description: 'Process Creation Audit: Logs all process execution argv, environment variables, and cryptographic hash digests.',
      triggerCondition: 'always_audit'
    }
  ];

  // Kernel eBPF Maps
  private maps: EbpfMap[] = [
    {
      id: 'map_blocked_pids',
      name: 'blocked_pids_map',
      type: 'BPF_MAP_TYPE_HASH',
      keySize: 4,
      valueSize: 64,
      maxEntries: 1024,
      currentEntries: 5,
      entries: [
        { key: 'PID 1492', value: 'PROT_EXEC W^X Violation [SIGKILL]', lastUpdated: '11:42:18' },
        { key: 'PID 2048', value: 'BlackLotus BYOVD Driver Attempt [EPERM]', lastUpdated: '10:15:32' },
        { key: 'PID 3110', value: 'LockBit 3.0 Ransomware Encryptor [SIGKILL]', lastUpdated: '11:28:05' },
        { key: 'PID 4892', value: 'C2 Beaconing (185.220.101.44) [ECONNREFUSED]', lastUpdated: '09:54:12' },
        { key: 'PID 5120', value: 'PTRACE_ATTACH to lsass (PID 844) [EPERM]', lastUpdated: '12:02:44' }
      ],
      description: 'Kernel-side hash table of terminated or quarantined process IDs with corresponding violation codes.'
    },
    {
      id: 'map_c2_threat_ips',
      name: 'c2_threat_ips_map',
      type: 'BPF_MAP_TYPE_HASH',
      keySize: 4,
      valueSize: 16,
      maxEntries: 8192,
      currentEntries: 8,
      entries: [
        { key: '185.220.101.44', value: 'Severity: CRITICAL | CobaltStrike C2', lastUpdated: '09:00:00' },
        { key: '194.26.29.112', value: 'Severity: HIGH | LockBit Hive', lastUpdated: '09:00:00' },
        { key: '45.154.255.89', value: 'Severity: CRITICAL | BlackCat Tor Proxy', lastUpdated: '09:00:00' },
        { key: '91.240.118.172', value: 'Severity: HIGH | QakBot Infrastructure', lastUpdated: '09:00:00' },
        { key: '103.145.13.20', value: 'Severity: CRITICAL | Lazarus Group Staging', lastUpdated: '09:00:00' }
      ],
      description: 'Synchronized with Threat Intel Feed. Packets matching destination IPs are dropped at XDP/kprobe connect level.'
    },
    {
      id: 'map_ringbuf_events',
      name: 'ringbuf_events',
      type: 'BPF_MAP_TYPE_RINGBUF',
      keySize: 0,
      valueSize: 256,
      maxEntries: 16384,
      currentEntries: 142,
      entries: [
        { key: 'Slot #141', value: 'sys_mprotect: PID 1492 prot=0x7 (W^X TRAP)', lastUpdated: 'Just now' },
        { key: 'Slot #140', value: 'sys_connect: PID 4892 dst=185.220.101.44:8443', lastUpdated: '2s ago' }
      ],
      description: 'Zero-copy high throughput multi-core kernel ring buffer streaming raw syscall payloads to user space.'
    }
  ];

  // Simulation Profiles
  private simulationProfiles: SandboxSimulationProfile[] = [
    {
      id: 'sim_lockbit3',
      name: 'LockBit 3.0 Ransomware Campaign',
      category: 'RANSOMWARE',
      processName: 'lockbit3_payload.elf',
      description: 'Simulates rapid file traversal, high-entropy cryptographic encryption, file renaming (*.lockbit), and VSS shadow copy deletion.',
      expectedMitre: 'T1486 (Data Encrypted for Impact), T1490 (Inhibit System Recovery)',
      steps: [
        {
          delayMs: 300,
          syscall: 'sys_openat',
          syscallNr: 257,
          args: 'dirfd=AT_FDCWD, pathname="/home/user/docs/financial_ledger.xlsx", flags=O_RDWR',
          rawArgs: { path: '/home/user/docs/financial_ledger.xlsx', flags: 'O_RDWR' },
          simulatedReturn: 'fd=4',
          riskScore: 25,
          mitre: 'T1083'
        },
        {
          delayMs: 400,
          syscall: 'sys_read',
          syscallNr: 0,
          args: 'fd=4, buf=0x7fff10200000, count=65536',
          rawArgs: { fd: 4, count: 65536 },
          simulatedReturn: '65536 bytes read',
          riskScore: 20
        },
        {
          delayMs: 500,
          syscall: 'sys_write',
          syscallNr: 1,
          args: 'fd=4, buf=[Entropy 7.989 - ChaCha20/Poly1305 Ciphertext], count=65536',
          rawArgs: { fd: 4, entropy: 7.989, count: 65536 },
          simulatedReturn: '65536 bytes written',
          riskScore: 85,
          mitre: 'T1486',
          triggerHeuristic: 'High Entropy Burst Rate > 7.90'
        },
        {
          delayMs: 400,
          syscall: 'sys_rename',
          syscallNr: 82,
          args: 'oldpath="financial_ledger.xlsx", newpath="financial_ledger.xlsx.lockbit"',
          rawArgs: { oldpath: 'financial_ledger.xlsx', newpath: 'financial_ledger.xlsx.lockbit' },
          simulatedReturn: '-1 (EPERM)',
          riskScore: 99,
          mitre: 'T1486',
          triggerHeuristic: 'eBPF Rename Guard: Blocked Ransomware Extension'
        },
        {
          delayMs: 400,
          syscall: 'sys_execve',
          syscallNr: 59,
          args: 'filename="/bin/sh", argv=["sh", "-c", "vssadmin delete shadows /all /quiet"]',
          rawArgs: { binary: '/bin/sh', cmd: 'vssadmin delete shadows /all /quiet' },
          simulatedReturn: '-1 (SIGKILL sent to PID)',
          riskScore: 100,
          mitre: 'T1490',
          triggerHeuristic: 'Shadow Copy Tampering Trap Triggered'
        }
      ]
    },
    {
      id: 'sim_cobaltstrike',
      name: 'Cobalt Strike Memory Injection & Hollowing',
      category: 'EXPLOIT',
      processName: 'beacon.x64.bin',
      description: 'Executes fileless anonymous memfd creation, sets RWX page permissions, and injects payload into foreign PID via ptrace.',
      expectedMitre: 'T1055.012 (Process Hollowing), T1620 (Reflective Code Loading)',
      steps: [
        {
          delayMs: 300,
          syscall: 'sys_memfd_create',
          syscallNr: 319,
          args: 'name=":shm:cs_stager", flags=MFD_CLOEXEC',
          rawArgs: { name: ':shm:cs_stager', flags: 'MFD_CLOEXEC' },
          simulatedReturn: 'fd=5',
          riskScore: 70,
          mitre: 'T1620'
        },
        {
          delayMs: 400,
          syscall: 'sys_mprotect',
          syscallNr: 10,
          args: 'addr=0x7fff92a00000, len=65536, prot=PROT_READ|PROT_WRITE|PROT_EXEC',
          rawArgs: { addr: '0x7fff92a00000', prot: 7 },
          simulatedReturn: '-1 (SIGKILL - W^X VIOLATION)',
          riskScore: 98,
          mitre: 'T1055',
          triggerHeuristic: 'eBPF kprobe: W^X Enforcement Intercepted RWX Allocation'
        },
        {
          delayMs: 500,
          syscall: 'sys_ptrace',
          syscallNr: 101,
          args: 'request=PTRACE_ATTACH, pid=844 (Target: lsass.exe), addr=NULL',
          rawArgs: { request: 'PTRACE_ATTACH', target_pid: 844 },
          simulatedReturn: '-1 (EPERM)',
          riskScore: 99,
          mitre: 'T1055.012',
          triggerHeuristic: 'eBPF Anti-Injection Policy: Blocked Remote Process Memory Hook'
        },
        {
          delayMs: 400,
          syscall: 'sys_connect',
          syscallNr: 42,
          args: 'sockfd=6, addr=185.220.101.44:8443 (Cobalt Strike TeamServer C2)',
          rawArgs: { ip: '185.220.101.44', port: 8443 },
          simulatedReturn: '-1 (ECONNREFUSED)',
          riskScore: 100,
          mitre: 'T1071.001',
          triggerHeuristic: 'Kernel C2 IP Map Match: Egress Blocked'
        }
      ]
    },
    {
      id: 'sim_blacklotus',
      name: 'BlackLotus BYOVD Driver & Rootkit Load',
      category: 'ROOTKIT',
      processName: 'blacklotus_installer.elf',
      description: 'Attempts to load a vulnerable signed kernel driver (mhyprot2 / RTCore64) and execute arbitrary kernel memory patching.',
      expectedMitre: 'T1068 (Exploitation for Privilege Escalation), T1014 (Rootkit)',
      steps: [
        {
          delayMs: 400,
          syscall: 'sys_openat',
          syscallNr: 257,
          args: 'dirfd=AT_FDCWD, pathname="/tmp/mhyprot2.sys", flags=O_RDONLY',
          rawArgs: { path: '/tmp/mhyprot2.sys' },
          simulatedReturn: 'fd=3',
          riskScore: 40
        },
        {
          delayMs: 500,
          syscall: 'sys_init_module',
          syscallNr: 175,
          args: 'umod=0x7fff5a000000, len=48128, uargs="" (BYOVD Rootkit Target)',
          rawArgs: { umod: '0x7fff5a000000', size: 48128 },
          simulatedReturn: '-1 (EPERM - REVOKED_DRIVER_CERT)',
          riskScore: 100,
          mitre: 'T1068',
          triggerHeuristic: 'eBPF BYOVD Filter: Known Vulnerable Driver Hash Blocked'
        },
        {
          delayMs: 400,
          syscall: 'sys_ioctl',
          syscallNr: 16,
          args: 'fd=3, cmd=0x8000204C, arg=0x7ffcf120 (Attempt to write CR0 WP bit)',
          rawArgs: { cmd: '0x8000204C' },
          simulatedReturn: '-1 (EPERM)',
          riskScore: 100,
          mitre: 'T1014'
        }
      ]
    },
    {
      id: 'sim_xmrig',
      name: 'XMRig Monero Stealth Cryptominer',
      category: 'MALWARE',
      processName: 'systemd-helper (xmrig.bin)',
      description: 'Disguises itself as a system daemon, binds CPU affinities to max capacity, and connects to mining pool over Stratum protocol.',
      expectedMitre: 'T1496 (Resource Hijacking), T1036.005 (Masquerading)',
      steps: [
        {
          delayMs: 300,
          syscall: 'sys_sysinfo',
          syscallNr: 99,
          args: 'info=0x7fff89000000 (Enumerating CPU Core count & AVX2 capability)',
          rawArgs: { query: 'cpu_topology' },
          simulatedReturn: '0 (Success)',
          riskScore: 15
        },
        {
          delayMs: 400,
          syscall: 'sys_sched_setaffinity',
          syscallNr: 203,
          args: 'pid=0, cpusetsize=128, mask=[Cores 0-15 Locked 100%]',
          rawArgs: { mask: '0xFFFF' },
          simulatedReturn: '0 (Success)',
          riskScore: 65,
          mitre: 'T1496'
        },
        {
          delayMs: 400,
          syscall: 'sys_socket',
          syscallNr: 41,
          args: 'domain=AF_INET, type=SOCK_STREAM, protocol=IPPROTO_TCP',
          rawArgs: { domain: 'AF_INET', type: 'SOCK_STREAM' },
          simulatedReturn: 'fd=7',
          riskScore: 20
        },
        {
          delayMs: 500,
          syscall: 'sys_connect',
          syscallNr: 42,
          args: 'sockfd=7, addr=pool.supportxmr.com:3333 (Stratum Mining Protocol)',
          rawArgs: { domain: 'pool.supportxmr.com', port: 3333 },
          simulatedReturn: '-1 (ECONNREFUSED - CRYPTOMINING FILTER)',
          riskScore: 95,
          mitre: 'T1496',
          triggerHeuristic: 'eBPF Socket Policy: Stratum Mining Protocol Blocked'
        }
      ]
    },
    {
      id: 'sim_benign_dev',
      name: 'Benign Compiler Build Workflow (Cargo / GCC)',
      category: 'BENIGN_SYSADMIN',
      processName: 'cargo-build',
      description: 'Standard software compilation pipeline invoking rustc, gcc, pipe descriptors, and linking. Baseline 0% threat calibration.',
      expectedMitre: 'None (Standard Sysadmin Execution)',
      steps: [
        {
          delayMs: 200,
          syscall: 'sys_clone',
          syscallNr: 56,
          args: 'clone_flags=CLONE_VM|CLONE_FS|CLONE_FILES|SIGCHLD, stack=0x7fff0000',
          rawArgs: { flags: 'CLONE_VM' },
          simulatedReturn: 'child_pid=6104',
          riskScore: 5
        },
        {
          delayMs: 250,
          syscall: 'sys_execve',
          syscallNr: 59,
          args: 'filename="/usr/bin/gcc", argv=["gcc", "-O3", "-c", "main.c"]',
          rawArgs: { binary: '/usr/bin/gcc' },
          simulatedReturn: '0 (Audited)',
          riskScore: 0
        },
        {
          delayMs: 250,
          syscall: 'sys_openat',
          syscallNr: 257,
          args: 'dirfd=AT_FDCWD, pathname="main.o", flags=O_CREAT|O_WRONLY|O_TRUNC',
          rawArgs: { path: 'main.o' },
          simulatedReturn: 'fd=3',
          riskScore: 0
        },
        {
          delayMs: 300,
          syscall: 'sys_write',
          syscallNr: 1,
          args: 'fd=3, buf=[ELF 64-bit LSB relocatable object], count=24576',
          rawArgs: { fd: 3, count: 24576, entropy: 4.8 },
          simulatedReturn: '24576 bytes written',
          riskScore: 0
        }
      ]
    }
  ];

  // Engine Statistics
  private stats: EbpfEngineStats = {
    engineStatus: 'RUNNING',
    activeProbesCount: 6,
    totalSyscallsProcessed: 32684,
    totalBlocksKills: 159,
    totalAudited: 32525,
    ringBufferThroughputMsgSec: 48,
    ringBufferDropRate: 0.00,
    averageLatencyUs: 0.42,
    jitCompiler: 'ENABLED (Clang/LLVM 18 eBPF v4 JIT)',
    kernelVersion: 'Linux 6.9.12-securecurtain-hardened-x86_64',
    bpfLsmEnabled: true
  };

  constructor() {
    this.seedInitialEvents();
    this.startBackgroundTelemetry();
  }

  private seedInitialEvents() {
    const initialRaw: Partial<SyscallEvent>[] = [
      {
        cpu: 2,
        pid: 1492,
        ppid: 1102,
        comm: 'dropper_stage1',
        uid: 1000,
        syscall: 'sys_mprotect',
        syscallNr: 10,
        arguments: 'addr=0x7fff92a00000, len=65536, prot=PROT_READ|PROT_WRITE|PROT_EXEC',
        rawArgs: { addr: '0x7fff92a00000', prot: 7 },
        returnVal: '-1 (SIGKILL)',
        durationUs: 0.38,
        actionTaken: 'KILLED_SIGKILL',
        threatScore: 98,
        mitreTechnique: 'T1055.001',
        signature: 'W^X_MEMORY_VIOLATION_TRAP',
        ruleMatched: 'pol_mprotect'
      },
      {
        cpu: 0,
        pid: 5120,
        ppid: 5100,
        comm: 'inject_dbg',
        uid: 1000,
        syscall: 'sys_ptrace',
        syscallNr: 101,
        arguments: 'request=PTRACE_POKETEXT, pid=844 (lsass), addr=0x7fff92a00040',
        rawArgs: { request: 'PTRACE_POKETEXT', target: 844 },
        returnVal: '-1 (EPERM)',
        durationUs: 0.45,
        actionTaken: 'BLOCKED_EPERM',
        threatScore: 95,
        mitreTechnique: 'T1055.012',
        signature: 'PTRACE_REMOTE_MEM_INJECTION',
        ruleMatched: 'pol_ptrace'
      },
      {
        cpu: 3,
        pid: 4892,
        ppid: 1001,
        comm: 'rev_beacon',
        uid: 1000,
        syscall: 'sys_connect',
        syscallNr: 42,
        arguments: 'sockfd=4, addr=185.220.101.44:8443',
        rawArgs: { ip: '185.220.101.44', port: 8443 },
        returnVal: '-1 (ECONNREFUSED)',
        durationUs: 0.52,
        actionTaken: 'BLOCKED_EPERM',
        threatScore: 99,
        mitreTechnique: 'T1071.001',
        signature: 'KNOWN_C2_FEED_IP_MATCH',
        ruleMatched: 'pol_connect'
      },
      {
        cpu: 1,
        pid: 3110,
        ppid: 2980,
        comm: 'lockbit3_elf',
        uid: 1000,
        syscall: 'sys_rename',
        syscallNr: 82,
        arguments: 'oldpath="tax_2025.pdf", newpath="tax_2025.pdf.lockbit"',
        rawArgs: { oldpath: 'tax_2025.pdf', newpath: 'tax_2025.pdf.lockbit' },
        returnVal: '-1 (EPERM)',
        durationUs: 0.41,
        actionTaken: 'BLOCKED_EPERM',
        threatScore: 99,
        mitreTechnique: 'T1486',
        signature: 'RANSOMWARE_MASS_EXT_LOCK',
        ruleMatched: 'pol_unlink_rename'
      },
      {
        cpu: 2,
        pid: 2048,
        ppid: 1,
        comm: 'blacklotus_byovd',
        uid: 0,
        syscall: 'sys_init_module',
        syscallNr: 175,
        arguments: 'umod=0x7fff5a000000, len=48128, uargs="" (mhyprot2.sys)',
        rawArgs: { driver: 'mhyprot2.sys' },
        returnVal: '-1 (EPERM)',
        durationUs: 0.61,
        actionTaken: 'BLOCKED_EPERM',
        threatScore: 100,
        mitreTechnique: 'T1068',
        signature: 'BYOVD_VULNERABLE_DRIVER_BLOCKED',
        ruleMatched: 'pol_init_module'
      },
      {
        cpu: 0,
        pid: 1084,
        ppid: 890,
        comm: 'systemd-journald',
        uid: 0,
        syscall: 'sys_epoll_wait',
        syscallNr: 232,
        arguments: 'epfd=3, events=0x7ffe100, maxevents=64, timeout=-1',
        rawArgs: { epfd: 3 },
        returnVal: '1',
        durationUs: 0.22,
        actionTaken: 'PASSED',
        threatScore: 0
      },
      {
        cpu: 1,
        pid: 2450,
        ppid: 1200,
        comm: 'nginx',
        uid: 33,
        syscall: 'sys_accept4',
        syscallNr: 288,
        arguments: 'sockfd=6, addr=127.0.0.1:52194, flags=SOCK_NONBLOCK',
        rawArgs: { ip: '127.0.0.1', port: 52194 },
        returnVal: '7',
        durationUs: 0.31,
        actionTaken: 'PASSED',
        threatScore: 0
      }
    ];

    const now = Date.now();
    this.recentEvents = initialRaw.map((e, idx) => ({
      id: `evt_init_${idx + 1}`,
      timestamp: new Date(now - (initialRaw.length - idx) * 2000).toTimeString().split(' ')[0] + '.' + String(Math.floor(Math.random() * 900) + 100),
      epochMs: now - (initialRaw.length - idx) * 2000,
      cpu: e.cpu ?? 0,
      pid: e.pid ?? 1000,
      ppid: e.ppid ?? 1,
      comm: e.comm ?? 'systemd',
      uid: e.uid ?? 0,
      syscall: e.syscall ?? 'sys_read',
      syscallNr: e.syscallNr ?? 0,
      arguments: e.arguments ?? '',
      rawArgs: e.rawArgs ?? {},
      returnVal: e.returnVal ?? '0',
      durationUs: e.durationUs ?? 0.35,
      actionTaken: e.actionTaken ?? 'PASSED',
      threatScore: e.threatScore ?? 0,
      mitreTechnique: e.mitreTechnique,
      signature: e.signature,
      ruleMatched: e.ruleMatched
    }));
  }

  // Periodic ambient kernel telemetry to simulate real live OS syscall activity
  private startBackgroundTelemetry() {
    if (this.backgroundTelemetryTimer) clearInterval(this.backgroundTelemetryTimer);

    const benignProcesses = [
      { comm: 'systemd', syscall: 'sys_epoll_wait', nr: 232, args: 'epfd=4, timeout=1000', ret: '0' },
      { comm: 'cockpit-ws', syscall: 'sys_read', nr: 0, args: 'fd=5, count=4096', ret: '128' },
      { comm: 'dbus-daemon', syscall: 'sys_poll', nr: 7, args: 'fds=0x7ffcf0, nfds=12, timeout=-1', ret: '1' },
      { comm: 'auditd', syscall: 'sys_recvfrom', nr: 45, args: 'fd=3, count=8192, flags=0', ret: '256' },
      { comm: 'redis-server', syscall: 'sys_write', nr: 1, args: 'fd=8, count=32', ret: '32' },
      { comm: 'node', syscall: 'sys_futex', nr: 202, args: 'uaddr=0x12000, op=FUTEX_WAIT', ret: '0' }
    ];

    this.backgroundTelemetryTimer = setInterval(() => {
      if (this.isStreamPaused) return;

      const p = benignProcesses[Math.floor(Math.random() * benignProcesses.length)];
      const cpu = Math.floor(Math.random() * 4);
      const pid = 1000 + Math.floor(Math.random() * 2000);
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

      const evt: SyscallEvent = {
        id: `evt_ambient_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        timestamp: timeStr,
        epochMs: Date.now(),
        cpu,
        pid,
        ppid: 1,
        comm: p.comm,
        uid: 1000,
        syscall: p.syscall,
        syscallNr: p.nr,
        arguments: p.args,
        rawArgs: {},
        returnVal: p.ret,
        durationUs: Number((0.2 + Math.random() * 0.4).toFixed(2)),
        actionTaken: 'PASSED',
        threatScore: 0
      };

      this.pushEvent(evt);
      this.stats.totalSyscallsProcessed += 1;
      this.stats.ringBufferThroughputMsgSec = Math.floor(35 + Math.random() * 25);
      this.notifyStats();
    }, 2500);
  }

  public pushEvent(evt: SyscallEvent) {
    this.recentEvents.unshift(evt);
    if (this.recentEvents.length > this.maxHistory) {
      this.recentEvents.pop();
    }
    this.listeners.forEach((fn) => fn(evt));
  }

  // Abort any currently running simulation
  public abortSimulation(): void {
    this.isSimulationAborted = true;
  }

  // Execute a Sandbox Simulation Profile step-by-step
  public async runSimulation(profileId: string, onStep?: (stepIndex: number, event: SyscallEvent) => void): Promise<void> {
    const profile = this.simulationProfiles.find((p) => p.id === profileId);
    if (!profile) throw new Error(`Simulation profile "${profileId}" not found`);

    this.isSimulationAborted = false;

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    const simPid = 7000 + Math.floor(Math.random() * 1000);

    for (let i = 0; i < profile.steps.length; i++) {
      if (this.isSimulationAborted) break;

      const step = profile.steps[i];
      await new Promise((res) => setTimeout(res, step.delayMs));

      if (this.isSimulationAborted) break;

      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

      let action: SyscallEvent['actionTaken'] = 'PASSED';
      if (step.riskScore >= 98) {
        action = step.simulatedReturn.includes('SIGKILL') ? 'KILLED_SIGKILL' : 'BLOCKED_EPERM';
      } else if (step.riskScore >= 80) {
        action = 'INTERCEPTED';
      } else if (step.riskScore >= 50) {
        action = 'AUDIT';
      }

      const evt: SyscallEvent = {
        id: `evt_sim_${Date.now()}_${i}`,
        timestamp: timeStr,
        epochMs: Date.now(),
        cpu: Math.floor(Math.random() * 4),
        pid: simPid,
        ppid: 1102,
        comm: profile.processName,
        uid: profile.category === 'ROOTKIT' ? 0 : 1000,
        syscall: step.syscall,
        syscallNr: step.syscallNr,
        arguments: step.args,
        rawArgs: step.rawArgs,
        returnVal: step.simulatedReturn,
        durationUs: Number((0.35 + Math.random() * 0.4).toFixed(2)),
        actionTaken: action,
        threatScore: step.riskScore,
        mitreTechnique: step.mitre || profile.expectedMitre.split(' ')[0],
        signature: step.triggerHeuristic || (step.riskScore > 70 ? `THREAT_${profile.category}_DETECTED` : undefined),
        ruleMatched: step.riskScore >= 80 ? 'pol_' + step.syscall.replace('sys_', '') : undefined
      };

      this.pushEvent(evt);
      this.stats.totalSyscallsProcessed += 1;
      if (action === 'BLOCKED_EPERM' || action === 'KILLED_SIGKILL') {
        this.stats.totalBlocksKills += 1;
      }
      this.notifyStats();

      if (onStep) {
        onStep(i, evt);
      }
    }
  }

  // Inject a custom ad-hoc syscall event directly into the eBPF kernel pipeline
  public injectCustomSyscall(data: {
    comm: string;
    pid: number;
    syscall: string;
    syscallNr: number;
    arguments: string;
    rawArgs?: Record<string, any>;
    targetEntropy?: number;
    destinationIp?: string;
    isKernelModule?: boolean;
    isMemoryRwx?: boolean;
  }): SyscallEvent {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

    let action: SyscallEvent['actionTaken'] = 'PASSED';
    let riskScore = 0;
    let signature: string | undefined = undefined;
    let mitre: string | undefined = undefined;
    let ret = '0';
    let ruleMatched: string | undefined = undefined;

    // Evaluate against active policies
    if (data.isMemoryRwx || data.arguments.includes('PROT_EXEC') && data.arguments.includes('PROT_WRITE')) {
      action = 'KILLED_SIGKILL';
      riskScore = 98;
      signature = 'W^X_MEMORY_VIOLATION_TRAP';
      mitre = 'T1055.001';
      ret = '-1 (SIGKILL)';
      ruleMatched = 'pol_mprotect';
    } else if (data.syscall === 'sys_ptrace' || data.arguments.includes('PTRACE_POKETEXT')) {
      action = 'BLOCKED_EPERM';
      riskScore = 95;
      signature = 'PTRACE_REMOTE_MEM_INJECTION';
      mitre = 'T1055.012';
      ret = '-1 (EPERM)';
      ruleMatched = 'pol_ptrace';
    } else if (data.isKernelModule || data.syscall === 'sys_init_module') {
      action = 'BLOCKED_EPERM';
      riskScore = 100;
      signature = 'BYOVD_VULNERABLE_DRIVER_BLOCKED';
      mitre = 'T1068';
      ret = '-1 (EPERM)';
      ruleMatched = 'pol_init_module';
    } else if (data.destinationIp && ['185.220.101.44', '194.26.29.112', '45.154.255.89'].includes(data.destinationIp)) {
      action = 'BLOCKED_EPERM';
      riskScore = 99;
      signature = 'KNOWN_C2_FEED_IP_MATCH';
      mitre = 'T1071.001';
      ret = '-1 (ECONNREFUSED)';
      ruleMatched = 'pol_connect';
    } else if ((data.targetEntropy && data.targetEntropy > 7.5) || data.arguments.includes('.lockbit')) {
      action = 'BLOCKED_EPERM';
      riskScore = 99;
      signature = 'RANSOMWARE_HIGH_ENTROPY_ENCRYPTOR';
      mitre = 'T1486';
      ret = '-1 (EPERM)';
      ruleMatched = 'pol_unlink_rename';
    } else if (data.syscall === 'sys_memfd_create') {
      action = 'ISOLATED';
      riskScore = 75;
      signature = 'FILELESS_MEMFD_EXEC_STAGER';
      mitre = 'T1620';
      ret = 'fd=5 (diverted to sandbox)';
      ruleMatched = 'pol_memfd';
    }

    const evt: SyscallEvent = {
      id: `evt_injected_${Date.now()}`,
      timestamp: timeStr,
      epochMs: Date.now(),
      cpu: Math.floor(Math.random() * 4),
      pid: data.pid || 6500,
      ppid: 1102,
      comm: data.comm || 'custom_tester',
      uid: 1000,
      syscall: data.syscall,
      syscallNr: data.syscallNr,
      arguments: data.arguments,
      rawArgs: data.rawArgs || {},
      returnVal: ret,
      durationUs: Number((0.30 + Math.random() * 0.3).toFixed(2)),
      actionTaken: action,
      threatScore: riskScore,
      mitreTechnique: mitre,
      signature,
      ruleMatched
    };

    this.pushEvent(evt);
    this.stats.totalSyscallsProcessed += 1;
    if (action === 'BLOCKED_EPERM' || action === 'KILLED_SIGKILL') {
      this.stats.totalBlocksKills += 1;
    }
    this.notifyStats();

    return evt;
  }

  // Getters & Management API
  public getPrograms(): EbpfProgram[] {
    return [...this.programs];
  }

  public getPolicies(): SyscallHookPolicy[] {
    return [...this.policies];
  }

  public getMaps(): EbpfMap[] {
    return [...this.maps];
  }

  public getSimulationProfiles(): SandboxSimulationProfile[] {
    return [...this.simulationProfiles];
  }

  public getRecentEvents(): SyscallEvent[] {
    return [...this.recentEvents];
  }

  public getStats(): EbpfEngineStats {
    return { ...this.stats };
  }

  public toggleProbe(id: string): void {
    const prog = this.programs.find((p) => p.id === id);
    if (!prog) return;
    prog.status = prog.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    this.stats.activeProbesCount = this.programs.filter((p) => p.status === 'ACTIVE').length;
    this.notifyStats();
  }

  public updatePolicyAction(policyId: string, action: SyscallEnforcementAction): void {
    const pol = this.policies.find((p) => p.id === policyId);
    if (!pol) return;
    pol.action = action;
  }

  public togglePolicyEnabled(policyId: string): void {
    const pol = this.policies.find((p) => p.id === policyId);
    if (!pol) return;
    pol.enabled = !pol.enabled;
  }

  public clearMapEntries(mapId: string): void {
    const map = this.maps.find((m) => m.id === mapId);
    if (!map) return;
    map.entries = [];
    map.currentEntries = 0;
  }

  public clearEvents(): void {
    this.recentEvents = [];
  }

  public toggleStreamPause(): boolean {
    this.isStreamPaused = !this.isStreamPaused;
    return this.isStreamPaused;
  }

  public isPaused(): boolean {
    return this.isStreamPaused;
  }

  // Subscriptions
  public subscribeEvents(listener: SyscallEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeStats(listener: StatsEventListener): () => void {
    this.statsListeners.add(listener);
    return () => this.statsListeners.delete(listener);
  }

  private notifyStats(): void {
    const s = this.getStats();
    this.statsListeners.forEach((fn) => fn(s));
  }
}

export const ebpfSyscallService = new EbpfSyscallService();
