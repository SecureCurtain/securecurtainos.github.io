// jb7572_2026-08-24: Category 6 - Package Delivery & Features Management Service
// Updated 2026-09-04: Octopi-Style Architecture, Multi-Repo Configurator (Add/Remove GUI), & Origin-Locked Conflict Shield
import { 
  SystemPackage, 
  OptionalOsFeature, 
  PackageCategory, 
  InstallerBackend, 
  ConfiguredRepository 
} from '../types';

export const INITIAL_CONFIGURED_REPOSITORIES: ConfiguredRepository[] = [
  {
    id: 'repo_arch_core',
    name: 'Arch Linux [core]',
    backend: 'pacman',
    url: 'https://geo.mirror.pkgbuild.com/core/os/x86_64',
    branchOrSuite: 'rolling',
    components: ['core'],
    isEnabled: true,
    isCustom: false,
    latencyMs: 14,
    status: 'SYNCED',
    lastUpdated: '2026-09-04 13:00 UTC',
    description: 'Vital system packages, Linux kernel, C libraries, and basic bootloader utilities.',
    keyringPath: '/etc/pacman.d/gnupg/pubring.gpg'
  },
  {
    id: 'repo_arch_extra',
    name: 'Arch Linux [extra]',
    backend: 'pacman',
    url: 'https://geo.mirror.pkgbuild.com/extra/os/x86_64',
    branchOrSuite: 'rolling',
    components: ['extra'],
    isEnabled: true,
    isCustom: false,
    latencyMs: 18,
    status: 'SYNCED',
    lastUpdated: '2026-09-04 13:10 UTC',
    description: 'Desktop environments, developer frameworks, system utilities, and graphical tools.',
    keyringPath: '/etc/pacman.d/gnupg/pubring.gpg'
  },
  {
    id: 'repo_arch_multilib',
    name: 'Arch Linux [multilib]',
    backend: 'pacman',
    url: 'https://geo.mirror.pkgbuild.com/multilib/os/x86_64',
    branchOrSuite: 'rolling',
    components: ['multilib'],
    isEnabled: true,
    isCustom: false,
    latencyMs: 22,
    status: 'SYNCED',
    lastUpdated: '2026-09-04 12:45 UTC',
    description: '32-bit software and binary compatibility libraries on 64-bit architecture.',
    keyringPath: '/etc/pacman.d/gnupg/pubring.gpg'
  },
  {
    id: 'repo_aur_yay',
    name: 'Arch User Repository [aur] (Yay)',
    backend: 'yay',
    url: 'https://aur.archlinux.org/rpc/v5',
    branchOrSuite: 'main',
    components: ['aur-pkgbuild', 'git-sources'],
    isEnabled: true,
    isCustom: false,
    latencyMs: 35,
    status: 'SYNCED',
    lastUpdated: '2026-09-04 13:20 UTC',
    description: 'Community-driven software repository compiled directly via PKGBUILD recipes.',
    keyringPath: '/etc/pacman.d/gnupg/aur-trusted.gpg'
  },
  {
    id: 'repo_chaotic_aur',
    name: 'Chaotic-AUR Pre-Built Binaries',
    backend: 'yay',
    url: 'https://geo-mirror.chaotic.cx/chaotic-aur/x86_64',
    branchOrSuite: 'main',
    components: ['chaotic-aur'],
    isEnabled: true,
    isCustom: true,
    latencyMs: 42,
    status: 'SYNCED',
    lastUpdated: '2026-09-04 11:30 UTC',
    description: 'Automated continuous-integration pre-built binary packages from the AUR.',
    keyringPath: '/etc/pacman.d/gnupg/chaotic.gpg'
  },
  {
    id: 'repo_debian_trixie',
    name: 'Debian 13 (Trixie) Pool [apt]',
    backend: 'apt',
    url: 'https://deb.debian.org/debian',
    branchOrSuite: 'trixie',
    components: ['main', 'contrib', 'non-free-firmware'],
    isEnabled: true,
    isCustom: false,
    latencyMs: 26,
    status: 'SYNCED',
    lastUpdated: '2026-09-04 10:15 UTC',
    description: 'Debian testing archive providing stable base libraries and compatibility packages.',
    keyringPath: '/usr/share/keyrings/debian-archive-keyring.gpg'
  },
  {
    id: 'repo_kali_rolling',
    name: 'Kali Linux Rolling [apt]',
    backend: 'apt',
    url: 'https://http.kali.org/kali',
    branchOrSuite: 'kali-rolling',
    components: ['main', 'non-free', 'contrib'],
    isEnabled: true,
    isCustom: false,
    latencyMs: 29,
    status: 'SYNCED',
    lastUpdated: '2026-09-04 12:00 UTC',
    description: 'OffSec digital forensics, reverse engineering, and threat penetration packages.',
    keyringPath: '/usr/share/keyrings/kali-archive-keyring.gpg'
  },
  {
    id: 'repo_winget_ms',
    name: 'Windows Package Manager [winget]',
    backend: 'winget',
    url: 'https://winget.azureedge.net/cache',
    branchOrSuite: 'windows-desktop',
    components: ['community-manifests'],
    isEnabled: true,
    isCustom: false,
    latencyMs: 19,
    status: 'SYNCED',
    lastUpdated: '2026-09-04 13:15 UTC',
    description: 'Microsoft Official Community Repository of Windows application manifests.',
    keyringPath: 'Microsoft Code Signing Certificate Store'
  }
];

