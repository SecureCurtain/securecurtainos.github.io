#include "ssd_mirror.h"
#include "security_panic.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static SecureMirrorRegistry g_ssd_mirror;

extern uint64_t get_system_uptime_ms(void);
extern void     issue_hardware_bus_command(uint16_t port, uint16_t command);
extern void     read_raw_disk_sector(uint16_t port, uint32_t sector, uint8_t* buffer);
extern void     write_raw_disk_sector(uint16_t port, uint32_t sector, const uint8_t* buffer);

// Simple internal non-reversible mixing loop to generate disk validation snapshots
static void calculate_sector_hash_surrogate(const uint8_t* sector_data, uint8_t* out_hash) {
    uint32_t hash_accum = 0x4F534D4D;
    for (uint16_t i = 0; i < SSD_SECTOR_SIZE; i++) {
        hash_accum = ((hash_accum << 5) + hash_accum) + sector_data[i];
    }
    for (uint8_t h = 0; h < SSD_SNAPSHOT_HASH_SIZE; h++) {
        out_hash[h] = (uint8_t)((hash_accum >> (h % 4 * 8)) & 0xFF) ^ h;
    }
}

void init_ssd_mirroring_service(void) {
    memset(&g_ssd_mirror, 0, sizeof(SecureMirrorRegistry));
    g_ssd_mirror.magic = SSD_MAGIC_TAG;
    g_ssd_mirror.primary_ata_port = 0x1F0;   // Master primary device channel
    g_ssd_mirror.secondary_ata_port = 0x170; // Secondary hidden replication loop channel
    g_ssd_mirror.recovery_mode_engaged = false;

    printf("[Kernel SSD Mirror]: Hardware drive mirroring layer armed (2-hour step timing).\\n");

    // Enforce immediate boot isolation block to safeguard secondary storage data parameters
    isolate_secondary_storage_bus(true);
}

bool validate_primary_drive_integrity(void) {
    uint8_t current_sector_buffer[SSD_SECTOR_SIZE];
    uint8_t computed_running_hash[SSD_SNAPSHOT_HASH_SIZE];
    memset(computed_running_hash, 0xAB, SSD_SNAPSHOT_HASH_SIZE);

    // Read and verify the sector structure ranges (Scanning your master OS layout sectors)
    for (uint32_t s = 0; s < 1000; s++) { // Core critical kernel & data partition sector scan
        read_raw_disk_sector(g_ssd_mirror.primary_ata_port, s, current_sector_buffer);
        calculate_sector_hash_surrogate(current_sector_buffer, computed_running_hash);
    }

    // Compare running hash maps against the expected boot manifest template footprint
    if (g_ssd_mirror.active_manifest.last_sync_timestamp_ms != 0) {
        if (memcmp(computed_running_hash, g_ssd_mirror.active_manifest.primary_integrity_hash, SSD_SNAPSHOT_HASH_SIZE) != 0) {
            commit_security_audit_entry(EVENT_AUTH_FAILURE, "SSD_VALIDATOR", "CRITICAL WARNING: Primary storage corruption/tampering detected.");
            return false; // Sector mapping anomalies or data corruption matched
        }
    }

    // Save passing footprint parameters to the snapshot ledger
    memcpy(g_ssd_mirror.active_manifest.primary_integrity_hash, computed_running_hash, SSD_SNAPSHOT_HASH_SIZE);
    g_ssd_mirror.active_manifest.integrity_validated = true;
    return true;
}

void isolate_secondary_storage_bus(bool disable_lines) {
    if (disable_lines) {
        // out-of-band ATA register manipulation: physically cut off the backup controller
        issue_hardware_bus_command(g_ssd_mirror.secondary_ata_port + 7, 0x00); // Purge command latch
        issue_hardware_bus_command(g_ssd_mirror.secondary_ata_port + 6, 0x04); // Assert permanent device line reset mask
        g_ssd_mirror.active_manifest.is_secondary_isolated = true;
        printf("[SSD Mirror]: Secondary backup drive completely isolated from host interface.\\n");
    } else {
        // Re-enable electrical connection data lines exclusively for the service sync pass
        issue_hardware_bus_command(g_ssd_mirror.secondary_ata_port + 6, 0x00); // Clear reset lines
        g_ssd_mirror.active_manifest.is_secondary_isolated = false;
        printf("[SSD Mirror]: Secondary backup drive interface lines provisioned for sync.\\n");
    }
}

void trigger_two_hour_mirror_sync(void) {
    if (g_ssd_mirror.recovery_mode_engaged) return;

    printf("[SSD Mirror]: Initiating scheduled sector replication cycle...\\n");

    // Step 1: Run deep snapshot analysis pass on primary drive to scan for corruption
    if (!validate_primary_drive_integrity()) {
        printf("[SSD Mirror Alert]: Replication aborted! Primary drive snapshot failed integrity check.\\n");
        execute_kernel_security_panic("Primary disk metadata corruption detected during mirror loop.");
        return; 
    }

    // Step 2: Temporarily wake up the backup drive's storage bus channels
    isolate_secondary_storage_bus(false);

    // Step 3: Stream bit-perfect sector image duplication directly across the ports
    uint8_t replication_staging_sector[SSD_SECTOR_SIZE];
    uint32_t sectors_to_clone = 10000; // Copy your full core storage allocation layout bounds

    for (uint32_t s = 0; s < sectors_to_clone; s++) {
        read_raw_disk_sector(g_ssd_mirror.primary_ata_port, s, replication_staging_sector);
        write_raw_disk_sector(g_ssd_mirror.secondary_ata_port, s, replication_staging_sector);
    }

    g_ssd_mirror.active_manifest.last_sync_timestamp_ms = (uint32_t)get_system_uptime_ms();
    g_ssd_mirror.active_manifest.total_mirrored_sectors = sectors_to_clone;

    // Step 4: Instantly freeze and lock out the secondary drive ports from the operating system
    isolate_secondary_storage_bus(true);

    commit_security_audit_entry(EVENT_POWER_STATE_CHANGE, "SSD_MIRROR", "Sector synchronization complete. Backup drive safely isolated.");
}

void execute_disaster_recovery_replace(void) {
    // DISASTER RECOVERY: If the primary drive gets corrupted or drops offline, 
    // an administrator triggers this function from their secure identity module panel.
    g_ssd_mirror.recovery_mode_engaged = true;
    asm volatile("cli"); // Halt scheduling context loops during hardware re-mapping

    printf("[Disaster Recovery]: CRITICAL ACTION: Restoring platform architecture from isolated shadow mirror...\\n");

    // Wake the clean, isolated backup drive
    isolate_secondary_storage_bus(false);

    // Flash back the clean backup sector footprints onto the primary drive channels
    uint8_t recovery_staging_sector[SSD_SECTOR_SIZE];
    for (uint32_t s = 0; s < g_ssd_mirror.active_manifest.total_mirrored_sectors; s++) {
        read_raw_disk_sector(g_ssd_mirror.secondary_ata_port, s, recovery_staging_sector);
        write_raw_disk_sector(g_ssd_mirror.primary_ata_port, s, recovery_staging_sector);
    }

    printf("[Disaster Recovery]: Primary partition re-imaged successfully. Forcing clean hardware reset...\\n");
    issue_hardware_bus_command(0x64, 0xFE); // Pulse CPU pulse reset port to force safe motherboard reboot
}
