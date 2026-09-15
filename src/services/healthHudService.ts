// jb7572_2026-08-24: Unified Overview & Health HUD Aggregator Service
import { 
  HealthHUDMetrics, 
  SubsystemHealthBadge, 
  SystemIncident 
} from '../types';
import { systemProcessService } from './systemProcessService';
import { storageService } from './storageService';
import { networkSecurityService } from './networkSecurityService';
import { systemConfigService } from './systemConfigService';
import { hardwareLogsService } from './hardwareLogsService';
import { packageManagementService } from './packageManagementService';
import { searchIndexingService } from './searchIndexingService';

class HealthHudService {
  private customIncidents: SystemIncident[] = [
    {
      id: 'inc_storage_pressure',
      timestamp: '10 mins ago',
      level: 'WARNING',
      subsystem: 'Storage Subsystem',
      message: 'Temporary directory /tmp exceeded 70% capacity threshold (3.1 GB / 4.0 GB).',
      actionCommand: 'storage clean',
      resolved: false
    },
    {
      id: 'inc_upgradable_pkgs',
      timestamp: '25 mins ago',
      level: 'INFO',
      subsystem: 'Package Delivery',
      message: '2 core binaries have new upstream releases in repository (qemu, mesa-vulkan).',
      actionCommand: 'apt upgrade',
      resolved: false
    },
    {
      id: 'inc_sec_syn_flood',
      timestamp: '1 hour ago',
      level: 'CRITICAL',
      subsystem: 'Firewall & Network',
      message: 'Firewall SYN Cookie drop mitigation triggered on port 22 (SSH brute protection active).',
      actionCommand: 'iptables -L',
      resolved: true
    }
  ];

  public getHUDMetrics(): HealthHUDMetrics {
    const sysMetrics = systemProcessService.getSystemMetrics();
    const disks = storageService.getDisks();
    const totalStorageBytes = disks.reduce((sum, d) => sum + d.sizeBytes, 0);
    const usedStorageBytes = disks.reduce((sum, d) => {
      const partUsed = d.partitions.reduce((pSum, p) => pSum + p.usedBytes, 0);
      return sum + partUsed;
    }, 0);
    const storagePercent = totalStorageBytes > 0 ? Math.round((usedStorageBytes / totalStorageBytes) * 100) : 48;

    const sensors = hardwareLogsService.getSensors();
    const maxTemp = sensors.cpuPackageTempC || 48;

    const ifaces = networkSecurityService.getInterfaces();
    const netThroughputMbps = +(ifaces.reduce((sum, i) => sum + (i.rxBytes + i.txBytes), 0) / (1024 * 1024 * 50)).toFixed(1);

    const rules = networkSecurityService.getFirewallRules();
    const blockedCount = rules.filter(r => r.action === 'BLOCK' || r.action === 'DROP').reduce((sum, r) => sum + r.hits, 0);

    const services = systemConfigService.getServices();
    const runningServices = services.filter(s => s.status === 'RUNNING').length;

    const pkgs = packageManagementService.getPackages();
    const upgradableCount = pkgs.filter(p => p.status === 'UPGRADABLE').length;

    const indexStats = searchIndexingService.getStats();
    const auditSummary = hardwareLogsService.getAuditSummary();

    return {
      cpuUsagePercent: sysMetrics.cpuTotalPercent,
      memoryUsedPercent: Math.round((sysMetrics.memUsedBytes / sysMetrics.memTotalBytes) * 100),
      memoryUsedMb: Math.round(sysMetrics.memUsedBytes / (1024 * 1024)),
      memoryTotalMb: Math.round(sysMetrics.memTotalBytes / (1024 * 1024)),
      thermalMaxC: maxTemp,
      storageUsedPercent: storagePercent,
      networkThroughputMbps: Math.max(12.4, netThroughputMbps),
      firewallBlockedCount: blockedCount || 1420,
      activeProcesses: sysMetrics.processCount,
      runningDaemons: runningServices || 7,
      upgradablePackagesCount: upgradableCount,
      indexedFilesCount: indexStats.totalFiles,
      bootTimeSeconds: auditSummary.lastBootDurationSec || 1.18,
      uptimeFormatted: '2h 20m (8,420s)'
    };
  }