const initialPackages: SystemPackage[] = [
  // ==========================================
  // PACMAN PACKAGES (Arch Native)
  // ==========================================
  {
    id: 'pkg_pacman_core',
    name: 'pacman',
    category: 'SYSTEM_CORE',
    version: '6.1.0-4',
    installedVersion: '6.1.0-4',
    status: 'INSTALLED',
    sizeBytes: 26004684, // 24.8 MB
    maintainer: 'Arch Linux Core Team <pacman-dev@lists.archlinux.org>',
    description: 'Arch Linux package manager with libalpm C library backend and cryptographic GPG trust validation.',
    sha256: '9a8d42ef1907cb5b5c5e88e2c219ba5ec926715fba39206d091219b16ac8fe19',
    dependencies: ['glibc', 'libarchive', 'curl', 'gpgme'],
    repoSource: 'repo_arch_core',
    originInstaller: 'pacman',
    license: 'GPL-2.0-or-later',
    architecture: 'x86_64',
    upstreamUrl: 'https://archlinux.org/pacman/',
    packager: 'Allan McRae <allan@archlinux.org>',
    installedFiles: [
      '/usr/bin/pacman',
      '/usr/bin/pacman-conf',
      '/usr/bin/pacman-key',
      '/etc/pacman.conf',
      '/etc/pacman.d/mirrorlist',
      '/var/lib/pacman/local/',
      '/usr/share/man/man8/pacman.8.gz'
    ]
  },
  {
    id: 'pkg_dislocker',
    name: 'dislocker',
    category: 'SECURITY',
    version: '0.7.3-6',
    installedVersion: '0.7.3-6',
    status: 'INSTALLED',
    sizeBytes: 3565158, // 3.4 MB
    maintainer: 'Romain Coltel <romain.coltel@gmail.com>',
    description: 'FUSE driver to read and decrypt Microsoft BitLocker encrypted volumes using recovery passwords or FVEK keys.',
    sha256: '61a0984f183920cda49e78261893c52a0917240faeb9287319f0714bda890123',
    dependencies: ['mbedtls', 'fuse3'],
    repoSource: 'repo_arch_extra',
    originInstaller: 'pacman',
    license: 'GPL-2.0',
    architecture: 'x86_64',
    upstreamUrl: 'https://github.com/Aorimn/dislocker',
    packager: 'Arch Linux Community <packages@archlinux.org>',
    installedFiles: [
      '/usr/bin/dislocker',
      '/usr/bin/dislocker-fuse',
      '/usr/bin/dislocker-file',
      '/usr/lib/libdislocker.so.0.7',
      '/usr/share/man/man1/dislocker.1.gz'
    ]
  },
  {
    id: 'pkg_sleuthkit',
    name: 'sleuthkit',
    category: 'SECURITY',
    version: '4.12.1-2',
    installedVersion: '4.12.1-2',
    status: 'INSTALLED',
    sizeBytes: 22020096, // 21 MB
    maintainer: 'Brian Carrier <carrier@sleuthkit.org>',
    description: 'Library and collection of command line digital forensics tools for investigating raw/E01 disk images (fls, istat, icat, mactime).',
    sha256: '772c918390abf620819746e50912cb8491823740ab9281740928172948719012',
    dependencies: ['libewf', 'afflib', 'zlib'],
    repoSource: 'repo_arch_extra',
    originInstaller: 'pacman',
    license: 'CPL / GPL-2.0',
    architecture: 'x86_64',
    upstreamUrl: 'https://www.sleuthkit.org/sleuthkit/',
    packager: 'Arch Forensics Team <packages@archlinux.org>',
    installedFiles: [
      '/usr/bin/fls',
      '/usr/bin/istat',
      '/usr/bin/icat',
      '/usr/bin/mmls',
      '/usr/bin/fsstat',
      '/usr/lib/libtsk.so.19',
      '/usr/share/man/man1/fls.1.gz'
    ]
  },
  {
    id: 'pkg_gcc_toolchain',
    name: 'gcc-x86_64-elf',
    category: 'DEVELOPMENT',
    version: '13.2.0',
    installedVersion: '13.2.0',
    status: 'INSTALLED',
    sizeBytes: 84934656, // ~81 MB
    maintainer: 'SecureCurtain Core Team <toolchains@securecurtain.dev>',
    description: 'Bare-metal cross-compilation toolchain for x86_64 ELF microkernel targets.',
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    dependencies: ['binutils-elf', 'glibc-headers'],
    repoSource: 'repo_arch_core',
    originInstaller: 'pacman',
    license: 'GPL-3.0',
    architecture: 'x86_64',
    upstreamUrl: 'https://gcc.gnu.org/',
    packager: 'Toolchain Maintainers',
    installedFiles: [
      '/usr/bin/x86_64-elf-gcc',
      '/usr/bin/x86_64-elf-g++',
      '/usr/lib/gcc/x86_64-elf/13.2.0/cc1',
      '/usr/include/gcc-elf/'
    ]
  },
  {
    id: 'pkg_curl',
    name: 'curl',
    category: 'NETWORKING',
    version: '8.6.0',
    installedVersion: '8.6.0',
    status: 'INSTALLED',
    sizeBytes: 4194304, // 4 MB
    maintainer: 'Daniel Stenberg <daniel@haxx.se>',
    description: 'Command line tool and library for transferring data with URLs over HTTP/3, TLS 1.3.',
    sha256: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    dependencies: ['libssl3', 'zlib'],
    repoSource: 'repo_arch_core',
    originInstaller: 'pacman',
    license: 'curl / MIT',
    architecture: 'x86_64',
    upstreamUrl: 'https://curl.se/',
    packager: 'Arch Core Team',
    installedFiles: [
      '/usr/bin/curl',
      '/usr/lib/libcurl.so.4.8.0',
      '/usr/lib/libcurl.so.4',
      '/usr/share/man/man1/curl.1.gz'
    ]
  },
  {
    id: 'pkg_htop',
    name: 'htop',
    category: 'UTILITIES',
    version: '3.3.0',
    installedVersion: '3.3.0',
    status: 'INSTALLED',
    sizeBytes: 1887436, // 1.8 MB
    maintainer: 'Htop Authors <htop@htop.dev>',
    description: 'Interactive text-mode process viewer and real-time thread telemetry monitor.',
    sha256: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    dependencies: ['ncurses'],
    repoSource: 'repo_arch_extra',
    originInstaller: 'pacman',
    license: 'GPL-2.0',
    architecture: 'x86_64',
    upstreamUrl: 'https://htop.dev/',
    packager: 'Arch Extra Team',
    installedFiles: ['/usr/bin/htop', '/usr/share/man/man1/htop.1.gz']
  },
  {
    id: 'pkg_fastfetch',
    name: 'fastfetch',
    category: 'UTILITIES',
    version: '2.8.4',
    installedVersion: null,
    status: 'AVAILABLE',
    sizeBytes: 2097152, // 2 MB
    maintainer: 'Fastfetch Contributors <fastfetch@github.com>',
    description: 'Ultra-fast, customizable system information and hardware telemetry display tool written in C.',
    sha256: '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d',
    dependencies: ['libpci'],
    repoSource: 'repo_arch_extra',
    originInstaller: 'pacman',
    license: 'MIT',
    architecture: 'x86_64',
    upstreamUrl: 'https://github.com/fastfetch-cli/fastfetch',
    packager: 'Arch Community Team',
    installedFiles: ['/usr/bin/fastfetch', '/usr/share/fastfetch/presets/']
  },

  // ==========================================
  // YAY (AUR) PACKAGES
  // ==========================================
  {
    id: 'pkg_yay_helper',
    name: 'yay',
    category: 'SYSTEM_CORE',
    version: '12.4.2-1',
    installedVersion: '12.4.2-1',
    status: 'INSTALLED',
    sizeBytes: 18979225, // 18.1 MB
    maintainer: 'Morganamilo <morganamilo@archlinux.org>',
    description: 'Yet Another Yogurt - High-speed Go-based AUR helper and pacman frontend with automated PKGBUILD compilation.',
    sha256: '4c759082e66699a221f7c32bf0954bfa3514a6da7cbf2a27ffae91206104bc12',
    dependencies: ['pacman', 'git', 'go', 'base-devel'],
    repoSource: 'repo_aur_yay',
    originInstaller: 'yay',
    license: 'GPL-3.0',
    architecture: 'x86_64',
    upstreamUrl: 'https://github.com/Jguer/yay',
    packager: 'AUR Trusted Users',
    installedFiles: [
      '/usr/bin/yay',
      '/etc/yay/config.json',
      '/usr/share/man/man8/yay.8.gz'
    ]
  },
  {
    id: 'pkg_volatility3',
    name: 'volatility3',
    category: 'SECURITY',
    version: '2.7.0-1',
    installedVersion: '2.7.0-1',
    status: 'INSTALLED',
    sizeBytes: 71827456, // 68.5 MB
    maintainer: 'Volatility Foundation <volatility@volatilityfoundation.org>',
    description: 'Advanced memory forensics framework supporting Windows, Linux, and macOS physical address symbols.',
    sha256: '8b7a6309852f819076f6cb1936e788091abf07823e65471aa875f1029cba2901',
    dependencies: ['python', 'python-capstone', 'python-pefile', 'python-yara'],
    repoSource: 'repo_aur_yay',
    originInstaller: 'yay',
    license: 'VSL (Volatility Software License)',
    architecture: 'any',
    upstreamUrl: 'https://github.com/volatilityfoundation/volatility3',
    packager: 'DFIR AUR Maintainers',
    installedFiles: [
      '/usr/bin/vol',
      '/usr/bin/volshell',
      '/usr/lib/python3.12/site-packages/volatility3/',
      '/usr/share/doc/volatility3/'
    ]
  },
  {
    id: 'pkg_pcileech',
    name: 'pcileech-fpga',
    category: 'SECURITY',
    version: '4.18-2',
    installedVersion: '4.18-2',
    status: 'INSTALLED',
    sizeBytes: 35651584, // 34 MB
    maintainer: 'Ulf Frisk <pcileech@frizk.net>',
    description: 'Direct PCIe DMA hardware memory acquisition tool for PCILeech Screamer / Squirrel and Thunderbolt adapters.',
    sha256: '2f129c78b66504a9197c39050d268593ab8174efc892b192384a719d38bb1092',
    dependencies: ['libftdi', 'libusb'],
    repoSource: 'repo_aur_yay',
    originInstaller: 'yay',
    license: 'GPL-3.0',
    architecture: 'x86_64',
    upstreamUrl: 'https://github.com/ufrisk/pcileech',
    packager: 'Hardware Hacking Community',
    installedFiles: [
      '/usr/bin/pcileech',
      '/usr/lib/pcileech/pcileech.so',
      '/etc/udev/rules.d/99-pcileech.rules'
    ]
  },
  {
    id: 'pkg_chipsec',
    name: 'chipsec',
    category: 'SECURITY',
    version: '1.13.4-1',
    installedVersion: null,
    status: 'AVAILABLE',
    sizeBytes: 56836096, // 54.2 MB
    maintainer: 'CHIPSEC Team <chipsec@intel.com>',
    description: 'Platform security assessment framework for auditing UEFI/BIOS security, SMM rootkits, and hardware registers.',
    sha256: '3398e72c830917bcf05492167c13408a287950a7c93425b09819fbc416738910',
    dependencies: ['python', 'pciutils', 'nasm'],
    repoSource: 'repo_aur_yay',
    originInstaller: 'yay',
    license: 'GPL-2.0',
    architecture: 'x86_64',
    upstreamUrl: 'https://github.com/chipsec/chipsec',
    packager: 'Firmware Security Group',
    installedFiles: [
      '/usr/bin/chipsec_main',
      '/usr/bin/chipsec_util',
      '/usr/lib/python3.12/site-packages/chipsec/'
    ]
  },

  // ==========================================
  // APT PACKAGES (Debian & Kali Linux)
  // ==========================================
  {
    id: 'pkg_plaso',
    name: 'plaso',
    category: 'SECURITY',
    version: '20240308-1',
    installedVersion: '20240308-1',
    status: 'INSTALLED',
    sizeBytes: 148897792, // 142 MB
    maintainer: 'Log2Timeline Team <log2timeline-dev@googlegroups.com>',
    description: 'Super-timeline generation engine parsing file systems, event logs, registry hives, and browser histories (log2timeline / psort).',
    sha256: '1a98e72c830917bcf05492167c13408a287950a7c93425b09819fbc416738910',
    dependencies: ['python3-plaso', 'python3-dfvfs', 'python3-libbfio'],
    repoSource: 'repo_kali_rolling',
    originInstaller: 'apt',
    license: 'Apache-2.0',
    architecture: 'amd64',
    upstreamUrl: 'https://github.com/log2timeline/plaso',
    packager: 'Kali Security Maintainers',
    installedFiles: [
      '/usr/bin/log2timeline.py',
      '/usr/bin/psort.py',
      '/usr/bin/pinfo.py',
      '/var/lib/dpkg/info/plaso.list'
    ]
  },
  {
    id: 'pkg_guymager',
    name: 'guymager',
    category: 'SECURITY',
    version: '0.8.13-2',
    installedVersion: '0.8.13-2',
    status: 'INSTALLED',
    sizeBytes: 17301504, // 16.5 MB
    maintainer: 'Guy Voncken <guy.voncken@skynet.be>',
    description: 'High-speed multi-threaded forensic imager for creating bit-stream Raw, E01 (Expert Witness), and AFF disk images.',
    sha256: '5561a0984f183920cda49e78261893c52a0917240faeb9287319f0714bda8901',
    dependencies: ['qtbase5-dev', 'libewf-dev', 'libudev-dev'],
    repoSource: 'repo_debian_trixie',
    originInstaller: 'apt',
    license: 'GPL-2.0',
    architecture: 'amd64',
    upstreamUrl: 'https://guymager.sourceforge.io/',
    packager: 'Debian Forensics Team',
    installedFiles: [
      '/usr/bin/guymager',
      '/etc/guymager/guymager.cfg',
      '/var/lib/dpkg/info/guymager.list'
    ]
  },
  {
    id: 'pkg_zeek',
    name: 'zeek',
    category: 'NETWORKING',
    version: '6.0.4-1',
    installedVersion: '6.0.4-1',
    status: 'INSTALLED',
    sizeBytes: 188743680, // 180 MB
    maintainer: 'The Zeek Project <info@zeek.org>',
    description: 'Passive air-gapped network security monitor and protocol analysis engine for zero-emission traffic triage.',
    sha256: '8812c79a8b7a6309852f819076f6cb1936e788091abf07823e65471aa875f102',
    dependencies: ['libpcap', 'libssl', 'python3'],
    repoSource: 'repo_kali_rolling',
    originInstaller: 'apt',
    license: 'BSD-3-Clause',
    architecture: 'amd64',
    upstreamUrl: 'https://zeek.org/',
    packager: 'Kali Offensive Team',
    installedFiles: [
      '/usr/bin/zeek',
      '/usr/bin/zeek-cut',
      '/usr/share/zeek/site/local.zeek',
      '/var/lib/dpkg/info/zeek.list'
    ]
  },
  {
    id: 'pkg_wireshark',
    name: 'wireshark-cli',
    category: 'NETWORKING',
    version: '4.2.2',
    installedVersion: null,
    status: 'AVAILABLE',
    sizeBytes: 29360128, // 28 MB
    maintainer: 'Wireshark Devs <wireshark@wireshark.org>',
    description: 'Network packet analyzer and deep protocol dissector (tshark binary).',
    sha256: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    dependencies: ['libpcap', 'glib2'],
    repoSource: 'repo_debian_trixie',
    originInstaller: 'apt',
    license: 'GPL-2.0',
    architecture: 'amd64',
    upstreamUrl: 'https://www.wireshark.org/',
    packager: 'Debian Packaging Team',
    installedFiles: ['/usr/bin/tshark', '/usr/bin/dumpcap', '/usr/share/man/man1/tshark.1.gz']
  },

  // ==========================================
  // WINGET PACKAGES (Windows Subsystem Pool)
  // ==========================================
  {
    id: 'pkg_sysinternals',
    name: 'sysinternals-suite',
    category: 'UTILITIES',
    version: '2024.08',
    installedVersion: '2024.08',
    status: 'INSTALLED',
    sizeBytes: 47185920, // 45 MB
    maintainer: 'Mark Russinovich <mark.russinovich@microsoft.com>',
    description: 'Microsoft Sysinternals troubleshooting suite including Process Explorer, ProcMon, Autoruns, and TCPView.',
    sha256: '92ba42ef1907cb5b5c5e88e2c219ba5ec926715fba39206d091219b16ac8fe11',
    dependencies: [],
    repoSource: 'repo_winget_ms',
    originInstaller: 'winget',
    license: 'Microsoft Software License',
    architecture: 'x64',
    upstreamUrl: 'https://learn.microsoft.com/en-us/sysinternals/',
    packager: 'Microsoft Winget Team',
    installedFiles: [
      'C:\\Program Files\\Sysinternals\\procexp.exe',
      'C:\\Program Files\\Sysinternals\\procmon.exe',
      'C:\\Program Files\\Sysinternals\\autoruns.exe'
    ]
  },
  {
    id: 'pkg_pwsh',
    name: 'powershell-core',
    category: 'DEVELOPMENT',
    version: '7.4.1',
    installedVersion: '7.4.1',
    status: 'INSTALLED',
    sizeBytes: 104857600, // 100 MB
    maintainer: 'PowerShell Team <powershell@microsoft.com>',
    description: 'Cross-platform automation engine and scripting language built on .NET runtime.',
    sha256: '88ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    dependencies: ['.NET 8 Runtime'],
    repoSource: 'repo_winget_ms',
    originInstaller: 'winget',
    license: 'MIT',
    architecture: 'x64',
    upstreamUrl: 'https://github.com/PowerShell/PowerShell',
    packager: 'Microsoft Corp',
    installedFiles: [
      'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
      'C:\\Program Files\\PowerShell\\7\\pwsh.dll'
    ]
  },
  {
    id: 'pkg_7zip',
    name: '7zip.7zip',
    category: 'UTILITIES',
    version: '24.07',
    installedVersion: null,
    status: 'AVAILABLE',
    sizeBytes: 2621440, // 2.5 MB
    maintainer: 'Igor Pavlov <support@7-zip.org>',
    description: 'High-ratio file archiver with AES-256 encryption and support for 7z, XZ, BZIP2, GZIP, TAR, ZIP and WIM.',
    sha256: '44dc674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c84699',
    dependencies: [],
    repoSource: 'repo_winget_ms',
    originInstaller: 'winget',
    license: 'GNU LGPL',
    architecture: 'x64',
    upstreamUrl: 'https://www.7-zip.org/',
    packager: 'Winget Community',
    installedFiles: [
      'C:\\Program Files\\7-Zip\\7z.exe',
      'C:\\Program Files\\7-Zip\\7zFM.exe',
      'C:\\Program Files\\7-Zip\\7z.dll'
    ]
  }
];

