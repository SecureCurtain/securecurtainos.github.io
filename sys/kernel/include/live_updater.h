#pragma once
#include <stdint.h>
#include <stdbool.h>

#define MAX_STAGED_COMPONENTS 16
#define UPDATER_MAGIC_TAG     0x4C555044 // "LUPD" binary tracking tag
#define STAGING_DIR_ROOT      "/sys/stage"

typedef struct {
    char     target_system_path[64];  // Destination path (e.g., "/sys/bin/nt_env.bin")
    char     staged_temporary_path[64]; // Temporary path (e.g., "/sys/stage/nt_env.bin.tmp")
    uint32_t file_size_bytes;
    uint8_t  expected_sha_signature[32]; // Signature to be verified before deployment
    bool     is_pending_commit;
} StagedComponentNode;

typedef struct {
    uint32_t            magic;
    StagedComponentNode components[MAX_STAGED_COMPONENTS];
    uint32_t            pending_count;
    bool                transaction_sealed;
} LiveUpdateManifest;

// Microkernel Deployment System Mappings
void init_live_updater_subsystem(void);
bool sys_stage_system_component(const char* target_path, const char* staged_tmp_path, const uint8_t* signature);
void execute_early_boot_update_commit(void);
uint32_t query_pending_updates_count(void);