  public getSubsystemsStatus(): SubsystemHealthBadge[] {
    const hud = this.getHUDMetrics();
    const pkgs = packageManagementService.getPackages();
    const upgradable = pkgs.filter(p => p.status === 'UPGRADABLE').length;
    const indexStats = searchIndexingService.getStats();

    return [
      {
        id: 'sub_perf',
        name: 'CPU & Process Scheduler',
        categoryKey: 'SYSTEM_PERFORMANCE',
        status: hud.cpuUsagePercent > 85 ? 'ALERT' : hud.cpuUsagePercent > 60 ? 'WARNING' : 'HEALTHY',
        metric: `${hud.cpuUsagePercent}% Load`,
        detail: `${hud.activeProcesses} tasks on 4 cores (${hud.thermalMaxC}°C)`
      },
      {
        id: 'sub_mem_debug',
        name: 'Virtual Memory & Disassembler',
        categoryKey: 'MEMORY_DEBUGGER',
        status: 'HEALTHY',
        metric: `${hud.memoryUsedMb} MB Active`,
        detail: 'PML4 Page tables, GDB register snapshots & x86_64 disasm'
      },
      {
        id: 'sub_storage',
        name: 'Virtual Filesystem & Disks',
        categoryKey: 'STORAGE_FILESYSTEM',
        status: hud.storageUsedPercent > 85 ? 'ALERT' : hud.storageUsedPercent > 70 ? 'WARNING' : 'HEALTHY',
        metric: `${hud.storageUsedPercent}% Full`,
        detail: 'NVMe 980 PRO (SMART Grade A, TRIM Active)'
      },
      {
        id: 'sub_net',
        name: 'Network & Netfilter Firewall',
        categoryKey: 'NETWORK_SECURITY',
        status: 'HEALTHY',
        metric: `${hud.networkThroughputMbps} Mbps`,
        detail: `eth0 link UP, ${hud.firewallBlockedCount} packets filtered`
      },
      {
        id: 'sub_config',
        name: 'Systemd & Kernel Config',
        categoryKey: 'SYSTEM_CONFIG',
        status: 'HEALTHY',
        metric: `${hud.runningDaemons} Daemons`,
        detail: 'sysctl memory parameters verified'
      },
      {
        id: 'sub_logs',
        name: 'Hardware & Journal Audit',
        categoryKey: 'AUDITING_LOGS',
        status: 'HEALTHY',
        metric: `${hud.bootTimeSeconds.toFixed(2)}s Boot`,
        detail: 'ACPI & PCI Bus green, zero kernel panics'
      },
      {
        id: 'sub_pkg',
        name: 'Package Repos & Features',
        categoryKey: 'PACKAGE_POOLS',
        status: upgradable > 0 ? 'WARNING' : 'HEALTHY',
        metric: upgradable > 0 ? `${upgradable} Updates` : 'Synced',
        detail: `${pkgs.length} packages tracked in pool`
      },
      {
        id: 'sub_search',
        name: 'Search Indexer Catalog',
        categoryKey: 'SEARCH_NAVIGATION',
        status: indexStats.status === 'ACTIVE' ? 'HEALTHY' : 'STANDBY',
        metric: `${indexStats.totalFiles} Files`,
        detail: `Fast catalog indexing ${indexStats.status.toLowerCase()}`
      }
    ];
  }

  public getIncidents(): SystemIncident[] {
    return [...this.customIncidents];
  }

  public resolveIncident(id: string): void {
    const inc = this.customIncidents.find(i => i.id === id);
    if (inc) inc.resolved = true;
  }

  public executeQuickFix(action: 'CLEAN_STORAGE' | 'UPGRADE_PACKAGES' | 'REBUILD_CATALOG' | 'FLUSH_NETWORK'): { success: boolean; message: string } {
    if (action === 'CLEAN_STORAGE') {
      const res = storageService.cleanStorageSense();
      this.resolveIncident('inc_storage_pressure');
      return { success: true, message: `Storage cleanup reclaimed ${res.reclaimedBytesFormatted} from temporary cache.` };
    }
    if (action === 'UPGRADE_PACKAGES') {
      const res = packageManagementService.upgradeAll();
      this.resolveIncident('inc_upgradable_pkgs');
      return { success: true, message: res.message };
    }
    if (action === 'REBUILD_CATALOG') {
      const stats = searchIndexingService.rebuildIndex();
      return { success: true, message: `Catalog index refreshed: ${stats.totalFiles} files indexed.` };
    }
    if (action === 'FLUSH_NETWORK') {
      return { success: true, message: 'Flushed ARP neighbor cache and DNS resolver socket pools.' };
    }
    return { success: false, message: 'Unknown quick action.' };
  }
}

export const healthHudService = new HealthHudService();