const initialFeatures: OptionalOsFeature[] = [
  {
    id: 'feat_kvm_virt',
    name: 'Hardware-Assisted KVM Virtualization',
    category: 'VIRTUALIZATION',
    description: 'Exposes Intel VT-x / AMD-V CPU virtualization extensions to user space hypervisors.',
    enabled: true,
    requiresReboot: true,
    payloadSizeBytes: 33554432 // 32 MB
  },
  {
    id: 'feat_linux_compat',
    name: 'Linux ABI Syscall Compatibility Layer',
    category: 'SUBSYSTEM',
    description: 'Translates standard Linux x86_64 glibc system calls into SecureCurtain IPC microkernel messages.',
    enabled: true,
    requiresReboot: false,
    payloadSizeBytes: 67108864 // 64 MB
  },
  {
    id: 'feat_gdb_stub',
    name: 'Ring 0 Kernel GDB Remote Debugger Stub',
    category: 'DEVELOPER',
    description: 'Enables interactive serial and TCP GDB breakpoints inside kernel interrupt handlers.',
    enabled: false,
    requiresReboot: true,
    payloadSizeBytes: 8388608 // 8 MB
  },
  {
    id: 'feat_ebpf_jit',
    name: 'eBPF Kernel JIT Subsystem & Tracing',
    category: 'DIAGNOSTICS',
    description: 'In-kernel bytecode verifier and JIT compiler for zero-overhead performance tracing.',
    enabled: true,
    requiresReboot: false,
    payloadSizeBytes: 16777216 // 16 MB
  },
  {
    id: 'feat_wayland_direct',
    name: 'Direct DRM/KMS Hardware Plane Rendering',
    category: 'SUBSYSTEM',
    description: 'Zero-copy frame rendering directly to GPU scanout planes without X11 translation.',
    enabled: true,
    requiresReboot: false,
    payloadSizeBytes: 25165824 // 24 MB
  }
];

