// jb7572_2026-08-24: Category 5 - Logs, Hardware & Auditing Subsystem Service
import { 
  SystemLogEntry, 
  HardwareDevice, 
  HardwareSensorData, 
  ReliabilityAuditSummary,
  LogLevel,
  LogSubsystem
} from '../types';

const initialLogs: SystemLogEntry[] = [
  {
    id: 'log_1',
    timestamp: '2026-08-24 21:35:12.418',
    level: 'INFO',
    subsystem: 'KERNEL',
    source: 'kernel',
    pid: 0,
    message: '[    0.000000] SecureCurtain: x86_64 SMP Microkernel booting on 8 logical cores (APIC ID 0..7)'
  },
  {
    id: 'log_2',
    timestamp: '2026-08-24 21:35:12.520',
    level: 'INFO',
    subsystem: 'KERNEL',
    source: 'kernel',
    pid: 0,
    message: '[    0.102410] Memory: 16777216K/16777216K available (Paging CR3=0x100000, 4-Level MMU initialized)'
  },
  {
    id: 'log_3',
    timestamp: '2026-08-24 21:35:12.890',
    level: 'INFO',
    subsystem: 'DRIVERS',
    source: 'pci_core',
    pid: 0,
    message: '[    0.472109] pci 0000:00:02.0: Intel Iris Xe Graphics [8086:9a49] probe success, DRM driver bound'
  },
  {
    id: 'log_4',
    timestamp: '2026-08-24 21:35:13.110',
    level: 'INFO',
    subsystem: 'STORAGE',
    source: 'nvme_drv',
    pid: 0,
    message: '[    0.692014] nvme nvme0: Samsung 980 PRO 1TB PCIe Gen4 x4, sector size 512B, ext4 root mounted RW'
  },
  {
    id: 'log_5',
    timestamp: '2026-08-24 21:35:13.340',
    level: 'INFO',
    subsystem: 'NETWORK',
    source: 'e1000_net',
    pid: 135,
    message: '[    0.922150] e1000 0000:00:03.0 eth0: Link is Up at 1000 Mbps Full Duplex, RX/TX DMA rings primed'
  },
  {
    id: 'log_6',
    timestamp: '2026-08-24 21:35:13.780',
    level: 'INFO',
    subsystem: 'SYSTEMD',
    source: 'systemd_init',
    pid: 1,
    message: '[    1.362001] systemd[1]: Reached target Graphical Interface & Multi-User System. Boot complete in 1.48s'
  },
  {
    id: 'log_7',
    timestamp: '2026-08-24 21:35:45.012',
    level: 'AUDIT',
    subsystem: 'AUTH',
    source: 'sshd',
    pid: 412,
    message: 'sshd[412]: Accepted publickey for root from 192.168.1.50 port 52140 ssh2: ED25519 SHA256:8b4x9...'
  },
  {
    id: 'log_8',
    timestamp: '2026-08-24 21:36:01.830',
    level: 'WARN',
    subsystem: 'NETWORK',
    source: 'firewall_stateful',
    pid: 0,
    message: 'fw_stateful: Inbound TCP SYN probe dropped from external IP 203.0.113.44:44912 to port 23 (TELNET)'
  },
  {
    id: 'log_9',
    timestamp: '2026-08-24 21:37:15.912',
    level: 'INFO',
    subsystem: 'STORAGE',
    source: 'fstrim',
    pid: 890,
    message: 'fstrim[890]: /: 142.6 GiB (153120194560 bytes) trimmed on /dev/nvme0n1p2'
  },
  {
    id: 'log_10',
    timestamp: '2026-08-24 21:38:22.104',
    level: 'WARN',
    subsystem: 'DRIVERS',
    source: 'acpid',
    pid: 240,
    message: 'acpid: CPU Package junction thermal spike detected at 68°C; Fan RPM increased to 2,400 RPM'
  }
];

