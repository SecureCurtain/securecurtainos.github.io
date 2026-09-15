// jb7572_2026-09-01: Multi-Distro Universal Package Manager, GPG Keyring Importer & Repository Pool
// Supports: Arch Linux (pacman, yay / AUR), Debian (apt, dpkg), Kali Linux (kali-rolling, Offensive/DFIR tools)

export type SupportedDistroRepo = 'ARCH' | 'AUR_YAY' | 'DEBIAN' | 'KALI';

export interface GpgKeyringDescriptor {
  id: string;
  distro: SupportedDistroRepo;
  keyName: string;
  keyId: string;
  fingerprint: string;
  sourceUrl: string;
  armoredKeySnippet: string;
  isImported: boolean;
  importedAt?: string;
  keyringPath: string;
  signatureAlgorithm: string;
  expires: string;
}

export interface RepoMirrorConfig {
  id: string;
  distro: SupportedDistroRepo;
  name: string;
  mirrorUrl: string;
  branch: string;
  branchOrSuite?: string;
  components: string[];
  isEnabled: boolean;
  latencyMs: number;
  status: 'ONLINE' | 'SYNCED' | 'CHECKING' | 'OFFLINE';
  lastUpdatedUtc: string;
  isCustom?: boolean;
}

export interface UniversalPackageBinary {
  id: string;
  name: string;
  packageManager: 'pacman' | 'yay' | 'apt';
  distro: SupportedDistroRepo;
  version: string;
  category: 'Forensics' | 'Memory & DMA' | 'Encryption' | 'System & Kernel' | 'Offensive / Pentest' | 'Hardware Rescue';
  description: string;
  installed: boolean;
  binaryPath: string;
  downloadSize: string;
  installedSize: string;
  sha256: string;
  dependencies: string[];
  repoSource: string;
}

// Pre-seeded GPG Keyrings for Arch, Debian, Kali
export const DEFAULT_GPG_KEYRINGS: GpgKeyringDescriptor[] = [
  {
    id: 'arch-master-keyring',
    distro: 'ARCH',
    keyName: 'Arch Linux Master Signing Key (pacman-key)',
    keyId: '0x97DBFA96989F6B12',
    fingerprint: '6D42 BDDE 142D 6D85 0443 D814 2550 6D3D 97DB FA96',
    sourceUrl: 'https://archlinux.org/keys/archlinux.gpg',
    armoredKeySnippet: '-----BEGIN PGP PUBLIC KEY BLOCK-----\nmQINBF2mR+wBEADG41+2e9k...ArchLinux-Master-2026...-----END PGP PUBLIC KEY BLOCK-----',
    isImported: true,
    importedAt: '2026-09-01T08:14:22Z',
    keyringPath: '/etc/pacman.d/gnupg/pubring.gpg',
    signatureAlgorithm: 'RSA 4096 / SHA-512',
    expires: '2030-12-31'
  },
  {
    id: 'arch-aur-trusted',
    distro: 'AUR_YAY',
    keyName: 'Arch User Repository (AUR) Trusted User Keyring',
    keyId: '0x139B09DA5BF0D338',
    fingerprint: '3B94 A8B7 87B7 7B7E 9021  DFE4 139B 09DA 5BF0 D338',
    sourceUrl: 'https://aur.archlinux.org/keys/aur-maintainers.gpg',
    armoredKeySnippet: '-----BEGIN PGP PUBLIC KEY BLOCK-----\nmQGNBF4x96EBDADKq7...AUR-Yay-Maintainers-2026...-----END PGP PUBLIC KEY BLOCK-----',
    isImported: true,
    importedAt: '2026-09-01T08:15:10Z',
    keyringPath: '/etc/pacman.d/gnupg/aur-trusted.gpg',
    signatureAlgorithm: 'Ed25519 / SHA-512',
    expires: '2029-06-30'
  },
  {
    id: 'debian-archive-trixie',
    distro: 'DEBIAN',
    keyName: 'Debian Archive Automatic Signing Key (Trixie / Bookworm)',
    keyId: '0xF8D2C7700312C643',
    fingerprint: 'A428 5295 FDAE 7807 1F5C  D739 F8D2 C770 0312 C643',
    sourceUrl: 'https://ftp-master.debian.org/keys/archive-key-13.asc',
    armoredKeySnippet: '-----BEGIN PGP PUBLIC KEY BLOCK-----\nmQINBF08F6MBEACr7sN0k...Debian-Release-Key-13...-----END PGP PUBLIC KEY BLOCK-----',
    isImported: true,
    importedAt: '2026-09-01T08:16:04Z',
    keyringPath: '/usr/share/keyrings/debian-archive-keyring.gpg',
    signatureAlgorithm: 'RSA 4096 / SHA-512',
    expires: '2031-10-15'
  },
  {
    id: 'kali-archive-key',
    distro: 'KALI',
    keyName: 'Kali Linux Official Repository Key (OffSec Archive)',
    keyId: '0xED444FF07D8D0BF6',
    fingerprint: '44C6 513A 8E4F B3D3 0875  F758 ED44 4FF0 7D8D 0BF6',
    sourceUrl: 'https://archive.kali.org/archive-key.asc',
    armoredKeySnippet: '-----BEGIN PGP PUBLIC KEY BLOCK-----\nmQINBFqK9WwBEADKz1V3x...Kali-OffSec-Archive-2026...-----END PGP PUBLIC KEY BLOCK-----',
    isImported: true,
    importedAt: '2026-09-01T08:18:40Z',
    keyringPath: '/usr/share/keyrings/kali-archive-keyring.gpg',
    signatureAlgorithm: 'RSA 4096 / SHA-512',
    expires: '2032-01-01'
  }
];