class PackageManagementService {
  private packages: SystemPackage[] = JSON.parse(JSON.stringify(initialPackages));
  private features: OptionalOsFeature[] = JSON.parse(JSON.stringify(initialFeatures));
  private repositories: ConfiguredRepository[] = JSON.parse(JSON.stringify(INITIAL_CONFIGURED_REPOSITORIES));

  // =========================================================================
  // 1. REPOSITORIES MANAGEMENT (Octopi-Style Add / Remove / Toggle / Sync)
  // =========================================================================
  public getRepositories(): ConfiguredRepository[] {
    return [...this.repositories];
  }

  public addRepository(newRepoData: {
    name: string;
    backend: InstallerBackend;
    url: string;
    branchOrSuite: string;
    components: string[];
    description: string;
  }): { success: boolean; message: string; repo?: ConfiguredRepository } {
    if (!newRepoData.name || !newRepoData.url) {
      return { success: false, message: 'Repository name and Mirror URL are required.' };
    }

    const id = `repo_custom_${Date.now()}`;
    const newRepo: ConfiguredRepository = {
      id,
      name: newRepoData.name,
      backend: newRepoData.backend,
      url: newRepoData.url,
      branchOrSuite: newRepoData.branchOrSuite || 'main',
      components: newRepoData.components.length > 0 ? newRepoData.components : ['main'],
      isEnabled: true,
      isCustom: true,
      latencyMs: Math.floor(Math.random() * 25) + 15,
      status: 'SYNCED',
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      description: newRepoData.description || 'Custom user-configured repository pool.'
    };

    this.repositories.push(newRepo);
    return {
      success: true,
      message: `Repository "${newRepo.name}" (${newRepo.backend}) added successfully to system config!`,
      repo: newRepo
    };
  }

