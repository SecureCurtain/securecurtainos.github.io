#pragma once
#include <stdint.h>
#include <stdbool.h>

#define SSD_SECTOR_SIZE          512
#define SSD_SNAPSHOT_HASH_SIZE   32
#define SSD_MAGIC_TAG            0x5353444D // "SSDM" binary tracking token
#define SSD_SYNC_INTERVAL_MS     (2 * 3600 * 1000) // Precise 2-hour interval translation

typedef struct {
    uint32_t last_sync_timestamp_ms;
    uint8_t  primary_integrity_hash[SSD_SNAPSHOT_HASH_SIZE];
    uint32_t total_mirrored_sectors;
    bool     is_secondary_isolated;
    bool     integrity_validated;
} SsdSnapshotManifest;

typedef struct {
    uint32_t            magic;
    uint16_t            primary_ata_port;   // Main drive bus address (e.g., 0x1F0)
    uint16_t            secondary_ata_port; // Hidden backup drive bus address (e.g., 0x170)
    SsdSnapshotManifest active_manifest;
    bool                recovery_mode_engaged;
} SecureMirrorRegistry;

// Microkernel Core Drive Resiliency Mappings
void init_ssd_mirroring_service(void);
void trigger_two_hour_mirror_sync(void);
bool validate_primary_drive_integrity(void);
void isolate_secondary_storage_bus(bool disable_lines);
void execute_disaster_recovery_replace(void);