// Pre-configured Repository Mirrors
export const DEFAULT_REPO_MIRRORS: RepoMirrorConfig[] = [
  {
    id: 'arch-core-extra',
    distro: 'ARCH',
    name: 'Arch Linux Core / Extra / Multilib (Tier 1 Mirror)',
    mirrorUrl: 'https://geo.mirror.pkgbuild.com/$repo/os/$arch',
    branch: 'rolling',
    components: ['core', 'extra', 'multilib'],
    isEnabled: true,
    latencyMs: 18,
    status: 'SYNCED',
    lastUpdatedUtc: '2026-09-01 10:45:00 UTC'
  },
  {
    id: 'aur-git-pool',
    distro: 'AUR_YAY',
    name: 'Arch User Repository (AUR RPC v5 + Yay Go-Binary Engine)',
    mirrorUrl: 'https://aur.archlinux.org/rpc/v5',
    branch: 'main',
    components: ['aur-pkgbuild', 'aur-git', 'chaotic-aur'],
    isEnabled: true,
    latencyMs: 32,
    status: 'SYNCED',
    lastUpdatedUtc: '2026-09-01 11:00:15 UTC'
  },
  {
    id: 'debian-trixie-main',
    distro: 'DEBIAN',
    name: 'Debian 13 (Trixie) Main / Contrib / Non-Free-Firmware',
    mirrorUrl: 'https://deb.debian.org/debian',
    branch: 'trixie',
    components: ['main', 'contrib', 'non-free', 'non-free-firmware'],
    isEnabled: true,
    latencyMs: 24,
    status: 'SYNCED',
    lastUpdatedUtc: '2026-09-01 09:30:00 UTC'
  },
  {
    id: 'kali-rolling-pool',
    distro: 'KALI',
    name: 'Kali Linux Official Rolling Pool (OffSec Security & DFIR Repos)',
    mirrorUrl: 'https://http.kali.org/kali',
    branch: 'kali-rolling',
    components: ['main', 'non-free', 'contrib'],
    isEnabled: true,
    latencyMs: 28,
    status: 'SYNCED',
    lastUpdatedUtc: '2026-09-01 10:15:00 UTC'
  }
];