  public removeRepository(repoId: string): { success: boolean; message: string } {
    const index = this.repositories.findIndex(r => r.id === repoId);
    if (index === -1) {
      return { success: false, message: 'Repository not found.' };
    }

    const repo = this.repositories[index];
    if (!repo.isCustom) {
      return { success: false, message: `Core repository "${repo.name}" cannot be permanently deleted. You can disable it instead.` };
    }

    this.repositories.splice(index, 1);
    return {
      success: true,
      message: `Repository "${repo.name}" removed from configuration.`
    };
  }

  public toggleRepository(repoId: string): { success: boolean; message: string; repo?: ConfiguredRepository } {
    const repo = this.repositories.find(r => r.id === repoId);
    if (!repo) {
      return { success: false, message: 'Repository not found.' };
    }

    repo.isEnabled = !repo.isEnabled;
    const statusText = repo.isEnabled ? 'Enabled' : 'Disabled';
    return {
      success: true,
      message: `Repository "${repo.name}" is now ${statusText}.`,
      repo
    };
  }

  public syncRepositories(): { success: boolean; message: string; latencyMap: Record<string, number> } {
    const latencyMap: Record<string, number> = {};
    this.repositories.forEach(r => {
      if (r.isEnabled) {
        r.latencyMs = Math.floor(Math.random() * 20) + 12;
        r.status = 'SYNCED';
        r.lastUpdated = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
        latencyMap[r.id] = r.latencyMs;
      } else {
        r.status = 'OFFLINE';
      }
    });

    return {
      success: true,
      message: `Synchronized ${this.repositories.filter(r => r.isEnabled).length} active repository indexes across pacman, yay, apt, and winget.`,
      latencyMap
    };
  }

