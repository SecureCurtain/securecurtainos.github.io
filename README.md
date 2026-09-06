# 🛡️ SecureCurtain OS
### *The Self-Healing, Dual-Persona Microkernel Operating System for Mission-Critical Security, Forensics, and Sovereign Computing*

[![Platform](https://img.shields.io/badge/Architecture-x86__64%20%7C%20AArch64-blue.svg?style=for-the-badge)](https://github.com/SecureCurtain/securecurtainos)
[![Kernel](https://img.shields.io/badge/Kernel-Microkernel%20(Fault--Isolated)-emerald.svg?style=for-the-badge)](https://github.com/SecureCurtain/securecurtainos)
[![Dual-Subsystem](https://img.shields.io/badge/Subsystem-Linux%20(POSIX)%20%2B%20Windows%20(Win32)-purple.svg?style=for-the-badge)](https://github.com/SecureCurtain/securecurtainos)
[![Package Safety](https://img.shields.io/badge/Package%20Shield-Origin--Locked%20(Pacman%20%2B%20Apt)-indigo.svg?style=for-the-badge)](https://github.com/SecureCurtain/securecurtainos)
[![Telemetry](https://img.shields.io/badge/Telemetry-ZERO%20(Air--Gapped%20Verified)-rose.svg?style=for-the-badge)](https://github.com/SecureCurtain/securecurtainos)

---

## ⚡ Executive Summary

**SecureCurtain OS** is a next-generation operating system engineered from the ground up to solve the three greatest vulnerabilities of modern computing: **monolithic kernel crashes**, **cross-platform application fragmentation**, and **untrusted software supply chains**.

By combining a **formal microkernel architecture** with an isolated **Dual-Persona (Linux + Windows) execution layer**, SecureCurtain OS enables operators, security researchers, and enterprise administrators to run native Linux ELF binaries, Arch/Debian packages, and Windows administration tools side-by-side with mathematical fault isolation and zero telemetry.

```
                  ┌──────────────────────────────────────────┐
                  │      SecureCurtain Cockpit & GUI         │
                  │  (Octopi Package Mgr / Live Forensics)   │
                  └────────────────────┬─────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     Linux / POSIX Subsystem   │             │   Windows / Win32 Subsystem   │
│   (pacman, yay/AUR, apt, ELF) │             │ (PE32+, Registry, PowerShell) │
└───────────────┬───────────────┘             └───────────────┬───────────────┘
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       │ System Call Virtualization
                                       ▼
                 ┌───────────────────────────────────────────┐
                 │     Origin-Lock Package Safety Shield     │
                 │   (Prevents glibc / soname corruption)    │
                 └─────────────────────┬─────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SecureCurtain Microkernel Core                        │
│    • Hardware Fault Isolation     • Autonomous Watchdog (<15ms recovery)    │
│    • Userspace Drivers (VirtIO)   • Zero-Telemetry Memory Scrubbing         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Why Choose SecureCurtain OS?

### 1. 🛡️ Crash-Proof Microkernel with Autonomous Recovery
Monolithic operating systems (Linux, Windows, macOS) execute file systems, networking stacks, and hardware drivers in the highest privilege level (Ring 0). A single memory leak, null-pointer dereference, or faulty Wi-Fi driver results in a catastrophic Blue Screen (BSOD) or Kernel Panic.
* **In SecureCurtain OS:** Drivers and network engines execute in isolated userspace memory domains (Ring 3).
* **Self-Healing Watchdog:** If a driver crashes, our microkernel supervisor restarts the offending driver container in **under 15 milliseconds** without terminating user applications or dropping the session.

### 2. 🔀 True Dual-Persona Environment (Linux & Windows Native)
Stop toggling between operating systems or running heavy, sluggish virtual machines:
* **Native POSIX & Win32 Execution:** Run `ripgrep`, `bash`, `nmap`, and `gdb` alongside Windows PE32+ forensic binaries, PowerShell tools, and `sysinternals` natively.
* **Unified 420+ Command Shell:** Seamlessly execute commands from both ecosystems (`ls`, `dir`, `ip a`, `ifconfig`, `top`, `tasklist`, `cat`, `type`) with consistent piping and output parsing.

### 3. 📦 Octopi-Style Package Center with Origin-Lock Safety Shield
Co-locating Arch Linux (`pacman`, `yay/AUR`) and Debian/Kali (`apt`, `dpkg`) on the same system is notoriously hazardous due to `glibc` trampling and library collisions.
* **Octopi Graphical Interface:** Point-and-click repository management without ever touching raw config files. Add upstream mirrors, BlackArch pentesting tools, or Chaotic-AUR with one click.
* **Origin-Lock Safety Shield:** Every application is cryptographically tagged with its originating installer. If an operator or automated script invokes `apt upgrade` on a pacman-installed binary, the transaction is safely intercepted and rejected before system libraries can be corrupted.

### 4. 🚑 Triage-Ready Live Rescue USB & Forensics
Engineered specifically for field engineers, incident responders, and system administrators:
* **Updateable Anti-Malware Signatures:** Unlike static rescue disks that require re-burning an ISO every morning, SecureCurtain's offline signature updater writes threat signatures to a persistent encrypted partition while preserving the pristine read-only base system.
* **Offline Windows Registry Inspector:** Scans unmounted Windows NTFS drives for persistent registry malware, hijacked `explorer.exe` shell keys, and malicious Windows Services.
* **Zero-RAM Exhaustion Safeguard:** Live USB write caches are monitored against Copy-On-Write (COW) overlay boundaries to prevent out-of-memory lockups during intensive scans.

### 5. 🔒 Hardware-Enforced Zero Telemetry
* No diagnostic collection.
* No telemetry beacons.
* No unsolicited cloud connections.
* Built-in RAM scrubbers wipe volatile memory pages upon process termination to thwart cold-boot attacks.

---

## 📊 Feature Comparison

| Capability | SecureCurtain OS | Standard Linux | Windows 11 Enterprise | Qubes OS |
| :--- | :---: | :---: | :---: | :---: |
| **Kernel Architecture** | **Fault-Isolated Microkernel** | Monolithic | Monolithic Hybrid | Xen Hypervisor |
| **Driver Crash Recovery** | **< 15ms Auto-Restart** | Kernel Panic | Blue Screen (BSOD) | VM Restart |
| **Dual-Persona (Linux + Win32)**| **Native Co-existence** | Wine / WSL Required | WSL2 / VM Required | Multi-VM Segregation |
| **Package Management** | **Origin-Locked Octopi GUI** | Distro Specific | Winget / Store | Template Based |
| **Idle Memory Footprint** | **< 256 MB** | ~800 MB – 1.5 GB | ~3.5 GB – 4.5 GB | ~4.0 GB – 8.0 GB |
| **Live USB Signature Updates** | **In-Place Persistent Update** | Manual Scripting | Not Supported | High Complexity |
| **Native Registry Hive Audit** | **Built-in Offline Scanner** | Third-Party Tools | Active Hive Only | Third-Party Tools |
| **Telemetry & Spyware** | **100% Zero Telemetry** | Variable (Distro) | Extensive Telemetry | Zero Telemetry |

---

## 🛠️ Core OS Modules & Included Tooling

### 🖥️ Desktop & Incident Response Cockpit
- **Octopi Universal Package GUI:** Manage mirrors, synchronize databases, inspect package file manifests, and safely install from Arch, AUR, Debian, and Kali repositories.
- **Microkernel Diagnostics Console:** Real-time visual monitoring of Ring 3 driver processes, IPC queues, watchdog health, and memory page allocation.
- **VirtIO Network Adapter:** High-throughput virtualized network interface providing sub-microsecond packet latency and zero-copy ring buffers.
- **Disks & Storage Inspector:** GPT/MBR partition editor, raw block level hexdump analyzer, and cryptographic disk sanitizer (`shred` / `blkdiscard`).

### 🛡️ Security & Malware Analysis Suite
- **Antivirus Engine with Dynamic DB:** ClamAV-compatible and YARA-rule driven signature engine with offline air-gapped update bundles.
- **Registry Persistence Hunter:** Parses `HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon` (`Shell`, `Userinit`), `Run/RunOnce` keys, and unquoted Windows Service paths on dormant disk images.
- **Live Memory Forensics:** Built-in extraction and string analysis for physical RAM and swap dumps.

---

## 💻 Hardware Requirements

> ⚠️ **CRITICAL INSTALLER REQUIREMENT:** SecureCurtain OS enforces hardware verification during the pre-boot installation environment. Systems with less than **16 GB of physical RAM** or processors older than **AMD 1st Gen Ryzen / equivalent Intel** will **refuse to install**.

| Component | Minimum Specification (Strictly Enforced) | Recommended Specification |
| :--- | :--- | :--- |
| **Processor (CPU)** | **AMD 1st Gen Ryzen** (Zen 14nm, e.g. Ryzen 3 1200 / Ryzen 5 1600+) OR **Equivalent Intel Core** (7th/8th Gen Core i5/i7+ with AVX2, VT-x, and AES-NI)<br>*⚠️ System installer will abort if CPU is below this baseline.* | AMD Ryzen 7/9 (Zen 3/4/5) or Intel Core i7/i9 (11th Gen+) (8+ cores, 3.8 GHz+, hardware virtualization) |
| **Memory (RAM)** | **16 GB RAM (Minimum Hard Gate)**<br>*⚠️ Required for microkernel driver Ring 3 isolation, concurrent Linux+Win32 containers, and live forensic caches. Installer halts if < 16 GB.* | **32 GB – 64 GB+ RAM** (high-speed DDR4/DDR5 for real-time memory forensics and multi-persona execution) |
| **Storage** | 64 GB available disk space (or 32 GB+ fast USB 3.2 for Live Rescue) | 256 GB+ NVMe PCIe Gen 4 SSD |
| **Graphics** | UEFI framebuffer / KMS compliant GPU (Intel HD 630+, AMD Radeon RX/Vega, NVIDIA) | Dedicated modern GPU with KMS acceleration |
| **Network** | Any standard Gigabit Ethernet or Wi-Fi 5/6 (VirtIO supported) | Dual Gigabit Ethernet / Intel Wi-Fi 6E |

---

## 🚀 Quick Start Guide

### Option 1: Running in QEMU / KVM (Immediate Testing)
Boot SecureCurtain OS directly in a high-performance virtual machine with VirtIO hardware acceleration (requires 16 GB allocated RAM):

```bash
# Clone the official repository
git clone https://github.com/SecureCurtain/securecurtainos.git
cd securecurtainos

# Launch using QEMU with 16GB RAM, VirtIO network, and microkernel watchdog enabled
qemu-system-x86_64 \
  -m 16384 \
  -smp 4 \
  -cpu host \
  -enable-kvm \
  -cdrom ./build/securecurtain-rescue.iso \
  -netdev user,id=net0,hostfwd=tcp::3000-:3000 \
  -device virtio-net-pci,netdev=net0 \
  -vga std \
  -boot d
```

### Option 2: Creating a Live Bootable Rescue USB
Flash SecureCurtain OS to any USB flash drive (8 GB or larger) with persistent signature storage:

```bash
# Linux / macOS (verify your target device path with lsblk first!)
sudo dd if=securecurtain-rescue.iso of=/dev/sdX bs=4M status=progress conv=fsync

# Windows
# Use Rufus or Etcher in 'DD Image' mode.
```

### Option 3: Updating Anti-Malware Signatures on the Rescue USB
Keep your USB up-to-date without re-flashing:

```bash
# Run inside SecureCurtain Terminal or GUI
sc-malware-update --check
sc-malware-update --fetch-latest
```

---

## 📖 Package Management at a Glance

Using our **Origin-Locked** command structure:

```bash
# Synchronize all upstream repository databases
octopi-sync

# Install an Arch Linux forensic utility safely
pacman -S ghidra-bin

# Install an AUR package through yay
yay -S volatility3

# Install a Debian forensic tool safely
apt install sleuthkit

# Inspect active Origin-Lock policies
origin-guard --status
```

---

## 🎯 Use Cases

* **Incident Response & Triage:** Boot infected Windows or Linux laptops from a Live USB to scan registry persistence, dump memory, and isolate rootkits without booting the compromised OS.
* **Sovereign Workstations:** An everyday computing platform free from commercial OS telemetries, telemetry keyloggers, and forced upgrade cycles.
* **Air-Gapped Infrastructure:** Critical control environments (SCADA, defense, laboratory hardware) requiring a self-healing OS that never halts on peripheral driver faults.
* **Malware Reverse Engineering:** Safe, contained workspace with built-in disassembly, hex inspection, and cross-platform binary execution.

---

## 🤝 Contributing

We welcome contributions from kernel developers, security researchers, and UI designers!

1. Fork the Project (`https://github.com/SecureCurtain/securecurtainos/fork`)
2. Create your Feature Branch (`git checkout -b feature/MicrokernelDriverEnhancement`)
3. Commit your Changes (`git commit -m 'Add VirtIO GPU driver isolation'`)
4. Push to the Branch (`git push origin feature/MicrokernelDriverEnhancement`)
5. Open a Pull Request

---

### About the Author

SecureCurtainOS is an independent project created by a cybersecurity student currently completing a **B.A. in Cybersecurity and Information Assurance**. 

After spending several years navigating severe chronic health challenges and rebuilding a path forward, this project became both a technical challenge and a personal mission. SecureCurtainOS represents a dedication to resilient systems engineering, digital privacy, and proving that impactful innovation can be built from the ground up by solo developers overcoming immense hurdles.

---

### ⚖️ Licensing & Enterprise Deployment

SecureCurtainOS is published under a dual-licensing model to support both the open-source community and professional environments: 

* **Community Edition**: Freely available for developers, hobbyists, and researchers under the **GNU GPL v3** license.
* **Commercial Edition**: Tailored for corporate offices, government agencies, and digital forensics laboratories requiring closed-source deployment, proprietary integration, or dedicated technical support.

If your organization requires a commercial exemption from the GPL v3 constraints, please review our [LICENSE](https://github.com/SecureCurtain/securecurtainos.github.io/blob/main/LICENSE) file