const initialHardwareDevices: HardwareDevice[] = [
  {
    id: 'dev_cpu',
    name: 'Intel(R) Core(TM) i7-12700K (x86_64 SMP)',
    category: 'CPU',
    busAddress: 'Host Bridge (APIC)',
    vendor: 'Intel Corporation',
    vendorId: '0x8086',
    deviceId: '0x4660',
    subsystemId: '0x0000:0000',
    deviceModel: 'Alder Lake 12th Gen (8 Performance + 4 Efficient Cores, 20 Threads @ 3.60GHz Boost 5.00GHz)',
    driver: 'x86_64_smp_scheduler',
    driverProvider: 'Microkernel Native',
    driverVersion: '1.0.4-rt-smp',
    driverLoadedAt: 'Boot (Kernel Ring 0)',
    availableDrivers: [
      {
        driverName: 'x86_64_smp_scheduler',
        provider: 'Microkernel Native',
        version: '1.0.4-rt-smp',
        source: 'Built-in /securecurtain.bin',
        description: 'Zero-trust capability scheduler with per-core Runqueues and Real-Time preemption.',
        isRecommended: true
      },
      {
        driverName: 'x86_64_energy_perf_bias',
        provider: 'Microkernel Native',
        version: '1.0.2',
        source: 'Built-in /securecurtain.bin',
        description: 'Low-power governor balancing performance per watt with aggressive C6 sleep states.'
      }
    ],
    status: 'OK',
    irq: 'Local APIC Timer (IRQ 0)',
    memoryRange: '0x00000000 - 0xFFFFFFFF',
    powerState: 'D0 (Active)',
    firmwareVersion: 'Microcode Revision 0x2E (2026)',
    linkSpeed: 'Host Bus (Internal Ring Interconnect @ 4.8 GHz)',
    capabilities: ['VT-x Hardware Virtualization', 'AES-NI Hardware Acceleration', 'AVX2 / FMA3 Vector Engine', 'CET Shadow Stack', 'SMEP / SMAP Protection'],
    specs: {
      'Microarchitecture': 'Intel Alder Lake Hybrid (Golden Cove + Gracemont)',
      'Total Physical Cores': '12 Cores (8P + 4E)',
      'Total Logical Threads': '20 Threads',
      'Base Frequency': '3.60 GHz',
      'Max Turbo Frequency': '5.00 GHz',
      'L1 Cache': '80 KB per P-Core / 96 KB per E-Core module',
      'L2 Cache': '1.25 MB per P-Core / 2 MB per E-Core cluster',
      'L3 Intel Smart Cache': '25 MB Shared',
      'Thermal Design Power (TDP)': '125W Base / 190W Turbo',
      'Instruction Set': '64-bit AMD64 / Intel 64 with AVX2'
    }
  },
  {
    id: 'dev_gpu',
    name: 'Intel(R) Iris(R) Xe Integrated Graphics',
    category: 'GPU',
    busAddress: '0000:00:02.0',
    vendor: 'Intel Corporation',
    vendorId: '0x8086',
    deviceId: '0x9a49',
    subsystemId: '0x8086:2211',
    deviceModel: 'Iris Xe GT2 96 Execution Units [8086:9a49] (rev 01)',
    driver: 'i915_drm_kms',
    driverProvider: 'Driver VMM (Linux)',
    driverVersion: 'Linux 6.12.8-compat-vmm',
    driverLoadedAt: '/drivers/vmm/drm_i915.ko',
    availableDrivers: [
      {
        driverName: 'i915_drm_kms',
        provider: 'Driver VMM (Linux)',
        version: 'Linux 6.12.8-compat-vmm',
        source: 'Driver VMM Container',
        description: 'Direct Rendering Manager (DRM/KMS) with full hardware video decode (HEVC/AV1) and 3D acceleration.',
        isRecommended: true
      },
      {
        driverName: 'iris_xe_native_fb',
        provider: 'Microkernel Native',
        version: '0.9.1-native',
        source: 'Microkernel Ring 3 Server',
        description: 'Secure native microkernel framebuffer without Linux VMM overhead (2D UI acceleration only).'
      },
      {
        driverName: 'simplefb_generic',
        provider: 'Fallback Generic',
        version: '1.0.0-uefi',
        source: 'GOP Firmware Hook',
        description: 'UEFI Graphics Output Protocol fallback driver for fail-safe visual recovery.'
      },
      {
        driverName: 'vfio_pci_passthrough',
        provider: 'VFIO Passthrough',
        version: '4.2.0',
        source: 'Microkernel IOMMU Layer',
        description: 'Binds device to VFIO-PCI for dedicated guest VM passthrough.'
      }
    ],
    status: 'OK',
    irq: 16,
    memoryRange: '0x6000000000 - 0x600fffffff (BAR 0: 256MB) | 0x40000000 - 0x4fffffff (BAR 2: 256MB)',
    powerState: 'D0 (Active)',
    firmwareVersion: 'VBIOS 1024.0.0 / GuC v70.5.1',
    linkSpeed: 'PCIe Internal Host Ring',
    capabilities: ['Direct Rendering Infrastructure (DRI3)', 'Vulkan 1.3', 'OpenGL 4.6', 'QuickSync Video (AV1 / H.265 / VP9)', 'DisplayPort 1.4a Multi-Stream'],
    specs: {
      'Execution Units (EUs)': '96 EUs (768 ALUs)',
      'Graphics Base Clock': '300 MHz',
      'Graphics Boost Clock': '1.45 GHz',
      'Shared Video Memory': 'Up to 8.0 GB Dynamic Allocation',
      'Display Pipelines': '4 Independent 4K Displays @ 60Hz or 1x 8K @ 60Hz',
      'Hardware Decoders': 'AV1 10-bit, HEVC Main10, VP9 Profile 2, AVC/H.264',
      'Color Space Support': 'HDR10, BT.2020 wide gamut, 10-bit Deep Color'
    }
  },
  {
    id: 'dev_nvme',
    name: 'Samsung 980 PRO NVMe PCIe Gen4 SSD 1TB',
    category: 'STORAGE_NVME',
    busAddress: '0000:01:00.0',
    vendor: 'Samsung Electronics Co Ltd',
    vendorId: '0x144d',
    deviceId: '0xa80a',
    subsystemId: '0x144d:a801',
    deviceModel: 'Samsung NVMe SSD Controller 980 PRO (V-NAND TLC 3-bit MLC)',
    driver: 'nvme_pci_core',
    driverProvider: 'Microkernel Native',
    driverVersion: '2.1.0-nvme1.4',
    driverLoadedAt: 'Boot (Microkernel Storage Server)',
    availableDrivers: [
      {
        driverName: 'nvme_pci_core',
        provider: 'Microkernel Native',
        version: '2.1.0-nvme1.4',
        source: 'Native Storage Server',
        description: 'Asynchronous lock-free NVMe 1.4 queue manager with DMA buffer isolation and Ring-0 write-blocker hook.',
        isRecommended: true
      },
      {
        driverName: 'nvme_linux_vmm',
        provider: 'Driver VMM (Linux)',
        version: 'Linux 6.12.8-compat',
        source: 'Driver VMM Container',
        description: 'Standard Linux kernel NVMe core driver with multipath failover.'
      },
      {
        driverName: 'ahci_sata_fallback',
        provider: 'Fallback Generic',
        version: '1.2.0',
        source: 'Generic Storage Engine',
        description: 'Legacy emulation layer for diagnostic analysis.'
      }
    ],
    status: 'OK',
    irq: 24,
    memoryRange: '0x70000000 - 0x70003fff (16 KB MMIO)',
    powerState: 'D0 (Active)',
    firmwareVersion: '5B2QGXA7 (Signed Samsung Crypto-Firmware)',
    linkSpeed: 'PCIe Gen 4.0 x4 (16.0 GT/s per lane, 64.0 Gbps theoretical)',
    capabilities: ['NVMe 1.4 Command Set', 'TCG Opal 2.0 Hardware Encryption', 'AES 256-bit Full Disk Encryption', 'Autonomous Power State Transition (APST)', 'TRIM / Deallocate & ZNS'],
    specs: {
      'Form Factor': 'M.2 2280 NVMe',
      'Raw Capacity': '1,000,204,886,016 Bytes (1,000.2 GB / 931.5 GiB)',
      'Sequential Read': 'Up to 7,000 MB/s',
      'Sequential Write': 'Up to 5,000 MB/s',
      'Random 4K IOPS (Read)': '1,000,000 IOPS (QD32)',
      'Random 4K IOPS (Write)': '1,000,000 IOPS (QD32)',
      'NAND Type': 'Samsung 128-layer V-NAND 3-bit MLC (TLC)',
      'DRAM Cache': '1GB Low Power DDR4 SDRAM',
      'Total Bytes Written (TBW)': '600 TBW Endurance Rating',
      'Sector Size': '512 Bytes Logical / 4096 Bytes Physical (4Kn capable)'
    }
  },
  {
    id: 'dev_nic_e1000',
    name: 'Intel Gigabit Ethernet Controller (e1000e / 82540EM)',
    category: 'NETWORK_NIC',
    busAddress: '0000:00:03.0',
    vendor: 'Intel Corporation',
    vendorId: '0x8086',
    deviceId: '0x100e',
    subsystemId: '0x8086:001e',
    deviceModel: '82540EM Gigabit Ethernet Controller [8086:100e]',
    driver: 'e1000_lwip_driver',
    driverProvider: 'Microkernel Native',
    driverVersion: '1.4.2-lwip2.2',
    driverLoadedAt: 'Boot (Network Server)',
    availableDrivers: [
      {
        driverName: 'e1000_lwip_driver',
        provider: 'Microkernel Native',
        version: '1.4.2-lwip2.2',
        source: 'Native TCP/IP Stack',
        description: 'Zero-copy ring buffer lwIP network driver integrated with packet inspection and stateful firewall.',
        isRecommended: true
      },
      {
        driverName: 'e1000e_linux_vmm',
        provider: 'Driver VMM (Linux)',
        version: 'Linux 6.12.8-compat',
        source: 'Driver VMM Container',
        description: 'Full Linux e1000e module with IEEE 1588 PTP precision timestamping and hardware VLAN stripping.'
      },
      {
        driverName: 'dpdk_uio_pci',
        provider: 'Vendor Proprietary',
        version: '23.11-lts',
        source: 'High-Speed Packet Engine',
        description: 'Kernel-bypass DPDK polling mode driver for line-rate packet capture.'
      }
    ],
    status: 'OK',
    irq: 11,
    memoryRange: '0xfebc0000 - 0xfebdffff (128 KB MMIO) | I/O Ports: 0xc000 - 0xc03f',
    powerState: 'D0 (Active)',
    firmwareVersion: 'PXE v2.1 Build 083 / NVM v1.33',
    linkSpeed: '1000 Mbps Full Duplex (Auto-Negotiated 1 Gbps Cat6)',
    capabilities: ['TCP/UDP Checksum Offload', 'Scatter-Gather DMA', 'Jumbo Frames (Up to 9014 bytes)', 'Wake-on-LAN (Magic Packet)', 'Energy Efficient Ethernet (IEEE 802.3az)'],
    specs: {
      'Physical Interface': '1x RJ-45 Copper Port',
      'MAC Address': '52:54:00:12:34:56 (Globally Unique)',
      'Duplex Support': '10BASE-T / 100BASE-TX / 1000BASE-T Full & Half',
      'Transmit Queues': '4 Hardware TX Descriptors Rings',
      'Receive Queues': '4 Hardware RX Descriptors Rings',
      'FIFO Buffer Size': '64 KB on-chip packet buffer'
    }
  },
  {
    id: 'dev_nic_wifi',
    name: 'Intel Wi-Fi 6E AX210 160MHz Tri-Band WLAN',
    category: 'NETWORK_NIC',
    busAddress: '0000:02:00.0',
    vendor: 'Intel Corporation',
    vendorId: '0x8086',
    deviceId: '0x2725',
    subsystemId: '0x8086:0020',
    deviceModel: 'Intel Wi-Fi 6E AX210 M.2 2230 Wireless Adapter (Typhoon Peak)',
    driver: 'iwlwifi_mac80211',
    driverProvider: 'Driver VMM (Linux)',
    driverVersion: 'Linux 6.12.8 (iwlwifi-ty-a0-gf-a0-72.ucode)',
    driverLoadedAt: '/drivers/vmm/iwlwifi.ko',
    availableDrivers: [
      {
        driverName: 'iwlwifi_mac80211',
        provider: 'Driver VMM (Linux)',
        version: 'Linux 6.12.8 (ucode 72)',
        source: 'Driver VMM Container',
        description: 'Intel official Wi-Fi 6E mac80211 driver with WPA3-SAE, 6GHz channels, and Bluetooth 5.3 coexistence.',
        isRecommended: true
      },
      {
        driverName: 'ath9k_generic_wlan',
        provider: 'Fallback Generic',
        version: '2.0.1',
        source: 'Generic WLAN Subsystem',
        description: 'Legacy 802.11n fallback mode without 6GHz/160MHz support.'
      },
      {
        driverName: 'monitor_mode_aircrack',
        provider: 'Vendor Proprietary',
        version: '3.4.0-raw',
        source: 'Security Research Arsenal',
        description: 'Promiscuous RF monitor mode driver with raw 802.11 frame injection for Wi-Fi auditing.'
      }
    ],
    status: 'OK',
    irq: 38,
    memoryRange: '0x71000000 - 0x71003fff (16 KB MMIO)',
    powerState: 'D0 (Active)',
    firmwareVersion: 'iwlwifi-ty-a0-gf-a0-72.ucode (Intel Authenticode)',
    linkSpeed: 'PCIe Gen 2.0 x1 / 2402 Mbps PHY Rate',
    capabilities: ['Tri-Band (2.4 GHz, 5 GHz, 6 GHz)', '160 MHz Channel Width', 'OFDMA Up/Downlink', '1024-QAM Modulation', 'WPA3-Personal / WPA3-Enterprise 192-bit', 'Bluetooth 5.3 Audio'],
    specs: {
      'Supported Standards': 'Wi-Fi 6E (IEEE 802.11ax), Wi-Fi 5 (802.11ac), 802.11a/b/g/n',
      'Antenna Configuration': '2x2 TX/RX MU-MIMO Streams',
      'Max Theoretical Speed': '2,402 Mbps (6 GHz 160 MHz) + 574 Mbps (2.4 GHz)',
      'Spatial Streams': '2 Concurrent Streams',
      'Encryption Engines': 'WPA3-SAE, WPA2-PSK (AES-CCMP, GCMP-256), 802.11w Protected Mgmt Frames',
      'Bluetooth Spec': 'Bluetooth 5.3 / BLE Audio LC3 codec / LE Isochronous Channels'
    }
  },
  {
    id: 'dev_usb_xhci',
    name: 'USB 3.2 Gen 2x2 (20Gbps) xHCI Host Controller',
    category: 'USB_CONTROLLER',
    busAddress: '0000:00:14.0',
    vendor: 'Intel Corporation',
    vendorId: '0x8086',
    deviceId: '0x43ed',
    subsystemId: '0x8086:7270',
    deviceModel: 'Tiger Lake-H / Alder Lake xHCI USB 3.2 Controller [8086:43ed]',
    driver: 'xhci_hcd_core',
    driverProvider: 'Microkernel Native',
    driverVersion: '1.2.0-xhci-spec1.2',
    driverLoadedAt: 'Boot (Microkernel USB Subsystem)',
    availableDrivers: [
      {
        driverName: 'xhci_hcd_core',
        provider: 'Microkernel Native',
        version: '1.2.0-xhci-spec1.2',
        source: 'Microkernel USB Hub',
        description: 'Native zero-trust xHCI driver with USB Port Lockdown security policies and badUSB isolation.',
        isRecommended: true
      },
      {
        driverName: 'xhci_pci_linux_vmm',
        provider: 'Driver VMM (Linux)',
        version: 'Linux 6.12.8-compat',
        source: 'Driver VMM Container',
        description: 'Standard Linux xhci-pci stack with USB Attached SCSI Protocol (UASP) support.'
      },
      {
        driverName: 'ehci_legacy_compat',
        provider: 'Fallback Generic',
        version: '1.0.0',
        source: 'Legacy Subsystem',
        description: 'Forces USB 2.0 fallback compatibility on all ports.'
      }
    ],
    status: 'OK',
    irq: 29,
    memoryRange: '0x72000000 - 0x7200ffff (64 KB MMIO)',
    powerState: 'D0 (Active)',
    firmwareVersion: 'Intel xHCI Microcode v14.0.2',
    linkSpeed: 'PCIe Gen 3.0 x2 / Up to 20 Gbps (USB 3.2 Gen 2x2 Dual-Lane)',
    capabilities: ['USB 3.2 Gen 2x2 (20 Gbps)', 'USB Power Delivery 3.0 (100W)', 'USB-C DisplayPort Alt Mode', 'USB Port Quarantine & Access Control', 'UASP Storage Acceleration'],
    specs: {
      'Root Hub Ports': '14 Downstream Ports (4x USB 3.2 Gen 2x2, 6x USB 3.2 Gen 1, 4x USB 2.0)',
      'Bandwidth': 'Up to 20,000 Mbps per Superspeed+ Lane',
      'Port Lockdown': 'Microkernel Capability-Enforced (Read-Only Mode & PIN Elevate)',
      'DMA Rings': 'Dedicated Scratchpad Buffer Allocation in isolated physical RAM',
      'Interrupters': '8 MSI-X Interrupt Vectors'
    }
  },
  {
    id: 'dev_audio_hda',
    name: 'Realtek High Definition Audio Codec (ALC1220 HD-A)',
    category: 'AUDIO',
    busAddress: '0000:00:1f.3',
    vendor: 'Realtek Semiconductor',
    vendorId: '0x10ec',
    deviceId: '0x1220',
    subsystemId: '0x10ec:1220',
    deviceModel: 'ALC1220 120dB SNR 7.1 Surround High Definition Audio Codec',
    driver: 'snd_hda_intel',
    driverProvider: 'Driver VMM (Linux)',
    driverVersion: 'Linux 6.12.8 (ALSA HD-Audio 1.0.25)',
    driverLoadedAt: '/drivers/vmm/snd_hda_intel.ko',
    availableDrivers: [
      {
        driverName: 'snd_hda_intel',
        provider: 'Driver VMM (Linux)',
        version: 'Linux 6.12.8 (ALSA 1.0.25)',
        source: 'Driver VMM Container',
        description: 'ALSA high-definition audio driver with multichannel 192kHz/24-bit DAC and jack auto-sensing.',
        isRecommended: true
      },
      {
        driverName: 'ac97_native_dsp',
        provider: 'Microkernel Native',
        version: '1.0.1-dsp',
        source: 'Microkernel Sound Authority',
        description: 'Low-latency DSP sound engine hook for Cylon vocoder and system tones without ALSA overhead.'
      },
      {
        driverName: 'snd_dummy_sink',
        provider: 'Fallback Generic',
        version: '1.0.0',
        source: 'Generic Audio Null Sink',
        description: 'Silent dummy audio loopback device for headless audio capture and testing.'
      }
    ],
    status: 'OK',
    irq: 32,
    memoryRange: '0x73000000 - 0x73003fff (16 KB MMIO)',
    powerState: 'D0 (Active)',
    firmwareVersion: 'Realtek Codec Revision 0x100302',
    linkSpeed: 'Intel High Definition Audio Link (24.0 MHz BCLK)',
    capabilities: ['120dB Signal-to-Noise Ratio (SNR)', 'DSD & 192kHz / 24-bit PCM Playback', 'Smart Headphone Amplifier (600 Ohm load)', 'Hardware Parametric EQ', 'Jack Retasking & Auto-Detection'],
    specs: {
      'Audio Channels': '7.1 Surround Sound Output + 2 Independent Stereo Streams',
      'DAC Sample Rates': '44.1kHz, 48kHz, 96kHz, 192kHz @ 16/20/24-bit',
      'ADC Sample Rates': 'Up to 192kHz @ 24-bit (110dB SNR for Microphone)',
      'Input/Output Jacks': 'Front Panel Mic/Headphone, Rear Line-In, Line-Out, Optical S/PDIF',
      'Integrated DSP': 'Realtek Hardware Audio Processing Core'
    }
  },
  {
    id: 'dev_ram',
    name: 'DDR5 16GB Dual-Channel High-Speed RAM Bank',
    category: 'MEMORY',
    busAddress: 'Memory Controller 0 (Host IMC)',
    vendor: 'Corsair / Micron',
    vendorId: '0x802c',
    deviceId: '0x0000',
    subsystemId: '0x0000:0000',
    deviceModel: '2x 8GB DDR5-5600 CL36-36-36-76 1.25V UDIMM (16.0 GiB Total)',
    driver: 'x86_64_mmu_paging',
    driverProvider: 'Microkernel Native',
    driverVersion: '1.0.4-4level-mmu',
    driverLoadedAt: 'Boot (Kernel Paging CR3=0x100000)',
    availableDrivers: [
      {
        driverName: 'x86_64_mmu_paging',
        provider: 'Microkernel Native',
        version: '1.0.4-4level-mmu',
        source: 'Microkernel Ring 0 Core',
        description: '4-Level paging MMU with SMEP, SMAP, NX Bit, and ASLR virtual memory randomization.',
        isRecommended: true
      },
      {
        driverName: 'x86_64_5level_la57',
        provider: 'Microkernel Native',
        version: '1.0.0-la57',
        source: 'Microkernel Ring 0 Core',
        description: '5-Level paging (LA57) supporting up to 4 Petabytes of physical and 128 Petabytes of virtual address space.'
      }
    ],
    status: 'OK',
    irq: 'N/A (Hardware Bus)',
    memoryRange: '0x00000000 - 0x400000000 (17,179,869,184 Bytes / 16.0 GiB)',
    powerState: 'D0 (Active)',
    firmwareVersion: 'SPD EEPROM JEDEC Revision 1.0 (XMP 3.0 Profile 1)',
    linkSpeed: 'DDR5-5600 (5,600 MT/s / 89.6 GB/s Peak Bandwidth)',
    capabilities: ['On-Die ECC (ODECC)', 'Dual 32-bit Subchannels per DIMM', 'XMP 3.0 Extreme Memory Profile', 'Row Hammer Refresh Mitigation', 'Hardware Memory Protection (SMAP / SMEP)'],
    specs: {
      'Total Physical Capacity': '16.0 GiB (17,179,869,184 Bytes)',
      'Modules Installed': '2x 8GB DIMMs in Dual-Channel Mode (Slot 2 & Slot 4)',
      'Memory Type': 'DDR5 SDRAM Non-ECC Unbuffered DIMM',
      'Tested Frequency': 'DDR5-5600 (2800 MHz Real Clock)',
      'Primary Timings': 'CL36-36-36-76 (tCAS-tRCD-tRP-tRAS)',
      'Operating Voltage': '1.25V (VPP 1.8V)',
      'Subchannels': '4x 32-bit Wide Channels (2 per DIMM)',
      'Peak Memory Bandwidth': '89.6 GB/s (Dual Channel)'
    }
  }
];