  // =========================================================================
  // 2. SAFETY ENGINE: ORIGIN-LOCKED UPDATE ENFORCEMENT
  // =========================================================================
  /**
   * Validates if a requested package operation conforms to the strict Origin-Lock rule:
   * An application can ONLY be updated or managed by its original installer!
   */
  public validateUpdateOrigin(
    pkgId: string, 
    requestedInstaller?: InstallerBackend
  ): { 
    safe: boolean; 
    blockedReason?: string; 
    expectedInstaller: InstallerBackend; 
    pkgName: string;
  } {
    const pkg = this.packages.find(p => p.id === pkgId || p.name === pkgId);
    const expectedInstaller: InstallerBackend = pkg?.originInstaller || 'pacman';
    const pkgName = pkg?.name || pkgId;

    if (!pkg) {
      return { safe: false, blockedReason: `Package "${pkgId}" not found.`, expectedInstaller: 'pacman', pkgName };
    }

    // If requestedInstaller is specified and doesn't match the original installer: BLOCK!
    if (requestedInstaller && requestedInstaller !== expectedInstaller) {
      return {
        safe: false,
        pkgName,
        expectedInstaller,
        blockedReason: `[CROSS-MANAGER CONFLICT BLOCKED] Application "${pkgName}" was originally installed using "${expectedInstaller}". Attempting to upgrade or mutate it via "${requestedInstaller}" is prohibited to prevent dynamic library symlink collisions, glibc ABI mismatch, and dual-database corruption.`
      };
    }

    return { safe: true, expectedInstaller, pkgName };
  }