// Universal Package Pool with Pacman, Yay, and Apt binaries
export const UNIVERSAL_PACKAGE_POOL: UniversalPackageBinary[] = [
  // --- Pacman & Yay Package Managers & Helpers ---
  {
    id: 'pacman-bin',
    name: 'pacman',
    packageManager: 'pacman',
    distro: 'ARCH',
    version: '6.1.0-4',
    category: 'System & Kernel',
    description: 'Arch Linux official package manager with libalpm C library backend and cryptographic GPG database validation.',
    installed: true,
    binaryPath: '/usr/bin/pacman',
    downloadSize: '5.2 MB',
    installedSize: '24.8 MB',
    sha256: '9a8d42ef1907cb5b5c5e88e2c219ba5ec926715fba39206d091219b16ac8fe19',
    dependencies: ['glibc', 'libarchive', 'curl', 'gpgme'],
    repoSource: 'arch-core-extra'
  },
  {
    id: 'yay-bin',
    name: 'yay',
    packageManager: 'yay',
    distro: 'AUR_YAY',
    version: '12.4.2-1',
    category: 'System & Kernel',
    description: 'Yet Another Yogurt - High-speed Go-based AUR helper and pacman frontend with automated PKGBUILD compilation.',
    installed: true,
    binaryPath: '/usr/bin/yay',
    downloadSize: '4.8 MB',
    installedSize: '18.1 MB',
    sha256: '4c759082e66699a221f7c32bf0954bfa3514a6da7cbf2a27ffae91206104bc12',
    dependencies: ['pacman', 'git', 'go', 'base-devel'],
    repoSource: 'aur-git-pool'
  },
  {
    id: 'pacman-contrib',
    name: 'pacman-contrib',
    packageManager: 'pacman',
    distro: 'ARCH',
    version: '1.10.0-1',
    category: 'System & Kernel',
    description: 'Essential scripts and tools for pacman systems (paccache, rankmirrors, checkupdates, pactree).',
    installed: true,
    binaryPath: '/usr/bin/paccache',
    downloadSize: '1.1 MB',
    installedSize: '4.3 MB',
    sha256: '3f5e08b1a8f9024c4e78a69e71239c091d3408a287950a7c93425b09819fbc41',
    dependencies: ['pacman', 'bash'],
    repoSource: 'arch-core-extra'
  },

  // --- Kali Forensics & Offensive Arsenal ---
  {
    id: 'volatility3-pkg',
    name: 'volatility3',
    packageManager: 'yay',
    distro: 'AUR_YAY',
    version: '2.7.0-1',
    category: 'Memory & DMA',
    description: 'Advanced memory forensics framework supporting Windows, Linux, and macOS physical address symbols.',
    installed: true,
    binaryPath: '/usr/bin/vol',
    downloadSize: '14.2 MB',
    installedSize: '68.5 MB',
    sha256: '8b7a6309852f819076f6cb1936e788091abf07823e65471aa875f1029cba2901',
    dependencies: ['python', 'python-capstone', 'python-pefile', 'python-yara'],
    repoSource: 'aur-git-pool'
  },
  {
    id: 'pcileech-pkg',
    name: 'pcileech-fpga',
    packageManager: 'yay',
    distro: 'AUR_YAY',
    version: '4.18-2',
    category: 'Memory & DMA',
    description: 'Direct PCIe DMA hardware memory acquisition tool for PCILeech Screamer / Squirrel and Thunderbolt adapters.',
    installed: true,
    binaryPath: '/usr/bin/pcileech',
    downloadSize: '8.4 MB',
    installedSize: '34.0 MB',
    sha256: '2f129c78b66504a9197c39050d268593ab8174efc892b192384a719d38bb1092',
    dependencies: ['libftdi', 'libusb'],
    repoSource: 'aur-git-pool'
  },
  {
    id: 'dislocker-pkg',
    name: 'dislocker',
    packageManager: 'pacman',
    distro: 'ARCH',
    version: '0.7.3-6',
    category: 'Encryption',
    description: 'FUSE driver to read and decrypt Microsoft BitLocker encrypted volumes using recovery passwords or FVEK keys.',
    installed: true,
    binaryPath: '/usr/bin/dislocker',
    downloadSize: '820 KB',
    installedSize: '3.4 MB',
    sha256: '61a0984f183920cda49e78261893c52a0917240faeb9287319f0714bda890123',
    dependencies: ['mbedtls', 'fuse3'],
    repoSource: 'arch-core-extra'
  },
  {
    id: 'plaso-log2timeline',
    name: 'plaso',
    packageManager: 'apt',
    distro: 'KALI',
    version: '20240308-1',
    category: 'Forensics',
    description: 'Super-timeline generation engine parsing file systems, event logs, registry hives, and browser histories (log2timeline / psort).',
    installed: true,
    binaryPath: '/usr/bin/log2timeline.py',
    downloadSize: '28.6 MB',
    installedSize: '142.0 MB',
    sha256: '1a98e72c830917bcf05492167c13408a287950a7c93425b09819fbc416738910',
    dependencies: ['python3-plaso', 'python3-dfvfs', 'python3-libbfio'],
    repoSource: 'kali-rolling-pool'
  },
  {
    id: 'sleuthkit-pkg',
    name: 'sleuthkit',
    packageManager: 'pacman',
    distro: 'ARCH',
    version: '4.12.1-2',
    category: 'Forensics',
    description: 'Library and collection of command line digital forensics tools for investigating disk images (fls, mactime, istat, icat).',
    installed: true,
    binaryPath: '/usr/bin/fls',
    downloadSize: '4.6 MB',
    installedSize: '21.0 MB',
    sha256: '772c918390abf620819746e50912cb8491823740ab9281740928172948719012',
    dependencies: ['libewf', 'afflib', 'zlib'],
    repoSource: 'arch-core-extra'
  },
  {
    id: 'guymager-pkg',
    name: 'guymager',
    packageManager: 'apt',
    distro: 'DEBIAN',
    version: '0.8.13-2',
    category: 'Forensics',
    description: 'High-speed multi-threaded forensic imager for creating Raw, E01 (Expert Witness), and AFF bit-stream disk images.',
    installed: true,
    binaryPath: '/usr/bin/guymager',
    downloadSize: '3.8 MB',
    installedSize: '16.5 MB',
    sha256: '5561a0984f183920cda49e78261893c52a0917240faeb9287319f0714bda8901',
    dependencies: ['qtbase5-dev', 'libewf-dev', 'libudev-dev'],
    repoSource: 'debian-trixie-main'
  },
  {
    id: 'zeek-ids-pkg',
    name: 'zeek',
    packageManager: 'apt',
    distro: 'KALI',
    version: '6.0.4-1',
    category: 'Offensive / Pentest',
    description: 'Passive air-gapped network security monitor and packet analyzer for zero-emission traffic triage.',
    installed: true,
    binaryPath: '/usr/bin/zeek',
    downloadSize: '38.0 MB',
    installedSize: '180.0 MB',
    sha256: '8812c79a8b7a6309852f819076f6cb1936e788091abf07823e65471aa875f102',
    dependencies: ['libpcap', 'libssl', 'python3'],
    repoSource: 'kali-rolling-pool'
  },
  {
    id: 'chipsec-framework',
    name: 'chipsec',
    packageManager: 'yay',
    distro: 'AUR_YAY',
    version: '1.13.4-1',
    category: 'Hardware Rescue',
    description: 'Hardware security assessment framework for auditing platform firmware, UEFI/BIOS security, and SMM rootkits.',
    installed: true,
    binaryPath: '/usr/bin/chipsec_main',
    downloadSize: '12.4 MB',
    installedSize: '54.2 MB',
    sha256: '3398e72c830917bcf05492167c13408a287950a7c93425b09819fbc416738910',
    dependencies: ['python', 'pciutils', 'nasm'],
    repoSource: 'aur-git-pool'
  },
  {
    id: 'memprocfs-pkg',
    name: 'memprocfs',
    packageManager: 'yay',
    distro: 'AUR_YAY',
    version: '5.8.0-1',
    category: 'Memory & DMA',
    description: 'Mount physical memory dumps and live DMA devices as virtual filesystems (VFS) to browse processes and drivers as files.',
    installed: true,
    binaryPath: '/usr/bin/memprocfs',
    downloadSize: '6.2 MB',
    installedSize: '26.4 MB',
    sha256: '719082e66699a221f7c32bf0954bfa3514a6da7cbf2a27ffae91206104bc124c',
    dependencies: ['fuse3', 'liblz4', 'openssl'],
    repoSource: 'aur-git-pool'
  }
];