class HardwareLogsService {
  private logs: SystemLogEntry[] = JSON.parse(JSON.stringify(initialLogs));
  private hardwareDevices: HardwareDevice[] = JSON.parse(JSON.stringify(initialHardwareDevices));
  
  private sensors: HardwareSensorData = {
    cpuPackageTempC: 48,
    cpuCoresTempC: [46, 49, 45, 47, 50, 48, 44, 46],
    gpuTempC: 44,
    nvmeTempC: 41,
    fanSpeedRpm: 1850,
    fanSpeedPercent: 42,
    cpuPowerWatts: 28.4,
    totalSystemWatts: 62.1,
    voltageVCore: 1.18,
    voltage12V: 12.08,
    voltage5V: 5.02,
    voltage3V3: 3.31,
    batteryPercent: 94,
    batteryHealthPercent: 98,
    batteryStatus: 'AC_CONNECTED'
  };

  private auditSummary: ReliabilityAuditSummary = {
    systemUptimeSeconds: 14820,
    reliabilityScore: 9.8,
    totalKernelPanics: 0,
    totalAppCrashes: 1,
    cleanReboots: 24,
    uncleanShutdowns: 0,
    lastBootDurationSec: 1.48,
    microkernelInitTimeMs: 102,
    driversInitTimeMs: 590,
    userspaceInitTimeMs: 788
  };