  // =========================================================================
  // 3. PACKAGES MANAGEMENT (Octopi Transactions)
  // =========================================================================
  public getPackages(): SystemPackage[] {
    return [...this.packages];
  }

  public installPackage(
    pkgId: string, 
    requestedInstaller?: InstallerBackend
  ): { success: boolean; message: string; package?: SystemPackage } {
    const pkg = this.packages.find(p => p.id === pkgId || p.name === pkgId);
    if (!pkg) return { success: false, message: `Package "${pkgId}" not found in repositories.` };

    // Check origin lock if already installed
    if (pkg.installedVersion) {
      const check = this.validateUpdateOrigin(pkg.id, requestedInstaller);
      if (!check.safe) {
        return { success: false, message: check.blockedReason! };
      }
    }

    // Use original installer or assign requested one
    if (requestedInstaller) {
      pkg.originInstaller = requestedInstaller;
    }

    pkg.installedVersion = pkg.version;
    pkg.status = 'INSTALLED';

    const installerUsed = pkg.originInstaller || 'pacman';
    return {
      success: true,
      message: `[${installerUsed.toUpperCase()}] Package "${pkg.name}" v${pkg.version} installed successfully (origin-locked to ${installerUsed}).`,
      package: pkg
    };
  }

  public upgradePackage(
    pkgId: string, 
    requestedInstaller?: InstallerBackend
  ): { success: boolean; message: string; package?: SystemPackage } {
    const pkg = this.packages.find(p => p.id === pkgId || p.name === pkgId);
    if (!pkg) return { success: false, message: `Package "${pkgId}" not found.` };

    // SAFETY CHECK: Verify origin installer matches
    const check = this.validateUpdateOrigin(pkg.id, requestedInstaller);
    if (!check.safe) {
      return { success: false, message: check.blockedReason! };
    }

    if (pkg.status !== 'UPGRADABLE') {
      return { success: false, message: `Package "${pkg.name}" is already up to date (${pkg.version}).` };
    }

    const prevVersion = pkg.installedVersion;
    pkg.installedVersion = pkg.version;
    pkg.status = 'INSTALLED';

    const installerUsed = pkg.originInstaller || 'pacman';
    return {
      success: true,
      message: `[${installerUsed.toUpperCase()}] Safely upgraded "${pkg.name}" from v${prevVersion} to v${pkg.version} using its original installer.`,
      package: pkg
    };
  }