  // ==========================================
  // 1. Logs & Event Viewer Management
  // ==========================================
  public getLogs(): SystemLogEntry[] {
    return [...this.logs];
  }

  public addLogEntry(entry: Omit<SystemLogEntry, 'id' | 'timestamp'>): SystemLogEntry {
    const newLog: SystemLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').replace('Z', '')
    };
    this.logs.unshift(newLog); // Put newest on top
    return newLog;
  }

  public clearLogs(): { success: boolean; message: string } {
    this.logs = [];
    return { success: true, message: 'System log buffer cleared.' };
  }

  public generateTestLog(level: LogLevel): { success: boolean; message: string; entry: SystemLogEntry } {
    const messages: Record<LogLevel, string[]> = {
      INFO: [
        'systemd[1]: Re-evaluating mount point status for /sys/fs/cgroup',
        'cron[480]: (root) CMD (fstrim -v /dev/nvme0n1p2)',
        'e1000: Link state verified healthy, 0 packet collisions'
      ],
      WARN: [
        'kernel: PCIe bus 0000:00:03.0 ASPM L1 link power state negotiated',
        'sshd[412]: Disconnecting invalid user admin 198.51.100.22 port 48201 [preauth]',
        'nvme0: SSD thermal threshold warning cleared (normalized at 42°C)'
      ],
      ERROR: [
        'wayland_server: Surface buffer swap missed vblank deadline (dropped frame)',
        'acpid: Failed to query ACPI thermal zone 2 fan tachometer'
      ],
      CRITICAL: [
        'kernel: MCE (Machine Check Exception) recovered: Correctable ECC bit-flip handled on RAM Bank 0',
        'systemd[1]: Unit bluetoothd.service entered failed state.'
      ],
      AUDIT: [
        'auditd[112]: USER_LOGIN pid=412 uid=0 auid=1000 ses=2 subj=kernel msg=\'op=PAM:login acct="root" res=success\'',
        'auditd[112]: SYSCALL arch=c000003e syscall=59 success=yes exit=0 ppid=620 pid=890 exe="/usr/bin/crontab"'
      ]
    };

    const pool = messages[level];
    const pickedMsg = pool[Math.floor(Math.random() * pool.length)];

    const entry = this.addLogEntry({
      level,
      subsystem: level === 'AUDIT' ? 'AUTH' : (level === 'CRITICAL' ? 'KERNEL' : 'SYSTEMD'),
      source: level === 'AUDIT' ? 'auditd' : 'systemd',
      pid: Math.floor(Math.random() * 500) + 1,
      message: pickedMsg
    });

    return {
      success: true,
      message: `Injected test ${level} event to journal ring buffer.`,
      entry
    };
  }

  // ==========================================
  // 2. Hardware Devices (lspci / lsusb / devmgmt)
  // ==========================================
  public getHardwareDevices(): HardwareDevice[] {
    return [...this.hardwareDevices];
  }

  public toggleDeviceStatus(id: string): { success: boolean; message: string; device?: HardwareDevice } {
    const dev = this.hardwareDevices.find(d => d.id === id);
    if (!dev) return { success: false, message: `Device #${id} not found.` };
    if (dev.category === 'CPU' || dev.category === 'MEMORY') {
      return { success: false, message: `CRITICAL: Cannot disable primary ${dev.category} system hardware.` };
    }

    dev.status = dev.status === 'OK' ? 'DISABLED' : 'OK';
    dev.powerState = dev.status === 'OK' ? 'D0 (Active)' : 'D3 (Low Power)';

    // Log the event
    this.addLogEntry({
      level: 'WARN',
      subsystem: 'DRIVERS',
      source: 'pci_core',
      pid: 0,
      message: `Device [${dev.busAddress}] ${dev.name} power state transitioned to ${dev.powerState} (Status: ${dev.status})`
    });

    return {
      success: true,
      message: `Hardware device "${dev.name}" is now ${dev.status}.`,
      device: dev
    };
  }

  public switchDeviceDriver(deviceId: string, newDriverName: string): { success: boolean; message: string; device?: HardwareDevice } {
    const dev = this.hardwareDevices.find(d => d.id === deviceId);
    if (!dev) return { success: false, message: `Device #${deviceId} not found.` };

    const driverOpt = dev.availableDrivers?.find(d => d.driverName === newDriverName);
    if (!driverOpt) {
      return { success: false, message: `Driver "${newDriverName}" is not available or valid for device ${dev.name}.` };
    }

    const previousDriver = dev.driver;
    dev.driver = driverOpt.driverName;
    dev.driverProvider = driverOpt.provider;
    dev.driverVersion = driverOpt.version;
    dev.driverLoadedAt = driverOpt.source;

    // Log the driver switch event to system ring buffer
    this.addLogEntry({
      level: 'INFO',
      subsystem: 'DRIVERS',
      source: 'driver_mgr',
      pid: 0,
      message: `[DRV_HOTSWAP] Unbound '${previousDriver}' and bound '${dev.driver}' (${driverOpt.provider} v${driverOpt.version}) to device ${dev.busAddress} [${dev.vendorId}:${dev.deviceId}]`
    });

    return {
      success: true,
      message: `Successfully rebound ${dev.name} to driver "${dev.driver}" (${driverOpt.provider}).`,
      device: dev
    };
  }

  // ==========================================
  // 3. Hardware Sensors & Thermals
  // ==========================================
  public getSensors(): HardwareSensorData {
    // Add realistic subtle jitter to live telemetry
    const jitter = (Math.random() - 0.5) * 1.2;
    const cpuTemp = +(Math.min(78, Math.max(38, this.sensors.cpuPackageTempC + jitter))).toFixed(1);
    const fanRpm = Math.round(1600 + (cpuTemp - 40) * 45);

    this.sensors.cpuPackageTempC = cpuTemp;
    this.sensors.fanSpeedRpm = fanRpm;
    this.sensors.fanSpeedPercent = Math.min(100, Math.round((fanRpm / 3200) * 100));
    this.sensors.cpuPowerWatts = +(24 + (cpuTemp - 40) * 0.8 + (Math.random() * 2)).toFixed(1);
    this.sensors.totalSystemWatts = +(55 + (cpuTemp - 40) * 1.2).toFixed(1);

    return { ...this.sensors };
  }

  // ==========================================
  // 4. Reliability & Boot Benchmarks
  // ==========================================
  public getAuditSummary(): ReliabilityAuditSummary {
    this.auditSummary.systemUptimeSeconds += 3;
    return { ...this.auditSummary };
  }
}

export const hardwareLogsService = new HardwareLogsService();