  public removePackage(
    pkgId: string, 
    requestedInstaller?: InstallerBackend
  ): { success: boolean; message: string; package?: SystemPackage } {
    const pkg = this.packages.find(p => p.id === pkgId || p.name === pkgId);
    if (!pkg) return { success: false, message: `Package "${pkgId}" not found.` };

    // Origin check
    const check = this.validateUpdateOrigin(pkg.id, requestedInstaller);
    if (!check.safe) {
      return { success: false, message: check.blockedReason! };
    }

    if (pkg.status === 'AVAILABLE') {
      return { success: false, message: `Package "${pkg.name}" is not currently installed.` };
    }

    // Safety guard on critical toolchains
    if (pkg.name === 'pacman' || (pkg.name === 'gcc-x86_64-elf' && this.packages.filter(p => p.status === 'INSTALLED').length < 3)) {
      return { success: false, message: 'Cannot remove core operating system manager.' };
    }

    pkg.installedVersion = null;
    pkg.status = 'AVAILABLE';
    const installerUsed = pkg.originInstaller || 'pacman';
    return {
      success: true,
      message: `[${installerUsed.toUpperCase()}] Package "${pkg.name}" removed from local binary path.`,
      package: pkg
    };
  }

  public upgradeAll(): { success: boolean; count: number; message: string } {
    const upgradable = this.packages.filter(p => p.status === 'UPGRADABLE');
    upgradable.forEach(p => {
      p.installedVersion = p.version;
      p.status = 'INSTALLED';
    });
    return {
      success: true,
      count: upgradable.length,
      message: `Successfully synchronized and upgraded ${upgradable.length} packages through their respective original installers.`
    };
  }

  // =========================================================================
  // 4. OPTIONAL OS FEATURES MANAGEMENT
  // =========================================================================
  public getFeatures(): OptionalOsFeature[] {
    return [...this.features];
  }

  public toggleFeature(featureId: string): { success: boolean; message: string; feature?: OptionalOsFeature } {
    const feat = this.features.find(f => f.id === featureId);
    if (!feat) return { success: false, message: `Feature #${featureId} not found.` };

    feat.enabled = !feat.enabled;
    const actionText = feat.enabled ? 'Enabled' : 'Disabled';
    const rebootNotice = feat.requiresReboot ? ' (Note: Requires system reboot to activate kernel hooks)' : '';

    return {
      success: true,
      message: `OS Feature "${feat.name}" is now ${actionText}${rebootNotice}.`,
      feature: feat
    };
  }
}

export const packageManagementService = new PackageManagementService();
